import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user || !user.branch_id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.menu_categories.findMany({
    where: { branch_id: user.branch_id, is_active: true },
    orderBy: { sort_order: "asc" },
    include: {
      menu_items: {
        where: { is_available: true },
        orderBy: { sort_order: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          image_url: true,
          price: true,
          tax_rate: true,
          is_kitchen: true,
          prep_station: true,
        },
      },
    },
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      menu_items: c.menu_items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        image_url: i.image_url,
        price: i.price.toString(),
        tax_rate: i.tax_rate?.toString() ?? "0",
        is_kitchen: i.is_kitchen,
        prep_station: i.prep_station,
      })),
    })),
  });
}
