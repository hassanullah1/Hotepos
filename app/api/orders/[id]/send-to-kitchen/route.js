import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  const order = await prisma.orders.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Items that haven't been attached to any kitchen ticket yet
  const pendingItems = await prisma.order_items.findMany({
    where: {
      order_id: id,
      kitchen_ticket_items: { none: {} },
    },
    include: { menu_items: { select: { prep_station: true, is_kitchen: true, name: true } } },
  });

  const kitchenItems = pendingItems.filter((i) => i.menu_items.is_kitchen);
  if (kitchenItems.length === 0) {
    return NextResponse.json({ error: "No new items to send" }, { status: 400 });
  }

  // group by prep_station
  const byStation = {};
  for (const item of kitchenItems) {
    const station = item.menu_items.prep_station || "general";
    if (!byStation[station]) byStation[station] = [];
    byStation[station].push(item);
  }

  const tickets = [];
  await prisma.$transaction(async (tx) => {
    for (const [station, stationItems] of Object.entries(byStation)) {
      const ticket = await tx.kitchen_tickets.create({
        data: {
          order_id: id,
          prep_station: station,
          status: "queued",
          kitchen_ticket_items: {
            create: stationItems.map((i) => ({ order_item_id: i.id })),
          },
        },
        include: { kitchen_ticket_items: { include: { order_items: true } } },
      });
      tickets.push(ticket);
    }

    await tx.order_items.updateMany({
      where: { id: { in: kitchenItems.map((i) => i.id) } },
      data: { status: "sent" },
    });
  });

  // TODO: emit socket event `kitchen_ticket_created` with `tickets` payload
  // so kitchen displays and this order screen update live.

  return NextResponse.json({ tickets }, { status: 201 });
}
