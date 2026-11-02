// /api/owners/menu-items/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { assertManagedBranch } from "@/lib/owner-scope";

const ITEM_SELECT = {
  id: true,
  name: true,
  description: true,
  image_url: true,
  base_price: true,
  tax_rate: true,
  is_kitchen: true,
  prep_station: true,
  sort_order: true,
  category_id: true,
  product_category_id: true,
  unit_id: true,
  unit_quantity: true,
  menu_categories: { select: { id: true, name: true } },
  product_category: { select: { id: true, key: true, name: true } },
  unit: { select: { id: true, name: true, short_name: true } },
  branch_items: {
    select: {
      branch_id: true,
      is_available: true,
      is_online: true,
      price_override: true,
    },
  },
};

function serialize(i, branchId) {
  const bi = i.branch_items?.find((b) => b.branch_id === branchId) || null;
  const effectivePrice = Number(bi?.price_override ?? i.base_price);
  return {
    id: i.id,
    name: i.name,
    description: i.description,
    image_url: i.image_url,

    base_price: i.base_price,
    price_override: bi?.price_override ?? null,
    price: effectivePrice,
    is_available: bi?.is_available ?? true,
    is_online: bi?.is_online ?? false,

    tax_rate: i.tax_rate,
    is_kitchen: i.is_kitchen,
    prep_station: i.prep_station,
    sort_order: i.sort_order,
    category: i.menu_categories,
    product_category: i.product_category,

    // ── unit fields ──
    unit_id: i.unit_id,
    unit_quantity: i.unit_quantity,
    unit: i.unit,
  };
}

/**
 * GET /api/owners/menu-items?branch_id=X&category_id=Y&q=foo
 */
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id");
  const categoryId = searchParams.get("category_id");
  const q = (searchParams.get("q") || "").trim();

  if (!branchId)
    return NextResponse.json(
      { error: "branch_id is required" },
      { status: 400 },
    );

  const branch = await assertManagedBranch(branchId, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found in your hotel" },
      { status: 404 },
    );

  const where = {
    hotel_id: branch.hotel_id,
    ...(categoryId ? { category_id: categoryId } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  };

  const items = await prisma.menu_items.findMany({
    where,
    select: ITEM_SELECT,
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ items: items.map((i) => serialize(i, branchId)) });
}

/**
 * POST /api/owners/menu-items
 * Body: {
 *   branch_id, name, base_price,
 *   category_id?, product_category_id?, description?, image_url?,
 *   tax_rate?, is_kitchen?, prep_station?, sort_order?,
 *   is_available?, is_online?,
 *   unit_id?, unit_quantity?
 * }
 */
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.branch_id || !body.name || body.base_price === undefined) {
    return NextResponse.json(
      { error: "branch_id, name and base_price are required" },
      { status: 400 },
    );
  }

  const branch = await assertManagedBranch(body.branch_id, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found in your hotel" },
      { status: 404 },
    );

  if (body.category_id) {
    const cat = await prisma.menu_categories.findFirst({
      where: { id: body.category_id, hotel_id: branch.hotel_id },
    });
    if (!cat)
      return NextResponse.json(
        { error: "Category not found in this hotel" },
        { status: 404 },
      );
  }

  const unitId = body.unit_id || null;
  const unitQty =
    unitId &&
    body.unit_quantity !== undefined &&
    body.unit_quantity !== null &&
    body.unit_quantity !== ""
      ? Number(body.unit_quantity)
      : null;

  try {
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.menu_items.create({
        data: {
          hotel_id: branch.hotel_id,
          category_id: body.category_id || null,
          product_category_id: body.product_category_id || null,
          name: body.name,
          description: body.description || null,
          image_url: body.image_url || null,
          base_price: body.base_price,
          tax_rate: body.tax_rate ?? 0,
          is_kitchen: body.is_kitchen ?? true,
          prep_station: body.prep_station || null,
          sort_order: body.sort_order ?? 0,

          unit_id: unitId,
          unit_quantity: unitQty,
        },
      });

      const allBranches = await tx.branches.findMany({
        where: { hotel_id: branch.hotel_id },
        select: { id: true },
      });
      if (allBranches.length > 0) {
        await tx.branch_menu_items.createMany({
          data: allBranches.map((b) => ({
            branch_id: b.id,
            menu_item_id: created.id,
            is_available: body.is_available ?? true,
            is_online: body.is_online ?? false,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    const fresh = await prisma.menu_items.findUnique({
      where: { id: item.id },
      select: ITEM_SELECT,
    });
    return NextResponse.json(
      { item: serialize(fresh, body.branch_id) },
      { status: 201 },
    );
  } catch (err) {
    console.error("Create menu item error:", err);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 400 },
    );
  }
}
