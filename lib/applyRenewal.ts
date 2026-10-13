import prisma from "@/lib/prisma";

/**
 * Renewal ref format:  renew_<hotelId>_<planId>_<months>_<timestampMs>
 * Underscore separator, no colons. UUIDs contain dashes but never
 * underscores, so splitting on "_" is unambiguous.
 */
export function buildRenewalRef(
  hotelId: string,
  planId: string,
  months: number,
) {
  return `renew_${hotelId}_${planId}_${months}_${Date.now()}`;
}

export type RenewalResult =
  | {
      ok: true;
      alreadyApplied: boolean;
      hotel_id: string;
      plan_id: string;
      months: number;
      new_expiry: string;
    }
  | { ok: false; error: string; status?: number };

export async function applyRenewalFromRef(
  ref: string,
  transactionId?: string | null,
): Promise<RenewalResult> {
  const parts = ref.split("_");
  if (parts.length !== 5 || parts[0] !== "renew") {
    return { ok: false, error: "BAD_REF", status: 400 };
  }
  const [, hotelId, planId, monthsStr] = parts;
  const months = Number(monthsStr);
  if (!hotelId || !planId || !Number.isFinite(months) || months < 1) {
    return { ok: false, error: "BAD_REF", status: 400 };
  }

  const hotel = await prisma.hotels.findUnique({
    where: { id: hotelId },
    select: {
      id: true,
      subscription_expires_at: true,
      last_renewal_ref: true,
    },
  });
  if (!hotel) return { ok: false, error: "HOTEL_NOT_FOUND", status: 404 };

  // Idempotent — same ref means this exact payment was already applied
  if (hotel.last_renewal_ref === ref) {
    return {
      ok: true,
      alreadyApplied: true,
      hotel_id: hotel.id,
      plan_id: planId,
      months,
      new_expiry:
        hotel.subscription_expires_at?.toISOString() ||
        new Date().toISOString(),
    };
  }

  // Eligibility re-check (in case hotel grew past the plan since checkout)
  const plan = await prisma.subscription_plans.findUnique({
    where: { id: planId },
    select: { max_branches: true, max_pos_devices: true, name: true },
  });
  if (!plan) return { ok: false, error: "PLAN_NOT_FOUND", status: 404 };

  const branchCount = await prisma.branches.count({
    where: { hotel_id: hotel.id },
  });
  const posCount = await prisma.pos_devices.count({
    where: { branches: { hotel_id: hotel.id }, is_active: true },
  });

  if (plan.max_branches != null && branchCount > plan.max_branches) {
    return { ok: false, error: "PLAN_TOO_SMALL_BRANCHES", status: 400 };
  }
  if (plan.max_pos_devices != null && posCount > plan.max_pos_devices) {
    return { ok: false, error: "PLAN_TOO_SMALL_POS", status: 400 };
  }

  const now = new Date();
  const currentExpiry = hotel.subscription_expires_at
    ? new Date(hotel.subscription_expires_at)
    : null;

  const base =
    currentExpiry && currentExpiry.getTime() > now.getTime()
      ? currentExpiry
      : now;

  const newExpiry = new Date(base);
  newExpiry.setMonth(newExpiry.getMonth() + months);

  try {
    await prisma.hotels.update({
      where: { id: hotel.id },
      data: {
        subscription_status: "active",
        subscription_expires_at: newExpiry,
        subscription_plan_id: planId,
        last_renewal_ref: ref,
      },
    });

    return {
      ok: true,
      alreadyApplied: false,
      hotel_id: hotel.id,
      plan_id: planId,
      months,
      new_expiry: newExpiry.toISOString(),
    };
  } catch (err) {
    console.error("applyRenewalFromRef failed:", err);
    return { ok: false, error: "APPLY_FAILED", status: 500 };
  }
}
