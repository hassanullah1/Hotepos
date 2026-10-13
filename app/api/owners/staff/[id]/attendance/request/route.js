// app/api/owners/staff/[id]/attendance/request/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getOwnerHotelIds } from "@/lib/owner-scope";

async function assertAccessToStaff(staffId, userId) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { branch_id: true, roles: { select: { name: true } } },
  });
  if (!user) return null;

  const staff = await prisma.users.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      branch_id: true,
      branches: { select: { hotel_id: true } },
    },
  });
  if (!staff || !staff.branches) return null;

  // Super admin: full access
  if (user.roles?.name === "super_admin") return staff;

  // Branch manager: only staff in their own branch
  if (user.roles?.name === "branch_manager") {
    return user.branch_id === staff.branch_id ? staff : null;
  }

  // Hotel owner: must own the hotel
  if (user.roles?.name === "hotel_owner") {
    const ownedHotelIds = await getOwnerHotelIds(user.id);
    if (ownedHotelIds.includes(staff.branches.hotel_id)) return staff;
  }

  return null;
}

export async function POST(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const staff = await assertAccessToStaff(id, user.id);
  if (!staff) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const body = await request.json();
  const { leave_type, start_date, end_date, reason } = body;
  if (!leave_type || !start_date || !end_date) {
    return NextResponse.json(
      { error: "LEAVE_FIELDS_REQUIRED" },
      { status: 400 },
    );
  }
  if (new Date(end_date) < new Date(start_date)) {
    return NextResponse.json({ error: "END_BEFORE_START" }, { status: 400 });
  }

  const leaveRequest = await prisma.staff_leave_requests.create({
    data: {
      user_id: id,
      branch_id: staff.branch_id,
      leave_type,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      reason: reason || null,
    },
  });

  return NextResponse.json({ request: leaveRequest }, { status: 201 });
}
