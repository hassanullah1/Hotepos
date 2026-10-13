import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBuyerFromRequest } from "@/lib/buyer-auth";

type Line = { menu_item_id: string; rating: number; comment?: string };

export async function POST(request: Request) {
  const buyer = await getBuyerFromRequest(request);
  if (!buyer) {
    return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const token = typeof body.order_token === "string" ? body.order_token : "";
  if (!token) {
    return NextResponse.json(
      { error: "ORDER_TOKEN_REQUIRED" },
      { status: 400 },
    );
  }

  const lines = Array.isArray(body.reviews)
    ? (body.reviews as Line[]).filter(
        (l) =>
          l &&
          typeof l.menu_item_id === "string" &&
          Number.isInteger(l.rating) &&
          l.rating >= 1 &&
          l.rating <= 5,
      )
    : [];

  if (!lines.length) {
    return NextResponse.json({ error: "NO_REVIEWS" }, { status: 400 });
  }

  const order = await prisma.orders.findFirst({
    where: { public_token: token },
    select: {
      id: true,
      branch_id: true,
      buyer_id: true,
      status: true,
      order_items: { select: { menu_item_id: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  }

  // Only the buyer who placed the order can review it
  if (order.buyer_id !== buyer.buyerId) {
    return NextResponse.json({ error: "NOT_YOUR_ORDER" }, { status: 403 });
  }

  if (!["paid", "closed", "served"].includes(order.status)) {
    return NextResponse.json({ error: "ORDER_NOT_COMPLETED" }, { status: 400 });
  }

  // Reviews only for items actually in the order
  const orderedItemIds = new Set(order.order_items.map((i) => i.menu_item_id));
  const valid = lines.filter((l) => orderedItemIds.has(l.menu_item_id));

  if (!valid.length) {
    return NextResponse.json({ error: "NO_VALID_ITEMS" }, { status: 400 });
  }

  // Prevent double-reviewing the same item on the same order
  const existing = await prisma.reviews.findMany({
    where: {
      order_id: order.id,
      buyer_id: buyer.buyerId,
      menu_item_id: { in: valid.map((l) => l.menu_item_id) },
    },
    select: { menu_item_id: true },
  });
  const alreadyReviewed = new Set(existing.map((r) => r.menu_item_id));
  const toCreate = valid.filter((l) => !alreadyReviewed.has(l.menu_item_id));

  if (!toCreate.length) {
    return NextResponse.json({ error: "ALREADY_REVIEWED" }, { status: 409 });
  }

  const created = await prisma.$transaction(
    toCreate.map((l) =>
      prisma.reviews.create({
        data: {
          menu_item_id: l.menu_item_id,
          branch_id: order.branch_id,
          order_id: order.id,
          buyer_id: buyer.buyerId,
          rating: l.rating,
          comment: l.comment?.trim() || null,
        },
        select: { id: true, rating: true, menu_item_id: true },
      }),
    ),
  );

  return NextResponse.json({ reviews: created }, { status: 201 });
}
