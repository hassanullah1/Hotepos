// lib/require-rooms-plan.ts
import prisma from "@/lib/prisma";

/**
 * Returns true if the given hotel's plan includes the "rooms" feature.
 *
 * Feature gating in the current schema lives in `plan_sections`:
 *
 *   hotels.subscription_plan_id → subscription_plans.id
 *   plan_sections.plan_id       → subscription_plans.id
 *   plan_sections.section_id    → sections.id  (key = "rooms", "pos", ...)
 *   plan_sections.is_enabled    → boolean
 *
 * Behaviour:
 *   • no hotelId                         → false  (caller can't be trusted)
 *   • hotel has no plan assigned         → false
 *   • plan has no "rooms" section row    → false  (plan doesn't grant it)
 *   • plan has "rooms" row, is_enabled=F → false  (explicitly disabled)
 *   • plan has "rooms" row, is_enabled=T → true
 */
export async function hotelHasRoomsFeature(
  hotelId: string | null | undefined,
): Promise<boolean> {
  if (!hotelId) return false;

  const hotel = await prisma.hotels.findUnique({
    where: { id: hotelId },
    select: { subscription_plan_id: true },
  });

  if (!hotel?.subscription_plan_id) return false;

  const row = await prisma.plan_sections.findFirst({
    where: {
      plan_id: hotel.subscription_plan_id,
      sections: { key: "rooms" },
    },
    select: { is_enabled: true },
  });

  return row?.is_enabled === true;
}
