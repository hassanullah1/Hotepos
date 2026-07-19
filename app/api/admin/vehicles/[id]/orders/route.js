import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vehicles/[id]/orders -> all rental orders for this vehicle
export async function GET(_req, { params }) {
  const { id } = await params;

  const orders = await prisma.order.findMany({
    where: { vehicleId: id },
    include: {
      client: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(orders);
}
