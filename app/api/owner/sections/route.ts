import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/owner/sections
 *
 * Returns the section keys unlocked by the current hotel's plan.
 *
 * - super_admin / admin        → { all: true }  (bypass)
 * - hotel_owner                → via hotel_owners.user_id
 * - branch_manager / staff     → via users.hotel_id
 */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleName: string | undefined = user.role ?? user.roles?.name;

  // Platform admins are not plan-gated
  if (roleName === "super_admin" || roleName === "admin") {
    return NextResponse.json({ all: true, section_keys: [], sections: [] });
  }

  // ── Resolve hotelId (role-agnostic) ────────────────────────────
  let hotelId: string | null = null;

  // 1. hotel_owners profile (if the user is an owner)
  const owner = await prisma.hotel_owners.findUnique({
    where: { user_id: user.id },
    select: { hotel_id: true },
  });
  hotelId = owner?.hotel_id ?? null;

  // 2. Fallback: users.hotel_id (branch_manager, staff…)
  if (!hotelId) {
    hotelId = user.hotel_id ?? null;
  }

  // 3. Last resort: re-read from DB (in case JWT is stale)
  if (!hotelId) {
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { hotel_id: true },
    });
    hotelId = dbUser?.hotel_id ?? null;
  }

  console.log(
    "[/api/owner/sections] user=%s role=%s hotelId=%s",
    user.id,
    roleName,
    hotelId,
  );

  if (!hotelId) {
    return NextResponse.json({ all: false, section_keys: [], sections: [] });
  }

  const hotel = await prisma.hotels.findUnique({
    where: { id: hotelId },
    select: {
      subscription_plans: {
        select: {
          sections: {
            where: { is_enabled: true },
            select: {
              config: true,
              sections: { select: { key: true, name: true, is_active: true } },
            },
          },
        },
      },
    },
  });

  const enabled = (hotel?.subscription_plans?.sections ?? [])
    .filter((s: any) => s.sections?.key && s.sections.is_active !== false)
    .map((s: any) => ({
      key: s.sections.key as string,
      name: s.sections.name as string,
      config: (s.config ?? {}) as Record<string, unknown>,
    }));

  console.log(
    "[/api/owner/sections] enabledKeys =",
    enabled.map((s) => s.key),
  );

  return NextResponse.json({
    all: false,
    section_keys: enabled.map((s) => s.key),
    sections: enabled,
  });
}
