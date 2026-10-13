import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hashPassword } from "@/lib/auth";
import {
  loadOwnedStaff,
  assertBranchInOwnedHotel,
  STAFF_ROLES,
} from "@/lib/owner-scope";

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
    branch: s.branches
      ? { id: s.branches.id, name: s.branches.name, hotel_id: s.branches.hotel_id }
      : null,
  };
}

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const staff = await loadOwnedStaff(id, user.id);
  if (!staff) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ staff: serialize(staff) });
}

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedStaff(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await request.json();
  const data = {};
  if (body.full_name !== undefined) data.full_name = body.full_name;
  if (body.username !== undefined) data.username = body.username || null;
  if (body.pin_code !== undefined) data.pin_code = body.pin_code || null;
  if (body.is_active !== undefined) data.is_active = !!body.is_active;
  if (body.hired_at !== undefined)
    data.hired_at = body.hired_at ? new Date(body.hired_at) : null;

  if (body.role_name !== undefined) {
    if (!STAFF_ROLES.includes(body.role_name))
      return NextResponse.json({ error: "Invalid role_name" }, { status: 400 });
    const role = await prisma.roles.findUnique({
      where: { name: body.role_name },
    });
    if (!role)
      return NextResponse.json(
        { error: "Role not configured" },
        { status: 500 },
      );
    data.role_id = role.id;
  }

  if (body.branch_id !== undefined) {
    // Hotel is derived from the staff member's CURRENT branch, not trusted
    // from the request — so this can't be used to move staff into a hotel
    // the owner doesn't own, and it works for owners with multiple hotels.
    const branch = await assertBranchInOwnedHotel(
      body.branch_id,
      user.id,
      existing.branches.hotel_id,
    );
    if (!branch)
      return NextResponse.json(
        { error: "Branch not found in your hotel" },
        { status: 404 },
      );
    data.branch_id = body.branch_id;
  }

  if (body.email !== undefined) {
    if (body.email) {
      const conflict = await prisma.users.findFirst({
        where: { email: body.email, NOT: { id } },
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
        where: { phone: body.phone, NOT: { id } },
      });
      if (conflict)
        return NextResponse.json(
          { error: "Phone already in use" },
          { status: 409 },
        );
    }
    data.phone = body.phone || null;
  }

  if (body.password) data.password_hash = await hashPassword(body.password);

  try {
    await prisma.users.update({ where: { id }, data });
    const updated = await loadOwnedStaff(id, user.id);
    return NextResponse.json({ staff: serialize(updated) });
  } catch (err) {
    console.error("Update staff error:", err);
    return NextResponse.json(
      { error: "Failed to update staff" },
      { status: 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedStaff(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  try {
    await prisma.users.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete staff error:", err);
    return NextResponse.json(
      { error: "Failed to delete staff" },
      { status: 400 },
    );
  }
}
