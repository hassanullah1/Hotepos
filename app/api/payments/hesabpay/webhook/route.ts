import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { provisionHotelFromSignup } from "@/lib/provisionHotel";
import { payoutOrder } from "@/lib/payoutOrder";

export async function POST(request: Request) {
  console.log("=== HESABPAY WEBHOOK HIT ===", new Date().toISOString());
  const apiKey = process.env.HESABPAY_API_KEY;
  if (!apiKey) {
    console.error("HESABPAY_API_KEY is not set");
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
  // 1. RENEWAL FLOW  — reference format: "renew:<hotelId>:<planId>:<months>"
  // ============================================================
  if (typeof reference === "string" && reference.startsWith("renew:")) {
    const parts = reference.split(":");
    const hotelId = parts[1];
    const planId = parts[2];
    const monthsNum = parseInt(parts[3], 10);

    if (!hotelId || !planId || !Number.isFinite(monthsNum) || monthsNum < 1) {
      console.warn("Renewal webhook: bad reference", reference);
      return NextResponse.json({ error: "Bad renewal ref" }, { status: 400 });
    }

    if (!succeeded) {
      console.log(`Renewal webhook: payment not successful (${status})`);
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
    if (!hotel) {
      console.warn("Renewal webhook for unknown hotel:", hotelId);
      return NextResponse.json({ error: "Unknown hotel" }, { status: 404 });
    }

    const plan = await prisma.subscription_plans.findUnique({
      where: { id: planId },
      select: { max_branches: true, max_pos_devices: true, name: true },
    });
    if (!plan) {
      console.warn("Renewal webhook for unknown plan:", planId);
      return NextResponse.json({ error: "Unknown plan" }, { status: 404 });
    }

    const branchCount = await prisma.branches.count({
      where: { hotel_id: hotel.id },
    });
    const posCount = await prisma.pos_devices.count({
      where: {
        branches: { hotel_id: hotel.id },
        is_active: true,
      },
    });

    if (plan.max_branches != null && branchCount > plan.max_branches) {
      console.warn(
        `Renewal webhook: hotel ${hotel.id} has ${branchCount} branches but plan ${plan.name} allows ${plan.max_branches}`,
      );
      return NextResponse.json(
        { error: "Selected plan doesn't fit your current branches" },
        { status: 400 },
      );
    }
    if (plan.max_pos_devices != null && posCount > plan.max_pos_devices) {
      console.warn(
        `Renewal webhook: hotel ${hotel.id} has ${posCount} POS devices but plan ${plan.name} allows ${plan.max_pos_devices}`,
      );
      return NextResponse.json(
        { error: "Selected plan doesn't fit your current POS devices" },
        { status: 400 },
      );
    }

    const now = new Date();
    const currentExpiry = hotel.subscription_expires_at
      ? new Date(hotel.subscription_expires_at)
      : null;

    const base =
      currentExpiry && currentExpiry.getTime() > now.getTime()
        ? currentExpiry
        : now;

    const newExpiry = new Date(base);
    newExpiry.setMonth(newExpiry.getMonth() + monthsNum);

    try {
      await prisma.hotels.update({
        where: { id: hotel.id },
        data: {
          subscription_status: "active",
          subscription_expires_at: newExpiry,
          subscription_plan_id: planId,
        },
      });

      console.log(
        `✓ Renewal: hotel ${hotel.id} → plan ${plan.name}, extended ${monthsNum}mo → ${newExpiry.toISOString()}`,
      );

      return NextResponse.json({
        ok: true,
        renewal: true,
        hotel_id: hotel.id,
        plan_id: planId,
        months: monthsNum,
        new_expiry: newExpiry.toISOString(),
      });
    } catch (err) {
      console.error("Renewal webhook DB update failed:", err);
      return NextResponse.json(
        { error: "Could not finalize renewal" },
        { status: 500 },
      );
    }
  }

  // ============================================================
  // 2. ORDER PAYMENT FLOW
  //    Reference is an order UUID. On success: mark paid, then
  //    payout 95% to hotel owner + 5% to platform.
  // ============================================================
  const maybeOrder = await prisma.orders.findUnique({
    where: { id: reference },
    select: {
      id: true,
      payment_status: true,
      total_amount: true,
    },
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

    return NextResponse.json({
      ok: true,
      order: true,
      payout,
    });
  }

  // ============================================================
  // 3. NEW SIGNUP FLOW
  //    Reference is a pending_signups UUID.
  // ============================================================
  const signup = await prisma.pending_signups.findUnique({
    where: { id: reference },
    include: { subscription_plans: true },
  });
  if (!signup) {
    console.warn("HesabPay webhook for unknown reference:", reference);
    return NextResponse.json({ error: "Unknown reference" }, { status: 404 });
  }

  if (!succeeded) {
    await prisma.pending_signups.update({
      where: { id: signup.id },
      data: { status: "failed" },
    });
    return NextResponse.json({ ok: true });
  }

  if (signup.status === "paid" && signup.created_hotel_id) {
    return NextResponse.json({
      ok: true,
      already_processed: true,
      hotel_id: signup.created_hotel_id,
    });
  }

  try {
    const { hotel } = await provisionHotelFromSignup(signup, {
      generatePassword: false,
    });

    await prisma.pending_signups.update({
      where: { id: signup.id },
      data: {
        status: "paid",
        paid_at: new Date(),
        created_hotel_id: hotel.id,
      },
    });

    return NextResponse.json({ ok: true, hotel_id: hotel.id });
  } catch (err) {
    console.error("Failed to create hotel from paid signup:", err);
    return NextResponse.json(
      { error: "Could not finalize signup" },
      { status: 500 },
    );
  }
}