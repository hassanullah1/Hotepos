// app/api/owners/staff/[id]/attendance/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getOwnerHotelIds } from "@/lib/owner-scope";
import {
  ATTENDANCE_STATUSES,
  monthRange,
  serializeAttendance,
  serializeLeaveRequest,
} from "@/lib/attendance-helpers";

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

  // Super admin: access any staff
  if (user.roles?.name === "super_admin") return staff;

  // Branch manager: must be same branch
  if (user.roles?.name === "branch_manager") {
    if (user.branch_id === staff.branch_id) return staff;
    return null;
  }

  // Hotel owner: must own the hotel
  if (user.roles?.name === "hotel_owner") {
    const ownedHotelIds = await getOwnerHotelIds(user.id);
    if (ownedHotelIds.includes(staff.branches.hotel_id)) return staff;
  }

  return null;
}

// Turn a Date into the "YYYY-MM-DD" key the frontend calendar uses
function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const staff = await assertAccessToStaff(id, user.id);
  if (!staff) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const { start, end, label } = monthRange(searchParams.get("month"));

  const [attendance, leaveRequests] = await Promise.all([
    prisma.staff_attendance.findMany({
      where: { user_id: id, check_in: { gte: start, lt: end } },
      orderBy: { check_in: "asc" },
    }),
    prisma.staff_leave_requests.findMany({
      where: {
        user_id: id,
        start_date: { lt: end },
        end_date: { gte: start },
      },
      orderBy: { start_date: "asc" },
    }),
  ]);

  const days = {};

  // 1. Leave requests fill in first
  for (const lr of leaveRequests) {
    if (lr.status === "rejected") continue;

    const rangeStart = new Date(Math.max(new Date(lr.start_date), start));
    const rangeEndExclusive = new Date(
      Math.min(new Date(lr.end_date).getTime() + 86400000, end.getTime()),
    );

    for (
      let cursor = new Date(rangeStart);
      cursor < rangeEndExclusive;
      cursor = new Date(cursor.getTime() + 86400000)
    ) {
      const key = dayKey(cursor);
      days[key] = {
        source: "leave_request",
        status: lr.status,
        leave_type: lr.leave_type,
        id: lr.id,
      };
    }
  }

  // 2. Attendance records override leave requests
  for (const a of attendance) {
    const key = dayKey(a.check_in);
    days[key] = {
      source: "attendance",
      status: a.status,
      id: a.id,
    };
  }

  return NextResponse.json({
    month: label,
    days,
    leave_requests: leaveRequests.map(serializeLeaveRequest),
  });
}

export async function POST(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const staff = await assertAccessToStaff(id, user.id);
  if (!staff) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const body = await request.json();
  const { date, status, notes } = body;

  if (!date || !status) {
    return NextResponse.json(
      { error: "DATE_STATUS_REQUIRED" },
      { status: 400 },
    );
  }
  if (!ATTENDANCE_STATUSES.includes(status)) {
    return NextResponse.json({ error: "STATUS_INVALID" }, { status: 400 });
  }

  const day = new Date(`${date}T00:00:00.000Z`);
  const nextDay = new Date(day.getTime() + 86400000);

  const existing = await prisma.staff_attendance.findFirst({
    where: { user_id: id, check_in: { gte: day, lt: nextDay } },
  });

  const record = existing
    ? await prisma.staff_attendance.update({
        where: { id: existing.id },
        data: { status, notes: notes ?? existing.notes },
      })
    : await prisma.staff_attendance.create({
        data: {
          user_id: id,
          branch_id: staff.branch_id,
          check_in: day,
          status,
          notes: notes || null,
        },
      });

  return NextResponse.json(
    { attendance: serializeAttendance(record) },
    { status: existing ? 200 : 201 },
  );
}
