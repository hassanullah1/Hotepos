import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const order = await prisma.orders.findFirst({
    where: { public_token: token },
    select: {
      id: true,
      order_number: true,
      status: true,
      order_type: true,
      total_amount: true,
      payment_status: true,
      paid_at: true,
      created_at: true,
      branches: { select: { name: true, currency: true } },
      order_items: {
        select: {
          id: true,
          menu_item_id: true,
          quantity: true,
          unit_price: true,
          line_total: true,
          status: true,
          menu_items: { select: { name: true } },
        },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({
    order: {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      order_type: order.order_type,
      total_amount: Number(order.total_amount),
      payment_status: order.payment_status || "unpaid",
      paid_at: order.paid_at,
      created_at: order.created_at,
      branch_name: order.branches?.name || "",
      currency: order.branches?.currency || "AFN",
      items: order.order_items.map((i) => ({
        id: i.id,
        menu_item_id: i.menu_item_id,
        name: i.menu_items?.name || "",
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
        line_total: Number(i.line_total),
        status: i.status,
      })),
    },
  });
}
