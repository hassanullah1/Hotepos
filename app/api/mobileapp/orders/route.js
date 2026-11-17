import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ticketNewItems } from "@/lib/kitchen-tickets";
import { ORDER_INCLUDE, serializeOrder } from "@/lib/order-serialize";

const OPEN_STATUSES = ["open", "in_progress", "served"];

/* ═════════════════════════════════════════════════════════════
 * GET /mobileapp/orders — active POS orders for the branch
 * ═══════════════════════════════════════════════════════════*/
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedBranchId = searchParams.get("branch_id");
  const tableSessionId = searchParams.get("table_session_id");
  const tableId = searchParams.get("table_id");
  const status = searchParams.get("status");
  const scope = searchParams.get("scope");

  const branchId = requestedBranchId || user.branch_id;
  if (!branchId) {
    return NextResponse.json(
      { error: "No branch_id for this user. Pass ?branch_id=<uuid>." },
      { status: 400 },
    );
  }

  const branch = await prisma.branches.findUnique({
    where: { id: branchId },
    select: { id: true, hotel_id: true, name: true },
  });
  if (!branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  const isOwnerOfBranch = user.hotel_id && user.hotel_id === branch.hotel_id;
  const isAssignedToBranch = user.branch_id === branchId;
  const isAdmin = ["super_admin", "admin"].includes(user.roles?.name);

  if (!isAdmin && !isOwnerOfBranch && !isAssignedToBranch) {
    return NextResponse.json(
      { error: "Not allowed to view this branch" },
      { status: 403 },
    );
  }

  const where = { branch_id: branchId, source: "pos" };

  if (tableSessionId) where.table_session_id = tableSessionId;
  else if (tableId) where.table_sessions = { table_id: tableId };

  if (status) where.status = status;
  else if (scope === "all") {
    /* no filter */
  } else if (scope === "paid") {
    where.status = { in: ["paid", "closed"] };
  } else {
    where.status = { in: OPEN_STATUSES };
  }

  const orders = await prisma.orders.findMany({
    where,
    include: ORDER_INCLUDE,
    orderBy: { created_at: "desc" },
    take: 200,
  });

  return NextResponse.json(
    { orders: orders.map(serializeOrder) },
    { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } },
  );
}

/* ─── helpers ─── */

async function resolveMenuItems(branchId, hotelId, items) {
  const ids = items.map((i) => i.menu_item_id).filter(Boolean);
  if (ids.length === 0) return [];

  const menuItems = await prisma.menu_items.findMany({
    where: { id: { in: ids }, hotel_id: hotelId },
    select: {
      id: true,
      name: true,
      base_price: true,
      tax_rate: true,
      is_available: true,
      branch_items: {
        where: { branch_id: branchId },
        select: { price_override: true, is_available: true },
      },
    },
  });

  if (menuItems.length !== ids.length) {
    throw new Error("One or more menu items are invalid for this branch");
  }

  return menuItems.map((m) => {
    const bi = m.branch_items[0];
    const price =
      bi?.price_override != null
        ? Number(bi.price_override)
        : Number(m.base_price);
    const available =
      bi?.is_available !== undefined
        ? bi.is_available
        : (m.is_available ?? true);
    return {
      id: m.id,
      name: m.name,
      effectivePrice: price,
      effectiveTax: Number(m.tax_rate ?? 0),
      available,
    };
  });
}

async function nextOrderNumber(branchId) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const count = await prisma.orders.count({
    where: { branch_id: branchId, created_at: { gte: dayStart } },
  });
  return `ORD-${today}-${String(count + 1).padStart(4, "0")}`;
}

/* ═════════════════════════════════════════════════════════════
 * POST /mobileapp/orders
 *
 * body: {
 *   items: [{ menu_item_id, quantity, notes? }],
 *   table_id?:          uuid     // dine-in (auto-creates session)
 *   table_session_id?:  uuid     // dine-in (existing session)
 *   room_stay_id?:      uuid     // room service — like web
 *   customer_id?:       uuid     // optional, auto-filled from room
 *   order_type?:        "dine_in" | "takeaway" | "room_service" | "delivery"
 *   notes?:             string
 * }
 *
 * Exactly one of {table_session_id | table_id | room_stay_id} may be set.
 * ═══════════════════════════════════════════════════════════*/
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user || !user.branch_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body?.items) || body.items.length === 0) {
    return NextResponse.json({ error: "items are required" }, { status: 400 });
  }

  const branch = await prisma.branches.findUnique({
    where: { id: user.branch_id },
    select: { hotel_id: true },
  });
  if (!branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  /* ── Resolve room stay (optional) ── */
  let roomStay = null;
  const roomStayId = body.room_stay_id ?? body.roomStayId ?? null;
  if (roomStayId) {
    roomStay = await prisma.room_stays.findFirst({
      where: {
        id: roomStayId,
        branch_id: user.branch_id,
        status: "active",
      },
      select: { id: true, customer_id: true },
    });
    if (!roomStay) {
      return NextResponse.json(
        { error: "Active room stay not found for this branch" },
        { status: 404 },
      );
    }
  }

  /* ── Resolve table session (optional) ── */
  let tableSessionId = body.table_session_id ?? null;
  const tableId = body.table_id ?? null;

  if (!tableSessionId && tableId) {
    const tbl = await prisma.dining_tables.findFirst({
      where: { id: tableId, branch_id: user.branch_id },
      select: { id: true },
    });
    if (!tbl) {
      return NextResponse.json(
        { error: "Table not found in this branch" },
        { status: 404 },
      );
    }
    const existing = await prisma.table_sessions.findFirst({
      where: { table_id: tableId, status: "open" },
      select: { id: true },
    });
    if (existing) tableSessionId = existing.id;
    else {
      const created = await prisma.table_sessions.create({
        data: {
          table_id: tableId,
          branch_id: user.branch_id,
          opened_by: user.id,
          status: "open",
        },
        select: { id: true },
      });
      tableSessionId = created.id;
    }
  }

  if (tableSessionId) {
    const session = await prisma.table_sessions.findFirst({
      where: {
        id: tableSessionId,
        branch_id: user.branch_id,
        status: "open",
      },
      select: { id: true },
    });
    if (!session) {
      return NextResponse.json(
        { error: "Open table session not found for this branch" },
        { status: 404 },
      );
    }
  }

  /* ── Can't be both room and table ── */
  if (roomStay && tableSessionId) {
    return NextResponse.json(
      { error: "Cannot assign both a table and a room to one order" },
      { status: 400 },
    );
  }

  /* ── Determine order type ── */
  const orderType =
    body.order_type ??
    (roomStay ? "room_service" : tableSessionId ? "dine_in" : "takeaway");

  if (orderType === "dine_in" && !tableSessionId) {
    return NextResponse.json(
      { error: "table_session_id or table_id is required for dine_in orders" },
      { status: 400 },
    );
  }
  if (orderType === "room_service" && !roomStay) {
    return NextResponse.json(
      { error: "room_stay_id is required for room_service orders" },
      { status: 400 },
    );
  }

  /* ── Resolve menu + compute totals ── */
  let resolved;
  try {
    resolved = await resolveMenuItems(
      user.branch_id,
      branch.hotel_id,
      body.items,
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const byId = Object.fromEntries(resolved.map((m) => [m.id, m]));
  let subtotal = 0;
  let taxAmount = 0;
  const itemsData = [];

  for (const i of body.items) {
    const menuItem = byId[i.menu_item_id];
    if (!menuItem) {
      return NextResponse.json(
        { error: `Menu item ${i.menu_item_id} not found` },
        { status: 404 },
      );
    }
    if (!menuItem.available) {
      return NextResponse.json(
        { error: `"${menuItem.name}" is not available at this branch` },
        { status: 400 },
      );
    }

    const qty = Math.max(1, Number(i.quantity) || 1);
    const lineTotal = menuItem.effectivePrice * qty;
    const lineTax = (lineTotal * menuItem.effectiveTax) / 100;
    subtotal += lineTotal;
    taxAmount += lineTax;

    itemsData.push({
      menu_item_id: i.menu_item_id,
      quantity: qty,
      unit_price: menuItem.effectivePrice,
      line_total: lineTotal,
      notes: i.notes ?? null,
      status: "pending",
    });
  }

  /* ── Customer (explicit or auto from room) ── */
  let customerId = body.customer_id ?? null;
  if (!customerId && roomStay?.customer_id) customerId = roomStay.customer_id;
  if (customerId) {
    const customer = await prisma.customers.findFirst({
      where: { id: customerId, hotel_id: branch.hotel_id },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found in this hotel" },
        { status: 404 },
      );
    }
  }

  const orderNumber = await nextOrderNumber(user.branch_id);
  const totalAmount = subtotal + taxAmount;

  /* ── Create order ── */
  let order;
  try {
    order = await prisma.orders.create({
      data: {
        branch_id: user.branch_id,
        table_session_id: tableSessionId,
        room_stay_id: roomStay ? roomStay.id : null,
        customer_id: customerId,
        order_number: orderNumber,
        order_type: orderType,
        status: "open",
        payment_status: "unpaid",
        source: "pos",
        waiter_id: user.id,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes: body.notes ?? null,
        order_items: { create: itemsData },
      },
      include: ORDER_INCLUDE,
    });
  } catch (err) {
    console.error("[mobileapp/orders POST] create failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create order" },
      { status: 500 },
    );
  }

  /* ── Bump room totals (same as web POST) ── */
  if (roomStay) {
    try {
      await prisma.room_stays.update({
        where: { id: roomStay.id },
        data: {
          orders_total: { increment: subtotal },
          grand_total: { increment: subtotal },
        },
      });
    } catch (err) {
      console.error("[mobileapp/orders POST] room total bump failed:", err);
    }
  }

  try {
    await ticketNewItems(order.id);
  } catch (err) {
    console.error("[mobileapp/orders POST] ticket failed:", err);
  }

  return NextResponse.json({ order: serializeOrder(order) }, { status: 201 });
}
