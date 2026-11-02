// app/api/public/product-categories/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/public/product-categories?province_id=<uuid>
 *
 * Returns platform-wide product categories that have at least one
 * available online item in the given province, along with the item count.
 *
 * Also returns `total_items` (across all categories) so the UI can show
 * the number next to the "All dishes" card.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const provinceId = searchParams.get("province_id");

  if (!provinceId) {
    return NextResponse.json(
      { error: "province_id required" },
      { status: 400 },
    );
  }

  // Reusable scope: available at a branch that is online, in an online
  // hotel, in this province.
  const branchScope = {
    some: {
      is_online: true,
      is_available: true,
      branches: {
        province_id: provinceId,
        status: "active",
        hotels: { is_online: true },
      },
    },
  };

  const categories = await prisma.product_categories.findMany({
    where: { is_active: true, parent_id: null },
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      key: true,
      name: true,
      icon: true,
      image_url: true,
    },
  });

  if (categories.length === 0) {
    return NextResponse.json({ categories: [], total_items: 0 });
  }

  // Per-category item counts (only categorized items)
  const counts = await prisma.menu_items.groupBy({
    by: ["product_category_id"],
    where: {
      product_category_id: { not: null },
      branch_items: branchScope,
    },
    _count: { _all: true },
  });

  const countMap = new Map(
    counts.map((c) => [c.product_category_id, c._count._all]),
  );

  const result = categories
    .map((c) => ({
      id: c.id,
      key: c.key,
      name: c.name,
      icon: c.icon,
      image_url: c.image_url,
      item_count: countMap.get(c.id) || 0,
    }))
    

  // Total across all items (for the "All dishes" card)
  const totalItems = await prisma.menu_items.count({
    where: { branch_items: branchScope },
  });

  return NextResponse.json({
    categories: result,
    total_items: totalItems,
  });
}
