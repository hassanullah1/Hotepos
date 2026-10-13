import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  unauthorized,
  forbidden,
  canManageUsers,
  canAssignRole,
  scopeFilterForActor,
} from "@/lib/auth";
import {
  badRequest,
  notFound,
  parseJson,
  USER_SAFE_SELECT,
  shapeUser,
} from "@/lib/api-utils";

export async function PATCH(request, { params }) {
  const { id } = await params;

  const actor = await getCurrentUser(request);
  if (!actor) return unauthorized();
  if (!canManageUsers(actor)) return forbidden();

  const target = await prisma.users.findFirst({
    where: { id, ...scopeFilterForActor(actor) },
  });
  if (!target) return notFound("User not found");

  const body = await parseJson(request);
  const roleId = body?.roleId || body?.role_id;
  if (!roleId) return badRequest("roleId is required");

  // 🔥 Convert to string – this is the fix
  const role = await prisma.roles.findUnique({
    where: { id: String(roleId) },
  });
  if (!role) return badRequest("Invalid roleId");
  if (!canAssignRole(actor, role))
    return forbidden("You are not allowed to assign this role");

  if (actor.id === id && role.scope !== actor.roles.scope) {
    return badRequest("You cannot change your own role scope");
  }

  const user = await prisma.users.update({
    where: { id },
    data: {
      role_id: String(roleId), // also convert here
      updated_at: new Date(),
    },
    select: USER_SAFE_SELECT,
  });

  return NextResponse.json({ user: shapeUser(user) });
}
