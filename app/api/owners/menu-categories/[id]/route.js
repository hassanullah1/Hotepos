// /api/owners/menu-categories/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ownsHotel } from "@/lib/owner-scope";

async function loadScoped(id, userId) {
  const cat = await prisma.menu_categories.findUnique({
    where: { id },
    select: { id: true, hotel_id: true },
  });
  if (!cat) return null;
  const owns = await ownsHotel(userId, cat.hotel_id);
  if (!owns) return null;
  return cat;
}

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const data = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.sort_order !== undefined) data.sort_order = body.sort_order;
  if (body.is_active !== undefined) data.is_active = !!body.is_active;
  if (body.default_product_category_id !== undefined)
    data.default_product_category_id = body.default_product_category_id || null;

  try {
    const category = await prisma.menu_categories.update({
      where: { id },
      data,
    });
    return NextResponse.json({ category });
  } catch (err) {
    console.error("Update category error:", err);
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.menu_categories.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete category error:", err);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 400 },
    );
  }
}
