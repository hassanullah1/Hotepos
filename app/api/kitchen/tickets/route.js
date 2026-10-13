import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getStaffBranch } from "@/lib/pos-scope";

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const requestedBranchId = searchParams.get("branch_id");
  const station = searchParams.get("station"); // optional filter

  const scope = await getStaffBranch(user.id, requestedBranchId);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const where = {
    status: { in: ["queued", "preparing", "ready"] }, // hide served/old
    orders: { branch_id: scope.branchId },
  };
  if (station) where.prep_station = station;

  const tickets = await prisma.kitchen_tickets.findMany({
    where,
    include: {
      orders: {
        select: {
          id: true,
          order_number: true,
          order_type: true,
          notes: true,
          created_at: true,
          table_sessions: {
            select: {
              dining_tables: { select: { table_number: true } },
            },
          },
        },
      },
      kitchen_ticket_items: {
        include: {
          order_items: {
            select: {
              id: true,
              quantity: true,
              notes: true,
              modifiers: true,
              menu_items: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { created_at: "asc" }, // oldest first — FIFO kitchen queue
  });

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      id: t.id,
      status: t.status,
      prep_station: t.prep_station,
      created_at: t.created_at,
      printed_at: t.printed_at,
      order: {
        id: t.orders.id,
        order_number: t.orders.order_number,
        order_type: t.orders.order_type,
        notes: t.orders.notes,
        table_number:
          t.orders.table_sessions?.dining_tables?.table_number || null,
      },
      items: t.kitchen_ticket_items.map((kti) => ({
        order_item_id: kti.order_items.id,
        name: kti.order_items.menu_items.name,
        quantity: kti.order_items.quantity,
        notes: kti.order_items.notes,
        modifiers: kti.order_items.modifiers,
      })),
    })),
  });
}
