import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// POST /api/payments/hesabpay/order/confirm
// Called by the track page after HesabPay redirects back.
// The webhook is the AUTHORITATIVE source of truth. This endpoint just reports
// the current DB state — the track page (which polls every 5s) will show "paid"
// as soon as the webhook lands. No auth gate, no client-trust.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { ref?: string };
    const refMatch = String(body.ref || "").match(UUID_RE);
    const ref = refMatch ? refMatch[0] : "";

    if (!ref) {
      return NextResponse.json(
        { ok: false, error: "ref required" },
        { status: 200 },
      );
    }

    const order = await prisma.orders.findUnique({
      where: { id: ref },
      select: { id: true, payment_status: true },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 200 },
      );
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ ok: true, already_processed: true });
    }

    // Webhook hasn't fired yet — tell caller current state, don't error
    return NextResponse.json({
      ok: false,
      status: order.payment_status || "unpaid",
    });
  } catch (err) {
    console.error("[confirm] error:", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 200 });
  }
}
