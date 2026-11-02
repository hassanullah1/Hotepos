import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EARTH_KM = 6371;
const toRad = (d: number) => (d * Math.PI) / 180;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n =
    typeof v === "number"
      ? v
      : Number((v as { toString(): string }).toString());
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(
    60,
    Math.max(1, Number(searchParams.get("limit") || 20)),
  );
  const skip = (page - 1) * limit;

  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");
  const lat = latRaw !== null ? Number(latRaw) : NaN;
  const lng = lngRaw !== null ? Number(lngRaw) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const radiusKm = Math.min(
    100,
    Math.max(0.5, Number(searchParams.get("radius") || 20)),
  );

  // ── only branches whose hotel is online, active status ──
  const where: any = {
    OR: [{ status: "active" }, { status: null }],
    hotels: { is_online: true },
  };

  if (q) {
    where.AND = [
      {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { address: { contains: q, mode: "insensitive" } },
          { hotels: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
    ];
  }

  if (hasCoords) {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(toRad(lat)) || 1);
    where.latitude = { not: null, gte: lat - latDelta, lte: lat + latDelta };
    where.longitude = { not: null, gte: lng - lngDelta, lte: lng + lngDelta };
  }

  const select = {
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
    hotels: { select: { id: true, name: true, logo_url: true } },
    // ── FIX: menu_items is linked via branch_menu_items, not directly ──
    _count: {
      select: {
        branch_menu_items: {
          where: { is_online: true, is_available: true },
        },
      },
    },
  } as const;

  const [total, rows] = await prisma.$transaction([
    prisma.branches.count({ where }),
    prisma.branches.findMany({
      where,
      select,
      orderBy: { name: "asc" },
      skip: hasCoords ? 0 : skip,
      take: hasCoords ? undefined : limit,
    }),
  ]);

  let list = rows.map((b) => {
    const bLat = num(b.latitude);
    const bLng = num(b.longitude);
    return {
      id: b.id,
      name: b.name,
      hotel_id: b.hotels?.id || null,
      hotel_name: b.hotels?.name || "",
      logo_url: b.hotels?.logo_url || null,
      address: b.address,
      city: b.city,
      phone: b.phone,
      currency: b.currency || "AFN",
      opening_time: b.opening_time,
      closing_time: b.closing_time,
      latitude: bLat,
      longitude: bLng,
      menu_item_count: b._count.branch_menu_items,
      distance_km:
        hasCoords && bLat !== null && bLng !== null
          ? +haversineKm(lat, lng, bLat, bLng).toFixed(2)
          : null,
    };
  });

  if (hasCoords) {
    list = list
      .filter((b) => b.distance_km !== null && b.distance_km <= radiusKm)
      .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));

    const totalFiltered = list.length;
    list = list.slice(skip, skip + limit);

    return NextResponse.json({
      branches: list,
      page,
      limit,
      total: totalFiltered,
      totalPages: Math.max(1, Math.ceil(totalFiltered / limit)),
      location_used: true,
    });
  }

  return NextResponse.json({
    branches: list,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    location_used: false,
  });
}
