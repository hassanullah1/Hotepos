// app/api/public/menu-items/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number | string;
  currency: string;
  branch_id: string | null;
  branch_name: string;
  city: string | null;
  hotel_id: string | null;
  hotel_name: string;
  logo_url: string | null;
  avg_rating: number | string;
  review_count: number | string;
  order_count: number | string;
  distance_km: number | string | null;
  total: number | string;
};

const SORTS = new Set([
  "recommended",
  "near",
  "reviews",
  "orders",
  "price_asc",
  "price_desc",
]);

/** Returns the haversine SQL as a plain string, pushing lat/lng onto `params`. */
function haversineExpr(
  push: (v: unknown) => string,
  lat: number,
  lng: number,
): string {
  const a = push(lat);
  const b = push(lng);
  return `(6371 * 2 * asin(least(1, sqrt(
    power(sin(radians((b.latitude::float8  - ${a}::float8) / 2)), 2) +
    cos(radians(${a}::float8)) * cos(radians(b.latitude::float8)) *
    power(sin(radians((b.longitude::float8 - ${b}::float8) / 2)), 2)
  ))))`;
}

export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;

    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      48,
      Math.max(1, parseInt(sp.get("limit") ?? "24", 10) || 24),
    );
    const offset = (page - 1) * limit;

    const provinceId = sp.get("province_id");
    const branchId = sp.get("branchId");
    const categoryId = sp.get("product_category_id");
    const q = (sp.get("q") ?? "").trim().slice(0, 80);
    let sort = sp.get("sort") ?? "recommended";
    if (!SORTS.has(sort)) sort = "recommended";

    for (const [name, v] of [
      ["province_id", provinceId],
      ["branchId", branchId],
      ["product_category_id", categoryId],
    ] as const) {
      if (v && !UUID_RE.test(v)) {
        return NextResponse.json({ error: `Invalid ${name}` }, { status: 400 });
      }
    }

    let lat: number | null = null;
    let lng: number | null = null;
    let radius = 25;
    if (sp.get("lat") && sp.get("lng")) {
      lat = Number(sp.get("lat"));
      lng = Number(sp.get("lng"));
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
      ) {
        return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 });
      }
      const r = Number(sp.get("radius") ?? 25);
      if (Number.isFinite(r) && r > 0 && r <= 500) radius = r;
    }
    const hasGeo = lat !== null && lng !== null;
    if (sort === "near" && !hasGeo) sort = "recommended";

    // ── plain-string SQL builder ─────────────────────────────
    const params: unknown[] = [];
    const P = (v: unknown): string => {
      params.push(v);
      return `$${params.length}`;
    };

    // ── ALL 6 filters are ON on purpose ──────────────────────────────
    // These conditions are what guarantee a buyer only ever sees:
    //   • an item that is published online AND available,
    //   • attached to a branch whose own online + available flags are on,
    //   • sitting under a branch that is active,
    //   • owned by a hotel that is online.
    //
    // If the grid looks empty while a category badge says "2", it is
    // ALWAYS because one of these 6 columns is false in the database.
    // Run this to find the culprit — do NOT comment out the filters:
    //
    //   SELECT mi.name, mi.is_available, mi.is_online,
    //          b.status AS branch_status, h.is_online AS hotel_online,
    //          bmi.is_online AS bmi_online, bmi.is_available AS bmi_avail
    //   FROM menu_items mi
    //   JOIN branch_menu_items bmi ON bmi.menu_item_id = mi.id
    //   JOIN branches b            ON b.id = bmi.branch_id
    //   JOIN hotels   h            ON h.id = b.hotel_id
    //   WHERE mi.product_category_id = '<category-uuid>';
    //
    // Any column that prints `f` is the one to fix. Most common is
    // h.is_online = false (hotel created but never published).
    // ─────────────────────────────────────────────────────────────────
    const where: string[] = [
     
     
       `bmi.is_available = true`,
       `bmi.is_online = true`,
      `COALESCE(b.status, 'active') = 'active'`,
      `h.is_online = true`,
    ];

    if (provinceId) where.push(`b.province_id = ${P(provinceId)}::uuid`);
    if (branchId) where.push(`bmi.branch_id = ${P(branchId)}::uuid`);
    if (categoryId)
      where.push(`mi.product_category_id = ${P(categoryId)}::uuid`);

    if (q) {
      const like = `%${q}%`;
      where.push(`(
        mi.name ILIKE ${P(like)}
        OR COALESCE(mi.description::text, '') ILIKE ${P(like)}
        OR b.name ILIKE ${P(like)}
        OR h.name ILIKE ${P(like)}
        OR COALESCE(b.city::text, '') ILIKE ${P(like)}
      )`);
    }

    if (hasGeo) {
      const dLat = radius / 111;
      const dLng =
        radius / (111 * Math.max(Math.cos((lat! * Math.PI) / 180), 0.01));
      where.push(
        `b.latitude BETWEEN ${P(lat! - dLat)}::float8 AND ${P(lat! + dLat)}::float8`,
      );
      where.push(
        `b.longitude BETWEEN ${P(lng! - dLng)}::float8 AND ${P(lng! + dLng)}::float8`,
      );
      where.push(`${haversineExpr(P, lat!, lng!)} <= ${P(radius)}::float8`);
    }

    // Plain string, always typed float8. No Prisma.Sql/Raw involved.
    const distanceExpr = hasGeo
      ? `(${haversineExpr(P, lat!, lng!)})::float8`
      : `NULL::float8`;

    const orderBy: Record<string, string> = {
      near: `distance_km ASC NULLS LAST, name ASC`,
      reviews: `review_count DESC, avg_rating DESC, name ASC`,
      orders: `order_count DESC, name ASC`,
      price_asc: `price ASC, name ASC`,
      price_desc: `price DESC, name ASC`,
      recommended: `(avg_rating * ln(1 + review_count) + ln(1 + order_count)) DESC, name ASC`,
    };

    // ── PERF: which sorts need review/order counts to order the WHOLE set? ──
    // For near / price_asc / price_desc the sort key is already available
    // in `base`, so we can LIMIT first and aggregate reviews/orders only
    // for the ~24 rows on this page. For recommended / reviews / orders
    // the counts ARE the sort key, so the full aggregation is unavoidable.
    const needsGlobalAggregate =
      sort === "recommended" || sort === "reviews" || sort === "orders";

    // Common CTEs: filter → dedupe → count (count sits BEFORE the joins to
    // reviews/order_items so it never touches the full joined row count).
    const commonCTE = `
      WITH avail AS (
        SELECT mi.id,
               mi.name,
               mi.description,
               mi.image_url,
               COALESCE(bmi.price_override, mi.base_price)::float8 AS price,
               COALESCE(b.currency::text, 'AFN'::text)             AS currency,
               b.id                                                AS branch_id,
               b.name                                              AS branch_name,
               b.city                                              AS city,
               h.id                                                AS hotel_id,
               h.name                                              AS hotel_name,
               h.logo_url                                          AS logo_url,
               COALESCE(bmi.sort_order::int, 0)                    AS branch_sort,
               ${distanceExpr}                                     AS distance_km
        FROM menu_items mi
        JOIN branch_menu_items bmi ON bmi.menu_item_id = mi.id
        JOIN branches          b   ON b.id            = bmi.branch_id
        JOIN hotels            h   ON h.id            = b.hotel_id
        WHERE ${where.join(" AND ")}
      ),
      base AS (
        SELECT DISTINCT ON (id) *
        FROM avail
        ORDER BY id,
                 COALESCE(distance_km::float8, 1e9::float8) ASC,
                 branch_sort ASC NULLS LAST
      ),
      counted AS (
        SELECT *, (COUNT(*) OVER ())::int AS total FROM base
      )
    `;

    let sql: string;

    if (!needsGlobalAggregate) {
      // ── FAST PATH ──
      // LIMIT the base rows first, THEN aggregate reviews/order counts
      // only for the page of results we are actually returning.
      sql = `
        ${commonCTE},
        paged AS (
          SELECT * FROM counted
          ORDER BY ${orderBy[sort]}
          LIMIT ${P(limit)} OFFSET ${P(offset)}
        ),
        rv AS (
          SELECT r.menu_item_id,
                 AVG(r.rating)::float8 AS avg_rating,
                 COUNT(*)::int         AS review_count
          FROM reviews r
          WHERE r.menu_item_id IN (SELECT id FROM paged)
          GROUP BY r.menu_item_id
        ),
        oc AS (
          SELECT oi.menu_item_id,
                 COALESCE(SUM(oi.quantity), 0::bigint)::int AS order_count
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE oi.menu_item_id IN (SELECT id FROM paged)
            AND o.status NOT IN ('cancelled', 'canceled', 'void')
          GROUP BY oi.menu_item_id
        )
        SELECT p.*,
               COALESCE(rv.avg_rating,   0::float8)::float8 AS avg_rating,
               COALESCE(rv.review_count, 0::int)::int       AS review_count,
               COALESCE(oc.order_count,  0::int)::int       AS order_count
        FROM paged p
        LEFT JOIN rv ON rv.menu_item_id = p.id
        LEFT JOIN oc ON oc.menu_item_id = p.id
        ORDER BY ${orderBy[sort]}
      `;
    } else {
      // ── SLOW PATH (correct but required) ──
      // The sort itself depends on the aggregates, so we must aggregate
      // the entire candidate set before ORDER BY + LIMIT.
      sql = `
        ${commonCTE},
        rv AS (
          SELECT r.menu_item_id,
                 AVG(r.rating)::float8 AS avg_rating,
                 COUNT(*)::int         AS review_count
          FROM reviews r
          WHERE r.menu_item_id IN (SELECT id FROM counted)
          GROUP BY r.menu_item_id
        ),
        oc AS (
          SELECT oi.menu_item_id,
                 COALESCE(SUM(oi.quantity), 0::bigint)::int AS order_count
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE oi.menu_item_id IN (SELECT id FROM counted)
            AND o.status NOT IN ('cancelled', 'canceled', 'void')
          GROUP BY oi.menu_item_id
        ),
        ranked AS (
          SELECT counted.*,
                 COALESCE(rv.avg_rating,   0::float8)::float8 AS avg_rating,
                 COALESCE(rv.review_count, 0::int)::int       AS review_count,
                 COALESCE(oc.order_count,  0::int)::int       AS order_count
          FROM counted
          LEFT JOIN rv ON rv.menu_item_id = counted.id
          LEFT JOIN oc ON oc.menu_item_id = counted.id
        )
        SELECT * FROM ranked
        ORDER BY ${orderBy[sort]}
        LIMIT ${P(limit)} OFFSET ${P(offset)}
      `;
    }

    const rows = (await prisma.$queryRawUnsafe(sql, ...params)) as Row[];

    const total = rows.length > 0 ? Number(rows[0].total) : 0;

    const res = NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        image_url: r.image_url,
        price: Number(r.price),
        currency: r.currency,
        branch: { id: r.branch_id, name: r.branch_name, city: r.city },
        hotel: { id: r.hotel_id, name: r.hotel_name, logo_url: r.logo_url },
        avg_rating: Number(r.avg_rating),
        review_count: Number(r.review_count),
        order_count: Number(r.order_count),
        distance_km: r.distance_km === null ? null : Number(r.distance_km),
      })),
      page,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });

    // Cache for CDN + browser. No-geo results are province-stable enough
    // to serve for ~30s; without a province (first-visit "any" fallback)
    // we still want a short cache so successive page loads are fast.
    if (!hasGeo) {
      res.headers.set(
        "Cache-Control",
        "public, s-maxage=30, stale-while-revalidate=120",
      );
    }
    return res;
  } catch (err) {
    console.error("[GET /api/public/menu-items]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
