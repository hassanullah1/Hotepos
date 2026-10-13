// app/api/owners/room-stays/route.js
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

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id");
  const status = searchParams.get("status") || "active";

  if (!branchId)
    return NextResponse.json(
      { error: "branch_id is required" },
      { status: 400 },
    );

  const branch = await assertManagedBranch(branchId, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found or not accessible" },
      { status: 404 },
    );

  const stays = await prisma.room_stays.findMany({
    where: { branch_id: branchId, status },
    include: {
      rooms: { select: { id: true, room_number: true, floor: true } },
      customers: { select: { id: true, full_name: true, phone: true } },
    },
    orderBy: { check_in_at: "desc" },
  });

  return NextResponse.json({
    stays: stays.map((s) => ({
      id: s.id,
      room: s.rooms,
      customer: s.customers,
      guest_name: s.guest_name,
      guest_phone: s.guest_phone,
      rate_per_night: Number(s.rate_per_night),
      nights: s.nights,
      rent_total: Number(s.rent_total),
      orders_total: Number(s.orders_total),
      grand_total: Number(s.grand_total),
      check_in_at: s.check_in_at,
      expected_check_out: s.expected_check_out,
      status: s.status,
      is_paid: s.is_paid,
      notes: s.notes,
    })),
  });
}

// POST = check in a guest (assign a room to a customer)
// body: {
//   branch_id,
//   room_id,
//   customer_id?,              // existing customer
//   guest_name?, guest_phone?, guest_id_no?,  // OR walk-in fields
//   rate_per_night,
//   nights,
//   expected_check_out?,       // optional ISO date
//   notes?
// }
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);

  const branchId = typeof body.branch_id === "string" ? body.branch_id : "";
  const roomId = typeof body.room_id === "string" ? body.room_id : "";
  const customerId =
    typeof body.customer_id === "string" && body.customer_id
      ? body.customer_id
      : null;

  if (!branchId || !roomId) {
    return NextResponse.json(
      { error: "branch_id and room_id are required" },
      { status: 400 },
    );
  }

  const branch = await assertManagedBranch(branchId, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found or not accessible" },
      { status: 404 },
    );

  // Room must exist in this branch and be available
  const room = await prisma.rooms.findFirst({
    where: { id: roomId, branch_id: branchId, is_active: true },
    select: { id: true, status: true, room_type_id: true },
  });
  if (!room)
    return NextResponse.json(
      { error: "Room not found in this branch" },
      { status: 404 },
    );
  if (room.status === "occupied")
    return NextResponse.json(
      { error: "Room is already occupied" },
      { status: 400 },
    );

  // Cannot double-book: no other active stay on this room
  const existingStay = await prisma.room_stays.findFirst({
    where: { room_id: roomId, status: "active" },
    select: { id: true },
  });
  if (existingStay)
    return NextResponse.json(
      { error: "Room already has an active stay" },
      { status: 400 },
    );

  // Resolve customer
  let customer = null;
  if (customerId) {
    customer = await prisma.customers.findFirst({
      where: { id: customerId, hotel_id: branch.hotel_id },
      select: { id: true, full_name: true, phone: true },
    });
    if (!customer)
      return NextResponse.json(
        { error: "Customer not found in this hotel" },
        { status: 404 },
      );
  }

  // Walk-in name fallback
  const guestName =
    typeof body.guest_name === "string" && body.guest_name.trim()
      ? body.guest_name.trim()
      : customer?.full_name || null;
  const guestPhone =
    typeof body.guest_phone === "string" && body.guest_phone.trim()
      ? body.guest_phone.trim()
      : customer?.phone || null;
  const guestIdNo =
    typeof body.guest_id_no === "string" && body.guest_id_no.trim()
      ? body.guest_id_no.trim()
      : null;

  if (!customer && !guestName && !guestPhone) {
    return NextResponse.json(
      { error: "Provide a customer or at least a guest name/phone" },
      { status: 400 },
    );
  }

  // Rate / nights
  let rate = Number(body.rate_per_night);
  if (!Number.isFinite(rate) || rate < 0) {
    // fall back to the room type's base price
    const rt = await prisma.room_types.findUnique({
      where: { id: room.room_type_id },
      select: { base_price: true },
    });
    rate = Number(rt?.base_price || 0);
  }
  const nights = Math.max(1, Number(body.nights) || 1);

  const rentTotal = +(rate * nights).toFixed(2);

  const expectedCheckOut = (() => {
    if (
      typeof body.expected_check_out === "string" &&
      body.expected_check_out
    ) {
      const d = new Date(body.expected_check_out);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date();
    d.setDate(d.getDate() + nights);
    return d;
  })();

  try {
    const stay = await prisma.$transaction(async (tx) => {
      const created = await tx.room_stays.create({
        data: {
          branch_id: branchId,
          room_id: roomId,
          customer_id: customer ? customer.id : null,
          guest_name: guestName,
          guest_phone: guestPhone,
          guest_id_no: guestIdNo,
          rate_per_night: rate,
          nights,
          rent_total: rentTotal,
          orders_total: 0,
          grand_total: rentTotal,
          expected_check_out: expectedCheckOut,
          status: "active",
          is_paid: false,
          checked_in_by: user.id,
          notes:
            typeof body.notes === "string" && body.notes ? body.notes : null,
        },
        include: {
          rooms: { select: { id: true, room_number: true, floor: true } },
          customers: { select: { id: true, full_name: true, phone: true } },
        },
      });

      await tx.rooms.update({
        where: { id: roomId },
        data: { status: "occupied" },
      });

      return created;
    });

    return NextResponse.json({ stay }, { status: 201 });
  } catch (err) {
    console.error("Check-in error:", err);
    return NextResponse.json({ error: "Failed to check in" }, { status: 400 });
  }
}
