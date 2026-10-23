import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getBuyerFromRequest } from "@/lib/buyer-auth";
import { payoutOrder } from "@/lib/payoutOrder";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// POST /api/payments/hesabpay/order/confirm
// Body: { ref, transaction_id, success }
//
// Called by /order/track/[token] when HesabPay redirects the buyer back
// with ?data={"success":true,...,"transaction_id":"..."} in the URL.
//
// The webhook is the authoritative source of truth, but on localhost /
// environments where HesabPay can't reach the server, this redirect-based
// confirmation is the fallback. Both paths are idempotent.
export async function POST(request: Request) {
  const buyer = await getBuyerFromRequest(request);
  if (!buyer) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    ref?: string;
    transaction_id?: string;
    success?: boolean;
  };

  const refMatch = String(body.ref || "").match(UUID_RE);
  const ref = refMatch ? refMatch[0] : "";
  const transactionId = body.transaction_id || null;
  const success = body.success === true;

  if (!ref) {
    return NextResponse.json({ error: "ref required" }, { status: 400 });
  }
  if (!success) {
    return NextResponse.json(
      { error: "Payment not successful" },
      { status: 400 },
    );
  }

  const order = await prisma.orders.findUnique({
    where: { id: ref },
    select: {
      id: true,
      buyer_id: true,
      payment_status: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.buyer_id !== buyer.buyerId) {
    return NextResponse.json({ error: "NOT_YOUR_ORDER" }, { status: 403 });
  }

  if (order.payment_status === "paid") {
    return NextResponse.json({ ok: true, already_processed: true });
  }

  try {
    await prisma.orders.update({
      where: { id: order.id },
      data: {
        payment_status: "paid",
        paid_at: new Date(),
        payment_reference: transactionId,
        status: "in_progress",
      },
    });

    const payout = await payoutOrder(order.id);

    return NextResponse.json({
      ok: true,
      payout,
    });
  } catch (err) {
    console.error("Order confirm failed:", err);
    return NextResponse.json(
      { error: "Could not finalize payment" },
      { status: 500 },
    );
  }
}
