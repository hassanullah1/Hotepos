import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE_NAME } from "./auth";
import { prisma } from "./prisma";

/**
 * Get the currently logged-in admin user from the request cookies.
 * Returns null if not logged in, token invalid, or user deactivated.
 * Use in Server Components, Server Actions, and Route Handlers.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;
  return user;
}

/**
 * Check whether a user object has one of the allowed roles.
 * Usage: requireRole(user, ["SUPERADMIN", "ADMIN"])
 */
export function requireRole(user, allowedRoles = []) {
  return Boolean(user && allowedRoles.includes(user.role));
}
