import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

const ALLOWED_ROLES = ["hotel_owner", "branch_manager"];

/**
 * Server-side guard for every /admin/rooms/* page.
 * Blocks access when:
 *   - not logged in                    → /hotel/login
 *   - role isn't hotel_owner/manager   → /admin
 *   - user has no hotel in scope       → /admin
 *   - the hotel's plan has is_rooms=false → /admin
 *
 * Because this runs in a server component, the user never receives
 * the page's HTML when they shouldn't — no way to bypass with
 * dev tools or by hitting the URL directly.
 */
export default async function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserFromCookies();
  if (!user) redirect("/hotel/login");

  const roleName = user.roles?.name ?? null;

  // Super-admins are allowed but not typical; adjust if your policy differs.
  const isExempt = roleName === "super_admin" || roleName === "admin";

  if (!isExempt && !ALLOWED_ROLES.includes(roleName ?? "")) {
    redirect("/admin");
  }

  // Super-admin bypasses the plan check
  if (!isExempt) {
    // Resolve the user's hotel
    let hotelId: string | null = null;

    if (roleName === "hotel_owner") {
      const ho = await prisma.hotel_owners.findFirst({
        where: { user_id: user.id },
        select: { hotel_id: true },
      });
      hotelId = ho?.hotel_id ?? null;
    } else {
      // branch_manager
      const u = await prisma.users.findUnique({
        where: { id: user.id },
        select: { branches: { select: { hotel_id: true } } },
      });
      hotelId = u?.branches?.hotel_id ?? null;
    }

    if (!hotelId) redirect("/admin");

    const hotel = await prisma.hotels.findUnique({
      where: { id: hotelId },
      select: { subscription_plans: { select: { is_rooms: true } } },
    });

    const planHasRooms = hotel?.subscription_plans?.is_rooms === true;
    if (!planHasRooms) redirect("/admin");
  }

  return children;
}
