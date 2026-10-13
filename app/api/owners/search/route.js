import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getCurrentUser,
  requireRole,
  unauthorized,
  forbidden,
} from "@/lib/auth";

export async function GET(request) {
  // 1. Authenticate & authorize
  const user = await getCurrentUser(request);
  if (!user) return unauthorized();
  if (!requireRole(user, ["super_admin"])) return forbidden();

  // 2. Get search query
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ owners: [] });
  }

  try {
    // 3. Find users matching the search.
    // Do NOT require hotel_owners to exist.
    const owners = await prisma.users.findMany({
      where: {
        OR: [
          {
            full_name: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: q,
              mode: "insensitive",
            },
          },
        ],
      },

      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,

        hotel_owners: {
          select: {
            hotels: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },

      take: 20,
    });

    // 4. Format the response.
    // If the user has no hotel_owners record,
    // hotel_owners will be [] and hotels will also be [].
    const formatted = owners.map((owner) => ({
      id: owner.id,
      full_name: owner.full_name,
      email: owner.email,
      phone: owner.phone,

      hotels: owner.hotel_owners.flatMap((ho) => ho.hotels || []),
    }));

    return NextResponse.json({
      owners: formatted,
    });
  } catch (error) {
    console.error("Owner search error:", error);

    return NextResponse.json(
      {
        owners: [],
        error: "Failed to search users",
      },
      { status: 500 },
    );
  }
}
