import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ticketNewItems } from "@/lib/kitchen-tickets";
import { ORDER_INCLUDE, serializeOrder } from "@/lib/order-serialize";

const ALLOWED_STATUSES = [
  "open",
  "in_progress",
  "served",
  "paid",
  "closed",
  "cancelled",
  "rejected",
];

const NON_EDITABLE = ["paid", "closed", "cancelled", "rejected"];
const TERMINAL = ["paid", "closed", "cancelled", "rejected"];

/* ═════════════════════════════════════════════════════════════
 * GET /mobileapp/orders/[id]
 * ═══════════════════════════════════════════════════════════*/
export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user || !user.branch_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Order id is required" },
      { status: 400 },
    );
  }

  const order = await prisma.orders.findFirst({
    where: { id, branch_id: user.branch_id },
    include: ORDER_INCLUDE,
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: serializeOrder(order) });
}

/* ── helpers ── */

async function recalcTotals(orderId) {
  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    select: {
      discount_amount: true,
      service_charge: true,
      order_items: {
        select: {
          line_total: true,
          menu_items: { select: { tax_rate: true } },
        },
      },
    },
  });
  if (!order) return null;

  let subtotal = 0;
  let taxAmount = 0;
  for (const it of order.order_items) {
    const line = Number(it.line_total);
    subtotal += line;
    const rate = Number(it.menu_items?.tax_rate ?? 0);
    taxAmount += line * (rate / 100);
  }
  const totalAmount =
    subtotal +
    taxAmount -
    Number(order.discount_amount ?? 0) +
    Number(order.service_charge ?? 0);

  return prisma.orders.update({
    where: { id: orderId },
    data: { subtotal, tax_amount: taxAmount, total_amount: totalAmount },
  });
}

async function freeTableIfDone(tableSessionId) {
  if (!tableSessionId) return;
  const stillOpen = await prisma.orders.count({
    where: {
      table_session_id: tableSessionId,
      status: { notIn: TERMINAL },
    },
  });
  if (stillOpen > 0) return;

  const session = await prisma.table_sessions.findUnique({
    where: { id: tableSessionId },
    select: { table_id: true, status: true },
  });
  if (!session) return;

  await prisma.dining_tables.update({
    where: { id: session.table_id },
    data: { status: "available" },
  });
  if (session.status === "open") {
    await prisma.table_sessions.update({
      where: { id: tableSessionId },
      data: { status: "closed", closed_at: new Date() },
    });
  }
}

/* ═════════════════════════════════════════════════════════════
 * PATCH /mobileapp/orders/[id]
 *
 * body (any combination):
 *   { items: [{ menu_item_id, quantity, notes? }] }       // add lines
 *   { quantity_updates: [{ order_item_id, quantity }] }   // resize pending
 *   { item_deletes: [order_item_id, ...] }                // remove lines
 *   { status: "<web status>" }                            // flip status
 * ═══════════════════════════════════════════════════════════*/
export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user || !user.branch_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Order id is required" },
      { status: 400 },
    );
  }

  const order = await prisma.orders.findFirst({
    where: { id, branch_id: user.branch_id },
    select: {
      id: true,
      status: true,
      payment_status: true,
      table_session_id: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nonEditable = NON_EDITABLE.includes(order.status);

  // ── 1) add new items ────────────────────────────────────────
  if (Array.isArray(body?.items) && body.items.length > 0) {
    if (nonEditable) {
      return NextResponse.json(
        { error: `Cannot modify a ${order.status} order` },
        { status: 409 },
      );
    }

    const branch = await prisma.branches.findUnique({
      where: { id: user.branch_id },
      select: { hotel_id: true },
    });
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const ids = body.items.map((i) => i.menu_item_id).filter(Boolean);
    const menuItems = await prisma.menu_items.findMany({
      where: { id: { in: ids }, hotel_id: branch.hotel_id },
      select: {
        id: true,
        name: true,
        base_price: true,
        tax_rate: true,
        is_available: true,
        branch_items: {
          where: { branch_id: user.branch_id },
          select: { price_override: true, is_available: true },
        },
      },
    });

    if (menuItems.length !== ids.length) {
      return NextResponse.json(
        { error: "One or more menu items are invalid for this branch" },
        { status: 400 },
      );
    }

    const byId = Object.fromEntries(menuItems.map((m) => [m.id, m]));
    const createData = [];

    for (const i of body.items) {
      const m = byId[i.menu_item_id];
      const bi = m.branch_items[0];
      const price =
        bi?.price_override != null
          ? Number(bi.price_override)
          : Number(m.base_price);
      const available = bi?.is_available ?? m.is_available ?? true;

      if (!available) {
        return NextResponse.json(
          { error: `"${m.name}" is not available at this branch` },
          { status: 400 },
        );
      }

      const qty = Math.max(1, Number(i.quantity) || 1);
      createData.push({
        order_id: id,
        menu_item_id: i.menu_item_id,
        quantity: qty,
        unit_price: price,
        line_total: price * qty,
        notes: i.notes ?? null,
        status: "pending",
      });
    }

    await prisma.order_items.createMany({ data: createData });
  }

  // ── 2) update pending quantities ───────────────────────────
  if (
    Array.isArray(body?.quantity_updates) &&
    body.quantity_updates.length > 0
  ) {
    if (nonEditable) {
      return NextResponse.json(
        { error: `Cannot modify a ${order.status} order` },
        { status: 409 },
      );
    }
    for (const u of body.quantity_updates) {
      const item = await prisma.order_items.findFirst({
        where: { id: u.order_item_id, order_id: id },
        select: { id: true, unit_price: true, status: true },
      });
      if (!item) continue;
      if (item.status !== "pending") continue;
      const qty = Math.max(1, Number(u.quantity) || 1);
      await prisma.order_items.update({
        where: { id: u.order_item_id },
        data: { quantity: qty, line_total: Number(item.unit_price) * qty },
      });
    }
  }

  // ── 3) delete lines ────────────────────────────────────────
  if (Array.isArray(body?.item_deletes) && body.item_deletes.length > 0) {
    if (nonEditable) {
      return NextResponse.json(
        { error: `Cannot modify a ${order.status} order` },
        { status: 409 },
      );
    }
    await prisma.order_items.deleteMany({
      where: { order_id: id, id: { in: body.item_deletes } },
    });
  }

  // ── 4) status flip ─────────────────────────────────────────
  if (typeof body?.status === "string") {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }

    const patch = { status: body.status };
    if (body.status === "paid" || body.status === "closed") {
      patch.payment_status = "paid";
      patch.paid_at = new Date();
    }

    await prisma.orders.update({ where: { id }, data: patch });

    if (TERMINAL.includes(body.status)) {
      await freeTableIfDone(order.table_session_id);
    }
  }

  // ── 5) recalc + kitchen tickets + return full order ────────
  await recalcTotals(id);

  try {
    await ticketNewItems(id);
  } catch (err) {
    console.error("[mobileapp/orders/[id] PATCH] ticket failed:", err);
  }

  const full = await prisma.orders.findUnique({
    where: { id },
    include: ORDER_INCLUDE,
  });

  return NextResponse.json({ order: serializeOrder(full) });
}
