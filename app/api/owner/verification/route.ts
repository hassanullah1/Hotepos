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

  // -------- 1) hotel owner path: hotel_owners → hotels --------
  const ownerLinks = await prisma.hotel_owners.findMany({
    where: { user_id: payload.userId },
    select: {
      hotels: {
        select: {
          id: true,
          name: true,
          verification_status: true,
        },
      },
    },
  });

  if (ownerLinks.length > 0) {
    const hotels = ownerLinks.map((o) => o.hotels).filter(Boolean);

    // Aggregate: if ANY hotel is not verified, treat the account as blocked.
    // Return the "worst" status so the sidebar locks and the owner sees why.
    const priority = ["rejected", "pending", "contacted", "verified"];
    const status =
      priority.find((s) =>
        hotels.some((h) => (h.verification_status || "pending") === s),
      ) || "pending";

    return NextResponse.json({
      hotel: {
        id: hotels[0].id,
        name: hotels[0].name,
        verification_status: status,
      },
      hotels: hotels.map((h) => ({
        id: h.id,
        name: h.name,
        verification_status: h.verification_status || "pending",
      })),
      role: "hotel_owner",
    });
  }

  // -------- 2) branch manager path: users.branch_id → branches → hotels --------
  const user = await prisma.users.findUnique({
    where: { id: payload.userId },
    select: {
      branch_id: true,
      branches: {
        select: {
          hotel_id: true,
          hotels: {
            select: {
              id: true,
              name: true,
              verification_status: true,
            },
          },
        },
      },
    },
  });

  const branchHotel = user?.branches?.hotels;
  if (branchHotel) {
    return NextResponse.json({
      hotel: {
        id: branchHotel.id,
        name: branchHotel.name,
        verification_status: branchHotel.verification_status || "pending",
      },
      role: "branch_manager",
    });
  }

  return NextResponse.json({ error: "No hotel" }, { status: 404 });
}
