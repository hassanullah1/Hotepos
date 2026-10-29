import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { activateHotel } from "@/lib/provisionHotel";
import { payoutOrder } from "@/lib/payoutOrder";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  return NextResponse.json({ success: true }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    console.log(
      "[hesabpay webhook] hit @",
      new Date().toISOString(),
      "len:",
      rawBody.length,
    );
    if (rawBody) console.log("[hesabpay webhook] body:", rawBody);

    // ── 1. Parse
    let payload: any = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return NextResponse.json(
        { success: true, parsed: false },
        { status: 200 },
      );
    }

    // ── 2. Reference — HesabPay puts the order UUID in items[0].id
    const reference =
      payload.reference ||
      payload.metadata?.reference ||
      payload.items?.[0]?.id ||
      payload.data?.reference;

    if (!reference) {
      console.log("[hesabpay webhook] probe (no reference)");
      return NextResponse.json({ success: true, probe: true }, { status: 200 });
    }
    console.log("[hesabpay webhook] reference:", reference);

    // ── 3. Signature (HesabPay sends signature IN THE BODY — skip header check)
    const signatureHeader =
      request.headers.get("x-hesab-signature") ||
      request.headers.get("x-signature") ||
      "";
    const secret = process.env.HESABPAY_WEBHOOK_SECRET || "";

    // Only verify if BOTH a secret is configured AND a signature header is present.
    // HesabPay currently puts the signature in the body, so this path usually skips.
    if (secret && signatureHeader) {
      const expected = createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");
      let ok = false;
      try {
        ok = timingSafeEqual(
          Buffer.from(expected),
          Buffer.from(signatureHeader),
        );
      } catch {
        ok = false;
      }
      if (!ok) {
        console.warn("[hesabpay webhook] bad header signature for", reference);
        return NextResponse.json(
          { success: false, error: "invalid_signature" },
          { status: 200 },
        );
      }
    }

    // ── 4. Success detection — the actual HesabPay payload shape
    const statusStr = String(
      payload.status || payload.payment_status || "",
    ).toLowerCase();

    const succeeded =
      payload.success === true ||
      payload.status_code === 10 ||
      payload.status_code === "10" ||
      ["success", "succeeded", "paid", "completed"].includes(statusStr);

    const failed =
      payload.success === false ||
      [
        "failed",
        "failure",
        "cancelled",
        "canceled",
        "declined",
        "error",
        "rejected",
      ].includes(statusStr);

    console.log(
      "[hesabpay webhook] succeeded=",
      succeeded,
      "failed=",
      failed,
      "success_field=",
      payload.success,
      "status_code=",
      payload.status_code,
    );

    const transactionId = payload.transaction_id || null;

    const isRenewal =
      typeof reference === "string" && reference.startsWith("renew:");

    // ═══════════════ A. RENEWAL ═══════════════
    if (isRenewal) {
      const parts = String(reference).split(":");
      const hotelId = parts[1];
      const planId = parts[2];
      const monthsNum = parseInt(parts[3], 10);

      if (!hotelId || !planId || !Number.isFinite(monthsNum) || monthsNum < 1) {
        return NextResponse.json(
          { success: false, error: "bad_renewal_ref" },
          { status: 200 },
        );
      }
      if (!succeeded) {
        return NextResponse.json({
          success: true,
          renewal: true,
          status: "failed",
        });
      }

      const hotel = await prisma.hotels.findUnique({
        where: { id: hotelId },
        select: { id: true, subscription_expires_at: true },
      });
      if (!hotel) {
        return NextResponse.json(
          { success: false, error: "unknown_hotel" },
          { status: 200 },
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
        where: { id: hotelId },
        data: {
          subscription_status: "active",
          subscription_expires_at: newExpiry,
          subscription_plan_id: planId,
        },
      });

      return NextResponse.json({
        success: true,
        renewal: true,
        hotel_id: hotelId,
        months: monthsNum,
        new_expiry: newExpiry.toISOString(),
      });
    }

    // ── Guard UUID
    if (typeof reference !== "string" || !UUID_RE.test(reference)) {
      return NextResponse.json(
        { success: false, error: "invalid_reference" },
        { status: 200 },
      );
    }

    // ═══════════════ B. ORDER PAYMENT ═══════════════
    const maybeOrder = await prisma.orders.findUnique({
      where: { id: reference },
      select: { id: true, payment_status: true },
    });

    console.log(
      "[hesabpay webhook] order lookup:",
      maybeOrder
        ? `found payment_status=${maybeOrder.payment_status}`
        : "not found",
    );

    if (maybeOrder) {
      if (failed) {
        await prisma.orders.updateMany({
          where: { id: maybeOrder.id, payment_status: { not: "paid" } },
          data: { payment_status: "failed" },
        });
        return NextResponse.json({
          success: true,
          order: true,
          status: "failed",
        });
      }

      if (!succeeded) {
        // Order found but payload doesn't indicate success — do nothing
        console.warn(
          "[hesabpay webhook] order found but not marked paid (no success signal)",
        );
        return NextResponse.json({
          success: true,
          order: true,
          unknown_status: true,
        });
      }

      // Idempotent mark-paid
      if (maybeOrder.payment_status !== "paid") {
        await prisma.orders.update({
          where: { id: maybeOrder.id },
          data: {
            payment_status: "paid",
            paid_at: new Date(),
            payment_reference: transactionId || reference,
            // Do NOT set status: "in_progress" — kitchen advances it
          },
        });
        console.log(
          "[hesabpay webhook] ✅ order marked paid:",
          maybeOrder.id,
          "tx:",
          transactionId,
        );

        const existingPayout = await prisma.order_payouts.findUnique({
          where: { order_id: maybeOrder.id },
        });
        if (!existingPayout) {
          try {
            await payoutOrder(maybeOrder.id);
            console.log("[hesabpay webhook] payout done:", maybeOrder.id);
          } catch (err) {
            console.error("[hesabpay webhook] payout failed:", err);
          }
        }
      } else {
        console.log(
          "[hesabpay webhook] order already paid, skipping:",
          maybeOrder.id,
        );
      }

      return NextResponse.json({ success: true, order: true });
    }

    // ═══════════════ C. NEW HOTEL ACTIVATION ═══════════════
    const maybeHotel = await prisma.hotels.findUnique({
      where: { id: reference },
      include: {
        hotel_owner: { include: { users: true } },
        subscription_plans: true,
      },
    });

    if (maybeHotel) {
      if (failed) {
        await prisma.hotels.update({
          where: { id: maybeHotel.id },
          data: { subscription_status: "expired" },
        });
        return NextResponse.json({
          success: true,
          hotel: true,
          status: "failed",
        });
      }
      if (!succeeded) {
        return NextResponse.json({
          success: true,
          hotel: true,
          unknown_status: true,
        });
      }
      if (
        maybeHotel.subscription_status === "active" &&
        maybeHotel.subscription_expires_at &&
        new Date(maybeHotel.subscription_expires_at) >
          new Date(Date.now() - 60_000)
      ) {
        return NextResponse.json({
          success: true,
          hotel_id: maybeHotel.id,
          already_processed: true,
        });
      }
      try {
        const { resetLinkSent } = await activateHotel(maybeHotel.id);
        return NextResponse.json({
          success: true,
          hotel_id: maybeHotel.id,
          reset_link_sent: resetLinkSent,
        });
      } catch (err) {
        console.error("[hesabpay webhook] activate failed:", err);
        return NextResponse.json(
          { success: false, error: "activate_failed" },
          { status: 200 },
        );
      }
    }

    // ═══════════════ D. PENDING SIGNUP ═══════════════
    const signup = await prisma.pending_signups.findUnique({
      where: { id: reference },
    });

    if (signup) {
      if (failed) {
        await prisma.pending_signups.update({
          where: { id: signup.id },
          data: { status: "failed" },
        });
        return NextResponse.json({
          success: true,
          signup: true,
          status: "failed",
        });
      }
      if (!succeeded) {
        return NextResponse.json({
          success: true,
          signup: true,
          unknown_status: true,
        });
      }
      return NextResponse.json({ success: true, signup: true });
    }

    console.warn("[hesabpay webhook] unknown reference:", reference);
    return NextResponse.json(
      { success: false, error: "unknown_reference" },
      { status: 200 },
    );
  } catch (err) {
    console.error("[hesabpay webhook] fatal:", err);
    return NextResponse.json(
      { success: false, error: "internal" },
      { status: 200 },
    );
  }
}
