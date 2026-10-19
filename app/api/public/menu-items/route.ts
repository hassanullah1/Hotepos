// app/api/public/menu-items/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const EARTH_KM = 6371;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type MenuItemRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  category_name: string | null;
  branch_id: string;
  branch_name: string;
  distance_km: number | null;
};

function haversineSql(lat: number, lng: number): Prisma.Sql {
  return Prisma.sql`
    (
      ${EARTH_KM} * 2 * asin(
        least(1, sqrt(
          power(sin(radians((b.latitude - ${lat}) / 2)), 2) +
          cos(radians(${lat})) * cos(radians(b.latitude)) *
          power(sin(radians((b.longitude - ${lng}) / 2)), 2)
        ))
      )
    )
  `;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const branchId = searchParams.get("branchId");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search")?.trim() ?? "";
    const latRaw = searchParams.get("lat");
    const lngRaw = searchParams.get("lng");
    const radiusRaw = searchParams.get("radiusKm");

    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
    );
    const pageSize = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(searchParams.get("pageSize") ?? "20", 10) || 20,
      ),
    );
    const offset = (page - 1) * pageSize;

    if (branchId && !UUID_RE.test(branchId)) {
      return NextResponse.json({ error: "Invalid branchId" }, { status: 400 });
    }
    if (categoryId && !UUID_RE.test(categoryId)) {
      return NextResponse.json(
        { error: "Invalid categoryId" },
        { status: 400 },
      );
    }

    let lat: number | null = null;
    let lng: number | null = null;
    let radiusKm: number | null = null;

    if (latRaw !== null || lngRaw !== null) {
      const parsedLat = Number(latRaw);
      const parsedLng = Number(lngRaw);

      if (
        !Number.isFinite(parsedLat) ||
        !Number.isFinite(parsedLng) ||
        parsedLat < -90 ||
        parsedLat > 90 ||
        parsedLng < -180 ||
        parsedLng > 180
      ) {
        return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 });
      }

      lat = parsedLat;
      lng = parsedLng;

      if (radiusRaw !== null) {
        const parsedRadius = Number(radiusRaw);
        if (
          !Number.isFinite(parsedRadius) ||
          parsedRadius <= 0 ||
          parsedRadius > 500
        ) {
          return NextResponse.json(
            { error: "Invalid radiusKm" },
            { status: 400 },
          );
        }
        radiusKm = parsedRadius;
      } else {
        radiusKm = 5;
      }
    }

    const conditions: Prisma.Sql[] = [Prisma.sql`mi.is_available = true`];

    if (branchId) {
      conditions.push(Prisma.sql`mi.branch_id = ${branchId}::uuid`);
    }
    if (categoryId) {
      conditions.push(Prisma.sql`mi.category_id = ${categoryId}::uuid`);
    }
    if (search) {
      conditions.push(Prisma.sql`mi.name ILIKE ${"%" + search + "%"}`);
    }
    if (lat !== null && lng !== null && radiusKm !== null) {
      conditions.push(Prisma.sql`${haversineSql(lat, lng)} <= ${radiusKm}`);
    }

    const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;

    const countRows = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM menu_items mi
      JOIN branches b ON b.id = mi.branch_id
      ${whereSql}
    `;
    const total = countRows[0]?.count ?? 0;

    const distanceSelect =
      lat !== null && lng !== null
        ? Prisma.sql`${haversineSql(lat, lng)}::float AS distance_km`
        : Prisma.sql`NULL::float AS distance_km`;

    const orderBy =
      lat !== null && lng !== null
        ? Prisma.sql`distance_km ASC NULLS LAST, mi.name ASC`
        : Prisma.sql`mi.name ASC`;

    const rows = await prisma.$queryRaw<MenuItemRow[]>`
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.category_id,
        c.name AS category_name,
        mi.branch_id,
        b.name AS branch_name,
        ${distanceSelect}
      FROM menu_items mi
      JOIN branches b ON b.id = mi.branch_id
      LEFT JOIN menu_categories c ON c.id = mi.category_id
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("[GET /api/public/menu-items] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
