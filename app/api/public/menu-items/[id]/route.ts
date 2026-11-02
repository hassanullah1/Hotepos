// app/api/public/menu-items/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n =
    typeof v === "number"
      ? v
      : Number((v as { toString(): string }).toString());
  return Number.isFinite(n) ? n : null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const provinceIdRaw = (searchParams.get("province_id") || "").trim();
  const provinceId = UUID_RE.test(provinceIdRaw) ? provinceIdRaw : null;

  const item = await prisma.menu_items.findFirst({
    where: {
      id,
      is_available: true,
      is_online: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      image_url: true,
      base_price: true,
      hotels: { select: { id: true, name: true, logo_url: true } },
      branch_items: {
        where: {
          is_online: true,
          is_available: true,
          branches: {
            status: "active",
            hotels: { is_online: true },
            ...(provinceId ? { province_id: provinceId } : {}),
          },
        },
        orderBy: [{ sort_order: "asc" }],
        select: {
          price_override: true,
          branches: {
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
              latitude: true,
              longitude: true,
              currency: true,
              province_id: true,
              provinces: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  // No branch offers it (in the requested province) → treat as not found
  if (!item || item.branch_items.length === 0) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const branchItem = item.branch_items[0];
  const branch = branchItem.branches;

  const [agg, reviews, orderCount] = await Promise.all([
    prisma.reviews.aggregate({
      where: { menu_item_id: id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.reviews.findMany({
      where: { menu_item_id: id },
      orderBy: { created_at: "desc" },
      take: 30,
      select: {
        id: true,
        rating: true,
        comment: true,
        created_at: true,
        buyers: { select: { full_name: true } },
      },
    }),
    prisma.order_items.count({
      where: {
        menu_item_id: id,
        orders: { status: { notIn: ["cancelled", "canceled", "void"] } },
      },
    }),
  ]);

  return NextResponse.json({
    item: {
      id: item.id,
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      price: Number(branchItem.price_override ?? item.base_price),
      currency: branch?.currency || "AFN",
      province: branch?.provinces
        ? { id: branch.provinces.id, name: branch.provinces.name }
        : null,
      branch: {
        id: branch?.id || null,
        name: branch?.name || "",
        city: branch?.city || null,
        address: branch?.address || null,
        latitude: num(branch?.latitude),
        longitude: num(branch?.longitude),
        province_id: branch?.province_id || null,
      },
      hotel: {
        id: item.hotels?.id || null,
        name: item.hotels?.name || "",
        logo_url: item.hotels?.logo_url || null,
      },
      avg_rating: agg._avg.rating ? +Number(agg._avg.rating).toFixed(1) : 0,
      review_count: agg._count._all,
      order_count: orderCount,
    },
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      author_name: r.buyers?.full_name || null,
      created_at: r.created_at,
    })),
  });
}
