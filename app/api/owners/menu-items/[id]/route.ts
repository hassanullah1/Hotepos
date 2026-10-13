import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ownsHotel } from "@/lib/owner-scope";

async function loadItemScoped(id: string, userId: string) {
  const item = await prisma.menu_items.findUnique({
    where: { id },
    include: { branches: true },
  });
  if (!item) return null;
  const owns = await ownsHotel(userId, item.branches.hotel_id);
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

  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined)
    data.description = body.description || null;
  if (body.image_url !== undefined) data.image_url = body.image_url || null;
  if (body.price !== undefined) data.price = body.price;
  if (body.tax_rate !== undefined) data.tax_rate = body.tax_rate;
  if (body.is_available !== undefined) data.is_available = !!body.is_available;
  if (body.is_online !== undefined) data.is_online = !!body.is_online;
  if (body.is_kitchen !== undefined) data.is_kitchen = !!body.is_kitchen;
  if (body.prep_station !== undefined)
    data.prep_station = body.prep_station || null;
  if (body.sort_order !== undefined) data.sort_order = body.sort_order;

  if (body.category_id !== undefined) {
    if (body.category_id) {
      const cat = await prisma.menu_categories.findFirst({
        where: { id: body.category_id, branch_id: existing.branch_id },
      });
      if (!cat)
        return NextResponse.json(
          { error: "Category not found in this branch" },
          { status: 404 },
        );
    }
    data.category_id = body.category_id || null;
  }

  try {
    const item = await prisma.menu_items.update({ where: { id }, data });
    return NextResponse.json({ item });
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