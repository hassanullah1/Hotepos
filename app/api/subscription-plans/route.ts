import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

const PLAN_SELECT = {
  id: true,
  name: true,
  max_branches: true,
  max_pos_devices: true,
  price_monthly: true,
  features: true,
  is_active: true,
  is_rooms: true, // 👈 NEW
  created_at: true,
  _count: { select: { hotels: true } },
};

function serializePlan(p: any) {
  return {
    id: p.id,
    name: p.name,
    max_branches: p.max_branches,
    max_pos_devices: p.max_pos_devices,
    price_monthly: p.price_monthly,
    features: p.features || {},
    is_active: p.is_active,
    is_rooms: p.is_rooms === true, // 👈 NEW
    hotel_count: p._count?.hotels ?? 0,
    created_at: p.created_at,
  };
}

// GET /api/subscription-plans?q=basic&include_inactive=1
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const includeInactive = searchParams.get("include_inactive") === "1";

  const where: any = {};
  if (!includeInactive || !requireRole(user, ["super_admin"])) {
    where.is_active = true;
  }
  if (q) {
    where.name = { contains: q, mode: "insensitive" };
  }

  const plans = await prisma.subscription_plans.findMany({
    where,
    select: PLAN_SELECT,
    orderBy: { price_monthly: "asc" },
  });

  return NextResponse.json({ plans: plans.map(serializePlan) });
}

// POST /api/subscription-plans
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.name || body.name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (
    body.price_monthly === undefined ||
    body.price_monthly === null ||
    isNaN(Number(body.price_monthly))
  ) {
    return NextResponse.json(
      { error: "price_monthly must be a number" },
      { status: 400 },
    );
  }

  const existing = await prisma.subscription_plans.findFirst({
    where: { name: { equals: body.name.trim(), mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A plan with this name already exists" },
      { status: 409 },
    );
  }

  try {
    const plan = await prisma.subscription_plans.create({
      data: {
        name: body.name.trim(),
        max_branches: body.max_branches != null ? Number(body.max_branches) : 1,
        max_pos_devices:
          body.max_pos_devices != null ? Number(body.max_pos_devices) : 2,
        price_monthly: body.price_monthly,
        features:
          body.features && typeof body.features === "object"
            ? body.features
            : {},
        is_active: body.is_active ?? true,
        is_rooms: body.is_rooms === true, // 👈 NEW
      },
      select: PLAN_SELECT,
    });
    return NextResponse.json({ plan: serializePlan(plan) }, { status: 201 });
  } catch (err) {
    console.error("Create plan error:", err);
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 400 },
    );
  }
}