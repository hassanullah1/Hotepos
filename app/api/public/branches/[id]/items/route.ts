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
    where: {
      id,
      OR: [{ status: "active" }, { status: null }],
      hotels: { is_online: true },
    },
    select: { id: true },
  });
  if (!branch) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // ── Filters match /api/public/menu-items exactly:
  //    bmi.is_online, bmi.is_available, branch active (or NULL),
  //    hotel online. NO mi.is_online / mi.is_available — those were
  //    dropped from the listing on purpose, so they must be dropped
  //    here too or the grid will silently show 0.
  // ──
  const menuItemWhere: any = {};

  if (categoryId === "__uncategorized__") {
    menuItemWhere.category_id = null;
  } else if (categoryId !== "all") {
    menuItemWhere.category_id = categoryId;
  }

  if (q) {
    menuItemWhere.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const where: any = {
    branch_id: id,
    is_online: true,
    is_available: true,
  };
  if (Object.keys(menuItemWhere).length > 0) {
    where.menu_item = menuItemWhere;
  }

  const [total, rows] = await prisma.$transaction([
    prisma.branch_menu_items.count({ where }),
    prisma.branch_menu_items.findMany({
      where,
      orderBy: [{ sort_order: "asc" }, { menu_item: { name: "asc" } }],
      skip,
      take: limit,
      select: {
        menu_item_id: true,
        price_override: true,
        menu_item: {
          select: {
            id: true,
            name: true,
            description: true,
            image_url: true,
            base_price: true,
            category_id: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.menu_item.id,
      name: r.menu_item.name,
      description: r.menu_item.description,
      image_url: r.menu_item.image_url,
      price: Number(r.price_override ?? r.menu_item.base_price),
      category_id: r.menu_item.category_id,
    })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
