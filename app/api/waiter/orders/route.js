import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getStaffBranch } from "@/lib/pos-scope";

async function nextOrderNumber(branchId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const count = await prisma.orders.count({
    where: { branch_id: branchId, created_at: { gte: startOfDay } },
  });
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `ORD-${datePart}-${String(count + 1).padStart(4, "0")}`;
}

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getStaffBranch(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const tableSessionId = searchParams.get("table_session_id");
  if (!tableSessionId)
    return NextResponse.json(
      { error: "table_session_id is required" },
      { status: 400 },
    );

  const orders = await prisma.orders.findMany({
    where: { table_session_id: tableSessionId, branch_id: scope.branchId },
    include: {
      order_items: { include: { menu_items: { select: { name: true } } } },
    },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json({ orders });
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getStaffBranch(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { order_type, table_session_id, items, notes } = body;

  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json(
      { error: "At least one item is required" },
      { status: 400 },
    );
  if (order_type === "dine_in" && !table_session_id)
    return NextResponse.json(
      { error: "table_session_id is required for dine-in orders" },
      { status: 400 },
    );

  if (table_session_id) {
    const session = await prisma.table_sessions.findFirst({
      where: {
        id: table_session_id,
        branch_id: scope.branchId,
        status: "open",
      },
    });
    if (!session)
      return NextResponse.json(
        { error: "Table session not found or closed" },
        { status: 404 },
      );
  }

  // Snapshot price/tax from the DB — never trust price sent by the client.
  const menuItemIds = items.map((i) => i.menu_item_id);
  const menuItems = await prisma.menu_items.findMany({
    where: { id: { in: menuItemIds }, branch_id: scope.branchId },
  });
  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  for (const line of items) {
    if (!menuItemMap.has(line.menu_item_id))
      return NextResponse.json(
        { error: "One or more items don't belong to this branch" },
        { status: 400 },
      );
    if (!line.quantity || line.quantity <= 0)
      return NextResponse.json(
        { error: "Invalid item quantity" },
        { status: 400 },
      );
  }

  let subtotal = 0;
  let taxAmount = 0;
  const orderItemsData = items.map((line) => {
    const mi = menuItemMap.get(line.menu_item_id);
    const unitPrice = Number(mi.price);
    const lineTotal = unitPrice * line.quantity;
    const lineTax = (lineTotal * Number(mi.tax_rate || 0)) / 100;
    subtotal += lineTotal;
    taxAmount += lineTax;
    return {
      menu_item_id: mi.id,
      quantity: line.quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
      notes: line.notes || null,
      modifiers: line.modifiers || [],
      status: "pending",
      prep_station: mi.prep_station,
    };
  });
  const totalAmount = subtotal + taxAmount;

  try {
    const orderNumber = await nextOrderNumber(scope.branchId);

    const order = await prisma.orders.create({
      data: {
        branch_id: scope.branchId,
        table_session_id: table_session_id || null,
        order_number: orderNumber,
        order_type: order_type || (table_session_id ? "dine_in" : "takeaway"),
        status: "open",
        waiter_id: user.id,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes: notes || null,
        order_items: {
          create: orderItemsData.map(({ prep_station, ...rest }) => rest),
        },
      },
      include: { order_items: true },
    });

    // Group items by prep_station so each kitchen station only sees its own.
    const byStation = new Map();
    order.order_items.forEach((oi, idx) => {
      const station = orderItemsData[idx].prep_station || "general";
      if (!byStation.has(station)) byStation.set(station, []);
      byStation.get(station).push(oi.id);
    });

    for (const [station, orderItemIds] of byStation.entries()) {
      await prisma.kitchen_tickets.create({
        data: {
          order_id: order.id,
          prep_station: station,
          status: "queued",
          kitchen_ticket_items: {
            create: orderItemIds.map((id) => ({ order_item_id: id })),
          },
        },
      });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 400 },
    );
  }
}
