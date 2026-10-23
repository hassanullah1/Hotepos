import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getBuyerFromRequest } from "@/lib/buyer-auth";
import { createOrderPaymentSession } from "@/lib/hesabpay";

export async function POST(request: Request) {
  const buyer = await getBuyerFromRequest(request);
  if (!buyer)
    return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const orderId = typeof body.order_id === "string" ? body.order_id : "";
  if (!orderId)
    return NextResponse.json({ error: "ORDER_ID_REQUIRED" }, { status: 400 });

  const order = await prisma.orders.findFirst({
    where: { id: orderId, buyer_id: buyer.buyerId },
    select: {
      id: true,
      order_number: true,
      total_amount: true,
      payment_status: true,
      status: true,
      public_token: true,
    },
  });

  if (!order)
    return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  if (order.payment_status === "paid")
    return NextResponse.json({ error: "ORDER_ALREADY_PAID" }, { status: 409 });
  if (order.status === "cancelled")
    return NextResponse.json({ error: "ORDER_CANCELLED" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const token = order.public_token || order.id;

  const result = await createOrderPaymentSession({
    order_id: order.id,
    order_number: order.order_number,
    amount: Number(order.total_amount),
    email: buyer.email,
    // `ref` lets the track page know which order to confirm after redirect.
    success_url: `${appUrl}/order/track/${token}?paid=1&ref=${order.id}`,
    failure_url: `${appUrl}/order/track/${token}?payment=failed`,
  });

  if (!result.ok)
    return NextResponse.json(
      { error: result.message || "Could not start payment" },
      { status: 502 },
    );

  return NextResponse.json({ payment_url: result.payment_url });
}
