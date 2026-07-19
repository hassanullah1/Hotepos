import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const owners = await prisma.owner.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { tazkiraNumber: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        tazkiraNumber: true,
        address: true,
      },
    });

    return NextResponse.json(owners);
  } catch (error) {
    console.error("Owner search error:", error);
    return NextResponse.json(
      { error: "Failed to search owners" },
      { status: 500 },
    );
  }
}
