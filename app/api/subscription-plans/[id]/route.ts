import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

const PLAN_DETAIL_SELECT = {
  id: true,
  name: true,
  max_branches: true,
  max_pos_devices: true,
  price_monthly: true,
  features: true,
  is_active: true,
  is_rooms: true, // 👈 NEW
  created_at: true,
  hotels: {
    select: {
      id: true,
      name: true,
      slug: true,
      subscription_status: true,
      hotel_owner: {
        select: {
          users: { select: { full_name: true, email: true, phone: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  },
};

function serializePlanDetail(p: any) {
  return {
    id: p.id,
    name: p.name,
    max_branches: p.max_branches,
    max_pos_devices: p.max_pos_devices,
    price_monthly: p.price_monthly,
    features: p.features || {},
    is_active: p.is_active,
    is_rooms: p.is_rooms === true, // 👈 NEW
    created_at: p.created_at,
    hotels: (p.hotels || []).map((h: any) => ({
      id: h.id,
      name: h.name,
      slug: h.slug,
      subscription_status: h.subscription_status,
      owner_name: h.hotel_owner?.users?.full_name ?? null,
      owner_contact:
        h.hotel_owner?.users?.email || h.hotel_owner?.users?.phone || null,
    })),
    hotel_count: p.hotels?.length ?? 0,
    total_monthly_revenue:
      (p.hotels?.length ?? 0) * Number(p.price_monthly || 0),
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const plan = await prisma.subscription_plans.findUnique({
    where: { id },
    select: PLAN_DETAIL_SELECT,
  });
  if (!plan)
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  return NextResponse.json({ plan: serializePlanDetail(plan) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (!body.name.trim()) {
      return NextResponse.json(
        { error: "name cannot be empty" },
        { status: 400 },
      );
    }
    const conflict = await prisma.subscription_plans.findFirst({
      where: {
        name: { equals: body.name.trim(), mode: "insensitive" },
        NOT: { id },
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "A plan with this name already exists" },
        { status: 409 },
      );
    }
    data.name = body.name.trim();
  }
  if (body.price_monthly !== undefined) {
    if (isNaN(Number(body.price_monthly))) {
      return NextResponse.json(
        { error: "price_monthly must be a number" },
        { status: 400 },
      );
    }
    data.price_monthly = body.price_monthly;
  }
  if (body.max_branches !== undefined)
    data.max_branches = Number(body.max_branches);
  if (body.max_pos_devices !== undefined)
    data.max_pos_devices = Number(body.max_pos_devices);
  if (body.features !== undefined)
    data.features =
      body.features && typeof body.features === "object" ? body.features : {};
  if (body.is_active !== undefined) data.is_active = !!body.is_active;

  // 👇 NEW — plan-level rooms feature
  if (body.is_rooms !== undefined) data.is_rooms = body.is_rooms === true;

  try {
    await prisma.subscription_plans.update({ where: { id }, data });
    const plan = await prisma.subscription_plans.findUnique({
      where: { id },
      select: PLAN_DETAIL_SELECT,
    });
    return NextResponse.json({ plan: serializePlanDetail(plan) });
  } catch (err) {
    console.error("Update plan error:", err);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const inUse = await prisma.hotels.count({
    where: { subscription_plan_id: id },
  });
  if (inUse > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete — ${inUse} hotel(s) are currently on this plan. Deactivate it instead.`,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.subscription_plans.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete plan error:", err);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 400 },
    );
  }
}