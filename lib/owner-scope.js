import prisma from "@/lib/prisma";

// Returns true if this user owns the given hotel.
export async function ownsHotel(userId, hotelId) {
  if (!hotelId) return false;
  const ho = await prisma.hotel_owners.findFirst({
    where: { user_id: userId, hotel_id: hotelId },
    select: { hotel_id: true },
  });
  return !!ho;
}

// Returns all hotel_ids owned by this user.
export async function getOwnerHotelIds(userId) {
  const rows = await prisma.hotel_owners.findMany({
    where: { user_id: userId },
    select: { hotel_id: true },
  });
  return rows.map((r) => r.hotel_id);
}

// Confirms a branch belongs to the given hotel_id.
// Caller is responsible for having already verified hotelId is owned.
export async function assertBranchInHotel(branchId, hotelId) {
  if (!branchId || !hotelId) return null;
  return prisma.branches.findFirst({
    where: { id: branchId, hotel_id: hotelId },
  });
}

export async function loadOwnedBranch(branchId, userId) {
  if (!branchId) return null;
  const branch = await prisma.branches.findUnique({ where: { id: branchId } });
  if (!branch) return null;

  const owns = await ownsHotel(userId, branch.hotel_id);
  return owns ? branch : null;
}

// Loads a staff user (users row with a STAFF_ROLES role) scoped to any
// hotel this owner actually owns — multi-hotel aware, unlike
// getOwnerHotelId + a single hotel_id comparison.
// Returns null if: staff doesn't exist, isn't attached to a branch,
// isn't a staff role, or belongs to a hotel this owner doesn't own.
export async function loadOwnedStaff(staffId, userId) {
  if (!staffId) return null;
  const staff = await prisma.users.findUnique({
    where: { id: staffId },
    include: { roles: true, branches: true },
  });
  if (!staff || !staff.branches) return null;
  if (!STAFF_ROLES.includes(staff.roles?.name)) return null;

  const owns = await ownsHotel(userId, staff.branches.hotel_id);
  return owns ? staff : null;
}

// Confirms a branch is one this user is allowed to manage — covers all
// three roles that can touch branch-level config (tables, menu, staff):
//   - super_admin: any branch
//   - branch_manager: only their own assigned branch (users.branch_id)
//   - hotel_owner (or anyone else): falls back to hotel ownership check
export async function assertManagedBranch(branchId, userId) {
  if (!branchId) return null;

  const branch = await prisma.branches.findUnique({ where: { id: branchId } });
  if (!branch) return null;

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { branch_id: true, roles: { select: { name: true } } },
  });
  if (!user) return null;

  if (user.roles.name === "super_admin") return branch;

  if (user.roles.name === "branch_manager") {
    return user.branch_id === branchId ? branch : null;
  }

  const owns = await ownsHotel(userId, branch.hotel_id);
  return owns ? branch : null;
}

// Confirms a branch exists and belongs to a hotel this user owns.
// Ownership is derived from the branch itself, not from a hotel_id the
// client claims — so it's correct for owners with multiple hotels and
// can't be spoofed by a mismatched hotel_id in the request.
export async function assertOwnedBranch(branchId, userId) {
  if (!branchId) return null;
  const branch = await prisma.branches.findUnique({ where: { id: branchId } });
  if (!branch) return null;
  const owns = await ownsHotel(userId, branch.hotel_id);
  if (!owns) return null;
  return branch;
}

// Confirms a branch belongs to a hotel this user actually owns.
// Pass the hotel_id the client is claiming to act on; this verifies
// ownership AND branch membership in one call.
export async function assertBranchInOwnedHotel(branchId, userId, hotelId) {
  const owns = await ownsHotel(userId, hotelId);
  if (!owns) return null;
  return prisma.branches.findFirst({
    where: { id: branchId, hotel_id: hotelId },
  });
}

// Kept for any other callers that still assume single-hotel ownership.
// Unchanged name/signature/return shape -> nothing else breaks.
// Prefer getOwnerHotelIds / ownsHotel for multi-hotel-aware code.
export async function getOwnerHotelId(userId) {
  const ho = await prisma.hotel_owners.findFirst({
    where: { user_id: userId },
    select: { hotel_id: true },
  });
  return ho?.hotel_id ?? null;
}

export const STAFF_ROLES = ["branch_manager", "waiter", "cashier", "kitchen"];
