import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getStaffBranch } from "@/lib/pos-scope";

async function generateInvoiceData({
  tableSessionId = null,
  orderId = null,
  branchId,
}) {
  let orders = [];
  if (tableSessionId) {
    orders = await prisma.orders.findMany({
      where: { table_session_id: tableSessionId, branch_id: branchId },
      include: {
        order_items: { include: { menu_items: { select: { name: true } } } },
      },
      orderBy: { created_at: "asc" },
    });
  } else if (orderId) {
    const order = await prisma.orders.findFirst({
      where: { id: orderId, branch_id: branchId },
      include: {
        order_items: { include: { menu_items: { select: { name: true } } } },
      },
    });
    if (order) orders = [order];
  }

  if (orders.length === 0) return null;

  const subtotal = orders.reduce((s, o) => s + Number(o.subtotal), 0);
  const taxAmount = orders.reduce((s, o) => s + Number(o.tax_amount), 0);
  const discount = orders.reduce(
    (s, o) => s + Number(o.discount_amount || 0),
    0,
  );
  const serviceCharge = orders.reduce(
    (s, o) => s + Number(o.service_charge || 0),
    0,
  );
  const total = orders.reduce((s, o) => s + Number(o.total_amount), 0);

  const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

  const allItems = orders.flatMap((o) => o.order_items);
  const lines = allItems.map((item) => ({
    name: item.menu_items?.name || "Item",
    quantity: item.quantity,
    unit_price: Number(item.unit_price),
    line_total: Number(item.line_total),
  }));

  const branch = await prisma.branches.findUnique({
    where: { id: branchId },
    select: { name: true, address: true, phone: true },
  });

  const orderNumbers = orders.map((o) => o.order_number);

  return {
    invoice: {
      invoice_number: invoiceNumber,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discount,
      service_charge: serviceCharge,
      total_amount: total,
    },
    lines,
    branch,
    order_numbers: orderNumbers,
  };
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getStaffBranch(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { table_session_id, order_id } = body;

  if (!table_session_id && !order_id) {
    return NextResponse.json(
      { error: "Either table_session_id or order_id is required" },
      { status: 400 },
    );
  }

  let data;
  if (table_session_id) {
    data = await generateInvoiceData({
      tableSessionId: table_session_id,
      branchId: scope.branchId,
    });
  } else {
    data = await generateInvoiceData({
      orderId: order_id,
      branchId: scope.branchId,
    });
  }

  if (!data) {
    return NextResponse.json({ error: "No orders found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
