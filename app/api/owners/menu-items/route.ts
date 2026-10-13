import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { assertManagedBranch } from "@/lib/owner-scope";

const ITEM_SELECT = {
  id: true,
  name: true,
  description: true,
  image_url: true,
  price: true,
  tax_rate: true,
  is_available: true,
  is_online: true,
  is_kitchen: true,
  prep_station: true,
  sort_order: true,
  category_id: true,
  menu_categories: { select: { id: true, name: true } },
};

function serialize(i: any) {
  return {
    id: i.id,
    name: i.name,
    description: i.description,
    image_url: i.image_url,
    price: i.price,
    tax_rate: i.tax_rate,
    is_available: i.is_available,
    is_online: i.is_online ?? false,
    is_kitchen: i.is_kitchen,
    prep_station: i.prep_station,
    sort_order: i.sort_order,
    category: i.menu_categories,
  };
}

export async function GET(request: Request) {
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

  const where: any = { branch_id: branchId };
  if (categoryId) where.category_id = categoryId;
  if (q) where.name = { contains: q, mode: "insensitive" };

  const items = await prisma.menu_items.findMany({
    where,
    select: ITEM_SELECT,
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ items: items.map(serialize) });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.branch_id || !body.name || body.price === undefined) {
    return NextResponse.json(
      { error: "branch_id, name and price are required" },
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
      where: { id: body.category_id, branch_id: body.branch_id },
    });
    if (!cat)
      return NextResponse.json(
        { error: "Category not found in this branch" },
        { status: 404 },
      );
  }

  try {
    const item = await prisma.menu_items.create({
      data: {
        branch_id: body.branch_id,
        category_id: body.category_id || null,
        name: body.name,
        description: body.description || null,
        image_url: body.image_url || null,
        price: body.price,
        tax_rate: body.tax_rate ?? 0,
        is_available: body.is_available ?? true,
        is_online: body.is_online === true,
        is_kitchen: body.is_kitchen ?? true,
        prep_station: body.prep_station || null,
        sort_order: body.sort_order ?? 0,
      },
      select: ITEM_SELECT,
    });
    return NextResponse.json({ item: serialize(item) }, { status: 201 });
  } catch (err) {
    console.error("Create menu item error:", err);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 400 },
    );
  }
}