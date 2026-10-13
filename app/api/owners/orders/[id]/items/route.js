// app/api/owners/orders/[id]/items/route.js
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

async function recalcTotals(orderId) {
  const rows = await prisma.order_items.findMany({
    where: { order_id: orderId },
    select: { line_total: true },
  });
  const subtotal = rows.reduce((s, r) => s + Number(r.line_total), 0);
  await prisma.orders.update({
    where: { id: orderId },
    data: { subtotal, total_amount: subtotal },
  });
  return subtotal;
}

// POST — add one item to the order
// body: { menu_item_id, quantity?, notes? }
export async function POST(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await loadOrderScoped(id, user.id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (["paid", "closed", "cancelled"].includes(order.status)) {
    return NextResponse.json(
      { error: "Order is not open for edits" },
      { status: 400 },
    );
  }

  const body = await request.json();
  if (!body.menu_item_id)
    return NextResponse.json(
      { error: "menu_item_id is required" },
      { status: 400 },
    );

  const menu = await prisma.menu_items.findFirst({
    where: { id: body.menu_item_id, branch_id: order.branch_id },
    select: { id: true, price: true },
  });
  if (!menu)
    return NextResponse.json(
      { error: "Menu item not found in this branch" },
      { status: 404 },
    );

  const qty = Math.max(1, Number(body.quantity) || 1);
  const unit = Number(menu.price);
  const lineTotal = +(unit * qty).toFixed(2);

  try {
    await prisma.order_items.create({
      data: {
        order_id: id,
        menu_item_id: menu.id,
        quantity: qty,
        unit_price: unit,
        line_total: lineTotal,
        notes: body.notes || null,
        status: "pending",
      },
    });

    const newSubtotal = await recalcTotals(id);

    // Keep the room stay's running total in sync when this order is room-scoped
    if (order.room_stay_id) {
      // We recalc from scratch for accuracy instead of blind increments.
      const rows = await prisma.order_items.findMany({
        where: { orders: { room_stay_id: order.room_stay_id } },
        select: { line_total: true },
      });
      const ordersTotal = rows.reduce((s, r) => s + Number(r.line_total), 0);
      const stay = await prisma.room_stays.findUnique({
        where: { id: order.room_stay_id },
        select: { rent_total: true },
      });
      const rent = Number(stay?.rent_total || 0);
      await prisma.room_stays.update({
        where: { id: order.room_stay_id },
        data: {
          orders_total: ordersTotal,
          grand_total: rent + ordersTotal,
        },
      });
    } else {
      // Unused variable guard; keep subtotal accessible if needed later
      void newSubtotal;
    }

    const full = await prisma.orders.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    return NextResponse.json({ order: serializeOrder(full) }, { status: 201 });
  } catch (err) {
    console.error("Add order item error:", err);
    return NextResponse.json({ error: "Failed to add item" }, { status: 400 });
  }
}

// DELETE ?item_id=xxx — remove one line
export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await loadOrderScoped(id, user.id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("item_id");
  if (!itemId)
    return NextResponse.json({ error: "item_id is required" }, { status: 400 });

  try {
    await prisma.order_items.deleteMany({
      where: { id: itemId, order_id: id },
    });
    await recalcTotals(id);

    // Keep the room stay's running total in sync when this order is room-scoped
    if (order.room_stay_id) {
      const rows = await prisma.order_items.findMany({
        where: { orders: { room_stay_id: order.room_stay_id } },
        select: { line_total: true },
      });
      const ordersTotal = rows.reduce((s, r) => s + Number(r.line_total), 0);
      const stay = await prisma.room_stays.findUnique({
        where: { id: order.room_stay_id },
        select: { rent_total: true },
      });
      const rent = Number(stay?.rent_total || 0);
      await prisma.room_stays.update({
        where: { id: order.room_stay_id },
        data: {
          orders_total: ordersTotal,
          grand_total: rent + ordersTotal,
        },
      });
    }

    const full = await prisma.orders.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    return NextResponse.json({ order: serializeOrder(full) });
  } catch (err) {
    console.error("Remove order item error:", err);
    return NextResponse.json(
      { error: "Failed to remove item" },
      { status: 400 },
    );
  }
}
