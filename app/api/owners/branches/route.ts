import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getOwnerHotelId, ownsHotel } from "@/lib/owner-scope";

/** Prisma.Decimal → number | null (safe for JSON) */
function num(v: any) {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

function serialize(b: any) {
  return {
    id: b.id,
    hotel_id: b.hotel_id,
    name: b.name,
    code: b.code,
    address: b.address,
    city: b.city,
    phone: b.phone,
    latitude: num(b.latitude),
    longitude: num(b.longitude),
    currency: b.currency,
    timezone: b.timezone,
    tax_rate: num(b.tax_rate) ?? 0,
    service_charge_rate: num(b.service_charge_rate) ?? 0,
    status: b.status,
    opening_time: b.opening_time,
    closing_time: b.closing_time,
    created_at: b.created_at,
    updated_at: b.updated_at,
  };
}

// GET /api/branches?hotel_id=...
// If hotel_id omitted, uses the owner's single hotel (backwards compatible).
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  let hotelId = searchParams.get("hotel_id");

  if (!hotelId) {
    hotelId = await getOwnerHotelId(user.id);
  }
  if (!hotelId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // If a hotel_id was passed explicitly, verify ownership
  const owns = await ownsHotel(user.id, hotelId);
  if (!owns)
    return NextResponse.json(
      { error: "Hotel not found in your scope" },
      { status: 404 },
    );

  const branches = await prisma.branches.findMany({
    where: { hotel_id: hotelId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ branches: branches.map(serialize) });
}

// POST /api/branches
// body: { hotel_id, name, code?, address?, city?, phone?, latitude?, longitude?,
//         currency?, timezone?, tax_rate?, service_charge_rate?, status? }
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const hotelId = typeof body.hotel_id === "string" ? body.hotel_id : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!hotelId || !name)
    return NextResponse.json(
      { error: "hotel_id and name are required" },
      { status: 400 },
    );

  const owns = await ownsHotel(user.id, hotelId);
  if (!owns)
    return NextResponse.json(
      { error: "Hotel not found in your scope" },
      { status: 404 },
    );

  const asStrOrNull = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null;
  const asNumOrNull = (v: unknown) => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
      return Number(v);
    return null;
  };

  const code = asStrOrNull(body.code);
  if (code) {
    const dupe = await prisma.branches.findFirst({
      where: { hotel_id: hotelId, code },
      select: { id: true },
    });
    if (dupe)
      return NextResponse.json(
        { error: "A branch with this code already exists" },
        { status: 400 },
      );
  }

  try {
    const branch = await prisma.branches.create({
      data: {
        hotel_id: hotelId,
        name,
        code,
        address: asStrOrNull(body.address),
        city: asStrOrNull(body.city),
        phone: asStrOrNull(body.phone),
        latitude: asNumOrNull(body.latitude),
        longitude: asNumOrNull(body.longitude),
        currency: asStrOrNull(body.currency) || "AFN",
        timezone: asStrOrNull(body.timezone) || "Asia/Kabul",
        tax_rate: asNumOrNull(body.tax_rate) ?? 0,
        service_charge_rate: asNumOrNull(body.service_charge_rate) ?? 0,
        status: asStrOrNull(body.status) || "active",
      },
    });
    return NextResponse.json({ branch: serialize(branch) }, { status: 201 });
  } catch (err) {
    console.error("Create branch error:", err);
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 400 },
    );
  }
}