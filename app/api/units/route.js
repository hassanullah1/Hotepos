// /api/units/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/units
 * Platform-wide list of units for dropdowns. Read-only.
 */
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const units = await prisma.units.findMany({
    where: { is_active: true },
    select: { id: true, name: true, short_name: true, sort_order: true },
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ units });
}
