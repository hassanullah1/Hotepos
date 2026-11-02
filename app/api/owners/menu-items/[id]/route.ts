// /api/owners/menu-items/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ownsHotel } from "@/lib/owner-scope";
import type { Prisma } from "@/generated/prisma";

async function loadItemScoped(id: string, userId: string) {
  const item = await prisma.menu_items.findUnique({
    where: { id },
    select: { id: true, hotel_id: true },
  });
  if (!item) return null;
  const owns = await ownsHotel(userId, item.hotel_id);
  if (!owns) return null;
  return item;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadItemScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  // ── 1. Branch-scoped fields → branch_menu_items ──────────────────
  const branchId: string | undefined = body.branch_id;
  const hasBranchFields =
    branchId &&
    (body.is_online !== undefined ||
      body.is_available !== undefined ||
      body.price_override !== undefined);

  if (hasBranchFields) {
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

    const bu: Prisma.branch_menu_itemsUncheckedUpdateInput = {};
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
  const hu: Prisma.menu_itemsUncheckedUpdateInput = {};
  if (body.name !== undefined) hu.name = body.name;
  if (body.description !== undefined) hu.description = body.description || null;
  if (body.image_url !== undefined) hu.image_url = body.image_url || null;
  if (body.base_price !== undefined) hu.base_price = body.base_price;
  if (body.price !== undefined && body.base_price === undefined) {
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

  // ── unit fields ──────────────────────────────────────────────────
  if (body.unit_id !== undefined) {
    const newUnitId = body.unit_id || null;
    hu.unit_id = newUnitId;
    // clear quantity when unit is removed (unless caller sent an explicit value)
    if (newUnitId === null && body.unit_quantity === undefined) {
      hu.unit_quantity = null;
    }
  }
  if (body.unit_quantity !== undefined) {
    hu.unit_quantity =
      body.unit_quantity === null ||
      body.unit_quantity === "" ||
      body.unit_quantity === undefined
        ? null
        : Number(body.unit_quantity);
  }

  try {
    if (Object.keys(hu).length > 0) {
      await prisma.menu_items.update({ where: { id }, data: hu });
    }

    const fresh = await prisma.menu_items.findUnique({
      where: { id },
      include: {
        menu_categories: { select: { id: true, name: true } },
        product_category: { select: { id: true, key: true, name: true } },
        unit: { select: { id: true, name: true, short_name: true } },
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadItemScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
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
