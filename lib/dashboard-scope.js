import prisma from "@/lib/prisma";
import { getOwnerHotelIds, assertBranchInOwnedHotel } from "@/lib/owner-scope";

/**
 * Resolves which hotel(s) / branch(es) the current user is allowed to see
 * dashboard data for.
 *
 * - hotel_owner, no hotel_id given -> DEFAULT VIEW: every branch across
 *   EVERY hotel this owner has ("Total hotels / Total branches"). This is
 *   the landing state of the dashboard.
 * - hotel_owner, hotel_id given    -> every branch of that one hotel (or a
 *   single branch if branch_id is also given and it really belongs there).
 * - branch_manager -> locked to their own branch_id. hotel_id/branch_id
 *   query params are IGNORED for this role so a manager can never read
 *   another branch's numbers by editing the URL.
 *
 * Returns either:
 *   { error: string, status: number }
 * or:
 *   {
 *     role,
 *     hotelId,            // null when viewing "all hotels"
 *     ownedHotelIds,
 *     hotels: [{id, name}],                     // for the hotel switcher
 *     branches: [{id, name, hotel_id}],          // every switchable branch in the current view
 *     branchIds: [uuid, ...],                    // branches actually being queried right now
 *     selectedBranchId: uuid | null,
 *     viewMode: "all" | "hotel" | "branch" | "manager",
 *   }
 */
export async function resolveDashboardScope(user, { hotelId, branchId } = {}) {
  const dbUser = await prisma.users.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      hotel_id: true,
      branch_id: true,
      roles: { select: { name: true } },
    },
  });

  if (!dbUser) return { error: "User not found", status: 404 };

  const role = dbUser.roles?.name;

  // ---------------- Hotel Owner ----------------
  if (role === "hotel_owner") {
    const ownedHotelIds = await getOwnerHotelIds(dbUser.id);
    if (!ownedHotelIds || ownedHotelIds.length === 0) {
      return { error: "No hotel found for this owner", status: 404 };
    }

    if (hotelId && !ownedHotelIds.includes(hotelId)) {
      return { error: "Forbidden", status: 403 };
    }

    const hotels = await prisma.hotels.findMany({
      where: { id: { in: ownedHotelIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // No hotel_id -> aggregate across every hotel this owner has.
    const viewHotelIds = hotelId ? [hotelId] : ownedHotelIds;

    const branchesInView = await prisma.branches.findMany({
      where: { hotel_id: { in: viewHotelIds } },
      select: { id: true, name: true, hotel_id: true },
      orderBy: { name: "asc" },
    });

    let branchIds = branchesInView.map((b) => b.id);
    let selectedBranchId = null;
    let viewMode = hotelId ? "hotel" : "all";

    if (branchId) {
      const match = branchesInView.find((b) => b.id === branchId);
      if (!match) return { error: "Branch not found", status: 404 };
      const verified = await assertBranchInOwnedHotel(
        branchId,
        dbUser.id,
        match.hotel_id,
      );
      if (!verified) return { error: "Forbidden", status: 403 };
      branchIds = [branchId];
      selectedBranchId = branchId;
      viewMode = "branch";
    }

    return {
      role,
      hotelId: hotelId || null,
      ownedHotelIds,
      hotels,
      branches: branchesInView,
      branchIds,
      selectedBranchId,
      viewMode,
    };
  }

  // ---------------- Branch Manager ----------------
  if (role === "branch_manager") {
    if (!dbUser.branch_id) {
      return { error: "No branch assigned to this manager", status: 404 };
    }

    const branch = await prisma.branches.findUnique({
      where: { id: dbUser.branch_id },
      select: { id: true, name: true, hotel_id: true },
    });
    if (!branch) return { error: "Assigned branch not found", status: 404 };

    return {
      role,
      hotelId: branch.hotel_id,
      ownedHotelIds: [branch.hotel_id],
      hotels: [],
      branches: [
        { id: branch.id, name: branch.name, hotel_id: branch.hotel_id },
      ],
      branchIds: [branch.id],
      selectedBranchId: branch.id,
      viewMode: "manager",
    };
  }

  return { error: "Forbidden", status: 403 };
}
