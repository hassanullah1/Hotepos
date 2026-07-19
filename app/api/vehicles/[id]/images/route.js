import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This is the "separate function that only loads the needed image" endpoint.
// It's called lazily — once per thumbnail click, never in bulk — and uses a
// Postgres array slice (images[N:N]) so the DB itself only reads one element
// out of the array instead of the whole photo list.
export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const index = Number(searchParams.get("index"));

  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }

  try {
    // Postgres arrays are 1-indexed, hence index + 1 on both sides of the slice.
    const rows = await prisma.$queryRaw`
      SELECT images[${index + 1}:${index + 1}] AS slice
      FROM "Vehicle"
      WHERE id = ${id} AND status = 'AVAILABLE'
    `;

    const slice = rows?.[0]?.slice;
    if (!slice || slice.length === 0) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json(
      { index, image: slice[0] },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    console.error(`GET /api/vehicles/${id}/images failed`, err);
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}
