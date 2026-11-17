import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /mobileapp/menu
 *
 * Returns the mobile menu for the logged-in waiter's branch:
 *  - categories are hotel-level (menu_categories.hotel_id)
 *  - items are hotel-level, but filtered/repriced per branch
 *    using branch_menu_items (price_override, is_available, is_online)
 *
 * Response:
 * {
 *   categories: [
 *     { id, name, menu_items: [
 *        { id, name, description, image_url, price, tax_rate,
 *          is_kitchen, prep_station, is_available, is_online }
 *     ]}
 *   ]
 * }
 */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user || !user.branch_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const branch = await prisma.branches.findUnique({
    where: { id: user.branch_id },
    select: { id: true, hotel_id: true },
  });
  if (!branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  const categories = await prisma.menu_categories.findMany({
    where: { hotel_id: branch.hotel_id, is_active: true },
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      menu_items: {
        orderBy: [{ sort_order: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          image_url: true,
          base_price: true,
          tax_rate: true,
          is_kitchen: true,
          prep_station: true,
          is_available: true,
          is_online: true,
          sort_order: true,
          branch_items: {
            where: { branch_id: branch.id },
            select: {
              price_override: true,
              is_available: true,
              is_online: true,
            },
          },
        },
      },
    },
  });

  const payload = categories.map((c) => ({
    id: c.id,
    name: c.name,
    menu_items: c.menu_items
      // hide items the branch has explicitly turned off
      .filter((i) => {
        const bi = i.branch_items[0];
        if (bi && bi.is_available === false) return false;
        if (!bi && i.is_available === false) return false;
        return true;
      })
      .map((i) => {
        const bi = i.branch_items[0];
        const effectivePrice =
          bi?.price_override != null ? bi.price_override : i.base_price;
        return {
          id: i.id,
          name: i.name,
          description: i.description,
          image_url: i.image_url,
          price: Number(effectivePrice).toString(), // mobile type expects string
          tax_rate: Number(i.tax_rate ?? 0).toString(),
          is_kitchen: i.is_kitchen ?? false,
          prep_station: i.prep_station,
          is_available: bi?.is_available ?? i.is_available ?? true,
          is_online: bi?.is_online ?? i.is_online ?? false,
        };
      }),
  }));

  return NextResponse.json({ categories: payload });
}