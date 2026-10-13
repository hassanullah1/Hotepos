import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getOwnerHotelId } from "@/lib/owner-scope";

/** Prisma.Decimal → number | null (safe for JSON) */
function num(v) {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

export async function GET(request) {
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
      city: true,
      address: true,
      phone: true,
      latitude: true,
      longitude: true,
      status: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    branches: branches.map((b) => ({
      ...b,
      latitude: num(b.latitude),
      longitude: num(b.longitude),
    })),
  });
}
