// /api/owners/menu-categories/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { assertManagedBranch } from "@/lib/owner-scope";

/**
 * GET /api/owners/menu-categories?branch_id=X
 *   Categories are HOTEL-level now. branch_id is only used to determine
 *   which hotel to look at (and to authorize the caller).
 */
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id");
  if (!branchId)
    return NextResponse.json(
      { error: "branch_id is required" },
      { status: 400 },
    );

  const branch = await assertManagedBranch(branchId, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found or not accessible" },
      { status: 404 },
    );

  const categories = await prisma.menu_categories.findMany({
    where: { hotel_id: branch.hotel_id },
    select: {
      id: true,
      name: true,
      sort_order: true,
      is_active: true,
      default_product_category_id: true,
      default_product_category: { select: { id: true, name: true, key: true } },
      _count: { select: { menu_items: true } },
    },
    orderBy: { sort_order: "asc" },
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      sort_order: c.sort_order,
      is_active: c.is_active,
      default_product_category_id: c.default_product_category_id,
      default_product_category: c.default_product_category,
      item_count: c._count.menu_items,
    })),
  });
}

/**
 * POST /api/owners/menu-categories
 * Body: { branch_id, name, sort_order, is_active, default_product_category_id }
 */
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.branch_id || !body.name) {
    return NextResponse.json(
      { error: "branch_id and name are required" },
      { status: 400 },
    );
  }

  const branch = await assertManagedBranch(body.branch_id, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found or not accessible" },
      { status: 404 },
    );

  try {
    const category = await prisma.menu_categories.create({
      data: {
        hotel_id: branch.hotel_id,
        name: body.name,
        sort_order: body.sort_order ?? 0,
        is_active: body.is_active ?? true,
        default_product_category_id: body.default_product_category_id || null,
      },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    console.error("Create category error:", err);
    // P2002 = unique constraint on (hotel_id, name)
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 400 },
    );
  }
}
