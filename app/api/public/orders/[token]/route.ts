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
      source: true,
      total_amount: true,
      payment_status: true,
      paid_at: true,
      created_at: true,

      // ─────────────── NEW: refund fields ───────────────
   

      branches: { select: { name: true, currency: true } },

      // ─────────────── NEW: online-only satellite ───────────────
      online_details: {
        select: {
          contact_name: true,
          contact_phone: true,
          delivery_address: true,
          delivery_city: true,
          delivery_lat: true,
          delivery_lng: true,
          delivery_notes: true,
        },
      },

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
      source: order.source || "",
      total_amount: Number(order.total_amount),
      payment_status: order.payment_status || "unpaid",
      paid_at: order.paid_at,
     
      created_at: order.created_at,
      branch_name: order.branches?.name || "",
      currency: order.branches?.currency || "AFN",

      // ─────────────── NEW: online-only details ───────────────
      // null for POS / QR orders — the UI gates rendering on this.
      online_details: order.online_details
        ? {
            contact_name: order.online_details.contact_name,
            contact_phone: order.online_details.contact_phone,
            delivery_address: order.online_details.delivery_address,
            delivery_city: order.online_details.delivery_city,
            delivery_lat:
              order.online_details.delivery_lat != null
                ? Number(order.online_details.delivery_lat)
                : null,
            delivery_lng:
              order.online_details.delivery_lng != null
                ? Number(order.online_details.delivery_lng)
                : null,
            delivery_notes: order.online_details.delivery_notes,
          }
        : null,

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
