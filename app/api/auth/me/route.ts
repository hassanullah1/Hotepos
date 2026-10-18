import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, comparePassword, hashPassword } from "@/lib/auth";

const ME_SELECT = {
  id: true,
  full_name: true,
  email: true,
  phone: true,
  username: true,
  is_active: true,
  hired_at: true,
  created_at: true,
  updated_at: true,
  roles: {
    select: {
      name: true,
      scope: true,
      role_permissions: {
        select: { permissions: { select: { code: true } } },
      },
    },
  },
  branches: { select: { id: true, name: true, hotel_id: true } },
  hotel_owners: { select: { hotel_id: true, address: true } },
};

function serialize(u: any) {
  const ownerRow = Array.isArray(u.hotel_owners)
    ? u.hotel_owners[0] ?? null
    : u.hotel_owners ?? null;

  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    username: u.username,
    is_active: u.is_active,
    hired_at: u.hired_at,
    created_at: u.created_at,
    updated_at: u.updated_at,
    role: u.roles?.name ?? null,
    scope: u.roles?.scope ?? null,
    permissions:
      u.roles?.role_permissions?.map((rp: any) => rp.permissions.code) ?? [],
    branch: u.branches
      ? {
          id: u.branches.id,
          name: u.branches.name,
          hotel_id: u.branches.hotel_id,
        }
      : null,
    hotel_id: ownerRow?.hotel_id ?? u.branches?.hotel_id ?? null,
    address: ownerRow?.address ?? null,
  };
}

// GET /api/auth/me — current user's own profile
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const full = await prisma.users.findUnique({
    where: { id: user.id },
    select: ME_SELECT,
  });
  if (!full) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user: serialize(full) });
}

// PATCH /api/auth/me — update own name/contact info, and/or change password
// Body: { full_name?, email?, phone?, username?, current_password?, new_password? }
export async function PATCH(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.full_name !== undefined) {
    if (!body.full_name.trim()) {
      return NextResponse.json(
        { error: "full_name cannot be empty" },
        { status: 400 },
      );
    }
    data.full_name = body.full_name.trim();
  }

  if (body.username !== undefined) data.username = body.username || null;

  if (body.email !== undefined) {
    if (body.email) {
      const conflict = await prisma.users.findFirst({
        where: { email: body.email, NOT: { id: user.id } },
      });
      if (conflict)
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
    }
    data.email = body.email || null;
  }

  if (body.phone !== undefined) {
    if (body.phone) {
      const conflict = await prisma.users.findFirst({
        where: { phone: body.phone, NOT: { id: user.id } },
      });
      if (conflict)
        return NextResponse.json(
          { error: "Phone already in use" },
          { status: 409 },
        );
    }
    data.phone = body.phone || null;
  }

  if (body.new_password) {
    if (!body.current_password) {
      return NextResponse.json(
        { error: "current_password is required to set a new password" },
        { status: 400 },
      );
    }
    const existing = await prisma.users.findUnique({
      where: { id: user.id },
      select: { password_hash: true },
    });
    if (!existing?.password_hash) {
      return NextResponse.json(
        { error: "Account has no password set" },
        { status: 400 },
      );
    }
    const valid = await comparePassword(
      body.current_password,
      existing.password_hash,
    );
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 },
      );
    }
    if (body.new_password.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 },
      );
    }
    data.password_hash = await hashPassword(body.new_password);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    await prisma.users.update({ where: { id: user.id }, data });
    const updated = await prisma.users.findUnique({
      where: { id: user.id },
      select: ME_SELECT,
    });
    return NextResponse.json({ user: serialize(updated) });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 400 },
    );
  }
}