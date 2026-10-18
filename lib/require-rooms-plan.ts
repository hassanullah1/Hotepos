import prisma from "@/lib/prisma";

/**
 * Returns true if the given hotel's plan includes the rooms feature.
 * Used by API routes to enforce the plan gate.
 */
export async function hotelHasRoomsFeature(
  hotelId: string | null | undefined,
): Promise<boolean> {
  if (!hotelId) return false;
  const hotel = await prisma.hotels.findUnique({
    where: { id: hotelId },
    select: { subscription_plans: { select: { is_rooms: true } } },
  });
  return hotel?.subscription_plans?.is_rooms === true;
}
