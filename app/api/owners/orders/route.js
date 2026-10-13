// app/api/owners/orders/route.js
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

function makeOrderNumber() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${t}-${r}`;
}

async function createKitchenTicketsForOrder(order, menuMap) {
  const kitchenOrderItems = order.order_items.filter((oi) => {
    const m = menuMap.get(oi.menu_item_id);
    return m?.is_kitchen === true;
  });
  if (kitchenOrderItems.length === 0) return [];

  const byStation = new Map();
  for (const oi of kitchenOrderItems) {
    const m = menuMap.get(oi.menu_item_id);
    const station = m?.prep_station || null;
    if (!byStation.has(station)) byStation.set(station, []);
    byStation.get(station).push(oi.id);
  }

  const createdTicketIds = [];
  for (const [station, orderItemIds] of byStation.entries()) {
    const ticket = await prisma.kitchen_tickets.create({
      data: { order_id: order.id, prep_station: station, status: "queued" },
      select: { id: true },
    });
    createdTicketIds.push(ticket.id);
    await prisma.kitchen_ticket_items.createMany({
      data: orderItemIds.map((order_item_id) => ({
        kitchen_ticket_id: ticket.id,
        order_item_id,
      })),
    });
  }
  return createdTicketIds;
}

// GET /api/owners/orders?branch_id=...&status=open&table_id=...
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id");
  const status = searchParams.get("status");
  const tableId = searchParams.get("table_id");

  if (!branchId)
    return NextResponse.json(
      { error: "branch_id is required" },
      { status: 400 },
    );

  const branch = await assertManagedBranch(branchId, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found or not accessible" },
      { status: 404 },
    );

  const where = { branch_id: branchId };
  if (status) where.status = status;
  if (tableId) where.table_sessions = { is: { table_id: tableId } };

  const orders = await prisma.orders.findMany({
    where,
    include: ORDER_INCLUDE,
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({ orders: orders.map(serializeOrder) });
}

// POST /api/owners/orders
// body: {
//   branch_id,
//   table_id?,                // for dine-in on a table
//   room_stay_id?,            // for room-service / charge-to-room
//   customer_id?,             // optional, links the order to a customer
//   notes?, order_type?,
//   items: [{ menu_item_id, quantity, notes? }]
// }
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    branch_id,
    table_id,
    room_stay_id,
    customer_id,
    notes,
    order_type,
    items,
  } = body || {};

  if (!branch_id || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "branch_id and at least one item are required" },
      { status: 400 },
    );
  }

  const branch = await assertManagedBranch(branch_id, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found or not accessible" },
      { status: 404 },
    );

  // table_id and room_stay_id are mutually exclusive
  if (table_id && room_stay_id) {
    return NextResponse.json(
      { error: "Cannot assign the same order to both a table and a room" },
      { status: 400 },
    );
  }

  // Validate table (if provided)
  let table = null;
  if (table_id) {
    table = await prisma.dining_tables.findFirst({
      where: { id: table_id, branch_id },
      select: { id: true },
    });
    if (!table)
      return NextResponse.json(
        { error: "Table not found in this branch" },
        { status: 404 },
      );
  }

  // Validate active room stay (if provided)
  let roomStay = null;
  if (room_stay_id) {
    roomStay = await prisma.room_stays.findFirst({
      where: { id: room_stay_id, branch_id, status: "active" },
      select: { id: true },
    });
    if (!roomStay)
      return NextResponse.json(
        { error: "Room stay is not active or not in this branch" },
        { status: 404 },
      );
  }

  // Validate customer (if provided)
  let customer = null;
  if (customer_id) {
    customer = await prisma.customers.findFirst({
      where: { id: customer_id, hotel_id: branch.hotel_id },
      select: { id: true },
    });
    if (!customer)
      return NextResponse.json(
        { error: "Customer not found in this hotel" },
        { status: 404 },
      );
  }

  // Load authoritative menu rows
  const menuIds = items.map((i) => i.menu_item_id).filter(Boolean);
  const menuRows = await prisma.menu_items.findMany({
    where: { id: { in: menuIds }, branch_id },
    select: { id: true, price: true, is_kitchen: true, prep_station: true },
  });

  if (menuRows.length !== menuIds.length) {
    return NextResponse.json(
      { error: "One or more menu items are invalid for this branch" },
      { status: 400 },
    );
  }
  const menuMap = new Map(menuRows.map((m) => [m.id, m]));

  const resolved = items.map((i) => {
    const m = menuMap.get(i.menu_item_id);
    const qty = Math.max(1, Number(i.quantity) || 1);
    const unit = Number(m.price);
    return {
      menu_item_id: i.menu_item_id,
      quantity: qty,
      unit_price: unit,
      line_total: +(unit * qty).toFixed(2),
      notes: i.notes || null,
      status: "pending",
    };
  });

  const subtotal = resolved.reduce((s, i) => s + i.line_total, 0);

  try {
    // Find-or-create open table session (only when table assigned)
    let sessionId = null;
    if (table) {
      const existing = await prisma.table_sessions.findFirst({
        where: { table_id: table.id, status: "open" },
        select: { id: true },
      });
      if (existing) sessionId = existing.id;
      else {
        const created = await prisma.table_sessions.create({
          data: {
            table_id: table.id,
            branch_id,
            opened_by: user.id,
            status: "open",
          },
          select: { id: true },
        });
        sessionId = created.id;
      }
    }

    // Default order_type based on scope
    const finalType =
      order_type ||
      (roomStay ? "room_service" : table ? "dine_in" : "takeaway");

    // Create the order + its items
    const order = await prisma.orders.create({
      data: {
        branch_id,
        table_session_id: sessionId,
        room_stay_id: roomStay ? roomStay.id : null,
        customer_id: customer ? customer.id : null,
        order_number: makeOrderNumber(),
        order_type: finalType,
        status: "open",
        waiter_id: user.id,
        subtotal,
        total_amount: subtotal,
        notes: notes || null,
        order_items: { create: resolved },
      },
      include: ORDER_INCLUDE,
    });

    // Bump the room stay's running bill (cached totals)
    if (roomStay) {
      await prisma.room_stays.update({
        where: { id: roomStay.id },
        data: {
          orders_total: { increment: subtotal },
          grand_total: { increment: subtotal },
        },
      });
    }

    // Create kitchen tickets for is_kitchen items only
    try {
      await createKitchenTicketsForOrder(order, menuMap);
    } catch (ticketErr) {
      console.error("Kitchen ticket creation failed:", ticketErr);
    }

    return NextResponse.json({ order: serializeOrder(order) }, { status: 201 });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 400 },
    );
  }
}
