// app/api/roles/[id]/permissions/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, canManageUsers, canAssignRole } from "@/lib/auth";

// Replaces the full permission set for a role in one shot.
// Body: { permission_ids: string[] }
export async function PUT(request, context) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;

  const role = await prisma.roles.findUnique({ where: { id } });
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }
  if (!canAssignRole(user, role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const permission_ids = Array.isArray(body.permission_ids)
    ? body.permission_ids
    : [];

  try {
    await prisma.$transaction([
      prisma.role_permissions.deleteMany({ where: { role_id: id } }),
      ...(permission_ids.length
        ? [
            prisma.role_permissions.createMany({
              data: permission_ids.map((permission_id) => ({
                role_id: id,
                permission_id,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true, permission_ids });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 },
    );
  }
}
