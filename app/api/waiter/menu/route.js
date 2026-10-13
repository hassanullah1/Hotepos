import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getStaffBranch } from "@/lib/pos-scope";

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getStaffBranch(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const categories = await prisma.menu_categories.findMany({
    where: { branch_id: scope.branchId, is_active: true },
    orderBy: { sort_order: "asc" },
    select: {
      id: true,
      name: true,
      menu_items: {
        where: { is_available: true },
        orderBy: { sort_order: "asc" },
        select: {
          id: true,
          name: true,
          price: true,
          tax_rate: true,
          image_url: true,
        },
      },
    },
  });

  return NextResponse.json({ categories });
}
