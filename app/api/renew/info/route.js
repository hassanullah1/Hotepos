import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.users.findUnique({
    where: { id: payload.userId },
    select: {
      full_name: true,
      email: true,
      hotel_owners: {
        select: {
          hotels: {
            select: {
              id: true,
              name: true,
              _count: { select: { branches: true } },
            },
          },
        },
      },
    },
  });

  const hotel = user?.hotel_owners?.[0]?.hotels;
  if (!hotel) {
    return NextResponse.json({ error: "No hotel linked" }, { status: 404 });
  }

  const posCount = await prisma.pos_devices.count({
    where: {
      branches: { hotel_id: hotel.id },
      is_active: true,
    },
  });

  return NextResponse.json({
    hotel_id: hotel.id,
    hotel_name: hotel.name,
    owner_name: user.full_name ?? "",
    owner_email: user.email ?? "",
    branch_count: hotel._count.branches,
    pos_device_count: posCount,
  });
}
