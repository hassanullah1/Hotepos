import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  unauthorized,
  forbidden,
  canManageUsers,
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

  if (actor.id === id) {
    return badRequest("You cannot change your own active status");
  }

  const target = await prisma.users.findFirst({
    where: { id, ...scopeFilterForActor(actor) },
  });
  if (!target) return notFound("User not found");

  const body = await parseJson(request);
  if (typeof body?.is_active !== "boolean")
    return badRequest("is_active (boolean) is required");

  const user = await prisma.users.update({
    where: { id },
    data: { is_active: body.is_active, updated_at: new Date() },
    select: USER_SAFE_SELECT,
  });

  return NextResponse.json({ user: shapeUser(user) });
}
