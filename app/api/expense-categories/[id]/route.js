import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getExpenseScope } from "@/lib/expense-scope";

async function loadScopedCategory(id, scope) {
  const category = await prisma.expense_categories.findUnique({ where: { id } });
  if (!category) return null;
  if (!scope.hotelIds.includes(category.hotel_id)) return null;
  return category;
}

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getExpenseScope(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await loadScopedCategory(id, scope);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const data = {};
  if (body.name !== undefined) {
    if (!body.name.trim())
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    data.name = body.name.trim();
  }
  if (body.description !== undefined) data.description = body.description || null;
  if (body.is_active !== undefined) data.is_active = !!body.is_active;

  try {
    const category = await prisma.expense_categories.update({ where: { id }, data });
    return NextResponse.json({ category });
  } catch (err) {
    if (err.code === "P2002")
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
    console.error("Update category error:", err);
    return NextResponse.json({ error: "Failed to update category" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getExpenseScope(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await loadScopedCategory(id, scope);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft-delete: expenses already tagged with this category keep it, they
  // just stop offering it for *new* expenses.
  try {
    await prisma.expense_categories.update({ where: { id }, data: { is_active: false } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Deactivate category error:", err);
    return NextResponse.json({ error: "Failed to remove category" }, { status: 400 });
  }
}
