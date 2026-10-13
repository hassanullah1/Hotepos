import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EARTH_KM = 6371;
const toRad = (d: number) => (d * Math.PI) / 180;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
}

function sqlEscape(s: string) {
  return s.replace(/'/g, "''");
}

type RawRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  branch_id: string;
  b_id: string;
  b_name: string;
  b_city: string | null;
  b_latitude: number | null;
  b_longitude: number | null;
  b_currency: string | null;
  h_id: string;
  h_name: string;
  h_logo_url: string | null;
  avg_rating: number;
  review_count: number;
  order_count: number;
  distance_km?: number | null;
};

function shape(r: RawRow) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    image_url: r.image_url,
    price: Number(r.price),
    currency: r.b_currency || "AFN",
    branch: {
      id: r.b_id,
      name: r.b_name,
      city: r.b_city,
      latitude: r.b_latitude,
      longitude: r.b_longitude,
    },
    hotel: {
      id: r.h_id,
      name: r.h_name,
      logo_url: r.h_logo_url,
    },
    avg_rating: r.avg_rating ? +Number(r.avg_rating).toFixed(1) : 0,
    review_count: Number(r.review_count) || 0,
    order_count: Number(r.order_count) || 0,
    distance_km:
      r.distance_km === null || r.distance_km === undefined
        ? null
        : +Number(r.distance_km).toFixed(2),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = (searchParams.get("q") || "").trim();
  const sort = searchParams.get("sort") || "recommended";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(
    60,
    Math.max(1, Number(searchParams.get("limit") || 24)),
  );
  const skip = (page - 1) * limit;

  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");
  const lat = latRaw !== null ? Number(latRaw) : NaN;
  const lng = lngRaw !== null ? Number(lngRaw) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const radiusKm = Math.min(
    100,
    Math.max(0.5, Number(searchParams.get("radius") || 25)),
  );

  // -----------------------------------------------------------------
  // NEAR ME
  // -----------------------------------------------------------------
  if (sort === "near" && hasCoords) {
    const distanceExpr = `
      (
        2 * ${EARTH_KM} * ASIN(SQRT(
          POWER(SIN(RADIANS(b.latitude - ${lat}) / 2), 2) +
          COS(RADIANS(${lat})) * COS(RADIANS(b.latitude)) *
          POWER(SIN(RADIANS(b.longitude - ${lng}) / 2), 2)
        ))
      )
    `;

    const searchSql = q
      ? `AND (
          mi.name ILIKE '%${sqlEscape(q)}%'
          OR mi.description ILIKE '%${sqlEscape(q)}%'
          OR b.name ILIKE '%${sqlEscape(q)}%'
          OR h.name ILIKE '%${sqlEscape(q)}%'
        )`
      : "";

    const countRows = await prisma.$queryRawUnsafe<{ count: number }[]>(`
      SELECT COUNT(*)::int AS count
      FROM menu_items mi
      JOIN branches b ON b.id = mi.branch_id
      JOIN hotels   h ON h.id = b.hotel_id
      WHERE mi.is_available = true
        AND mi.is_online = true
        AND b.status = 'active'
        AND h.is_online = true
        AND b.latitude IS NOT NULL
        AND b.longitude IS NOT NULL
        ${searchSql}
        AND ${distanceExpr} <= ${radiusKm}
    `);
    const total = countRows[0]?.count || 0;

    if (total === 0) {
      return fallbackResponse({ q, page, limit, skip, sort, hasCoords });
    }

    const rows = await prisma.$queryRawUnsafe<RawRow[]>(`
      SELECT
        mi.id, mi.name, mi.description, mi.image_url,
        mi.price::float8 AS price,
        mi.branch_id,
        b.id AS b_id, b.name AS b_name, b.city AS b_city,
        b.latitude::float8 AS b_latitude,
        b.longitude::float8 AS b_longitude,
        b.currency AS b_currency,
        h.id AS h_id, h.name AS h_name, h.logo_url AS h_logo_url,
        COALESCE(r.avg_rating, 0)::float8 AS avg_rating,
        COALESCE(r.review_count, 0)::int AS review_count,
        COALESCE(o.order_count, 0)::int AS order_count,
        ${distanceExpr}::float8 AS distance_km
      FROM menu_items mi
      JOIN branches b ON b.id = mi.branch_id
      JOIN hotels   h ON h.id = b.hotel_id
      LEFT JOIN (
        SELECT menu_item_id,
               AVG(rating)::float8 AS avg_rating,
               COUNT(*)::int       AS review_count
        FROM reviews
        GROUP BY menu_item_id
      ) r ON r.menu_item_id = mi.id
      LEFT JOIN (
        SELECT menu_item_id, COUNT(*)::int AS order_count
        FROM order_items
        GROUP BY menu_item_id
      ) o ON o.menu_item_id = mi.id
      WHERE mi.is_available = true
        AND mi.is_online = true
        AND b.status = 'active'
        AND h.is_online = true
        AND b.latitude IS NOT NULL
        AND b.longitude IS NOT NULL
        ${searchSql}
        AND ${distanceExpr} <= ${radiusKm}
      ORDER BY distance_km ASC, mi.name ASC
      LIMIT ${limit} OFFSET ${skip}
    `);

    return NextResponse.json({
      items: rows.map(shape),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      location_used: true,
      sort,
      distance_fallback: false,
    });
  }

  // -----------------------------------------------------------------
  // RECOMMENDED
  // -----------------------------------------------------------------
  if (sort === "recommended") {
    const scoreExpr = `
      (
        COALESCE(r.avg_rating, 0) * LN(COALESCE(o.order_count, 0) + 1)
        + COALESCE(o.order_count, 0) * 0.05
      )
    `;

    const searchSql = q
      ? `AND (
          mi.name ILIKE '%${sqlEscape(q)}%'
          OR mi.description ILIKE '%${sqlEscape(q)}%'
          OR b.name ILIKE '%${sqlEscape(q)}%'
          OR h.name ILIKE '%${sqlEscape(q)}%'
        )`
      : "";

    const countRows = await prisma.$queryRawUnsafe<{ count: number }[]>(`
      SELECT COUNT(*)::int AS count
      FROM menu_items mi
      JOIN branches b ON b.id = mi.branch_id
      JOIN hotels   h ON h.id = b.hotel_id
      WHERE mi.is_available = true
        AND mi.is_online = true
        AND b.status = 'active'
        AND h.is_online = true
        ${searchSql}
    `);
    const total = countRows[0]?.count || 0;

    const rows = await prisma.$queryRawUnsafe<RawRow[]>(`
      SELECT
        mi.id, mi.name, mi.description, mi.image_url,
        mi.price::float8 AS price,
        mi.branch_id,
        b.id AS b_id, b.name AS b_name, b.city AS b_city,
        b.latitude::float8 AS b_latitude,
        b.longitude::float8 AS b_longitude,
        b.currency AS b_currency,
        h.id AS h_id, h.name AS h_name, h.logo_url AS h_logo_url,
        COALESCE(r.avg_rating, 0)::float8 AS avg_rating,
        COALESCE(r.review_count, 0)::int AS review_count,
        COALESCE(o.order_count, 0)::int AS order_count
      FROM menu_items mi
      JOIN branches b ON b.id = mi.branch_id
      JOIN hotels   h ON h.id = b.hotel_id
      LEFT JOIN (
        SELECT menu_item_id,
               AVG(rating)::float8 AS avg_rating,
               COUNT(*)::int       AS review_count
        FROM reviews
        GROUP BY menu_item_id
      ) r ON r.menu_item_id = mi.id
      LEFT JOIN (
        SELECT menu_item_id, COUNT(*)::int AS order_count
        FROM order_items
        GROUP BY menu_item_id
      ) o ON o.menu_item_id = mi.id
      WHERE mi.is_available = true
        AND mi.is_online = true
        AND b.status = 'active'
        AND h.is_online = true
        ${searchSql}
      ORDER BY ${scoreExpr} DESC, mi.name ASC
      LIMIT ${limit} OFFSET ${skip}
    `);

    return NextResponse.json({
      items: rows.map(shape),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      location_used: hasCoords,
      sort,
      distance_fallback: false,
    });
  }

  // -----------------------------------------------------------------
  // Native Prisma sorts (reviews / orders / price)
  // -----------------------------------------------------------------
  const where: any = {
    is_available: true,
    is_online: true,
    branches: {
      status: "active",
      hotels: { is_online: true },
    },
  };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { branches: { name: { contains: q, mode: "insensitive" } } },
      { branches: { hotels: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  let orderBy: any = { name: "asc" };
  if (sort === "reviews") orderBy = { reviews: { _count: "desc" } };
  else if (sort === "orders") orderBy = { order_items: { _count: "desc" } };
  else if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };

  const [total, rows] = await prisma.$transaction([
    prisma.menu_items.count({ where }),
    prisma.menu_items.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        image_url: true,
        price: true,
        branch_id: true,
        branches: {
          select: {
            id: true,
            name: true,
            city: true,
            latitude: true,
            longitude: true,
            currency: true,
            hotels: { select: { id: true, name: true, logo_url: true } },
          },
        },
        reviews: { select: { rating: true } },
        _count: { select: { order_items: true } },
      },
    }),
  ]);

  return NextResponse.json({
    items: rows.map((r) => {
      const reviewCount = r.reviews.length;
      const avg = reviewCount
        ? r.reviews.reduce((s, x) => s + x.rating, 0) / reviewCount
        : 0;
      const bLat =
        r.branches?.latitude != null
          ? Number(r.branches.latitude.toString())
          : null;
      const bLng =
        r.branches?.longitude != null
          ? Number(r.branches.longitude.toString())
          : null;
      const distance_km =
        hasCoords && bLat !== null && bLng !== null
          ? +haversine(lat, lng, bLat, bLng).toFixed(2)
          : null;

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        image_url: r.image_url,
        price: Number(r.price),
        currency: r.branches?.currency || "AFN",
        branch: {
          id: r.branches?.id || null,
          name: r.branches?.name || "",
          city: r.branches?.city || null,
          latitude: bLat,
          longitude: bLng,
        },
        hotel: {
          id: r.branches?.hotels?.id || null,
          name: r.branches?.hotels?.name || "",
          logo_url: r.branches?.hotels?.logo_url || null,
        },
        avg_rating: avg ? +avg.toFixed(1) : 0,
        review_count: reviewCount,
        order_count: r._count.order_items,
        distance_km,
      };
    }),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    location_used: hasCoords,
    sort,
    distance_fallback: false,
  });
}

async function fallbackResponse({
  q,
  page,
  limit,
  skip,
  sort,
  hasCoords,
}: {
  q: string;
  page: number;
  limit: number;
  skip: number;
  sort: string;
  hasCoords: boolean;
}) {
  const where: any = {
    is_available: true,
    is_online: true,
    branches: {
      status: "active",
      hotels: { is_online: true },
    },
  };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { branches: { name: { contains: q, mode: "insensitive" } } },
      { branches: { hotels: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.menu_items.count({ where }),
    prisma.menu_items.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        image_url: true,
        price: true,
        branch_id: true,
        branches: {
          select: {
            id: true,
            name: true,
            city: true,
            latitude: true,
            longitude: true,
            currency: true,
            hotels: { select: { id: true, name: true, logo_url: true } },
          },
        },
        reviews: { select: { rating: true } },
        _count: { select: { order_items: true } },
      },
    }),
  ]);

  return NextResponse.json({
    items: rows.map((r) => {
      const reviewCount = r.reviews.length;
      const avg = reviewCount
        ? r.reviews.reduce((s, x) => s + x.rating, 0) / reviewCount
        : 0;
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        image_url: r.image_url,
        price: Number(r.price),
        currency: r.branches?.currency || "AFN",
        branch: {
          id: r.branches?.id || null,
          name: r.branches?.name || "",
          city: r.branches?.city || null,
          latitude:
            r.branches?.latitude != null
              ? Number(r.branches.latitude.toString())
              : null,
          longitude:
            r.branches?.longitude != null
              ? Number(r.branches.longitude.toString())
              : null,
        },
        hotel: {
          id: r.branches?.hotels?.id || null,
          name: r.branches?.hotels?.name || "",
          logo_url: r.branches?.hotels?.logo_url || null,
        },
        avg_rating: avg ? +avg.toFixed(1) : 0,
        review_count: reviewCount,
        order_count: r._count.order_items,
        distance_km: null,
      };
    }),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    location_used: hasCoords,
    sort,
    distance_fallback: true,
  });
}
