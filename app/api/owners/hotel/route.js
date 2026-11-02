import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getCurrentUser,
  requireRole,
  unauthorized,
  forbidden,
} from "@/lib/auth";

/**
 * GET /api/owners/hotel
 * GET /api/owners/hotel?hotelId=<uuid>
 *
 * Returns every hotel linked to the current owner (via hotel_owners),
 * plus the full details + branches for the selected one.
 */
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return unauthorized();
  if (!requireRole(user, ["hotel_owner"])) return forbidden();

  const ownerProfiles = await prisma.hotel_owners.findMany({
    where: { user_id: user.id },
  });

  if (ownerProfiles.length === 0) {
    return NextResponse.json(
      { error: "No hotel is linked to this account" },
      { status: 404 },
    );
  }

  const ownedHotelIds = ownerProfiles.map((p) => p.hotel_id);

  const requestedHotelId = new URL(request.url).searchParams.get("hotelId");
  const selectedHotelId =
    requestedHotelId && ownedHotelIds.includes(requestedHotelId)
      ? requestedHotelId
      : ownedHotelIds[0];

  const selectedOwnerProfile = ownerProfiles.find(
    (p) => p.hotel_id === selectedHotelId,
  );

  try {
    const hotelsList = await prisma.hotels.findMany({
      where: { id: { in: ownedHotelIds } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });

    const hotel = await prisma.hotels.findUnique({
      where: { id: selectedHotelId },
      include: { subscription_plans: true },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const branchRows = await prisma.branches.findMany({
      where: { hotel_id: hotel.id },
      orderBy: { created_at: "asc" },
      include: {
        _count: {
          select: {
            users: true,
            dining_tables: true,
            branch_menu_items: true, // ← FIXED (was menu_items)
          },
        },
      },
    });

    const branches = branchRows.map((b) => {
      const { _count, ...rest } = b;
      return {
        ...rest,
        staff_count: _count.users,
        table_count: _count.dining_tables,
        menu_item_count: _count.branch_menu_items, // ← FIXED (was _count.menu_items)
      };
    });

    return NextResponse.json({
      hotels: hotelsList,
      selectedHotelId: hotel.id,
      hotel: {
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        logo_url: hotel.logo_url,
        subscription_plan: hotel.subscription_plans,
        subscription_status: hotel.subscription_status,
        subscription_expires_at: hotel.subscription_expires_at, // ← added: PlanCard needs this
        verification_status: hotel.verification_status, // ← added: status pill needs this
        address: selectedOwnerProfile?.address ?? null,
        hesabpay_account_number:
          selectedOwnerProfile?.hesabpay_account_number ?? null, // ← added: form field needs this
      },
      branches,
    });
  } catch (err) {
    console.error("[owners/hotel] load failed:", err); // ← actually log it
    return NextResponse.json(
      { error: err.message || "Failed to load hotel" },
      { status: 500 },
    );
  }
}
