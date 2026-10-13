import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ownsHotel } from "@/lib/owner-scope";

const TOLERANCE = 0.01;

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const b = await request.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
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

async function resolveCashMethodId(
  tx: typeof prisma,
  branchId: string,
): Promise<string> {
  const existing = await tx.payment_methods.findFirst({
    where: { branch_id: branchId, is_active: true, type: "cash" },
    select: { id: true },
  });
  if (existing) return existing.id;

  const anyActive = await tx.payment_methods.findFirst({
    where: { branch_id: branchId, is_active: true },
    select: { id: true },
  });
  if (anyActive) return anyActive.id;

  const created = await tx.payment_methods.create({
    data: { branch_id: branchId, name: "Cash", type: "cash", is_active: true },
    select: { id: true },
  });
  return created.id;
}

// POST /api/owners/customers/[id]/payments
// body: { item_type: "order" | "room_stay", item_id, amount? }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: customerId } = await params;

  const customer = await prisma.customers.findUnique({
    where: { id: customerId },
  });
  if (!customer)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await assertHotelScope(customer.hotel_id, user.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await readJson(request);

  const itemType = body.item_type;
  const itemId = body.item_id;

  if (
    (itemType !== "order" && itemType !== "room_stay") ||
    typeof itemId !== "string" ||
    !itemId
  ) {
    return NextResponse.json(
      { error: "item_type and item_id are required" },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // ---------------- ORDER ----------------
      if (itemType === "order") {
        const order = await tx.orders.findFirst({
          where: { id: itemId, customer_id: customerId },
          select: {
            id: true,
            branch_id: true,
            status: true,
            total_amount: true,
            room_stay_id: true,
          },
        });
        if (!order)
          throw Object.assign(new Error("Order not found"), { code: "NF" });

        if (["paid", "closed", "cancelled"].includes(order.status)) {
          throw Object.assign(new Error("Order is not payable"), {
            code: "BAD",
          });
        }

        const defaultAmount = Number(order.total_amount);
        const amount =
          typeof body.amount === "number" && body.amount > 0
            ? body.amount
            : defaultAmount;

        const paymentMethodId = await resolveCashMethodId(tx, order.branch_id);

        const payment = await tx.payments.create({
          data: {
            order_id: order.id,
            customer_id: customerId,
            payment_method_id: paymentMethodId,
            amount,
            amount_tendered: amount,
            change_given: 0,
            status: "completed",
            received_by: user.id,
          },
          select: { id: true, amount: true, paid_at: true },
        });

        await tx.orders.update({
          where: { id: order.id },
          data: { status: "paid" },
        });

        if (order.room_stay_id) {
          const rows = await tx.order_items.findMany({
            where: { orders: { room_stay_id: order.room_stay_id } },
            select: { line_total: true },
          });
          const ordersTotal = rows.reduce(
            (s, r) => s + Number(r.line_total),
            0,
          );
          const stay = await tx.room_stays.findUnique({
            where: { id: order.room_stay_id },
            select: { rent_total: true, paid_amount: true },
          });
          const rent = Number(stay?.rent_total || 0);
          const paid = Number(stay?.paid_amount || 0);
          const newGrand = +(rent + ordersTotal).toFixed(2);
          await tx.room_stays.update({
            where: { id: order.room_stay_id },
            data: {
              orders_total: ordersTotal,
              grand_total: newGrand,
              is_paid: paid >= newGrand - TOLERANCE,
            },
          });
        }

        return {
          kind: "order" as const,
          payment_id: payment.id,
          amount: Number(payment.amount),
        };
      }

      // ---------------- ROOM STAY ----------------
      const stay = await tx.room_stays.findFirst({
        where: { id: itemId, customer_id: customerId },
        select: {
          id: true,
          branch_id: true,
          status: true,
          rent_total: true,
          paid_amount: true,
        },
      });
      if (!stay)
        throw Object.assign(new Error("Stay not found"), { code: "NF" });

      if (stay.status === "cancelled")
        throw Object.assign(new Error("Stay is cancelled"), { code: "BAD" });

      const rows = await tx.order_items.findMany({
        where: { orders: { room_stay_id: stay.id } },
        select: { line_total: true },
      });
      const ordersTotal = rows.reduce((s, r) => s + Number(r.line_total), 0);
      const grand = +(Number(stay.rent_total) + ordersTotal).toFixed(2);

      const alreadyPaid = Number(stay.paid_amount || 0);
      const balance = +(grand - alreadyPaid).toFixed(2);

      if (balance <= TOLERANCE)
        throw Object.assign(new Error("Stay is already fully paid"), {
          code: "BAD",
        });

      let amount =
        typeof body.amount === "number" && body.amount > 0
          ? body.amount
          : balance;
      if (amount > balance) amount = balance;

      const paymentMethodId = await resolveCashMethodId(tx, stay.branch_id);

      const payment = await tx.payments.create({
        data: {
          room_stay_id: stay.id,
          customer_id: customerId,
          payment_method_id: paymentMethodId,
          amount,
          amount_tendered: amount,
          change_given: 0,
          status: "completed",
          received_by: user.id,
        },
        select: { id: true, amount: true, paid_at: true },
      });

      const newPaid = +(alreadyPaid + amount).toFixed(2);
      const isFullyPaid = newPaid >= grand - TOLERANCE;

      await tx.room_stays.update({
        where: { id: stay.id },
        data: {
          paid_amount: newPaid,
          is_paid: isFullyPaid,
          orders_total: ordersTotal,
          grand_total: grand,
        },
      });

      return {
        kind: "room_stay" as const,
        payment_id: payment.id,
        amount,
        paid_amount: newPaid,
        grand_total: grand,
        balance: +(grand - newPaid).toFixed(2),
        is_paid: isFullyPaid,
      };
    });

    return NextResponse.json({ payment: result }, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "NF")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (code === "BAD")
      return NextResponse.json(
        { error: (err as Error).message || "Not payable" },
        { status: 400 },
      );
    console.error("Record customer payment error:", err);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 400 },
    );
  }
}

// GET — customer payments list
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: customerId } = await params;

  const customer = await prisma.customers.findUnique({
    where: { id: customerId },
  });
  if (!customer)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await assertHotelScope(customer.hotel_id, user.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payments = await prisma.payments.findMany({
    where: { customer_id: customerId },
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

  return NextResponse.json({
    payments: payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      amount_tendered: p.amount_tendered ? Number(p.amount_tendered) : null,
      change_given: p.change_given ? Number(p.change_given) : 0,
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
