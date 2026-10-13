// app/api/roles/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, canManageUsers, canAssignRole } from "@/lib/auth";

export async function GET(request, context) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;

  const role = await prisma.roles.findUnique({
    where: { id },
    include: {
      role_permissions: { include: { permissions: true } },
    },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }
  if (!canAssignRole(user, role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    role: {
      id: role.id,
      name: role.name,
      scope: role.scope,
      permission_ids: role.role_permissions.map((rp) => rp.permission_id),
    },
  });
}

export async function PATCH(request, context) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const existing = await prisma.roles.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }
  if (!canAssignRole(user, existing)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, scope } = body;

  // Also block escalating a role's scope beyond the caller's own authority.
  if (scope !== undefined && !canAssignRole(user, { scope })) {
    return NextResponse.json(
      { error: "You cannot set this scope" },
      { status: 403 },
    );
  }

  try {
    const role = await prisma.roles.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(scope !== undefined ? { scope } : {}),
      },
    });
    return NextResponse.json({ role });
  } catch (err) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A role with that name already exists" },
        { status: 409 },
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;

  const existing = await prisma.roles.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }
  if (!canAssignRole(user, existing)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const inUse = await prisma.users.count({ where: { role_id: id } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${inUse} user(s) still have this role` },
      { status: 409 },
    );
  }

  try {
    await prisma.$transaction([
      prisma.role_permissions.deleteMany({ where: { role_id: id } }),
      prisma.roles.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
  }
}
