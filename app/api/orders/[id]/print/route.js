import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.orders.findUnique({
    where: { id: params.id },
    include: {
      order_items: { include: { menu_items: { select: { name: true } } } },
      branches: { select: { name: true, address: true, phone: true, tax_rate: true } },
      table_sessions: { include: { dining_tables: { select: { table_number: true } } } },
      payments: { include: { payment_methods: { select: { name: true } } } },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Bump printed_count on the invoice if one exists, else create it
  let invoice = await prisma.invoices.findFirst({ where: { order_id: order.id } });
  if (!invoice) {
    const invoiceNumber = `INV-${order.order_number}`;
    invoice = await prisma.invoices.create({
      data: {
        order_id: order.id,
        branch_id: order.branch_id,
        invoice_number: invoiceNumber,
        subtotal: order.subtotal,
        discount_amount: order.discount_amount,
        tax_amount: order.tax_amount,
        service_charge: order.service_charge,
        total_amount: order.total_amount,
        printed_count: 1,
      },
    });
  } else {
    invoice = await prisma.invoices.update({
      where: { id: invoice.id },
      data: { printed_count: { increment: 1 } },
    });
  }

  // plain structured payload — the app formats this into ESC/POS text
  return NextResponse.json({
    receipt: {
      invoice_number: invoice.invoice_number,
      branch: order.branches,
      table_number: order.table_sessions?.dining_tables?.table_number || null,
      order_number: order.order_number,
      items: order.order_items.map((i) => ({
        name: i.menu_items.name,
        qty: i.quantity,
        unit_price: i.unit_price,
        line_total: i.line_total,
      })),
      subtotal: order.subtotal,
      discount_amount: order.discount_amount,
      tax_amount: order.tax_amount,
      service_charge: order.service_charge,
      total_amount: order.total_amount,
      paid: order.payments.map((p) => ({
        method: p.payment_methods.name,
        amount: p.amount,
        tendered: p.amount_tendered,
        change: p.change_given,
      })),
      printed_at: new Date().toISOString(),
    },
  });
}
