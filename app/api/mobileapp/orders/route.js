import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ticketNewItems } from "@/lib/kitchen-tickets";

const ORDER_INCLUDE = {
  table_sessions: {
    select: { id: true, dining_tables: { select: { table_number: true } } },
  },
  users: { select: { id: true, full_name: true } }, // waiter
  order_items: {
    include: {
      menu_items: { select: { id: true, name: true, image_url: true } },
    },
    orderBy: { created_at: "asc" },
  },
};

function serializeOrder(o) {
  return {
    id: o.id,
    order_number: o.order_number,
    order_type: o.order_type,
    status: o.status,
    table_session_id: o.table_session_id,
    table_number: o.table_sessions?.dining_tables?.table_number ?? null,
    waiter_name: o.users?.full_name ?? null,
    subtotal: o.subtotal.toString(),
    discount_amount: o.discount_amount.toString(),
    tax_amount: o.tax_amount.toString(),
    service_charge: o.service_charge.toString(),
    total_amount: o.total_amount.toString(),
    notes: o.notes,
    created_at: o.created_at,
    items: o.order_items.map((it) => ({
      id: it.id,
      menu_item_id: it.menu_item_id,
      name: it.menu_items.name,
      image_url: it.menu_items.image_url,
      quantity: it.quantity,
      unit_price: it.unit_price.toString(),
      line_total: it.line_total.toString(),
      notes: it.notes,
      status: it.status, // pending | preparing | ready | served
    })),
  };
}

// GET /mobileapp/orders?table_session_id=...&status=open
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user || !user.branch_id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tableSessionId = searchParams.get("table_session_id");
  const status = searchParams.get("status");

  const where = { branch_id: user.branch_id };
  if (tableSessionId) where.table_session_id = tableSessionId;
  if (status) {
    where.status = status;
  } else if (!tableSessionId) {
    // default "what's open right now" view for Home
    where.status = { in: ["open", "sent", "in_progress"] };
  }

  const orders = await prisma.orders.findMany({
    where,
    include: ORDER_INCLUDE,
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({ orders: orders.map(serializeOrder) });
}

async function nextOrderNumber(branchId) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const countToday = await prisma.orders.count({
    where: {
      branch_id: branchId,
      created_at: { gte: new Date(new Date().toDateString()) },
    },
  });
  return `ORD-${today}-${String(countToday + 1).padStart(4, "0")}`;
}

// POST /mobileapp/orders
// body: { order_type: "dine_in" | "takeaway", table_session_id?, items: [{menu_item_id, quantity, notes}] }
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user || !user.branch_id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.items?.length)
    return NextResponse.json({ error: "items are required" }, { status: 400 });

  if (body.order_type === "dine_in" && !body.table_session_id) {
    return NextResponse.json(
      { error: "table_session_id is required for dine_in orders" },
      { status: 400 },
    );
  }

  const menuItems = await prisma.menu_items.findMany({
    where: {
      id: { in: body.items.map((i) => i.menu_item_id) },
      branch_id: user.branch_id,
    },
  });
  if (menuItems.length !== body.items.length) {
    return NextResponse.json(
      { error: "One or more menu items are invalid for this branch" },
      { status: 400 },
    );
  }
  const byId = Object.fromEntries(menuItems.map((m) => [m.id, m]));

  let subtotal = 0;
  let taxAmount = 0;
  const itemsData = body.items.map((i) => {
    const menuItem = byId[i.menu_item_id];
    const lineTotal = Number(menuItem.price) * i.quantity;
    const lineTax = (lineTotal * Number(menuItem.tax_rate ?? 0)) / 100;
    subtotal += lineTotal;
    taxAmount += lineTax;
    return {
      menu_item_id: i.menu_item_id,
      quantity: i.quantity,
      unit_price: menuItem.price,
      line_total: lineTotal,
      notes: i.notes ?? null,
      status: "pending",
    };
  });

  const orderNumber = await nextOrderNumber(user.branch_id);
  const totalAmount = subtotal + taxAmount;

  const order = await prisma.orders.create({
    data: {
      branch_id: user.branch_id,
      table_session_id: body.table_session_id ?? null,
      order_number: orderNumber,
      order_type: body.order_type ?? "dine_in",
      waiter_id: user.id,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      order_items: { create: itemsData },
    },
    include: ORDER_INCLUDE,
  });

  await ticketNewItems(order.id);

  return NextResponse.json({ order: serializeOrder(order) }, { status: 201 });
}
