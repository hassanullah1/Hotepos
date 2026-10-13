// app/api/owners/room-stays/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { assertManagedBranch } from "@/lib/owner-scope";

async function readJson(request) {
  try {
    const b = await request.json();
    return b && typeof b === "object" ? b : {};
  } catch {
    return {};
  }
}

async function loadScoped(id, userId) {
  const stay = await prisma.room_stays.findUnique({ where: { id } });
  if (!stay) return null;
  const branch = await assertManagedBranch(stay.branch_id, userId);
  return branch ? stay : null;
}

// PATCH — update / extend / check out
// body: {
//   action?: "extend" | "checkout" | "update",
//   nights?, rate_per_night?,             // extend
//   payment_method_id?, amount_tendered?  // checkout
//   guest_name?, guest_phone?, guest_id_no?, notes?  // update
// }
export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const stay = await loadScoped(id, user.id);
  if (!stay) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await readJson(request);
  const action = typeof body.action === "string" ? body.action : "update";

  try {
    // ---------- extend ----------
    if (action === "extend") {
      if (stay.status !== "active")
        return NextResponse.json(
          { error: "Only active stays can be extended" },
          { status: 400 },
        );

      const extraNights = Math.max(1, Number(body.nights) || 1);
      const rate = Number.isFinite(Number(body.rate_per_night))
        ? Number(body.rate_per_night)
        : Number(stay.rate_per_night);

      const addRent = +(rate * extraNights).toFixed(2);
      const newNights = stay.nights + extraNights;
      const newRent = +(Number(stay.rent_total) + addRent).toFixed(2);
      const newGrand = +(newRent + Number(stay.orders_total)).toFixed(2);

      const newExpected = (() => {
        const base = stay.expected_check_out
          ? new Date(stay.expected_check_out)
          : new Date(stay.check_in_at);
        base.setDate(base.getDate() + extraNights);
        return base;
      })();

      const updated = await prisma.room_stays.update({
        where: { id },
        data: {
          nights: newNights,
          rate_per_night: rate,
          rent_total: newRent,
          grand_total: newGrand,
          expected_check_out: newExpected,
        },
      });
      return NextResponse.json({ stay: updated });
    }

    // ---------- checkout ----------
    if (action === "checkout") {
      if (stay.status !== "active")
        return NextResponse.json(
          { error: "Stay is not active" },
          { status: 400 },
        );

      // Recompute orders total from linked orders (safety net)
      const orderRows = await prisma.orders.findMany({
        where: { room_stay_id: id },
        select: { total_amount: true, status: true },
      });
      const ordersTotal = orderRows
        .filter((o) => o.status !== "cancelled")
        .reduce((s, o) => s + Number(o.total_amount), 0);

      const grandTotal = +(Number(stay.rent_total) + ordersTotal).toFixed(2);

      const result = await prisma.$transaction(async (tx) => {
        // Record the settlement payment (optional)
        if (body.payment_method_id) {
          const amountTendered =
            body.amount_tendered != null
              ? Number(body.amount_tendered)
              : grandTotal;
          await tx.payments.create({
            data: {
              room_stay_id: id,
              payment_method_id: body.payment_method_id,
              amount: grandTotal,
              amount_tendered: amountTendered,
              change_given: Math.max(0, amountTendered - grandTotal),
              received_by: user.id,
            },
          });
        }

        const updatedStay = await tx.room_stays.update({
          where: { id },
          data: {
            status: "checked_out",
            is_paid: true,
            actual_check_out: new Date(),
            checked_out_by: user.id,
            orders_total: ordersTotal,
            grand_total: grandTotal,
          },
        });

        await tx.rooms.update({
          where: { id: stay.room_id },
          data: { status: "cleaning" },
        });

        return updatedStay;
      });

      return NextResponse.json({ stay: result });
    }

    // ---------- generic update ----------
    const data = {};
    if (typeof body.guest_name === "string")
      data.guest_name = body.guest_name.trim() || null;
    if (typeof body.guest_phone === "string")
      data.guest_phone = body.guest_phone.trim() || null;
    if (typeof body.guest_id_no === "string")
      data.guest_id_no = body.guest_id_no.trim() || null;
    if (typeof body.notes === "string") data.notes = body.notes.trim() || null;
    if (typeof body.rate_per_night === "number") {
      data.rate_per_night = body.rate_per_night;
      const rent = +(body.rate_per_night * stay.nights).toFixed(2);
      data.rent_total = rent;
      data.grand_total = +(rent + Number(stay.orders_total)).toFixed(2);
    }

    const updated = await prisma.room_stays.update({ where: { id }, data });
    return NextResponse.json({ stay: updated });
  } catch (err) {
    console.error("Update stay error:", err);
    return NextResponse.json(
      { error: "Failed to update stay" },
      { status: 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const stay = await loadScoped(id, user.id);
  if (!stay) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (stay.status !== "active")
    return NextResponse.json(
      { error: "Only active stays can be cancelled" },
      { status: 400 },
    );

  const orderCount = await prisma.orders.count({
    where: { room_stay_id: id, status: { not: "cancelled" } },
  });
  if (orderCount > 0)
    return NextResponse.json(
      {
        error: "This stay has orders. Cancel or check out instead of deleting.",
      },
      { status: 400 },
    );

  await prisma.$transaction(async (tx) => {
    await tx.room_stays.update({
      where: { id },
      data: { status: "cancelled" },
    });
    await tx.rooms.update({
      where: { id: stay.room_id },
      data: { status: "available" },
    });
  });

  return NextResponse.json({ success: true });
}
