// app/api/roles/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, canManageUsers, canAssignRole } from "@/lib/auth";

// Helper to check if a user is allowed to assign a specific role
function canAssignSpecificRole(user, role) {
  if (!user?.roles?.name) return false;

  const userRole = user.roles.name;

  // Super admin: everything
  if (userRole === "super_admin") return true;

  // Hotel owner: only branch-scoped roles
  if (userRole === "hotel_owner") {
    return role.scope === "branch";
  }

  // Branch manager: only branch-scoped roles, but NOT branch_manager
  if (userRole === "branch_manager") {
    return role.scope === "branch" && role.name !== "branch_manager";
  }

  // Other roles cannot assign anything
  return false;
}

// Helper to check if user can create a new role with given scope and name
function canCreateRole(user, scope, name) {
  if (!user?.roles?.name) return false;

  const userRole = user.roles.name;

  if (userRole === "super_admin") return true;

  if (userRole === "hotel_owner") {
    return scope === "branch" && name !== "branch_manager";
  }

  if (userRole === "branch_manager") {
    return scope === "branch" && name !== "branch_manager";
  }

  return false;
}

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageUsers(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const roles = await prisma.roles.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { role_permissions: true, users: true } },
    },
  });

  // Filter roles the current user is allowed to assign
  const assignableRoles = roles.filter((role) =>
    canAssignSpecificRole(user, role),
  );

  return NextResponse.json({
    roles: assignableRoles.map((r) => ({
      id: r.id,
      name: r.name,
      scope: r.scope,
      permission_count: r._count.role_permissions,
      user_count: r._count.users,
    })),
  });
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageUsers(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, scope, permission_ids } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const finalScope = scope || "branch";

  // Check if the user is allowed to create this role (scope + name)
  if (!canCreateRole(user, finalScope, name)) {
    return NextResponse.json(
      { error: "You are not allowed to create this role" },
      { status: 403 },
    );
  }

  try {
    const role = await prisma.roles.create({
      data: {
        name,
        scope: finalScope,
        ...(permission_ids?.length
          ? {
              role_permissions: {
                create: permission_ids.map((permission_id) => ({
                  permissions: { connect: { id: permission_id } },
                })),
              },
            }
          : {}),
      },
    });
    return NextResponse.json({ role }, { status: 201 });
  } catch (err) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A role with that name already exists" },
        { status: 409 },
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 },
    );
  }
}
