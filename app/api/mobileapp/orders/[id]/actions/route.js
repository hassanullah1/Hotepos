import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ORDER_INCLUDE, serializeOrder } from "@/lib/order-serialize";

const ALLOWED_ACTIONS = [
  "cancel",
  "reject",
  "mark_paid",
  "mark_unpaid",
  "close",
];

const LOCKED = ["cancelled", "rejected", "closed"];
const TERMINAL = ["paid", "closed", "cancelled", "rejected"];

/** Free the table + close the session if no other open order remains. */
async function maybeFreeTable(tx, tableSessionId) {
  if (!tableSessionId) return;

  const stillOpen = await tx.orders.count({
    where: {
      table_session_id: tableSessionId,
      status: { notIn: TERMINAL },
    },
  });
  if (stillOpen > 0) return;

  const session = await tx.table_sessions.findUnique({
    where: { id: tableSessionId },
    select: { table_id: true, status: true },
  });
  if (!session) return;

  await tx.dining_tables.update({
    where: { id: session.table_id },
    data: { status: "available" },
  });

  if (session.status === "open") {
    await tx.table_sessions.update({
      where: { id: tableSessionId },
      data: { status: "closed", closed_at: new Date() },
    });
  }
}

/* ═════════════════════════════════════════════════════════════
 * POST /mobileapp/orders/[id]/actions
 *
 * body:
 *   { action: "cancel",      reason?: string }
 *   { action: "reject",      reason?: string }
 *   { action: "mark_paid" }   → status "paid"
 *   { action: "mark_unpaid" } → payment "unpaid" (status "served" if it was "paid")
 *   { action: "close" }       → status "closed", returns full order for printing
 * ═══════════════════════════════════════════════════════════*/
export async function POST(request, { params }) {
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
      source: true,
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

  const action = body?.action;
  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `action must be one of ${ALLOWED_ACTIONS.join(" | ")}` },
      { status: 400 },
    );
  }

  const reason =
    typeof body?.reason === "string" ? body.reason.slice(0, 500) : null;

  if (
    LOCKED.includes(order.status) &&
    (action === "cancel" || action === "reject" || action === "close")
  ) {
    return NextResponse.json(
      { error: `Order is already ${order.status}` },
      { status: 409 },
    );
  }

  try {
    // ── cancel / reject ─────────────────────────────────────
    if (action === "cancel" || action === "reject") {
      const nextStatus = action === "cancel" ? "cancelled" : "rejected";
      const nextPayment =
        order.payment_status === "paid" ? "refunded" : order.payment_status;

      await prisma.$transaction(async (tx) => {
        await tx.orders.update({
          where: { id },
          data: {
            status: nextStatus,
            payment_status: nextPayment,
            notes:
              reason ??
              (action === "cancel"
                ? "Cancelled by staff"
                : "Rejected by staff"),
          },
        });
        await maybeFreeTable(tx, order.table_session_id);
      });

      return NextResponse.json({
        order: { id, status: nextStatus, payment_status: nextPayment },
      });
    }

    // ── mark_paid ───────────────────────────────────────────
    if (action === "mark_paid") {
      const updated = await prisma.orders.update({
        where: { id },
        data: {
          payment_status: "paid",
          paid_at: new Date(),
          status: "paid",
        },
      });

      if (order.table_session_id) {
        await prisma.$transaction(async (tx) => {
          await maybeFreeTable(tx, order.table_session_id);
        });
      }

      return NextResponse.json({
        order: {
          id: updated.id,
          status: updated.status,
          payment_status: updated.payment_status,
        },
      });
    }

    // ── mark_unpaid ─────────────────────────────────────────
    if (action === "mark_unpaid") {
      const patch = { payment_status: "unpaid", paid_at: null };
      if (order.status === "paid") patch.status = "served";

      const updated = await prisma.orders.update({
        where: { id },
        data: patch,
      });
      return NextResponse.json({
        order: {
          id: updated.id,
          status: updated.status,
          payment_status: updated.payment_status,
        },
      });
    }

    // ── close ───────────────────────────────────────────────
    if (action === "close") {
      await prisma.$transaction(async (tx) => {
        await tx.orders.update({
          where: { id },
          data: {
            status: "closed",
            payment_status: "paid",
            paid_at: new Date(),
          },
        });
        await maybeFreeTable(tx, order.table_session_id);
      });

      const full = await prisma.orders.findUnique({
        where: { id },
        include: ORDER_INCLUDE,
      });
      return NextResponse.json({ order: serializeOrder(full) });
    }

    return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
  } catch (err) {
    console.error(`[mobileapp/orders/[id]/actions] ${action} failed:`, err);
    return NextResponse.json(
      { error: err?.message ?? `${action} failed` },
      { status: 500 },
    );
  }
}
