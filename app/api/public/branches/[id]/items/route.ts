import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(
    60,
    Math.max(1, Number(searchParams.get("limit") || 20)),
  );
  const skip = (page - 1) * limit;
  const categoryId = searchParams.get("category_id") || "all";
  const q = (searchParams.get("q") || "").trim();

  const branch = await prisma.branches.findFirst({
    where: { id, status: "active", hotels: { is_online: true } },
    select: { id: true },
  });
  if (!branch)
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const where: any = {
    branch_id: id,
    is_available: true,
    is_online: true,
  };

  if (categoryId === "__uncategorized__") {
    where.category_id = null;
  } else if (categoryId !== "all") {
    where.category_id = categoryId;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await prisma.$transaction([
    prisma.menu_items.count({ where }),
    prisma.menu_items.findMany({
      where,
      orderBy: [{ sort_order: "asc" }, { name: "asc" }],
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        image_url: true,
        price: true,
        category_id: true,
      },
    }),
  ]);

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      image_url: i.image_url,
      price: Number(i.price),
      category_id: i.category_id,
    })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
