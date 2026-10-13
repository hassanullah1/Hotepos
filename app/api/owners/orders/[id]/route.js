// app/api/owners/orders/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { assertManagedBranch } from "@/lib/owner-scope";

const ORDER_INCLUDE = {
  order_items: {
    include: { menu_items: { select: { id: true, name: true } } },
  },
  table_sessions: {
    include: {
      dining_tables: {
        select: { id: true, table_number: true, area_id: true },
      },
    },
  },
  room_stays: {
    include: {
      rooms: { select: { id: true, room_number: true, floor: true } },
      customers: { select: { id: true, full_name: true, phone: true } },
    },
  },
};

function serializeOrder(o) {
  const t = o.table_sessions?.dining_tables || null;
  const rs = o.room_stays || null;
  return {
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    order_type: o.order_type,
    subtotal: Number(o.subtotal),
    discount_amount: Number(o.discount_amount),
    tax_amount: Number(o.tax_amount),
    service_charge: Number(o.service_charge),
    total_amount: Number(o.total_amount),
    notes: o.notes,
    created_at: o.created_at,
    updated_at: o.updated_at,
    table_session_id: o.table_session_id,
    room_stay_id: o.room_stay_id,
    customer_id: o.customer_id,
    table: t
      ? { id: t.id, table_number: t.table_number, area_id: t.area_id }
      : null,
    room_stay: rs
      ? {
          id: rs.id,
          room: rs.rooms
            ? {
                id: rs.rooms.id,
                room_number: rs.rooms.room_number,
                floor: rs.rooms.floor,
              }
            : null,
          customer: rs.customers
            ? {
                id: rs.customers.id,
                full_name: rs.customers.full_name,
                phone: rs.customers.phone,
              }
            : null,
          guest_name: rs.guest_name,
        }
      : null,
    items: (o.order_items || []).map((i) => ({
      id: i.id,
      menu_item_id: i.menu_item_id,
      name: i.menu_items?.name || "Item",
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      line_total: Number(i.line_total),
      notes: i.notes,
      status: i.status,
    })),
  };
}

async function loadOrderScoped(id, userId) {
  const order = await prisma.orders.findUnique({ where: { id } });
  if (!order) return null;
  const branch = await assertManagedBranch(order.branch_id, userId);
  return branch ? order : null;
}

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOrderScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const full = await prisma.orders.findUnique({
    where: { id },
    include: ORDER_INCLUDE,
  });
  return NextResponse.json({ order: serializeOrder(full) });
}

const ALLOWED = [
  "open",
  "in_progress",
  "served",
  "paid",
  "closed",
  "cancelled",
];

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOrderScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const data = {};
  if (body.status !== undefined) {
    if (!ALLOWED.includes(body.status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    data.status = body.status;
  }
  if (body.notes !== undefined) data.notes = body.notes || null;

  try {
    const updated = await prisma.orders.update({
      where: { id },
      data,
      include: ORDER_INCLUDE,
    });

    // Auto-close the table session when no open orders remain
    if (
      updated.table_session_id &&
      ["paid", "closed", "cancelled"].includes(updated.status)
    ) {
      const stillOpen = await prisma.orders.count({
        where: {
          table_session_id: updated.table_session_id,
          status: { in: ["open", "in_progress", "served"] },
        },
      });
      if (stillOpen === 0) {
        await prisma.table_sessions.update({
          where: { id: updated.table_session_id },
          data: { status: "closed", closed_at: new Date() },
        });
      }
    }

    return NextResponse.json({ order: serializeOrder(updated) });
  } catch (err) {
    console.error("Update order error:", err);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOrderScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.status === "closed" || existing.status === "paid") {
    return NextResponse.json(
      { error: "Cannot delete a closed/paid order" },
      { status: 400 },
    );
  }

  try {
    if (existing.status === "cancelled") {
      await prisma.orders.delete({ where: { id } });
    } else {
      await prisma.orders.update({
        where: { id },
        data: { status: "cancelled" },
      });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete order error:", err);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 400 },
    );
  }
}
