import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole, hashPassword } from "@/lib/auth";

const USER_SELECT = {
  id: true,
  hotel_id: true,
  branch_id: true,
  role_id: true,
  full_name: true,
  email: true,
  phone: true,
  username: true,
  pin_code: true,
  is_active: true,
  hired_at: true,
  address: true,
  created_at: true,
  roles: { select: { id: true, name: true, scope: true } },
  hotels_scope: { select: { id: true, name: true } },
  branches: { select: { id: true, name: true } },
};

function serializeUser(u) {
  return {
    id: u.id,
    hotel_id: u.hotel_id,
    branch_id: u.branch_id,
    role_id: u.role_id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    username: u.username,
    pin_code: u.pin_code,
    is_active: u.is_active,
    hired_at: u.hired_at,
    address: u.address,
    role_name: u.roles?.name ?? null,
    role_scope: u.roles?.scope ?? null,
    hotel_name: u.hotels_scope?.name ?? null,
    branch_name: u.branches?.name ?? null,
  };
}

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.users.findMany({
    select: USER_SELECT,
    orderBy: { full_name: "asc" },
  });

  return NextResponse.json({ users: users.map(serializeUser) });
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    full_name,
    email,
    phone,
    username,
    password,
    pin_code,
    roleId,
    hotel_id,
    branch_id,
    address,
    hired_at,
    is_active,
  } = body;

  if (!full_name || !password || !roleId) {
    return NextResponse.json(
      { error: "full_name, password and roleId are required" },
      { status: 400 }
    );
  }

  if (email) {
    const existing = await prisma.users.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  if (phone) {
    const existingPhone = await prisma.users.findFirst({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json({ error: "Phone already in use" }, { status: 409 });
    }
  }

  const password_hash = await hashPassword(password);

  try {
    const created = await prisma.users.create({
      data: {
        full_name,
        email: email || null,
        phone: phone || null,
        username: username || null,
        password_hash,
        pin_code: pin_code || null,
        role_id: roleId,
        hotel_id: hotel_id || null,
        branch_id: branch_id || null,
        address: address || null,
        hired_at: hired_at ? new Date(hired_at) : null,
        is_active: is_active ?? true,
      },
      select: USER_SELECT,
    });

    return NextResponse.json({ user: serializeUser(created) }, { status: 201 });
  } catch (err) {
    console.error("Create user error:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
  }
}
