import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n =
    typeof v === "number"
      ? v
      : Number((v as { toString(): string }).toString());
  return Number.isFinite(n) ? n : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const branch = await prisma.branches.findFirst({
    where: {
      id,
      OR: [{ status: "active" }, { status: null }],
      hotels: { is_online: true },
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      phone: true,
      latitude: true,
      longitude: true,
      currency: true,
      opening_time: true,
      closing_time: true,
      hotel_id: true,
      hotels: {
        select: {
          id: true,
          name: true,
          logo_url: true,
          delivery_type: true,
        },
      },
    },
  });

  if (!branch) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // `not: false` includes rows where is_active is NULL, which older
  // records can still have even though the schema default is true.
  const categories = await prisma.menu_categories.findMany({
    where: {
      hotel_id: branch.hotel_id,
      is_active: { not: false },
    },
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, sort_order: true },
  });

  const categoryIds = categories.map((c) => c.id);

  // ── Counts match /api/public/menu-items exactly:
  //    bmi.is_online, bmi.is_available. NO mi.is_online / mi.is_available.
  //    If you add filters to menu-items later, add them here too.
  // ──
  const countsRaw = (
    categoryIds.length
      ? await prisma.$queryRawUnsafe(
          `SELECT mi.category_id,
                  COUNT(DISTINCT bmi.menu_item_id)::bigint AS cnt
           FROM branch_menu_items bmi
           JOIN menu_items mi ON mi.id = bmi.menu_item_id
           WHERE bmi.branch_id = $1::uuid
             AND bmi.is_online = true
             AND bmi.is_available = true
             AND mi.category_id = ANY($2::uuid[])
           GROUP BY mi.category_id`,
          branch.id,
          categoryIds,
        )
      : []
  ) as Array<{ category_id: string; cnt: bigint }>;

  const counts: Record<string, number> = {};
  for (const row of countsRaw) {
    counts[row.category_id] = Number(row.cnt);
  }

  const cats: Array<{ id: string; name: string; item_count: number }> =
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      item_count: counts[c.id] ?? 0,
    }));

  const uncatRaw = (await prisma.$queryRawUnsafe(
    `SELECT COUNT(DISTINCT bmi.menu_item_id)::bigint AS cnt
     FROM branch_menu_items bmi
     JOIN menu_items mi ON mi.id = bmi.menu_item_id
     WHERE bmi.branch_id = $1::uuid
       AND bmi.is_online = true
       AND bmi.is_available = true
       AND mi.category_id IS NULL`,
    branch.id,
  )) as Array<{ cnt: bigint }>;

  const uncatCount = Number(uncatRaw[0]?.cnt ?? 0);
  if (uncatCount > 0) {
    cats.push({
      id: "__uncategorized__",
      name: "Other",
      item_count: uncatCount,
    });
  }

  return NextResponse.json({
    branch: {
      id: branch.id,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      latitude: num(branch.latitude),
      longitude: num(branch.longitude),
      currency: branch.currency || "AFN",
      opening_time: branch.opening_time,
      closing_time: branch.closing_time,
      hotels: branch.hotels || null,
      delivery_type: branch.hotels?.delivery_type ?? "none",
    },
    categories: cats,
  });
}
