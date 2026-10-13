import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getStaffBranch } from "@/lib/pos-scope";

const VALID_STATUSES = ["queued", "preparing", "ready", "served"];

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  if (!VALID_STATUSES.includes(body.status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const ticket = await prisma.kitchen_tickets.findUnique({
    where: { id },
    include: { orders: { select: { branch_id: true } } },
  });
  if (!ticket)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scope = await getStaffBranch(user.id, ticket.orders.branch_id);
  if (!scope || scope.branchId !== ticket.orders.branch_id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const data = { status: body.status };
    if (body.status === "preparing" && !ticket.printed_at) {
      data.printed_at = new Date();
    }

    const updated = await prisma.kitchen_tickets.update({
      where: { id },
      data,
    });

    // Mirror status onto the underlying order_items so waiters/cashiers
    // and any "order ready" indicators elsewhere reflect kitchen progress.
    const orderItemStatus =
      body.status === "ready" || body.status === "served"
        ? body.status === "ready"
          ? "ready"
          : "served"
        : body.status === "preparing"
          ? "preparing"
          : "pending";

    const links = await prisma.kitchen_ticket_items.findMany({
      where: { kitchen_ticket_id: id },
      select: { order_item_id: true },
    });
    await prisma.order_items.updateMany({
      where: { id: { in: links.map((l) => l.order_item_id) } },
      data: { status: orderItemStatus },
    });

    return NextResponse.json({ ticket: updated });
  } catch (err) {
    console.error("Update kitchen ticket error:", err);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 400 },
    );
  }
}
