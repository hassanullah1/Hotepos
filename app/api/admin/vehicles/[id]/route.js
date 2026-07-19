import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  VEHICLE_TYPES,
  vehicleInclude,
  buildSubtypeUpdate,
  flattenVehicle,
} from "@/lib/vehicleSubtypes";

export async function GET(_req, { params }) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: vehicleInclude(),
  });
  if (!vehicle)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(flattenVehicle(vehicle));
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { type, details, ...base } = body;

  const existing = await prisma.vehicle.findUnique({
    where: { id },
    include: vehicleInclude(),
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextType = type && VEHICLE_TYPES.includes(type) ? type : existing.type;

  const data = {
    type: nextType,
    ...(base.brand !== undefined ? { brand: base.brand || null } : {}),
    ...(base.model !== undefined ? { model: base.model || null } : {}),
    ...(base.year !== undefined
      ? { year: base.year ? parseInt(base.year, 10) : null }
      : {}),
    ...(base.plateNumber !== undefined
      ? { plateNumber: base.plateNumber || null }
      : {}),
    ...(base.vin !== undefined ? { vin: base.vin || null } : {}),
    ...(base.fuelType !== undefined ? { fuelType: base.fuelType || null } : {}),
    ...(base.transmission !== undefined
      ? { transmission: base.transmission || null }
      : {}),
    ...(base.status !== undefined ? { status: base.status } : {}),
    ...(base.pricePerDay !== undefined
      ? { pricePerDay: base.pricePerDay ? parseFloat(base.pricePerDay) : null }
      : {}),
    ...(base.pricePerHour !== undefined
      ? {
          pricePerHour: base.pricePerHour
            ? parseFloat(base.pricePerHour)
            : null,
        }
      : {}),
    ...(base.images !== undefined
      ? { images: Array.isArray(base.images) ? base.images : [] }
      : {}),
    ...(base.description !== undefined
      ? { description: base.description || null }
      : {}),
    ...(base.provinceId !== undefined
      ? base.provinceId
        ? { province: { connect: { id: base.provinceId } } }
        : { province: { disconnect: true } }
      : {}),
    ...(base.ownerId !== undefined
      ? base.ownerId
        ? { owner: { connect: { id: base.ownerId } } }
        : { owner: { disconnect: true } }
      : {}),
    ...buildSubtypeUpdate(nextType, details || {}, existing),
  };

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data,
      include: vehicleInclude(),
    });
    return NextResponse.json(flattenVehicle(vehicle));
  } catch (e) {
    if (e.code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e.code === "P2002")
      return NextResponse.json(
        { error: "Plate number or VIN already exists" },
        { status: 409 },
      );
    return NextResponse.json(
      { error: "Failed to update vehicle" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  try {
    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e.code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(
      { error: "Failed to delete vehicle" },
      { status: 500 },
    );
  }
}
