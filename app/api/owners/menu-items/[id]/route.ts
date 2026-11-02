// /api/owners/menu-items/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ownsHotel } from "@/lib/owner-scope";

async function loadItemScoped(id, userId) {
  const item = await prisma.menu_items.findUnique({
    where: { id },
    select: { id: true, hotel_id: true },
  });
  if (!item) return null;
  const owns = await ownsHotel(userId, item.hotel_id);
  if (!owns) return null;
  return item;
}

/**
 * PATCH /api/owners/menu-items/[id]
 *
 * Body may contain hotel-level fields:
 *   name, description, image_url, base_price, tax_rate,
 *   is_kitchen, prep_station, sort_order,
 *   category_id, product_category_id
 *
 * AND/OR branch-level fields (requires branch_id in the body):
 *   branch_id, is_online, is_available, price_override
 *
 * Branch-level fields update `branch_menu_items` for that branch only.
 */
export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadItemScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  // ── 1. Branch-scoped fields → branch_menu_items ──────────────────
  const branchId = body.branch_id;
  const hasBranchFields =
    branchId &&
    (body.is_online !== undefined ||
      body.is_available !== undefined ||
      body.price_override !== undefined);

  if (hasBranchFields) {
    // Guard: verify the branch belongs to this hotel
    const branch = await prisma.branches.findFirst({
      where: { id: branchId, hotel_id: existing.hotel_id },
      select: { id: true },
    });
    if (!branch) {
      return NextResponse.json(
        { error: "Branch not in this hotel" },
        { status: 400 },
      );
    }

    const bu = {};
    if (body.is_online !== undefined) bu.is_online = !!body.is_online;
    if (body.is_available !== undefined) bu.is_available = !!body.is_available;
    if (body.price_override !== undefined) {
      bu.price_override =
        body.price_override === null ? null : Number(body.price_override);
    }

    await prisma.branch_menu_items.upsert({
      where: {
        branch_id_menu_item_id: { branch_id: branchId, menu_item_id: id },
      },
      create: { branch_id: branchId, menu_item_id: id, ...bu },
      update: bu,
    });
  }

  // ── 2. Hotel-level fields → menu_items ────────────────────────────
  const hu = {};
  if (body.name !== undefined) hu.name = body.name;
  if (body.description !== undefined) hu.description = body.description || null;
  if (body.image_url !== undefined) hu.image_url = body.image_url || null;
  if (body.base_price !== undefined) hu.base_price = body.base_price;
  if (body.price !== undefined && body.base_price === undefined) {
    // backwards compatibility: if caller still sends `price`, treat as base_price
    hu.base_price = body.price;
  }
  if (body.tax_rate !== undefined) hu.tax_rate = body.tax_rate;
  if (body.is_kitchen !== undefined) hu.is_kitchen = !!body.is_kitchen;
  if (body.prep_station !== undefined)
    hu.prep_station = body.prep_station || null;
  if (body.sort_order !== undefined) hu.sort_order = body.sort_order;
  if (body.category_id !== undefined) {
    if (body.category_id) {
      const cat = await prisma.menu_categories.findFirst({
        where: { id: body.category_id, hotel_id: existing.hotel_id },
      });
      if (!cat)
        return NextResponse.json(
          { error: "Category not found in this hotel" },
          { status: 404 },
        );
    }
    hu.category_id = body.category_id || null;
  }
  if (body.product_category_id !== undefined)
    hu.product_category_id = body.product_category_id || null;

  try {
    if (Object.keys(hu).length > 0) {
      await prisma.menu_items.update({ where: { id }, data: hu });
    }

    const fresh = await prisma.menu_items.findUnique({
      where: { id },
      include: {
        menu_categories: { select: { id: true, name: true } },
        product_category: { select: { id: true, key: true, name: true } },
        branch_items: branchId ? { where: { branch_id: branchId } } : true,
      },
    });
    return NextResponse.json({ item: fresh });
  } catch (err) {
    console.error("Update menu item error:", err);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadItemScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    // branch_menu_items cascade-deletes with the item
    await prisma.menu_items.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete menu item error:", err);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 400 },
    );
  }
}
