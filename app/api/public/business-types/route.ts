import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/public/business-types
// Returns the active business types for the signup picker.
export async function GET() {
  try {
    const types = await prisma.business_types.findMany({
      where: { is_active: true },
      select: { id: true, key: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ business_types: types });
  } catch (err) {
    console.error("[public/business-types] failed:", err);
    return NextResponse.json(
      { error: "Failed to load business types" },
      { status: 500 },
    );
  }
}
