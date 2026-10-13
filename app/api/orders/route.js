import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

async function nextOrderNumber(branchId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.orders.count({
    where: { branch_id: branchId, created_at: { gte: startOfDay } },
  });

  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${datePart}-${String(count + 1).padStart(4, "0")}`;
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { branch_id, table_session_id, customer_id, order_type, items } = body;

  if (!branch_id || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "branch_id and at least one item are required" },
      { status: 400 },
    );
  }

  const branch = await prisma.branches.findUnique({ where: { id: branch_id } });
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  const menuItemIds = items.map((i) => i.menu_item_id);
  const menuItems = await prisma.menu_items.findMany({
    where: { id: { in: menuItemIds }, branch_id },
  });
  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  if (menuItemMap.size !== new Set(menuItemIds).size) {
    return NextResponse.json(
      { error: "One or more menu items are invalid for this branch" },
      { status: 400 },
    );
  }

  let subtotal = 0;
  let taxAmount = 0;
  const orderItemsData = items.map((i) => {
    const menuItem = menuItemMap.get(i.menu_item_id);
    const unitPrice = Number(menuItem.price);
    const modifiersTotal = (i.modifiers || []).reduce(
      (sum, m) => sum + Number(m.extra_price || 0),
      0,
    );
    const lineTotal = (unitPrice + modifiersTotal) * i.quantity;
    const lineTax = lineTotal * (Number(menuItem.tax_rate || 0) / 100);

    subtotal += lineTotal;
    taxAmount += lineTax;

    return {
      menu_item_id: i.menu_item_id,
      quantity: i.quantity,
      unit_price: unitPrice,
      modifiers: i.modifiers || [],
      line_total: lineTotal,
      notes: i.notes || null,
      status: "pending",
    };
  });

  const serviceCharge = subtotal * (Number(branch.service_charge_rate || 0) / 100);
  const totalAmount = subtotal + taxAmount + serviceCharge;
  const orderNumber = await nextOrderNumber(branch_id);

  try {
    const order = await prisma.orders.create({
      data: {
        branch_id,
        table_session_id: table_session_id || null,
        customer_id: customer_id || null,
        order_number: orderNumber,
        order_type: order_type || "dine_in",
        status: "open",
        waiter_id: user.id,
        subtotal,
        tax_amount: taxAmount,
        service_charge: serviceCharge,
        total_amount: totalAmount,
        order_items: { create: orderItemsData },
      },
      include: {
        order_items: { include: { menu_items: { select: { name: true } } } },
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 400 });
  }
}
