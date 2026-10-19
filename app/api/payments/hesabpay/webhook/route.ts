import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { activateHotel } from "@/lib/provisionHotel";
import { payoutOrder } from "@/lib/payoutOrder";

export async function POST(request: Request) {
  console.log("=== HESABPAY WEBHOOK HIT ===", new Date().toISOString());
  const apiKey = process.env.HESABPAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signature =
    request.headers.get("x-hesab-signature") ||
    request.headers.get("x-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const verifyRes = await fetch(
      "https://api.hesab.com/api/v1/hesab/webhooks/verify-signature",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `API-KEY ${apiKey}`,
        },
        body: JSON.stringify({ signature, payload }),
      },
    );
    const verifyData = await verifyRes.json().catch(() => null);
    const isValid =
      verifyRes.ok &&
      (verifyData?.valid === true || verifyData?.verified === true);
    if (!isValid) {
      console.warn("HesabPay webhook signature failed verification");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch (err) {
    console.error("HesabPay signature verification request failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 502 });
  }

  const reference =
    payload.reference || payload.metadata?.reference || payload.items?.[0]?.id;
  const status = payload.status || payload.payment_status;

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const succeeded = ["success", "succeeded", "paid", "completed"].includes(
    String(status).toLowerCase(),
  );

  // ============================================================
  // 1. RENEWAL — "renew:<hotelId>:<planId>:<months>"
  // ============================================================
  if (typeof reference === "string" && reference.startsWith("renew:")) {
    const parts = reference.split(":");
    const hotelId = parts[1];
    const planId = parts[2];
    const monthsNum = parseInt(parts[3], 10);

    if (!hotelId || !planId || !Number.isFinite(monthsNum) || monthsNum < 1) {
      return NextResponse.json({ error: "Bad renewal ref" }, { status: 400 });
    }
    if (!succeeded) {
      return NextResponse.json({ ok: true, renewal: true, status: "failed" });
    }

    const hotel = await prisma.hotels.findUnique({
      where: { id: hotelId },
      select: {
        id: true,
        subscription_expires_at: true,
        subscription_plan_id: true,
      },
    });
    if (!hotel)
      return NextResponse.json({ error: "Unknown hotel" }, { status: 404 });

    const plan = await prisma.subscription_plans.findUnique({
      where: { id: planId },
      select: { max_branches: true, max_pos_devices: true, name: true },
    });
    if (!plan)
      return NextResponse.json({ error: "Unknown plan" }, { status: 404 });

    const branchCount = await prisma.branches.count({
      where: { hotel_id: hotel.id },
    });
    const posCount = await prisma.pos_devices.count({
      where: { branches: { hotel_id: hotel.id }, is_active: true },
    });

    if (plan.max_branches != null && branchCount > plan.max_branches) {
      return NextResponse.json(
        { error: "Selected plan doesn't fit your current branches" },
        { status: 400 },
      );
    }
    if (plan.max_pos_devices != null && posCount > plan.max_pos_devices) {
      return NextResponse.json(
        { error: "Selected plan doesn't fit your current POS devices" },
        { status: 400 },
      );
    }

    const now = new Date();
    const currentExpiry = hotel.subscription_expires_at
      ? new Date(hotel.subscription_expires_at)
      : null;
    const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(base);
    newExpiry.setMonth(newExpiry.getMonth() + monthsNum);

    await prisma.hotels.update({
      where: { id: hotel.id },
      data: {
        subscription_status: "active",
        subscription_expires_at: newExpiry,
        subscription_plan_id: planId,
      },
    });

    return NextResponse.json({
      ok: true,
      renewal: true,
      hotel_id: hotel.id,
      months: monthsNum,
      new_expiry: newExpiry.toISOString(),
    });
  }

  // ============================================================
  // 2. ORDER PAYMENT
  // ============================================================
  const maybeOrder = await prisma.orders.findUnique({
    where: { id: reference },
    select: { id: true, payment_status: true, total_amount: true },
  });

  if (maybeOrder) {
    if (!succeeded) {
      await prisma.orders.update({
        where: { id: maybeOrder.id },
        data: { payment_status: "failed" },
      });
      return NextResponse.json({ ok: true, order: true, status: "failed" });
    }
    if (maybeOrder.payment_status !== "paid") {
      await prisma.orders.update({
        where: { id: maybeOrder.id },
        data: {
          payment_status: "paid",
          paid_at: new Date(),
          payment_reference:
            payload.transaction_id || payload.reference || null,
          status: "in_progress",
        },
      });
    }
    const payout = await payoutOrder(maybeOrder.id);
    return NextResponse.json({ ok: true, order: true, payout });
  }

  // ============================================================
  // 3. NEW HOTEL ACTIVATION — reference is a hotels UUID
  // ============================================================
  const maybeHotel = await prisma.hotels.findUnique({
    where: { id: reference },
    include: {
      hotel_owner: { include: { users: true } },
      subscription_plans: true,
    },
  });

  if (maybeHotel) {
    if (!succeeded) {
      await prisma.hotels.update({
        where: { id: maybeHotel.id },
        data: { subscription_status: "expired" },
      });
      return NextResponse.json({ ok: true, hotel: true, status: "failed" });
    }

    // Already active → idempotent
    if (
      maybeHotel.subscription_status === "active" &&
      maybeHotel.subscription_expires_at &&
      new Date(maybeHotel.subscription_expires_at) >
        new Date(Date.now() - 60 * 1000)
    ) {
      return NextResponse.json({
        ok: true,
        already_processed: true,
        hotel_id: maybeHotel.id,
      });
    }

    try {
      const { resetLinkSent } = await activateHotel(maybeHotel.id);
      return NextResponse.json({
        ok: true,
        hotel_id: maybeHotel.id,
        reset_link_sent: resetLinkSent,
      });
    } catch (err) {
      console.error("Webhook activate failed:", err);
      return NextResponse.json(
        { error: "Could not activate" },
        { status: 500 },
      );
    }
  }

  // ============================================================
  // 4. PENDING SIGNUP (WhatsApp — normally no webhook, fallback only)
  // ============================================================
  const signup = await prisma.pending_signups.findUnique({
    where: { id: reference },
  });
  if (signup) {
    if (!succeeded) {
      await prisma.pending_signups.update({
        where: { id: signup.id },
        data: { status: "failed" },
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: true, whatsapp: true });
  }

  return NextResponse.json({ error: "Unknown reference" }, { status: 404 });
}
