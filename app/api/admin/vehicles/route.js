import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VEHICLE_TYPES, vehicleInclude, buildSubtypeCreate, flattenVehicle } from "@/lib/vehicleSubtypes";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const provinceId = searchParams.get("provinceId");
  const ownerId = searchParams.get("ownerId");
  const q = searchParams.get("q");

  const where = {
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(provinceId ? { provinceId } : {}),
    ...(ownerId ? { ownerId } : {}),
    ...(q
      ? {
          OR: [
            { brand: { contains: q, mode: "insensitive" } },
            { model: { contains: q, mode: "insensitive" } },
            { plateNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: vehicleInclude(),
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vehicles.map(flattenVehicle));
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { type, details, ...base } = body;

  if (!VEHICLE_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of ${VEHICLE_TYPES.join(", ")}` }, { status: 400 });
  }

  const data = {
    type,
    brand: base.brand || null,
    model: base.model || null,
    year: base.year ? parseInt(base.year, 10) : null,
    plateNumber: base.plateNumber || null,
    vin: base.vin || null,
    fuelType: base.fuelType || null,
    transmission: base.transmission || null,
    status: base.status || "AVAILABLE",
    pricePerDay: base.pricePerDay ? parseFloat(base.pricePerDay) : null,
    pricePerHour: base.pricePerHour ? parseFloat(base.pricePerHour) : null,
    images: Array.isArray(base.images) ? base.images : [],
    description: base.description || null,
    ...(base.provinceId ? { province: { connect: { id: base.provinceId } } } : {}),
    ...(base.ownerId ? { owner: { connect: { id: base.ownerId } } } : {}),
    ...buildSubtypeCreate(type, details),
  };

  try {
    const vehicle = await prisma.vehicle.create({ data, include: vehicleInclude() });
    return NextResponse.json(flattenVehicle(vehicle), { status: 201 });
  } catch (e) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Plate number or VIN already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}
