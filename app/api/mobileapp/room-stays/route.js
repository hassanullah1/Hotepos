import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /mobileapp/room-stays?status=active[&branch_id=<uuid>]
 *
 * Same shape the web app uses at /api/owners/room-stays.
 * Mobile waiters can only see their own branch; owners/admins
 * can pass ?branch_id for multi-branch hotels.
 */
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "active";
  const requestedBranchId = searchParams.get("branch_id");

  const branchId = requestedBranchId || user.branch_id;
  if (!branchId) {
    return NextResponse.json(
      { error: "No branch for this user. Pass ?branch_id=<uuid>." },
      { status: 400 },
    );
  }

  const branch = await prisma.branches.findUnique({
    where: { id: branchId },
    select: { id: true, hotel_id: true },
  });
  if (!branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  const isOwnerOfBranch = user.hotel_id && user.hotel_id === branch.hotel_id;
  const isAssignedToBranch = user.branch_id === branchId;
  const isAdmin = ["super_admin", "admin"].includes(user.roles?.name);

  if (!isAdmin && !isOwnerOfBranch && !isAssignedToBranch) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stays = await prisma.room_stays.findMany({
    where: { branch_id: branchId, status },
    include: {
      rooms: { select: { id: true, room_number: true, floor: true } },
      customers: { select: { id: true, full_name: true, phone: true } },
    },
    orderBy: { created_at: "desc" },
    take: 200,
  });

  return NextResponse.json(
    {
      stays: stays.map((s) => ({
        id: s.id,
        branch_id: s.branch_id,
        status: s.status,
        guest_name: s.guest_name,
        room: s.rooms,
        customer: s.customers,
        rent_total: Number(s.rent_total ?? 0),
        orders_total: Number(s.orders_total ?? 0),
        grand_total: Number(s.grand_total ?? 0),
        created_at: s.created_at,
      })),
    },
    { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } },
  );
}
