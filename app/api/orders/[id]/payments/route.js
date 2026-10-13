import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await request.json();
  const { payment_method_id, amount, amount_tendered } = body;

  if (!payment_method_id || amount === undefined) {
    return NextResponse.json(
      { error: "payment_method_id and amount are required" },
      { status: 400 },
    );
  }

  const order = await prisma.orders.findUnique({
    where: { id },
    include: { payments: true, table_sessions: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const alreadyPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(order.total_amount) - alreadyPaid;
  const changeGiven = amount_tendered ? Math.max(0, amount_tendered - amount) : 0;

  const isFullyPaid = alreadyPaid + Number(amount) >= Number(order.total_amount) - 0.01;

  const [payment] = await prisma.$transaction([
    prisma.payments.create({
      data: {
        order_id: id,
        payment_method_id,
        amount,
        amount_tendered: amount_tendered ?? amount,
        change_given: changeGiven,
        received_by: user.id,
        status: "completed",
      },
    }),
    ...(isFullyPaid
      ? [
          prisma.orders.update({ where: { id }, data: { status: "paid" } }),
          ...(order.table_session_id
            ? [
                prisma.table_sessions.update({
                  where: { id: order.table_session_id },
                  data: { status: "closed", closed_at: new Date() },
                }),
              ]
            : []),
        ]
      : []),
  ]);

  // free up the table if the session closed
  if (isFullyPaid && order.table_sessions) {
    await prisma.dining_tables.update({
      where: { id: order.table_sessions.table_id },
      data: { status: "available" },
    });
  }

  return NextResponse.json({
    payment,
    order_status: isFullyPaid ? "paid" : "partial",
    remaining_before: remaining,
  });
}
