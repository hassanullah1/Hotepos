import prisma from "@/lib/prisma";

// Groups any order_items that aren't yet on a kitchen ticket into new
// tickets, split by prep_station. Called after order creation and after
// adding items to an existing order.
export async function ticketNewItems(orderId) {
  const items = await prisma.order_items.findMany({
    where: { order_id: orderId, kitchen_ticket_items: { none: {} } },
    include: { menu_items: { select: { is_kitchen: true, prep_station: true } } },
  });
  const kitchenItems = items.filter((i) => i.menu_items.is_kitchen);
  if (!kitchenItems.length) return;

  const byStation = {};
  for (const it of kitchenItems) {
    const station = it.menu_items.prep_station || "main";
    (byStation[station] ??= []).push(it.id);
  }

  for (const [station, orderItemIds] of Object.entries(byStation)) {
    await prisma.kitchen_tickets.create({
      data: {
        order_id: orderId,
        prep_station: station,
        kitchen_ticket_items: {
          create: orderItemIds.map((id) => ({ order_item_id: id })),
        },
      },
    });
  }
}
