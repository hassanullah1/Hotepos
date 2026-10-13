import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "8h";
import { cookies } from "next/headers";
if (!JWT_SECRET) {
  // Fail loudly at startup rather than silently signing tokens with `undefined`
  throw new Error("JWT_SECRET is not set in your environment (.env)");
}

export const AUTH_COOKIE_NAME = "auth_token";

export interface AuthTokenPayload {
  userId: string;
  roleId: string;
  roleName: string;
  hotelId: string | null;
  branchId: string | null;
}





/**
 * For server components / server actions only.
 * Reads the auth cookie from next/headers, no Request object needed.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies(); // async in Next 15+, sync-compatible via await
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = verifyToken(token);
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Same as getCurrentUser, but reads cookies from next/headers.
 * Use this in layouts and other server components.
 */
export async function getCurrentUserFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return null;
  }
  if (!payload.userId) return null;

  const user = await prisma.users.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      full_name: true,
      email: true,
      hotel_id: true,
      branch_id: true,
      is_active: true,
      roles: { select: { id: true, name: true, scope: true } },
    },
  });

  if (!user || !user.is_active) return null;
  return user;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET as string) as AuthTokenPayload;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function getAuthUser(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  let payload;
  try {
    payload = verifyToken(token); // your tokens sign `userId`, use the helper already here
  } catch (err) {
    return null;
  }

  if (!payload.userId) return null;

  try {
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      include: { roles: true }, // relation is `roles`, not `role`
    });
    return user;
  } catch (err) {
    return null;
  }
}

export function requireRole(user, allowedRoles) {
  if (!user) return false;
  return allowedRoles.includes(user.roles?.name); // `roles`, not `role`
}

export function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function extractToken(request) {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);
  const cookie = request.cookies.get(AUTH_COOKIE_NAME); // ← use the constant
  return cookie?.value || null;
}

export async function getCurrentUser(request) {
  const token = extractToken(request);
  if (!token) return null;

  let payload;
  try {
    payload = verifyToken(token); // uses your AuthTokenPayload shape
  } catch {
    return null;
  }

  if (!payload.userId) return null;

  const user = await prisma.users.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      full_name: true,
      email: true,
      hotel_id: true,
      branch_id: true,
      is_active: true,
      roles: { select: { id: true, name: true, scope: true } },
    },
  });

  if (!user || !user.is_active) return null;
  return user;
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** Can this actor open the user-management screens at all? */
export function canManageUsers(actor) {
  return ["platform", "hotel", "branch"].includes(actor.roles.scope);
}

/** Prisma `where` fragment restricting a query to what the actor may see. */

/** Can this actor assign `targetRole` to someone? */
export function canAssignRole(actor, targetRole) {
  if (actor.roles.scope === "platform") return true;
  if (actor.roles.scope === "hotel") return targetRole.scope !== "platform";
  if (actor.roles.scope === "branch") return targetRole.scope === "branch";
  return false;
}

/**
 * PATCH for lib/auth.ts
 * ----------------------
 * Replace the existing `scopeFilterForActor` export with this async version,
 * and add the `getOwnedHotelIds` helper alongside it. Both live in the same
 * file as your other auth helpers (getCurrentUser, canManageUsers, etc.)
 * since they already have `prisma` imported.
 */

/**
 * Every hotel_id an owner is linked to via hotel_owners.
 * (Not users.hotel_id — that column isn't reliably set for owner accounts.)
 */
export async function getOwnedHotelIds(actor) {
  const ownerProfiles = await prisma.hotel_owners.findMany({
    where: { user_id: actor.id },
    select: { hotel_id: true },
  });
  return ownerProfiles.map((p) => p.hotel_id);
}

/**
 * Prisma `where` fragment restricting a query to what the actor may see.
 * Now async: "hotel" scope resolves through hotel_owners instead of
 * trusting actor.hotel_id, which is unreliable for owner accounts.
 */
export async function scopeFilterForActor(actor) {
  if (actor.roles.scope === "platform") return {};

  if (actor.roles.scope === "hotel") {
    const hotelIds = await getOwnedHotelIds(actor);
    if (hotelIds.length === 0) return { id: "__none__" };
    return { hotel_id: { in: hotelIds } };
  }

  if (actor.roles.scope === "branch") {
    // Reliable directly off the users row for branch-scoped roles.
    return { branch_id: actor.branch_id };
  }

  return { id: "__none__" };
}
