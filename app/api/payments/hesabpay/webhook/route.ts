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

    // ── 1. Parse (never 400 on empty/invalid body — probe sends junk)
    let payload: any = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return NextResponse.json(
        { success: true, parsed: false },
        { status: 200 },
      );
    }

    // ── 2. Reference (probe has none)
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

    // ── 3. Signature (HesabPay puts signature in body; header check is optional)
    const signatureHeader =
      request.headers.get("x-hesab-signature") ||
      request.headers.get("x-signature") ||
      "";
    const secret = process.env.HESABPAY_WEBHOOK_SECRET || "";

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

    // ── 4. Success detection — actual HesabPay payload shape
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

    // ═══════════════════════════════════════════════════════════════
    // A. RENEWAL — "renew:<hotelId>:<planId>:<months>"
    // ═══════════════════════════════════════════════════════════════
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

      const plan = await prisma.subscription_plans.findUnique({
        where: { id: planId },
        select: { max_branches: true, max_pos_devices: true },
      });
      if (!plan) {
        return NextResponse.json(
          { success: false, error: "unknown_plan" },
          { status: 200 },
        );
      }

      const branchCount = await prisma.branches.count({
        where: { hotel_id: hotelId },
      });
      const posCount = await prisma.pos_devices.count({
        where: { branches: { hotel_id: hotelId }, is_active: true },
      });

      if (plan.max_branches != null && branchCount > plan.max_branches) {
        return NextResponse.json(
          { success: false, error: "plan_too_small_branches" },
          { status: 200 },
        );
      }
      if (plan.max_pos_devices != null && posCount > plan.max_pos_devices) {
        return NextResponse.json(
          { success: false, error: "plan_too_small_pos" },
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

      console.log(
        "[hesabpay webhook] ✅ renewal applied:",
        hotelId,
        "months:",
        monthsNum,
        "new_expiry:",
        newExpiry.toISOString(),
      );

      return NextResponse.json({
        success: true,
        renewal: true,
        hotel_id: hotelId,
        months: monthsNum,
        new_expiry: newExpiry.toISOString(),
      });
    }

    // ── Guard: reference must be a UUID for remaining paths
    if (typeof reference !== "string" || !UUID_RE.test(reference)) {
      return NextResponse.json(
        { success: false, error: "invalid_reference" },
        { status: 200 },
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // B. ORDER PAYMENT
    // ═══════════════════════════════════════════════════════════════
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
        console.warn(
          "[hesabpay webhook] order found but not marked paid (no success signal)",
        );
        return NextResponse.json({
          success: true,
          order: true,
          unknown_status: true,
        });
      }

      if (maybeOrder.payment_status !== "paid") {
        await prisma.orders.update({
          where: { id: maybeOrder.id },
          data: {
            payment_status: "paid",
            paid_at: new Date(),
            payment_reference: transactionId || reference,
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

    // ═══════════════════════════════════════════════════════════════
    // C. HOTEL — either new signup activation OR renewal for
    //    a hotel whose reference was sent as a plain UUID.
    // ═══════════════════════════════════════════════════════════════
    const maybeHotel = await prisma.hotels.findUnique({
      where: { id: reference },
      include: {
        hotel_owner: { include: { users: true } },
        subscription_plans: true,
      },
    });

    if (maybeHotel) {
      // ── GUARD: skip established hotels (renewals) ──
      // If the hotel already has an owner with a password, it's a real hotel
      // doing a RENEWAL, not a new signup. The webhook should NOT activate it
      // here — that would add 1 extra month + send an unwanted password email.
      // Renewals are extended by /api/renew/confirm instead.
      if (maybeHotel.hotel_owner?.users?.password_hash) {
        console.log(
          "[hesabpay webhook] skipping activation — renewal for established hotel:",
          maybeHotel.id,
        );
        return NextResponse.json({
          success: true,
          hotel: true,
          skip: "renewal_detected",
        });
      }

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

      // Idempotent — already activated within the last minute
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
        console.log(
          "[hesabpay webhook] ✅ hotel activated:",
          maybeHotel.id,
          "resetLinkSent:",
          resetLinkSent,
        );
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

    // ═══════════════════════════════════════════════════════════════
    // D. PENDING SIGNUP
    // ═══════════════════════════════════════════════════════════════
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
