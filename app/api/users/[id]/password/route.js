import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, canManageUsers, scopeFilterForActor } from "@/lib/auth";
import { badRequest, notFound, parseJson } from "@/lib/api-utils";

export async function PATCH(request, { params }) {
  const actor = await getCurrentUser(request);
  if (!actor) return unauthorized();
  if (!canManageUsers(actor)) return forbidden();

  const target = await prisma.users.findFirst({
    where: { id: params.id, ...scopeFilterForActor(actor) },
  });
  if (!target) return notFound("User not found");

  const body = await parseJson(request);
  const { password, pin_code } = body || {};
  if (!password && !pin_code) return badRequest("Provide a new password or pin_code");
  if (password && password.length < 8) return badRequest("Password must be at least 8 characters");

  const data = { updated_at: new Date() };
  if (password) data.password_hash = await bcrypt.hash(password, 10);
  if (pin_code) data.pin_code = pin_code;

  await prisma.users.update({ where: { id: params.id }, data });

  return NextResponse.json({ success: true });
}
