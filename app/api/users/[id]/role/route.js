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
  // ✅ Unwrap the params Promise
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

  const role = await prisma.roles.findUnique({ where: { id: roleId } });
  if (!role) return badRequest("Invalid roleId");
  if (!canAssignRole(actor, role))
    return forbidden("You are not allowed to assign this role");

  // ✅ Use the unwrapped `id` variable
  if (actor.id === id && role.scope !== actor.roles.scope) {
    return badRequest("You cannot change your own role scope");
  }

  const user = await prisma.users.update({
    where: { id }, // ✅ use `id`
    data: { role_id: roleId, updated_at: new Date() },
    select: USER_SAFE_SELECT,
  });

  return NextResponse.json({ user: shapeUser(user) });
}
