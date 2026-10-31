import prisma from "@/lib/prisma";

export async function getUserSections(user: {
  id: string;
  role?: string;
  roles?: { name?: string };
  hotel_id?: string | null;
}): Promise<Set<string> | null> {
  const roleName = user.role ?? user.roles?.name;

  // Platform admins bypass
  if (roleName === "super_admin" || roleName === "admin") {
    return null;
  }

  let hotelId: string | null = null;

  const owner = await prisma.hotel_owners.findUnique({
    where: { user_id: user.id },
    select: { hotel_id: true },
  });
  hotelId = owner?.hotel_id ?? null;

  if (!hotelId) hotelId = user.hotel_id ?? null;

  if (!hotelId) {
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { hotel_id: true },
    });
    hotelId = dbUser?.hotel_id ?? null;
  }

  if (!hotelId) return new Set();

  const hotel = await prisma.hotels.findUnique({
    where: { id: hotelId },
    select: {
      subscription_plans: {
        select: {
          sections: {
            where: { is_enabled: true },
            select: { sections: { select: { key: true, is_active: true } } },
          },
        },
      },
    },
  });

  const keys = (hotel?.subscription_plans?.sections ?? [])
    .filter((s: any) => s.sections?.key && s.sections.is_active !== false)
    .map((s: any) => s.sections.key as string);

  return new Set(keys);
}
