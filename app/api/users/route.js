import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  unauthorized,
  forbidden,
  canManageUsers,
  scopeFilterForActor, // now async — see auth-scope-filter-patch.js
  getOwnedHotelIds, // new helper — see auth-scope-filter-patch.js
  canAssignRole,
} from "@/lib/auth";
import {
  badRequest,
  conflict,
  parseJson,
  USER_SAFE_SELECT,
  shapeUser,
} from "@/lib/api-utils";

export async function GET(request) {
  const actor = await getCurrentUser(request);
  if (!actor) return unauthorized();
  if (!canManageUsers(actor)) return forbidden();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const roleId = searchParams.get("role_id");
  const branchId = searchParams.get("branch_id");
  const status = searchParams.get("status"); // "active" | "inactive"
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("page_size") || "50", 10)),
  );

  const where = {
    ...(await scopeFilterForActor(actor)),
    ...(roleId ? { role_id: roleId } : {}),
    ...(branchId ? { branch_id: branchId } : {}),
    ...(status ? { is_active: status === "active" } : {}),
    ...(search
      ? {
          OR: [
            { full_name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      select: USER_SAFE_SELECT,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.users.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map(shapeUser),
    total,
    page,
    page_size: pageSize,
  });
}

export async function POST(request) {
  const actor = await getCurrentUser(request);
  if (!actor) return unauthorized();
  if (!canManageUsers(actor)) return forbidden();

  const body = await parseJson(request);
  if (!body) return badRequest("Invalid JSON body");

  const {
    full_name,
    email,
    phone,
    username,
    password,
    pin_code,
    role_id,
    hotel_id,
    branch_id,
    hired_at,
  } = body;

  if (!full_name?.trim()) return badRequest("full_name is required");
  if (!role_id) return badRequest("role_id is required");
  if (!password && !pin_code)
    return badRequest("Provide a password or a pin_code");
  if (password && password.length < 8)
    return badRequest("Password must be at least 8 characters");

  const role = await prisma.roles.findUnique({ where: { id: role_id } });
  if (!role) return badRequest("Invalid role_id");
  if (!canAssignRole(actor, role))
    return forbidden("You are not allowed to assign this role");

  // Non-platform actors can only create users inside their own hotel/branch,
  // regardless of what the client sent.
  let effectiveHotelId = hotel_id || null;
  let effectiveBranchId = branch_id || null;

  if (actor.roles.scope === "hotel") {
    // Resolve the owner's real hotel(s) via hotel_owners — actor.hotel_id
    // isn't reliably set for owner accounts.
    const ownedHotelIds = await getOwnedHotelIds(actor);
    if (ownedHotelIds.length === 0) {
      return forbidden("No hotel is linked to this account");
    }
    // If the client sent a hotel_id, it must be one this owner actually owns.
    effectiveHotelId =
      hotel_id && ownedHotelIds.includes(hotel_id)
        ? hotel_id
        : ownedHotelIds[0];
  } else if (actor.roles.scope === "branch") {
    effectiveHotelId = actor.hotel_id;
    effectiveBranchId = actor.branch_id;
  }

  if (role.scope === "branch" && !effectiveBranchId) {
    return badRequest("branch_id is required for a branch-scoped role");
  }

  if (email) {
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) return conflict("Email is already in use");
  }
  if (phone) {
    const existing = await prisma.users.findUnique({ where: { phone } });
    if (existing) return conflict("Phone is already in use");
  }

  const password_hash = password ? await bcrypt.hash(password, 10) : null;

  const user = await prisma.users.create({
    data: {
      full_name: full_name.trim(),
      email: email || null,
      phone: phone || null,
      username: username || null,
      password_hash,
      pin_code: pin_code || null,
      role_id,
      hotel_id: effectiveHotelId,
      branch_id: effectiveBranchId,
      hired_at: hired_at ? new Date(hired_at) : null,
    },
    select: USER_SAFE_SELECT,
  });

  return NextResponse.json({ user: shapeUser(user) }, { status: 201 });
}
