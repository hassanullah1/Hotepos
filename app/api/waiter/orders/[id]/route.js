import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getStaffBranch } from "@/lib/pos-scope";

// Adds new items to an order that's already been sent, and/or updates the
// quantity of lines the kitchen hasn't started yet. Lets a waiter top up
// an existing round (e.g. "add 2 more cokes") instead of always opening a
// brand new order for every request that comes in after the first send.
export async function PATCH(request, context) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getStaffBranch(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: orderId } = await context.params;
  const body = await request.json();
  const items = Array.isArray(body.items) ? body.items : [];
  const quantityUpdates = Array.isArray(body.quantity_updates)
    ? body.quantity_updates
    : [];

  if (items.length === 0 && quantityUpdates.length === 0)
    return NextResponse.json(
      { error: "Nothing to update — provide items and/or quantity_updates" },
      { status: 400 },
    );

  const order = await prisma.orders.findFirst({
    where: { id: orderId, branch_id: scope.branchId },
    include: { order_items: true },
  });
  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "open")
    return NextResponse.json(
      { error: "This order is closed and can no longer be changed" },
      { status: 400 },
    );

  try {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // --- quantity updates: only for lines the kitchen hasn't started yet ---
      for (const upd of quantityUpdates) {
        const line = order.order_items.find(
          (oi) => oi.id === upd.order_item_id,
        );
        if (!line)
          throw new Error(
            `Order item ${upd.order_item_id} was not found on this order`,
          );
        if (line.status !== "pending")
          throw new Error(
            "That item is already being prepared and can't be changed",
          );
        if (!upd.quantity || upd.quantity <= 0)
          throw new Error("Invalid quantity");

        await tx.order_items.update({
          where: { id: line.id },
          data: {
            quantity: upd.quantity,
            line_total: Number(line.unit_price) * upd.quantity,
          },
        });
      }

      // --- new items: snapshot price/tax from the DB, never trust the client ---
      if (items.length > 0) {
        const menuItemIds = items.map((i) => i.menu_item_id);
        const menuItems = await tx.menu_items.findMany({
          where: { id: { in: menuItemIds }, branch_id: scope.branchId },
        });
        const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

        for (const line of items) {
          if (!menuItemMap.has(line.menu_item_id))
            throw new Error("One or more items don't belong to this branch");
          if (!line.quantity || line.quantity <= 0)
            throw new Error("Invalid item quantity");
        }

        const createdItems = [];
        for (const line of items) {
          const mi = menuItemMap.get(line.menu_item_id);
          const unitPrice = Number(mi.price);
          const oi = await tx.order_items.create({
            data: {
              order_id: order.id,
              menu_item_id: mi.id,
              quantity: line.quantity,
              unit_price: unitPrice,
              line_total: unitPrice * line.quantity,
              notes: line.notes || null,
              modifiers: line.modifiers || [],
              status: "pending",
            },
          });
          createdItems.push({ orderItem: oi, prep_station: mi.prep_station });
        }

        // Group the newly added lines by prep station and open a fresh
        // kitchen ticket per station, so the addition shows up to the
        // kitchen as a distinct new ticket rather than silently merging
        // into a ticket they may have already started or finished.
        const byStation = new Map();
        createdItems.forEach(({ orderItem, prep_station }) => {
          const station = prep_station || "general";
          if (!byStation.has(station)) byStation.set(station, []);
          byStation.get(station).push(orderItem.id);
        });
        for (const [station, orderItemIds] of byStation.entries()) {
          await tx.kitchen_tickets.create({
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
      }

      // --- recompute order totals from every line currently on the order ---
      const allItems = await tx.order_items.findMany({
        where: { order_id: order.id },
        include: { menu_items: { select: { tax_rate: true } } },
      });
      let subtotal = 0;
      let taxAmount = 0;
      for (const i of allItems) {
        const lineTotal = Number(i.line_total);
        subtotal += lineTotal;
        taxAmount += (lineTotal * Number(i.menu_items?.tax_rate || 0)) / 100;
      }
      const totalAmount =
        subtotal +
        taxAmount +
        Number(order.service_charge || 0) -
        Number(order.discount_amount || 0);

      return tx.orders.update({
        where: { id: order.id },
        data: { subtotal, tax_amount: taxAmount, total_amount: totalAmount },
        include: {
          order_items: { include: { menu_items: { select: { name: true } } } },
        },
      });
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (err) {
    console.error("Update order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update order" },
      { status: 400 },
    );
  }
}
