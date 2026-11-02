// /api/product-categories/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/product-categories
 * Public. Returns all active platform product categories for the dropdown.
 * Optionally filter with `?parent_id=null` to get only top-level ones.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const parentOnly = searchParams.get("parent_only") === "1";

  const where = { is_active: true };
  if (parentOnly) where.parent_id = null;

  const categories = await prisma.product_categories.findMany({
    where,
    select: {
      id: true,
      key: true,
      name: true,
      icon: true,
      parent_id: true,
    },
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ categories });
}
