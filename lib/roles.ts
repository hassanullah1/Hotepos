export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "ADMIN",
  MANAGER: "branch_manager",
  STAFF: "STAFF",
  HOTEL_OWNER: "hotel_owner",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function hasRole(
  userRole: string | null | undefined,
  allowedRoles: Role[],
): boolean {
  if (!userRole) return false;

  return allowedRoles.includes(userRole as Role);
}

export function isAdmin(role: string | null | undefined) {
  return hasRole(role, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
}

export function isSuperAdmin(role: string | null | undefined) {
  return role === ROLES.SUPER_ADMIN;
}

export function isManager(role: string | null | undefined) {
  return hasRole(role, [ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]);
}
