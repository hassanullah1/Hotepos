import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const ACTIVE_STATUSES = ["open", "in_progress", "served", "ready"];
const COMPLETED_STATUSES = ["paid", "closed", "completed"];
const CANCELLED_STATUSES = ["cancelled", "rejected"];

function scopedWhere(user: any, { branchId, hotelId }: any) {
  const w: any = { source: "customer" };

  if (branchId) {
    w.branch_id = branchId;
  } else if (hotelId) {
    w.branches = { hotel_id: hotelId };
  } else if (user.role === "branch_manager" && user.branch_id) {
    w.branch_id = user.branch_id;
  } else if (user.hotel_id) {
    w.branches = { hotel_id: user.hotel_id };
  }

  return w;
}

function withFilter(w: any, filter: string) {
  const out = { ...w };
  if (filter === "active") out.status = { in: ACTIVE_STATUSES };
  else if (filter === "completed") out.status = { in: COMPLETED_STATUSES };
  else if (filter === "cancelled") out.status = { in: CANCELLED_STATUSES };
  else if (filter === "unpaid") out.payment_status = { not: "paid" };
  else if (filter === "refunded") out.payment_status = "refunded";
  return out;
}

function withSearch(w: any, q: string) {
  if (!q) return w;
  return {
    ...w,
    OR: [
      { order_number: { contains: q, mode: "insensitive" } },
      { buyers: { full_name: { contains: q, mode: "insensitive" } } },
      { buyers: { phone: { contains: q, mode: "insensitive" } } },
      { buyers: { email: { contains: q, mode: "insensitive" } } },
      { branches: { name: { contains: q, mode: "insensitive" } } },
      { branches: { city: { contains: q, mode: "insensitive" } } },
      {
        online_details: {
          delivery_address: { contains: q, mode: "insensitive" },
        },
      },
    ],
  };
}

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id") || "";
  const hotelId = searchParams.get("hotel_id") || "";
  const filter = searchParams.get("filter") || "all";
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(5, parseInt(searchParams.get("pageSize") || "25", 10)),
  );

  const scoped = scopedWhere(user, { branchId, hotelId });
  const searched = withSearch(scoped, q);
  const finalWhere = withFilter(searched, filter);

  const [orders, total, countsArr, revenueAgg] = await Promise.all([
    prisma.orders.findMany({
      where: finalWhere,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        branches: {
          select: { id: true, name: true, city: true, currency: true },
        },
        buyers: {
          select: { id: true, full_name: true, phone: true, email: true },
        },
        order_items: {
          include: {
            menu_items: { select: { id: true, name: true, image_url: true } },
          },
        },
        online_details: true,
      },
    }),
    prisma.orders.count({ where: finalWhere }),
    Promise.all([
      prisma.orders.count({ where: withFilter(searched, "all") }),
      prisma.orders.count({ where: withFilter(searched, "active") }),
      prisma.orders.count({ where: withFilter(searched, "completed") }),
      prisma.orders.count({ where: withFilter(searched, "cancelled") }),
      prisma.orders.count({ where: withFilter(searched, "refunded") }),
      prisma.orders.count({ where: withFilter(searched, "unpaid") }),
    ]),
    prisma.orders.aggregate({
      where: withFilter(searched, "completed"),
      _sum: { total_amount: true },
      _count: { id: true },
    }),
  ]);

  const [
    allCount,
    activeCount,
    completedCount,
    cancelledCount,
    refundedCount,
    unpaidCount,
  ] = countsArr;

  return NextResponse.json({
    orders,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    counts: {
      all: allCount,
      active: activeCount,
      completed: completedCount,
      cancelled: cancelledCount,
      refunded: refundedCount,
      unpaid: unpaidCount,
    },
    stats: {
      totalRevenue: Number(revenueAgg._sum.total_amount || 0),
      completedOrders: revenueAgg._count.id || 0,
    },
  });
}