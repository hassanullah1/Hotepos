import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { getAuthUser } from "@/lib/auth";
import { ownsHotel } from "@/lib/owner-scope";

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") return {};
    return body as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function assertHotelScope(
  hotelId: string,
  userId: string,
): Promise<boolean> {
  if (!hotelId) return false;

  const owns = await ownsHotel(userId, hotelId);
  if (owns) return true;

  const u = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      hotel_id: true,
      is_active: true,
      branches: { select: { hotel_id: true } },
      roles: { select: { name: true } },
    },
  });
  if (!u) return false;
  if (u.roles?.name === "super_admin") return true;
  if (u.is_active === false) return false;

  if (u.hotel_id && u.hotel_id === hotelId) return true;
  if (u.branches?.hotel_id && u.branches.hotel_id === hotelId) return true;

  return false;
}

async function loadScoped(id: string, userId: string) {
  const customer = await prisma.customers.findUnique({ where: { id } });
  if (!customer) return null;
  const ok = await assertHotelScope(customer.hotel_id, userId);
  if (!ok) return null;
  return customer;
}

// GET — full customer history: info + orders + room stays + payments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const customer = await prisma.customers.findUnique({ where: { id } });
  if (!customer)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await assertHotelScope(customer.hotel_id, user.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Orders
  const orders = await prisma.orders.findMany({
    where: { customer_id: id },
    include: {
      order_items: {
        include: { menu_items: { select: { id: true, name: true } } },
      },
      table_sessions: {
        include: {
          dining_tables: { select: { id: true, table_number: true } },
        },
      },
      room_stays: {
        include: { rooms: { select: { id: true, room_number: true } } },
      },
    },
    orderBy: { created_at: "desc" },
  });

  // Room stays
  const stays = await prisma.room_stays.findMany({
    where: { customer_id: id },
    include: {
      rooms: { select: { id: true, room_number: true, floor: true } },
    },
    orderBy: { check_in_at: "desc" },
  });

  // Payments — direct link via customer_id
  const payments = await prisma.payments.findMany({
    where: { customer_id: id },
    include: {
      payment_methods: { select: { id: true, name: true, type: true } },
      orders: {
        select: { id: true, order_number: true, order_type: true },
      },
      room_stays: {
        select: { id: true, rooms: { select: { room_number: true } } },
      },
    },
    orderBy: { paid_at: "desc" },
  });

  const ordersTotal = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total_amount), 0);

  const staysTotal = stays
    .filter((s) => s.status !== "cancelled")
    .reduce((s, x) => s + Number(x.grand_total), 0);

  const paidTotal = payments.reduce((s, p) => s + Number(p.amount), 0);

  return NextResponse.json({
    customer: {
      id: customer.id,
      full_name: customer.full_name,
      phone: customer.phone,
      email: customer.email,
      loyalty_points: customer.loyalty_points,
      notes: customer.notes,
      created_at: customer.created_at,
    },
    summary: {
      orders_count: orders.length,
      stays_count: stays.length,
      orders_total: +ordersTotal.toFixed(2),
      stays_total: +staysTotal.toFixed(2),
      paid_total: +paidTotal.toFixed(2),
    },
    orders: orders.map((o) => {
      const room = o.room_stays?.rooms?.room_number || null;
      const table = o.table_sessions?.dining_tables?.table_number || null;
      return {
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        order_type: o.order_type,
        total_amount: Number(o.total_amount),
        created_at: o.created_at,
        room_number: room,
        table_number: table,
        items: (o.order_items || []).map((i) => ({
          id: i.id,
          name: i.menu_items?.name || "Item",
          quantity: i.quantity,
          unit_price: Number(i.unit_price),
          line_total: Number(i.line_total),
        })),
      };
    }),
    stays: stays.map((s) => {
      const grand = Number(s.grand_total);
      const paid = Number(s.paid_amount || 0);
      return {
        id: s.id,
        room_number: s.rooms?.room_number || null,
        floor: s.rooms?.floor || null,
        guest_name: s.guest_name,
        rate_per_night: Number(s.rate_per_night),
        nights: s.nights,
        rent_total: Number(s.rent_total),
        orders_total: Number(s.orders_total),
        grand_total: grand,
        paid_amount: paid,
        balance: +(grand - paid).toFixed(2),
        status: s.status,
        is_paid: s.is_paid,
        check_in_at: s.check_in_at,
        actual_check_out: s.actual_check_out,
        expected_check_out: s.expected_check_out,
      };
    }),
    payments: payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      paid_at: p.paid_at,
      notes: p.notes,
      method_name: p.payment_methods?.name || null,
      method_type: p.payment_methods?.type || null,
      order_number: p.orders?.order_number || null,
      order_type: p.orders?.order_type || null,
      room_number: p.room_stays?.rooms?.room_number || null,
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await readJson(request);

  const data: Prisma.customersUncheckedUpdateInput = {};

  if (typeof body.full_name === "string")
    data.full_name = body.full_name.trim() || null;

  if (typeof body.phone === "string") data.phone = body.phone.trim() || null;

  if (typeof body.email === "string") data.email = body.email.trim() || null;

  if (typeof body.notes === "string") data.notes = body.notes.trim() || null;

  if (typeof body.loyalty_points === "number") {
    data.loyalty_points = body.loyalty_points;
  } else if (
    typeof body.loyalty_points === "string" &&
    body.loyalty_points.trim() !== "" &&
    !Number.isNaN(Number(body.loyalty_points))
  ) {
    data.loyalty_points = Number(body.loyalty_points);
  }

  try {
    const customer = await prisma.customers.update({ where: { id }, data });
    return NextResponse.json({ customer });
  } catch (err: unknown) {
    console.error("Update customer error:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A customer with this phone already exists in this hotel" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [orderCount, stayCount] = await Promise.all([
    prisma.orders.count({ where: { customer_id: id } }),
    prisma.room_stays.count({ where: { customer_id: id } }),
  ]);

  if (orderCount > 0 || stayCount > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete a customer that has orders or room stays. Remove or reassign them first.",
      },
      { status: 400 },
    );
  }

  try {
    await prisma.customers.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete customer error:", err);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 400 },
    );
  }
}
