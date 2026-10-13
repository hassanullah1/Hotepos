import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await request.json();
  const { items } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }

  const order = await prisma.orders.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "open") {
    return NextResponse.json({ error: "Order is not open" }, { status: 400 });
  }

  const menuItems = await prisma.menu_items.findMany({
    where: { id: { in: items.map((i) => i.menu_item_id) }, branch_id: order.branch_id },
  });
  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  let addedSubtotal = 0;
  let addedTax = 0;
  const orderItemsData = items.map((i) => {
    const menuItem = menuItemMap.get(i.menu_item_id);
    const unitPrice = Number(menuItem.price);
    const modifiersTotal = (i.modifiers || []).reduce(
      (sum, m) => sum + Number(m.extra_price || 0),
      0,
    );
    const lineTotal = (unitPrice + modifiersTotal) * i.quantity;
    const lineTax = lineTotal * (Number(menuItem.tax_rate || 0) / 100);
    addedSubtotal += lineTotal;
    addedTax += lineTax;

    return {
      order_id: id,
      menu_item_id: i.menu_item_id,
      quantity: i.quantity,
      unit_price: unitPrice,
      modifiers: i.modifiers || [],
      line_total: lineTotal,
      notes: i.notes || null,
      status: "pending",
    };
  });

  const branch = await prisma.branches.findUnique({ where: { id: order.branch_id } });
  const addedService = addedSubtotal * (Number(branch.service_charge_rate || 0) / 100);

  const [, updatedOrder] = await prisma.$transaction([
    prisma.order_items.createMany({ data: orderItemsData }),
    prisma.orders.update({
      where: { id },
      data: {
        subtotal: { increment: addedSubtotal },
        tax_amount: { increment: addedTax },
        service_charge: { increment: addedService },
        total_amount: { increment: addedSubtotal + addedTax + addedService },
      },
      include: { order_items: { include: { menu_items: { select: { name: true } } } } },
    }),
  ]);

  return NextResponse.json({ order: updatedOrder }, { status: 201 });
}
