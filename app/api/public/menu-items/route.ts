// app/api/public/menu-items/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  currency: string;
  branch_id: string | null;
  branch_name: string;
  city: string | null;
  hotel_id: string | null;
  hotel_name: string;
  logo_url: string | null;
  avg_rating: number;
  review_count: number;
  order_count: number;
  distance_km: number | null;
  total: number;
};

const SORTS = new Set([
  "recommended",
  "near",
  "reviews",
  "orders",
  "price_asc",
  "price_desc",
]);

function haversine(lat: number, lng: number) {
  return Prisma.sql`(6371 * 2 * asin(least(1, sqrt(
    power(sin(radians((b.latitude::float8 - ${lat}::float8) / 2)), 2) +
    cos(radians(${lat}::float8)) * cos(radians(b.latitude::float8)) *
    power(sin(radians((b.longitude::float8 - ${lng}::float8) / 2)), 2)
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
    const q = (sp.get("q") ?? "").trim().slice(0, 80);
    let sort = sp.get("sort") ?? "recommended";
    if (!SORTS.has(sort)) sort = "recommended";

    for (const [name, v] of [
      ["province_id", provinceId],
      ["branchId", branchId],
    ] as const) {
      if (v && !UUID_RE.test(v)) {
        return NextResponse.json({ error: `Invalid ${name}` }, { status: 400 });
      }
    }

    // ---- location ----
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

    // ---- filters ----
    const where: Prisma.Sql[] = [
      Prisma.sql`mi.is_available = true`,
      Prisma.sql`mi.is_online = true`,
      Prisma.sql`h.is_online = true`,
    ];
    if (provinceId) where.push(Prisma.sql`b.province_id = ${provinceId}::uuid`);
    if (branchId) where.push(Prisma.sql`mi.branch_id = ${branchId}::uuid`);
    if (q) {
      const like = `%${q}%`;
      where.push(
        Prisma.sql`(mi.name ILIKE ${like} OR b.name ILIKE ${like} OR h.name ILIKE ${like} OR b.city ILIKE ${like})`,
      );
    }
    if (hasGeo) {
      // cheap bounding box first (index friendly), exact distance after
      const dLat = radius / 111;
      const dLng =
        radius / (111 * Math.max(Math.cos((lat! * Math.PI) / 180), 0.01));
      where.push(
        Prisma.sql`b.latitude BETWEEN ${lat! - dLat}::float8 AND ${lat! + dLat}::float8`,
      );
      where.push(
        Prisma.sql`b.longitude BETWEEN ${lng! - dLng}::float8 AND ${lng! + dLng}::float8`,
      );
      where.push(Prisma.sql`${haversine(lat!, lng!)} <= ${radius}::float8`);
    }

    const distance = hasGeo
      ? Prisma.sql`${haversine(lat!, lng!)}::float8`
      : Prisma.sql`NULL::float8`;

    // ORDER BY runs on the outer query, so plain column names are safe here
    const orderBy: Record<string, Prisma.Sql> = {
      near: Prisma.sql`distance_km ASC NULLS LAST, name ASC`,
      reviews: Prisma.sql`review_count DESC, avg_rating DESC, name ASC`,
      orders: Prisma.sql`order_count DESC, name ASC`,
      price_asc: Prisma.sql`price ASC, name ASC`,
      price_desc: Prisma.sql`price DESC, name ASC`,
      recommended: Prisma.sql`(avg_rating * ln(1 + review_count) + ln(1 + order_count)) DESC, name ASC`,
    };

    // ONE query: filter -> aggregate only matching dishes -> sort -> page + total
    const rows = await prisma.$queryRaw<Row[]>`
      WITH base AS (
        SELECT mi.id, mi.name, mi.description, mi.image_url,
               mi.price::float8 AS price,
               COALESCE(b.currency, 'AFN') AS currency,
               b.id AS branch_id, b.name AS branch_name, b.city,
               h.id AS hotel_id, h.name AS hotel_name, h.logo_url,
               ${distance} AS distance_km
        FROM menu_items mi
        JOIN branches b ON b.id = mi.branch_id
        JOIN hotels h ON h.id = b.hotel_id
        WHERE ${Prisma.join(where, " AND ")}
      ),
      rv AS (
        SELECT r.menu_item_id,
               AVG(r.rating)::float8 AS avg_rating,
               COUNT(*)::int AS review_count
        FROM reviews r
        WHERE r.menu_item_id IN (SELECT id FROM base)
        GROUP BY r.menu_item_id
      ),
      oc AS (
        SELECT oi.menu_item_id, COALESCE(SUM(oi.quantity), 0)::int AS order_count
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.menu_item_id IN (SELECT id FROM base)
          AND o.status NOT IN ('cancelled', 'canceled', 'void')
        GROUP BY oi.menu_item_id
      ),
      ranked AS (
        SELECT base.*,
               COALESCE(rv.avg_rating, 0)::float8 AS avg_rating,
               COALESCE(rv.review_count, 0)::int AS review_count,
               COALESCE(oc.order_count, 0)::int AS order_count,
               COUNT(*) OVER ()::int AS total
        FROM base
        LEFT JOIN rv ON rv.menu_item_id = base.id
        LEFT JOIN oc ON oc.menu_item_id = base.id
      )
      SELECT * FROM ranked
      ORDER BY ${orderBy[sort]}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = rows[0]?.total ?? 0;

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

    // location-based results are per-user, so only cache the generic ones
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
