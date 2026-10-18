import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const provinces = await prisma.provinces.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return NextResponse.json({ provinces });
  } catch (err) {
    console.error("GET /api/public/provinces error:", err);
    return NextResponse.json(
      { provinces: [], error: "FAILED" },
      { status: 500 },
    );
  }
}
