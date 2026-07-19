import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeVehicleDetail } from "@/lib/vehicleSerializer";

export async function GET(_request, { params }) {
  const { id } = await params;

  try {
    // cardinality(images) counts the array in the DB — no need to pull every
    // URL just to know how many thumbnails to render.
    const [vehicle, countRow] = await Promise.all([
      prisma.vehicle.findUnique({
        where: { id },
        select: {
          id: true,
          type: true,
          brand: true,
          model: true,
          year: true,
          description: true,
          transmission: true,
          fuelType: true,
          pricePerDay: true,
          pricePerHour: true,
          status: true,
          images: true, // sliced to [0] below before it's ever serialized
          taxi: true,
          dumpTruck: true,
          tanker: true,
          excavator: true,
          bodyTruck: true,
          // owner is deliberately never selected — it must never reach the client
        },
      }),
      prisma.$queryRaw`SELECT cardinality(images) AS count FROM "Vehicle" WHERE id = ${id}`,
    ]);

    if (!vehicle || vehicle.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const imageCount = Number(countRow?.[0]?.count ?? vehicle.images.length);
    const detail = serializeVehicleDetail({
      ...vehicle,
      images: vehicle.images.slice(0, 1),
      imageCount,
    });

    return NextResponse.json(detail);
  } catch (err) {
    console.error(`GET /api/vehicles/${id} failed`, err);
    return NextResponse.json({ error: "Failed to load vehicle" }, { status: 500 });
  }
}
