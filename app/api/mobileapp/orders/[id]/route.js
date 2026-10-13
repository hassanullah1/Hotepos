import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ticketNewItems } from "@/lib/kitchen-tickets";

async function recalcTotals(orderId) {
  const items = await prisma.order_items.findMany({
    where: { order_id: orderId },
  });
  const subtotal = items.reduce((sum, i) => sum + Number(i.line_total), 0);
  const order = await prisma.orders.findUnique({ where: { id: orderId } });
  const taxRate =
    order.subtotal > 0 ? Number(order.tax_amount) / Number(order.subtotal) : 0;
  const taxAmount = subtotal * taxRate;
  const totalAmount =
    subtotal +
    taxAmount -
    Number(order.discount_amount) +
    Number(order.service_charge);

  return prisma.orders.update({
    where: { id: orderId },
    data: { subtotal, tax_amount: taxAmount, total_amount: totalAmount },
  });
}

// PATCH /mobileapp/orders/:id
// body: { items?: [{menu_item_id, quantity, notes}], quantity_updates?: [{order_item_id, quantity}] }
export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user || !user.branch_id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.orders.findFirst({
    where: { id, branch_id: user.branch_id },
  });
  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "completed" || order.status === "cancelled") {
    return NextResponse.json(
      { error: `Cannot modify a ${order.status} order` },
      { status: 409 },
    );
  }

  const body = await request.json();

  // --- add new items ---
  if (body.items?.length) {
    const menuItems = await prisma.menu_items.findMany({
      where: {
        id: { in: body.items.map((i) => i.menu_item_id) },
        branch_id: user.branch_id,
      },
    });
    const byId = Object.fromEntries(menuItems.map((m) => [m.id, m]));
    if (menuItems.length !== body.items.length) {
      return NextResponse.json(
        { error: "One or more menu items are invalid for this branch" },
        { status: 400 },
      );
    }

    await prisma.order_items.createMany({
      data: body.items.map((i) => {
        const menuItem = byId[i.menu_item_id];
        const lineTotal = Number(menuItem.price) * i.quantity;
        return {
          order_id: id,
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          unit_price: menuItem.price,
          line_total: lineTotal,
          notes: i.notes ?? null,
          status: "pending",
        };
      }),
    });
  }

  // --- bump quantity on an item that hasn't started prep ---
  if (body.quantity_updates?.length) {
    for (const u of body.quantity_updates) {
      const item = await prisma.order_items.findFirst({
        where: { id: u.order_item_id, order_id: id },
      });
      if (!item) continue;
      if (item.status !== "pending") continue; // already sent — can't silently resize it
      await prisma.order_items.update({
        where: { id: u.order_item_id },
        data: {
          quantity: u.quantity,
          line_total: Number(item.unit_price) * u.quantity,
        },
      });
    }
  }

  await recalcTotals(id);
  await ticketNewItems(id);

  const full = await prisma.orders.findUnique({
    where: { id },
    include: {
      table_sessions: {
        select: { id: true, dining_tables: { select: { table_number: true } } },
      },
      users: { select: { id: true, full_name: true } },
      order_items: {
        include: {
          menu_items: { select: { id: true, name: true, image_url: true } },
        },
        orderBy: { created_at: "asc" },
      },
    },
  });

  return NextResponse.json({
    order: {
      id: full.id,
      order_number: full.order_number,
      order_type: full.order_type,
      status: full.status,
      table_session_id: full.table_session_id,
      table_number: full.table_sessions?.dining_tables?.table_number ?? null,
      waiter_name: full.users?.full_name ?? null,
      subtotal: full.subtotal.toString(),
      tax_amount: full.tax_amount.toString(),
      total_amount: full.total_amount.toString(),
      items: full.order_items.map((it) => ({
        id: it.id,
        menu_item_id: it.menu_item_id,
        name: it.menu_items.name,
        image_url: it.menu_items.image_url,
        quantity: it.quantity,
        unit_price: it.unit_price.toString(),
        line_total: it.line_total.toString(),
        notes: it.notes,
        status: it.status,
      })),
    },
  });
}
