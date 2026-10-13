import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getBuyerFromRequest } from "@/lib/buyer-auth";

type CartLine = { menu_item_id: string; quantity: number };

function newToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function POST(request: Request) {
  const buyer = await getBuyerFromRequest(request);
  if (!buyer)
    return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const branchId = typeof body.branch_id === "string" ? body.branch_id : "";
  const tableToken =
    typeof body.table_token === "string" ? body.table_token : "";
  const orderTypeRaw =
    typeof body.order_type === "string" ? body.order_type : "takeaway";
  const orderType = ["takeaway", "dine_in", "room_service"].includes(
    orderTypeRaw,
  )
    ? orderTypeRaw
    : "takeaway";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  const items = Array.isArray(body.items)
    ? (body.items as CartLine[]).filter(
        (i) =>
          i && typeof i.menu_item_id === "string" && Number(i.quantity) > 0,
      )
    : [];

  if (!items.length)
    return NextResponse.json({ error: "EMPTY_CART" }, { status: 400 });

  // Resolve branch — hotel must be online
  let branch = null;
  let table = null;

  if (tableToken) {
    table = await prisma.dining_tables.findFirst({
      where: { qr_code_token: tableToken },
      select: { id: true, branch_id: true },
    });
    if (!table)
      return NextResponse.json({ error: "TABLE_NOT_FOUND" }, { status: 404 });
    branch = await prisma.branches.findFirst({
      where: {
        id: table.branch_id,
        status: "active",
        hotels: { is_online: true },
      },
      select: { id: true, hotel_id: true },
    });
  } else if (branchId) {
    branch = await prisma.branches.findFirst({
      where: {
        id: branchId,
        status: "active",
        hotels: { is_online: true },
      },
      select: { id: true, hotel_id: true },
    });
  }

  if (!branch)
    return NextResponse.json({ error: "BRANCH_NOT_FOUND" }, { status: 404 });

  // Items must be available AND online
  const menuItemIds = items.map((i) => i.menu_item_id);
  const menuItems = await prisma.menu_items.findMany({
    where: {
      id: { in: menuItemIds },
      branch_id: branch.id,
      is_available: true,
      is_online: true,
    },
    select: { id: true, price: true },
  });

  if (menuItems.length !== menuItemIds.length)
    return NextResponse.json({ error: "ITEM_NOT_AVAILABLE" }, { status: 400 });

  const priceMap = new Map(menuItems.map((m) => [m.id, Number(m.price)]));
  const lines = items.map((i) => {
    const unit = priceMap.get(i.menu_item_id)!;
    const qty = Math.max(1, Math.floor(i.quantity));
    return {
      menu_item_id: i.menu_item_id,
      quantity: qty,
      unit_price: unit,
      line_total: +(unit * qty).toFixed(2),
    };
  });
  const subtotal = +lines.reduce((s, l) => s + l.line_total, 0).toFixed(2);

  // Dine-in: resolve/create table session
  let tableSessionId: string | null = null;
  if (orderType === "dine_in" && table) {
    const existing = await prisma.table_sessions.findFirst({
      where: { table_id: table.id, status: "open" },
      select: { id: true },
    });
    if (existing) {
      tableSessionId = existing.id;
    } else {
      const created = await prisma.table_sessions.create({
        data: {
          table_id: table.id,
          branch_id: branch.id,
          status: "open",
        },
        select: { id: true },
      });
      tableSessionId = created.id;
      await prisma.dining_tables.update({
        where: { id: table.id },
        data: { status: "occupied" },
      });
    }
  }

  const count = await prisma.orders.count({
    where: { branch_id: branch.id },
  });
  const orderNumber = `${branch.id.slice(0, 4).toUpperCase()}-${String(
    count + 1,
  ).padStart(5, "0")}`;

  const token = newToken();

  try {
    const order = await prisma.orders.create({
      data: {
        branch_id: branch.id,
        table_session_id: tableSessionId,
        customer_id: null,
        buyer_id: buyer.buyerId,
        order_number: orderNumber,
        order_type: orderType,
        status: "open",
        source: table ? "qr" : "customer",
        public_token: token,
        subtotal,
        total_amount: subtotal,
        notes: note || null,
        order_items: {
          create: lines.map((l) => ({
            menu_item_id: l.menu_item_id,
            quantity: l.quantity,
            unit_price: l.unit_price,
            line_total: l.line_total,
            status: "pending",
          })),
        },
      },
      select: {
        id: true,
        order_number: true,
        public_token: true,
        total_amount: true,
        status: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        order: {
          ...order,
          total_amount: Number(order.total_amount),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Public order error:", err);
    return NextResponse.json({ error: "ORDER_FAILED" }, { status: 400 });
  }
}
