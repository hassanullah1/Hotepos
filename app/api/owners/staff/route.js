import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hashPassword } from "@/lib/auth";
import {
  getOwnerHotelIds,
  assertBranchInOwnedHotel,
  STAFF_ROLES,
} from "@/lib/owner-scope";

const STAFF_SELECT = {
  id: true,
  full_name: true,
  email: true,
  phone: true,
  username: true,
  is_active: true,
  hired_at: true,
  created_at: true,
  branch_id: true,
  roles: { select: { name: true } },
  branches: { select: { id: true, name: true } },
};

function serialize(s) {
  return {
    id: s.id,
    full_name: s.full_name,
    email: s.email,
    phone: s.phone,
    username: s.username,
    is_active: s.is_active,
    hired_at: s.hired_at,
    created_at: s.created_at,
    role: s.roles?.name ?? null,
    branch: s.branches ? { id: s.branches.id, name: s.branches.name } : null,
  };
}

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get("hotel_id");
  const branchId = searchParams.get("branch_id");
  const q = (searchParams.get("q") || "").trim();

  // ----- Branch Manager: only their own branch -----
  if (user.roles?.name === "branch_manager") {
    if (!user.branch_id) {
      return NextResponse.json(
        { error: "No branch assigned" },
        { status: 403 },
      );
    }
    const where = {
      branch_id: user.branch_id,
      roles: { name: { in: STAFF_ROLES } },
    };
    if (q) {
      where.OR = [
        { full_name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ];
    }
    const staff = await prisma.users.findMany({
      where,
      select: STAFF_SELECT,
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ staff: staff.map(serialize) });
  }

  // ----- Owner / Super Admin -----
  if (!hotelId) {
    return NextResponse.json(
      { error: "hotel_id is required" },
      { status: 400 },
    );
  }

  // Super admins skip ownership check; owners must own the hotel
  if (user.roles?.name !== "super_admin") {
    const ownedHotelIds = await getOwnerHotelIds(user.id);
    if (!ownedHotelIds.includes(hotelId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const branchWhere = { hotel_id: hotelId };
  if (branchId) branchWhere.id = branchId;
  const branchIds = (
    await prisma.branches.findMany({ where: branchWhere, select: { id: true } })
  ).map((b) => b.id);
  if (branchIds.length === 0) return NextResponse.json({ staff: [] });

  const where = {
    branch_id: { in: branchIds },
    roles: { name: { in: STAFF_ROLES } },
  };
  if (q) {
    where.OR = [
      { full_name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }

  const staff = await prisma.users.findMany({
    where,
    select: STAFF_SELECT,
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json({ staff: staff.map(serialize) });
}
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { full_name, role_name, branch_id, password, hotel_id } = body;

  if (!full_name || !role_name || !branch_id || !password || !hotel_id) {
    return NextResponse.json(
      {
        error:
          "full_name, role_name, branch_id, hotel_id and password are required",
      },
      { status: 400 },
    );
  }
  if (!STAFF_ROLES.includes(role_name)) {
    return NextResponse.json({ error: "Invalid role_name" }, { status: 400 });
  }

  // Verifies the user owns hotel_id AND that branch_id belongs to it —
  // this is the fix: hotel_id now comes from the request (the hotel the
  // owner had selected in the UI) instead of an implicit single hotel.
  const branch = await assertBranchInOwnedHotel(branch_id, user.id, hotel_id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found in your hotel" },
      { status: 404 },
    );

  if (body.email) {
    const conflict = await prisma.users.findFirst({
      where: { email: body.email },
    });
    if (conflict)
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
  }
  if (body.phone) {
    const conflict = await prisma.users.findFirst({
      where: { phone: body.phone },
    });
    if (conflict)
      return NextResponse.json(
        { error: "Phone already in use" },
        { status: 409 },
      );
  }

  const role = await prisma.roles.findUnique({ where: { name: role_name } });
  if (!role)
    return NextResponse.json(
      { error: `Role ${role_name} is not configured` },
      { status: 500 },
    );

  try {
    const password_hash = await hashPassword(password);
    const staff = await prisma.users.create({
      data: {
        full_name,
        email: body.email || null,
        phone: body.phone || null,
        username: body.username || null,
        pin_code: body.pin_code || null,
        password_hash,
        role_id: role.id,
        branch_id,
        hired_at: body.hired_at ? new Date(body.hired_at) : null,
        is_active: body.is_active ?? true,
      },
      select: STAFF_SELECT,
    });
    return NextResponse.json({ staff: serialize(staff) }, { status: 201 });
  } catch (err) {
    console.error("Create staff error:", err);
    return NextResponse.json(
      { error: "Failed to create staff" },
      { status: 400 },
    );
  }
}
