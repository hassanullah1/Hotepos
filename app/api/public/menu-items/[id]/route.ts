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

  // optional province guard
  const { searchParams } = new URL(req.url);
  const provinceIdRaw = (searchParams.get("province_id") || "").trim();
  const provinceId = UUID_RE.test(provinceIdRaw) ? provinceIdRaw : null;

  const item = await prisma.menu_items.findFirst({
    where: {
      id,
      is_available: true,
      is_online: true,
      branches: {
        status: "active",
        hotels: { is_online: true },
        ...(provinceId ? { province_id: provinceId } : {}),
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      image_url: true,
      price: true,
      branch_id: true,
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
          hotels: { select: { id: true, name: true, logo_url: true } },
        },
      },
    },
  });

  if (!item) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

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
    prisma.order_items.count({ where: { menu_item_id: id } }),
  ]);

  return NextResponse.json({
    item: {
      id: item.id,
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      price: Number(item.price),
      currency: item.branches?.currency || "AFN",
      province: item.branches?.provinces
        ? {
            id: item.branches.provinces.id,
            name: item.branches.provinces.name,
          }
        : null,
      branch: {
        id: item.branches?.id || null,
        name: item.branches?.name || "",
        city: item.branches?.city || null,
        address: item.branches?.address || null,
        latitude: num(item.branches?.latitude),
        longitude: num(item.branches?.longitude),
        province_id: item.branches?.province_id || null,
      },
      hotel: {
        id: item.branches?.hotels?.id || null,
        name: item.branches?.hotels?.name || "",
        logo_url: item.branches?.hotels?.logo_url || null,
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
