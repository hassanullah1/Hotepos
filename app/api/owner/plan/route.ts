import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

/**
 * Resolve the hotel_id for the current user.
 *  - hotel_owner  → first row in hotel_owners
 *  - branch_manager / staff → users.branch_id → branches.hotel_id
 */
async function resolveHotelId(userId: string): Promise<string | null> {
  const ho = await prisma.hotel_owners.findFirst({
    where: { user_id: userId },
    select: { hotel_id: true },
  });
  if (ho?.hotel_id) return ho.hotel_id;

  const u = await prisma.users.findUnique({
    where: { id: userId },
    select: { branches: { select: { hotel_id: true } } },
  });
  return u?.branches?.hotel_id ?? null;
}

// GET /api/owner/plan
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hotelId = await resolveHotelId(user.id);
  if (!hotelId) return NextResponse.json({ plan: null });

  const hotel = await prisma.hotels.findUnique({
    where: { id: hotelId },
    select: {
      subscription_status: true,
      subscription_expires_at: true,
      subscription_plans: {
        select: {
          id: true,
          name: true,
          max_branches: true,
          max_pos_devices: true,
          price_monthly: true,
          is_rooms: true,
        },
      },
    },
  });
  if (!hotel) return NextResponse.json({ plan: null });

  const plan = hotel.subscription_plans ?? null;

  return NextResponse.json({
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          max_branches: plan.max_branches,
          max_pos_devices: plan.max_pos_devices,
          price_monthly: Number(plan.price_monthly),
          is_rooms: plan.is_rooms === true,
        }
      : null,
    subscription_status: hotel.subscription_status,
    subscription_expires_at: hotel.subscription_expires_at,
  });
}
