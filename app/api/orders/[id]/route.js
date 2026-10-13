import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.orders.findUnique({
    where: { id: params.id },
    include: {
      order_items: { include: { menu_items: { select: { name: true } } } },
      kitchen_tickets: { include: { kitchen_ticket_items: true } },
      table_sessions: { include: { dining_tables: { select: { table_number: true } } } },
      payments: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}
