// app/api/public/provinces/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const provinces = await prisma.provinces.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const res = NextResponse.json({ provinces });

    // Static reference data — cache 1 hour, serve stale for a day.
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
    return res;
  } catch (err) {
    console.error("[GET /api/public/provinces]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
