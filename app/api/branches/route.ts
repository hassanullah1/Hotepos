import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getOwnerHotelId } from "@/lib/owner-scope";

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n =
    typeof v === "number"
      ? v
      : Number((v as { toString(): string }).toString());
  return Number.isFinite(n) ? n : null;
}

function parseLat(v: unknown): number | null | undefined {
  if (v === null || v === "" || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < -90 || n > 90) return undefined;
  return Number(n.toFixed(7));
}

function parseLng(v: unknown): number | null | undefined {
  if (v === null || v === "" || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < -180 || n > 180) return undefined;
  return Number(n.toFixed(7));
}

class InvalidTimeError extends Error {}

/**
 * "HH:mm" | "HH:mm:ss" | "" | null  →  Date at 1970-01-01 UTC (for @db.Time(6))
 * Throws InvalidTimeError for anything else.
 */
function parseTime(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "string")
    throw new InvalidTimeError("Time must be a string");
  const m = v.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (!m) throw new InvalidTimeError("Expected HH:mm");
  return new Date(`1970-01-01T${m[1]}:${m[2]}:${m[3] ?? "00"}Z`);
}

/** Date at 1970-01-01 UTC  →  "HH:mm" | null */
function formatTime(v: Date | null | undefined): string | null {
  if (!v) return null;
  return `${String(v.getUTCHours()).padStart(2, "0")}:${String(
    v.getUTCMinutes(),
  ).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hotelId = await getOwnerHotelId(user.id);
  if (!hotelId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const branches = await prisma.branches.findMany({
    where: { hotel_id: hotelId },
    select: {
      id: true,
      name: true,
      code: true,
      province_id: true,
      provinces: { select: { id: true, name: true } },
      city: true,
      address: true,
      phone: true,
      latitude: true,
      longitude: true,
      currency: true,
      timezone: true,
      tax_rate: true,
      service_charge_rate: true,
      status: true,
      opening_time: true,
      closing_time: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    branches: branches.map((b) => ({
      ...b,
      latitude: num(b.latitude),
      longitude: num(b.longitude),
      tax_rate: num(b.tax_rate),
      service_charge_rate: num(b.service_charge_rate),
      opening_time: formatTime(b.opening_time),
      closing_time: formatTime(b.closing_time),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hotelId = await getOwnerHotelId(user.id);
  if (!hotelId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name)
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });

  // ---- Province is required ----
  const provinceId =
    typeof body.province_id === "string" ? body.province_id.trim() : "";
  if (!provinceId)
    return NextResponse.json({ error: "PROVINCE_REQUIRED" }, { status: 400 });

  try {
    const provinceExists = await prisma.provinces.findUnique({
      where: { id: provinceId },
      select: { id: true },
    });
    if (!provinceExists)
      return NextResponse.json(
        { error: "PROVINCE_NOT_FOUND" },
        { status: 400 },
      );
  } catch {
    return NextResponse.json({ error: "INVALID_PROVINCE_ID" }, { status: 400 });
  }

  const lat = parseLat(body.latitude);
  const lng = parseLng(body.longitude);
  if (lat === undefined || lng === undefined)
    return NextResponse.json(
      { error: "Invalid latitude or longitude" },
      { status: 400 },
    );

  // ---- Parse time fields ----
  let opening_time: Date | null = null;
  let closing_time: Date | null = null;
  try {
    opening_time = parseTime(body.opening_time);
    closing_time = parseTime(body.closing_time);
  } catch {
    return NextResponse.json(
      { error: "Invalid opening_time or closing_time, expected HH:mm" },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.branches.create({
      data: {
        hotel_id: hotelId,
        province_id: provinceId,
        name,
        code:
          typeof body.code === "string" && body.code.trim()
            ? body.code.trim()
            : null,
        address:
          typeof body.address === "string" && body.address.trim()
            ? body.address.trim()
            : null,
        city:
          typeof body.city === "string" && body.city.trim()
            ? body.city.trim()
            : null,
        phone:
          typeof body.phone === "string" && body.phone.trim()
            ? body.phone.trim()
            : null,
        latitude: lat,
        longitude: lng,
        currency:
          typeof body.currency === "string" && body.currency.trim()
            ? body.currency.trim()
            : "AFN",
        timezone:
          typeof body.timezone === "string" && body.timezone.trim()
            ? body.timezone.trim()
            : "Asia/Kabul",
        tax_rate:
          body.tax_rate === undefined || body.tax_rate === ""
            ? 0
            : Number(body.tax_rate) || 0,
        service_charge_rate:
          body.service_charge_rate === undefined ||
          body.service_charge_rate === ""
            ? 0
            : Number(body.service_charge_rate) || 0,
        status:
          typeof body.status === "string" && body.status.trim()
            ? body.status.trim()
            : "active",
        opening_time,
        closing_time,
      },
      include: { provinces: { select: { id: true, name: true } } },
    });

    return NextResponse.json(
      {
        branch: {
          ...created,
          latitude: num(created.latitude),
          longitude: num(created.longitude),
          opening_time: formatTime(created.opening_time),
          closing_time: formatTime(created.closing_time),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Create branch error:", err);
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? (err as { code: string }).code
        : "";
    if (code === "P2002")
      return NextResponse.json(
        { error: "BRANCH_CODE_EXISTS" },
        { status: 409 },
      );
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 400 },
    );
  }
}
