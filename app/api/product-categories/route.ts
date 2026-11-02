// app/api/public/product-categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CategoryRow = {
  id: string;
  key: string;
  name: string;
  icon: string | null;
  image_url: string | null;
  sort_order: number | null;
  item_count: number | string;
};

type TotalRow = { total: number | string };

export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;
    const provinceId = sp.get("province_id");

    if (provinceId && !UUID_RE.test(provinceId)) {
      return NextResponse.json(
        { error: "Invalid province_id" },
        { status: 400 },
      );
    }

    // ── Params + WHERE clause ────────────────────────────────────────
    // These 6 filters are IDENTICAL to /api/public/menu-items/route.ts.
    // If you ever change one file, change the other. That is what
    // guarantees the badge count and the grid length are the same number.
    const params: unknown[] = [];
    const P = (v: unknown): string => {
      params.push(v);
      return `$${params.length}`;
    };

    const where: string[] = [
      `mi.is_available = true`,
      `mi.is_online = true`,
      `bmi.is_online = true`,
      `bmi.is_available = true`,
      `b.status = 'active'`,
      `h.is_online = true`,
    ];
    if (provinceId) where.push(`b.province_id = ${P(provinceId)}::uuid`);
    const whereClause = where.join(" AND ");

    // ── Per-category counts ──────────────────────────────────────────
    // LEFT JOIN from product_categories, so categories with 0 matching
    // items still appear (count = 0) instead of vanishing from the bar.
    const categoriesSql = `
      WITH available AS (
        SELECT DISTINCT
               mi.id                AS menu_item_id,
               mi.product_category_id
        FROM menu_items mi
        JOIN branch_menu_items bmi ON bmi.menu_item_id = mi.id
        JOIN branches          b   ON b.id            = bmi.branch_id
        JOIN hotels            h   ON h.id            = b.hotel_id
        WHERE ${whereClause}
          AND mi.product_category_id IS NOT NULL
      )
      SELECT
        pc.id,
        pc.key,
        pc.name,
        pc.icon,
        pc.image_url,
        pc.sort_order,
        COALESCE(cnt.item_count, 0)::int AS item_count
      FROM product_categories pc
      LEFT JOIN (
        SELECT product_category_id,
               COUNT(DISTINCT menu_item_id) AS item_count
        FROM available
        GROUP BY product_category_id
      ) cnt ON cnt.product_category_id = pc.id
      WHERE pc.is_active = true
      ORDER BY pc.sort_order ASC NULLS LAST, pc.name ASC
    `;

    // ── Total for the "All" chip ─────────────────────────────────────
    // Includes items with NULL product_category_id, because clicking
    // "All" in the grid drops the category filter — so those items
    // appear on the grid too. Matching totals keeps the number honest.
    const totalSql = `
      SELECT COUNT(DISTINCT mi.id)::int AS total
      FROM menu_items mi
      JOIN branch_menu_items bmi ON bmi.menu_item_id = mi.id
      JOIN branches          b   ON b.id            = bmi.branch_id
      JOIN hotels            h   ON h.id            = b.hotel_id
      WHERE ${whereClause}
    `;

    const [categories, totals] = await Promise.all([
      prisma.$queryRawUnsafe(categoriesSql, ...params) as Promise<
        CategoryRow[]
      >,
      prisma.$queryRawUnsafe(totalSql, ...params) as Promise<TotalRow[]>,
    ]);

    const total_items = totals.length > 0 ? Number(totals[0].total) : 0;

    const res = NextResponse.json({
      categories: categories.map((r) => ({
        id: r.id,
        key: r.key,
        name: r.name,
        icon: r.icon,
        image_url: r.image_url,
        item_count: Number(r.item_count),
      })),
      total_items,
    });

    // Categories change slowly — cache 2 min, serve stale for 10.
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=600",
    );
    return res;
  } catch (err) {
    console.error("[GET /api/public/product-categories]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
