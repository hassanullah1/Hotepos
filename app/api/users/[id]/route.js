import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, canManageUsers, scopeFilterForActor } from "@/lib/auth";
import { badRequest, conflict, notFound, parseJson, USER_SAFE_SELECT, shapeUser } from "@/lib/api-utils";

async function loadScoped(actor, id) {
  return prisma.users.findFirst({
    where: { id, ...scopeFilterForActor(actor) },
    select: USER_SAFE_SELECT,
  });
}

export async function GET(request, { params }) {
  const actor = await getCurrentUser(request);
  if (!actor) return unauthorized();
  if (!canManageUsers(actor)) return forbidden();

  const user = await loadScoped(actor, params.id);
  if (!user) return notFound("User not found");
  return NextResponse.json({ user: shapeUser(user) });
}

export async function PATCH(request, { params }) {
  const actor = await getCurrentUser(request);
  if (!actor) return unauthorized();
  if (!canManageUsers(actor)) return forbidden();

  const existing = await loadScoped(actor, params.id);
  if (!existing) return notFound("User not found");

  const body = await parseJson(request);
  if (!body) return badRequest("Invalid JSON body");

  const { full_name, email, phone, username, hired_at } = body;

  if (email && email !== existing.email) {
    const dupe = await prisma.users.findUnique({ where: { email } });
    if (dupe) return conflict("Email is already in use");
  }
  if (phone && phone !== existing.phone) {
    const dupe = await prisma.users.findUnique({ where: { phone } });
    if (dupe) return conflict("Phone is already in use");
  }

  const user = await prisma.users.update({
    where: { id: params.id },
    data: {
      ...(full_name !== undefined ? { full_name: full_name.trim() } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(username !== undefined ? { username: username || null } : {}),
      ...(hired_at !== undefined ? { hired_at: hired_at ? new Date(hired_at) : null } : {}),
      updated_at: new Date(),
    },
    select: USER_SAFE_SELECT,
  });

  return NextResponse.json({ user: shapeUser(user) });
}

export async function DELETE(request, { params }) {
  const actor = await getCurrentUser(request);
  if (!actor) return unauthorized();
  if (!canManageUsers(actor)) return forbidden();

  if (actor.id === params.id) {
    return badRequest("You cannot delete your own account");
  }

  const existing = await loadScoped(actor, params.id);
  if (!existing) return notFound("User not found");

  // Soft delete on purpose: users.id is referenced (onDelete: NoAction) from
  // orders, payments, shifts, inventory_transactions, etc. A hard delete
  // would either fail on those FKs or silently orphan financial history.
  // Flip is_active instead; swap for prisma.users.delete(...) only if you've
  // migrated those references to onDelete: SetNull / Restrict as intended.
  await prisma.users.update({
    where: { id: params.id },
    data: { is_active: false, updated_at: new Date() },
  });

  return NextResponse.json({ success: true });
}
