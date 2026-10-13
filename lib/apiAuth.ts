import { NextRequest } from "next/server";
import { verifyToken, AuthTokenPayload } from "./auth";
import { prisma } from "./prisma";

/**
 * Pulls and verifies the Bearer token from the Authorization header.
 * Returns null if missing/invalid — never throws, so callers can
 * turn that into a clean 401 response.
 */
export async function getAuthUser(
  req: NextRequest,
): Promise<AuthTokenPayload | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export type PermissionCheckResult =
  | { authorized: true; payload: AuthTokenPayload }
  | { authorized: false; status: 401 | 403; message: string };

/**
 * Gate for any endpoint that requires a specific permission code.
 * super_admin always passes — the whole point of that role is
 * platform-wide access without per-permission bookkeeping.
 */
export async function requirePermission(
  req: NextRequest,
  permissionCode: string,
): Promise<PermissionCheckResult> {
  const payload = await getAuthUser(req);
  if (!payload) {
    return {
      authorized: false,
      status: 401,
      message: "Unauthorized — missing or invalid token",
    };
  }

  if (payload.roleName === "super_admin") {
    return { authorized: true, payload };
  }

  const grant = await prisma.role_permissions.findFirst({
    where: {
      role_id: payload.roleId,
      permissions: { code: permissionCode },
    },
  });

  if (!grant) {
    return {
      authorized: false,
      status: 403,
      message: `Forbidden — missing permission "${permissionCode}"`,
    };
  }

  return { authorized: true, payload };
}

/** Use when an endpoint just needs "any logged-in user", no specific permission. */
export async function requireAuth(
  req: NextRequest,
): Promise<PermissionCheckResult> {
  const payload = await getAuthUser(req);
  if (!payload) {
    return {
      authorized: false,
      status: 401,
      message: "Unauthorized — missing or invalid token",
    };
  }
  return { authorized: true, payload };
}
