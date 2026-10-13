import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getOwnerHotelIds, STAFF_ROLES } from "@/lib/owner-scope";

function monthRange(monthStr) {
  const now = new Date();
  const [y, m] = (
    monthStr ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  )
    .split("-")
    .map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1)); // exclusive
  return { start, end };
}

function monthLabel(start) {
  return `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`;
}

// how many days of [reqStart, reqEnd) fall inside [rangeStart, rangeEnd)
function overlapDays(reqStart, reqEnd, rangeStart, rangeEnd) {
  const s = reqStart > rangeStart ? reqStart : rangeStart;
  const e = reqEnd < rangeEnd ? reqEnd : rangeEnd;
  const diff = Math.round((e - s) / 86400000);
  return diff > 0 ? diff : 0;
}

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get("hotel_id");
  const branchId = searchParams.get("branch_id");
  const q = (searchParams.get("q") || "").trim();
  const month = searchParams.get("month"); // "YYYY-MM"

  // ---------- Branch Manager ----------
  if (user.roles?.name === "branch_manager") {
    // Use the provided branch_id, or fallback to user's own branch
    const targetBranchId = branchId || user.branch_id;
    if (!targetBranchId) {
      return NextResponse.json(
        { error: "No branch assigned to this user" },
        { status: 403 },
      );
    }
    // Ensure the manager is accessing only their own branch
    if (targetBranchId !== user.branch_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { start, end } = monthRange(month);

    // Build staff query for this single branch
    const staffWhere = {
      branch_id: targetBranchId,
      roles: { name: { in: STAFF_ROLES } },
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
        is_active: true,
        roles: { select: { name: true } },
        branches: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "desc" },
    });

    if (staff.length === 0) {
      return NextResponse.json({ staff: [], month: monthLabel(start) });
    }

    const staffIds = staff.map((s) => s.id);

    // Attendance counts
    const attendance = await prisma.staff_attendance.groupBy({
      by: ["user_id", "status"],
      where: { user_id: { in: staffIds }, check_in: { gte: start, lt: end } },
      _count: { _all: true },
    });

    // Leave requests overlap
    const leaveRequests = await prisma.staff_leave_requests.findMany({
      where: {
        user_id: { in: staffIds },
        start_date: { lt: end },
        end_date: { gte: start },
      },
      select: { user_id: true, start_date: true, end_date: true, status: true },
    });

    const attendanceMap = {};
    for (const row of attendance) {
      attendanceMap[row.user_id] ??= {};
      attendanceMap[row.user_id][row.status ?? "unknown"] = row._count._all;
    }

    const requestedMap = {};
    for (const lr of leaveRequests) {
      const days = overlapDays(
        new Date(lr.start_date),
        new Date(new Date(lr.end_date).getTime() + 86400000),
        start,
        end,
      );
      requestedMap[lr.user_id] = (requestedMap[lr.user_id] || 0) + days;
    }

    const result = staff.map((s) => ({
      id: s.id,
      full_name: s.full_name,
      is_active: s.is_active,
      role: s.roles?.name ?? null,
      branch: s.branches ? { id: s.branches.id, name: s.branches.name } : null,
      present_days: attendanceMap[s.id]?.present || 0,
      late_days: attendanceMap[s.id]?.late || 0,
      absent_days: attendanceMap[s.id]?.absent || 0,
      requested_days: requestedMap[s.id] || 0,
    }));

    return NextResponse.json({ staff: result, month: monthLabel(start) });
  }

  // ---------- Owner / Super Admin ----------
  if (!hotelId) {
    return NextResponse.json(
      { error: "hotel_id is required" },
      { status: 400 },
    );
  }

  // Super admin can access any hotel; owners must own the hotel
  if (user.roles?.name !== "super_admin") {
    const ownedHotelIds = await getOwnerHotelIds(user.id);
    if (!ownedHotelIds.includes(hotelId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { start, end } = monthRange(month);

  const branchWhere = { hotel_id: hotelId };
  if (branchId) branchWhere.id = branchId;
  const branchIds = (
    await prisma.branches.findMany({ where: branchWhere, select: { id: true } })
  ).map((b) => b.id);
  if (branchIds.length === 0) {
    return NextResponse.json({ staff: [], month: monthLabel(start) });
  }

  const staffWhere = {
    branch_id: { in: branchIds },
    roles: { name: { in: STAFF_ROLES } },
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
      is_active: true,
      roles: { select: { name: true } },
      branches: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "desc" },
  });

  if (staff.length === 0) {
    return NextResponse.json({ staff: [], month: monthLabel(start) });
  }

  const staffIds = staff.map((s) => s.id);

  const attendance = await prisma.staff_attendance.groupBy({
    by: ["user_id", "status"],
    where: { user_id: { in: staffIds }, check_in: { gte: start, lt: end } },
    _count: { _all: true },
  });

  const leaveRequests = await prisma.staff_leave_requests.findMany({
    where: {
      user_id: { in: staffIds },
      start_date: { lt: end },
      end_date: { gte: start },
    },
    select: { user_id: true, start_date: true, end_date: true, status: true },
  });

  const attendanceMap = {};
  for (const row of attendance) {
    attendanceMap[row.user_id] ??= {};
    attendanceMap[row.user_id][row.status ?? "unknown"] = row._count._all;
  }

  const requestedMap = {};
  for (const lr of leaveRequests) {
    const days = overlapDays(
      new Date(lr.start_date),
      new Date(new Date(lr.end_date).getTime() + 86400000),
      start,
      end,
    );
    requestedMap[lr.user_id] = (requestedMap[lr.user_id] || 0) + days;
  }

  const result = staff.map((s) => ({
    id: s.id,
    full_name: s.full_name,
    is_active: s.is_active,
    role: s.roles?.name ?? null,
    branch: s.branches ? { id: s.branches.id, name: s.branches.name } : null,
    present_days: attendanceMap[s.id]?.present || 0,
    late_days: attendanceMap[s.id]?.late || 0,
    absent_days: attendanceMap[s.id]?.absent || 0,
    requested_days: requestedMap[s.id] || 0,
  }));

  return NextResponse.json({ staff: result, month: monthLabel(start) });
}
