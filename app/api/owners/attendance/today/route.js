import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getOwnerHotelIds, STAFF_ROLES, ownsHotel } from "@/lib/owner-scope";
import {
  ATTENDANCE_STATUSES,
  serializeAttendance,
} from "@/lib/attendance-helpers";

function todayRange() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start.getTime() + 86400000);
  return { start, end, dateStr: start.toISOString().slice(0, 10) };
}

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get("hotel_id");
  const branchId = searchParams.get("branch_id");
  const q = (searchParams.get("q") || "").trim();

  // ---------- Branch Manager ----------
  if (user.roles?.name === "branch_manager") {
    const targetBranchId = branchId || user.branch_id;
    if (!targetBranchId) {
      return NextResponse.json(
        { error: "NO_BRANCH_ASSIGNED" },
        { status: 403 },
      );
    }
    // Ensure they only access their own branch
    if (targetBranchId !== user.branch_id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { start, end, dateStr } = todayRange();

    const staffWhere = {
      branch_id: targetBranchId,
      roles: { name: { in: STAFF_ROLES } },
      is_active: true,
    };
    if (q) {
      staffWhere.OR = [
        { full_name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ];
    }

    const staff = await prisma.users.findMany({
      where: staffWhere,
      select: {
        id: true,
        full_name: true,
        roles: { select: { name: true } },
        branches: { select: { id: true, name: true } },
      },
      orderBy: { full_name: "asc" },
    });

    if (staff.length === 0) {
      return NextResponse.json({ staff: [], date: dateStr });
    }

    const staffIds = staff.map((s) => s.id);

    const [attendance, leaveToday] = await Promise.all([
      prisma.staff_attendance.findMany({
        where: { user_id: { in: staffIds }, check_in: { gte: start, lt: end } },
      }),
      prisma.staff_leave_requests.findMany({
        where: {
          user_id: { in: staffIds },
          status: { in: ["pending", "approved"] },
          start_date: { lte: start },
          end_date: { gte: start },
        },
        select: { user_id: true, status: true, leave_type: true },
      }),
    ]);

    const attendanceMap = {};
    for (const a of attendance)
      attendanceMap[a.user_id] = serializeAttendance(a);

    const leaveMap = {};
    for (const l of leaveToday) leaveMap[l.user_id] = l;

    const result = staff.map((s) => ({
      id: s.id,
      full_name: s.full_name,
      role: s.roles?.name ?? null,
      branch: s.branches ? { id: s.branches.id, name: s.branches.name } : null,
      today_status: attendanceMap[s.id]?.status || null,
      attendance_id: attendanceMap[s.id]?.id || null,
      on_leave: leaveMap[s.id]
        ? {
            status: leaveMap[s.id].status,
            leave_type: leaveMap[s.id].leave_type,
          }
        : null,
    }));

    return NextResponse.json({ staff: result, date: dateStr });
  }

  // ---------- Owner / Super Admin ----------
  if (!hotelId) {
    return NextResponse.json({ error: "HOTEL_ID_REQUIRED" }, { status: 400 });
  }

  // Super admin can access any hotel; owners must own it
  if (user.roles?.name !== "super_admin") {
    const ownedHotelIds = await getOwnerHotelIds(user.id);
    if (!ownedHotelIds.includes(hotelId)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  const branchWhere = { hotel_id: hotelId };
  if (branchId) branchWhere.id = branchId;
  const branchIds = (
    await prisma.branches.findMany({ where: branchWhere, select: { id: true } })
  ).map((b) => b.id);

  const { start, end, dateStr } = todayRange();

  if (branchIds.length === 0) {
    return NextResponse.json({ staff: [], date: dateStr });
  }

  const staffWhere = {
    branch_id: { in: branchIds },
    roles: { name: { in: STAFF_ROLES } },
    is_active: true,
  };
  if (q) {
    staffWhere.OR = [
      { full_name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }

  const staff = await prisma.users.findMany({
    where: staffWhere,
    select: {
      id: true,
      full_name: true,
      roles: { select: { name: true } },
      branches: { select: { id: true, name: true } },
    },
    orderBy: { full_name: "asc" },
  });

  if (staff.length === 0) {
    return NextResponse.json({ staff: [], date: dateStr });
  }

  const staffIds = staff.map((s) => s.id);

  const [attendance, leaveToday] = await Promise.all([
    prisma.staff_attendance.findMany({
      where: { user_id: { in: staffIds }, check_in: { gte: start, lt: end } },
    }),
    prisma.staff_leave_requests.findMany({
      where: {
        user_id: { in: staffIds },
        status: { in: ["pending", "approved"] },
        start_date: { lte: start },
        end_date: { gte: start },
      },
      select: { user_id: true, status: true, leave_type: true },
    }),
  ]);

  const attendanceMap = {};
  for (const a of attendance) attendanceMap[a.user_id] = serializeAttendance(a);

  const leaveMap = {};
  for (const l of leaveToday) leaveMap[l.user_id] = l;

  const result = staff.map((s) => ({
    id: s.id,
    full_name: s.full_name,
    role: s.roles?.name ?? null,
    branch: s.branches ? { id: s.branches.id, name: s.branches.name } : null,
    today_status: attendanceMap[s.id]?.status || null,
    attendance_id: attendanceMap[s.id]?.id || null,
    on_leave: leaveMap[s.id]
      ? { status: leaveMap[s.id].status, leave_type: leaveMap[s.id].leave_type }
      : null,
  }));

  return NextResponse.json({ staff: result, date: dateStr });
}

// Bulk mark today's attendance for many staff at once.
// body: { records: [{ user_id, status }, ...] }
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const records = Array.isArray(body.records) ? body.records : [];
  if (records.length === 0) {
    return NextResponse.json({ error: "RECORDS_REQUIRED" }, { status: 400 });
  }

  for (const r of records) {
    if (!r.user_id || !ATTENDANCE_STATUSES.includes(r.status)) {
      return NextResponse.json({ error: "RECORD_INVALID" }, { status: 400 });
    }
  }

  const userIds = records.map((r) => r.user_id);
  const staffRows = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      branch_id: true,
      branches: { select: { hotel_id: true } },
    },
  });
  const staffMap = Object.fromEntries(staffRows.map((s) => [s.id, s]));

  // ---------- Permission checks ----------
  for (const r of records) {
    const s = staffMap[r.user_id];
    if (!s || !s.branches) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    if (user.roles?.name === "branch_manager") {
      // Branch manager can only mark attendance for their own branch
      if (s.branch_id !== user.branch_id) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }
    } else if (user.roles?.name === "hotel_owner") {
      const owns = await ownsHotel(user.id, s.branches.hotel_id);
      if (!owns) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }
    } else if (user.roles?.name !== "super_admin") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  const { start, end } = todayRange();

  const saved = [];
  for (const r of records) {
    const s = staffMap[r.user_id];
    const existing = await prisma.staff_attendance.findFirst({
      where: { user_id: r.user_id, check_in: { gte: start, lt: end } },
    });
    const record = existing
      ? await prisma.staff_attendance.update({
          where: { id: existing.id },
          data: { status: r.status },
        })
      : await prisma.staff_attendance.create({
          data: {
            user_id: r.user_id,
            branch_id: s.branch_id,
            check_in: start,
            status: r.status,
          },
        });
    saved.push(serializeAttendance(record));
  }

  return NextResponse.json({ attendance: saved });
}
