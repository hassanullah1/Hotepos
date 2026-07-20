import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  slugToEnum,
  DETAIL_RELATION,
  CAPACITY_FIELD,
  AC_CAPABLE_TYPES,
} from "@/lib/vehicleTypeMap";
import { serializeVehicleListItem } from "@/lib/vehicleSerializer";

const PAGE_SIZE_DEFAULT = 12;
const PAGE_SIZE_MAX = 24;

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const typeSlug = searchParams.get("type");
  const type = typeSlug ? slugToEnum(typeSlug) : null;
  if (typeSlug && !type) {
    return NextResponse.json(
      { error: "Unknown vehicle type" },
      { status: 400 },
    );
  }

  const search = searchParams.get("search")?.trim().slice(0, 100) || "";
  const acOnly =
    searchParams.get("ac") === "true" && type && AC_CAPABLE_TYPES.has(type);
  const minCapacity = Number(searchParams.get("minCapacity")) || 0;
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(
    Number(searchParams.get("limit")) || PAGE_SIZE_DEFAULT,
    PAGE_SIZE_MAX,
  );
  const usage = searchParams.get("usage"); // "taxi" or "rental" (only for taxi type)

  // ---- WHERE clause ----
  const where = {
    status: "AVAILABLE",
    ...(type && { type }),
    ...(search && {
      OR: [
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  // Add type‑specific filters (capacity, AC, and usage)
  if (type) {
    const relation = DETAIL_RELATION[type];
    const relationFilter = {};

    if (minCapacity > 0) {
      relationFilter[CAPACITY_FIELD[type]] = { gte: minCapacity };
    }
    if (acOnly) {
      relationFilter.ac = true;
    }
    // Usage filter only applies to taxis
    if (type === "TAXI" && usage) {
      const hasMeter =
        usage === "taxi" ? true : usage === "rental" ? false : undefined;
      if (hasMeter !== undefined) {
        relationFilter.hasMeter = hasMeter;
      }
    }

    if (Object.keys(relationFilter).length > 0) {
      where[relation] = relationFilter;
    }
  }

  try {
    const rows = await prisma.vehicle.findMany({
      where,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        brand: true,
        model: true,
        transmission: true,
        fuelType: true,
        pricePerDay: true,
        images: true,
        province: {
          select: {
            id: true,
            name: true,
          },
        },
        taxi:
          type === "TAXI" || !type
            ? { select: { ac: true, seats: true } }
            : false,
        dumpTruck:
          type === "DUMP_TRUCK" || !type
            ? { select: { payloadWeight: true, bedCapacity: true } }
            : false,
        tanker:
          type === "TANKER" || !type
            ? { select: { tankCapacity: true } }
            : false,
        excavator:
          type === "EXCAVATOR" || !type
            ? { select: { bucketCapacity: true } }
            : false,
        bodyTruck:
          type === "BODY_TRUCK" || !type
            ? { select: { maxPayload: true } }
            : false,
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const items = page.map((v) => {
      const serialized = serializeVehicleListItem({
        ...v,
        images: v.images.slice(0, 1),
      });
      return {
        ...serialized,
        province: v.province
          ? { id: v.province.id, name: v.province.name }
          : null,
      };
    });

    return NextResponse.json(
      { items, nextCursor: hasMore ? page[page.length - 1].id : null },
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
        },
      },
    );
  } catch (err) {
    console.error("GET /api/vehicles failed", err);
    return NextResponse.json(
      { error: "Failed to load vehicles" },
      { status: 500 },
    );
  }
}
