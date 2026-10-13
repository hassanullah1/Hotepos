import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBuyerFromRequest } from "@/lib/buyer-auth";

export async function GET(request: Request) {
  const buyer = await getBuyerFromRequest(request);
  if (!buyer) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const orders = await prisma.orders.findMany({
    where: { buyer_id: buyer.buyerId },
    orderBy: { created_at: "desc" },
    take: 50,
    select: {
      id: true,
      order_number: true,
      public_token: true,
      status: true,
      order_type: true,
      total_amount: true,
      created_at: true,
      branches: {
        select: {
          name: true,
          currency: true,
          hotels: { select: { name: true, logo_url: true } },
        },
      },
      order_items: {
        select: {
          quantity: true,
          menu_items: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      public_token: o.public_token,
      status: o.status,
      order_type: o.order_type,
      total_amount: Number(o.total_amount),
      created_at: o.created_at,
      branch_name: o.branches?.name || "",
      hotel_name: o.branches?.hotels?.name || "",
      logo_url: o.branches?.hotels?.logo_url || null,
      currency: o.branches?.currency || "AFN",
      items: o.order_items.map((i) => ({
        name: i.menu_items?.name || "",
        quantity: i.quantity,
      })),
    })),
  });
}
