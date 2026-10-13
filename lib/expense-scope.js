import prisma from "@/lib/prisma";

/**
 * Resolves the authenticated user's scope for expense-related endpoints.
 *
 * hotel_owner  -> may act on any hotel they own; must specify hotel_id +
 *                 branch_id on every request (hotelIds is the allow-list).
 * branch_manager -> locked to their own branch. hotelId/branchId are fixed
 *                    here and MUST NOT be overridable by client input.
 * anything else -> not allowed to touch expenses (returns null).
 */
export async function getExpenseScope(userId) {
  const me = await prisma.users.findUnique({
    where: { id: userId },
    include: { roles: true, branches: true },
  });
  if (!me) return null;

  const roleName = me.roles?.name;

  if (roleName === "hotel_owner") {
    const owned = await prisma.hotel_owners.findMany({
      where: { user_id: userId },
      select: { hotel_id: true },
    });
    return {
      role: "hotel_owner",
      hotelIds: owned.map((o) => o.hotel_id),
      hotelId: null,
      branchId: null,
    };
  }

  if (roleName === "branch_manager") {
    if (!me.branch_id || !me.branches) return null;
    return {
      role: "branch_manager",
      hotelIds: [me.branches.hotel_id],
      hotelId: me.branches.hotel_id,
      branchId: me.branch_id,
    };
  }

  // waiter, cashier, kitchen, super_admin, etc. — no expense access here.
  return null;
}

/**
 * Confirms a branch belongs to a hotel this scope may touch, and — for
 * branch_managers — silently ignores any client-supplied hotel/branch and
 * substitutes their own. This is the enforcement point that makes it
 * impossible for a branch manager to log an expense against another branch.
 */
export async function resolveBranchForScope(scope, requestedHotelId, requestedBranchId) {
  if (scope.role === "branch_manager") {
    return { hotelId: scope.hotelId, branchId: scope.branchId };
  }

  if (!requestedHotelId || !scope.hotelIds.includes(requestedHotelId)) return null;
  if (!requestedBranchId) return null;

  const branch = await prisma.branches.findUnique({ where: { id: requestedBranchId } });
  if (!branch || branch.hotel_id !== requestedHotelId) return null;

  return { hotelId: requestedHotelId, branchId: requestedBranchId };
}
