import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

const PLAN_DETAIL_SELECT = {
  id: true,
  name: true,
  max_branches: true,
  max_pos_devices: true,
  price_monthly: true,
  is_active: true,
  created_at: true,
  sections: {
    where: { is_enabled: true },
    select: {
      config: true,
      sections: { select: { key: true, name: true } },
    },
  },
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
  const sections = (p.sections ?? [])
    .map((ps: any) => ({
      key: ps.sections?.key ?? null,
      name: ps.sections?.name ?? null,
      config: ps.config ?? {},
    }))
    .filter((s: any) => s.key);

  return {
    id: p.id,
    name: p.name,
    max_branches: p.max_branches,
    max_pos_devices: p.max_pos_devices,
    price_monthly: p.price_monthly,
    is_active: p.is_active,
    created_at: p.created_at,
    sections,
    section_keys: sections.map((s: any) => s.key),
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
  if (!requireRole(user, ["super_admin"]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  if (!requireRole(user, ["super_admin"]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  if (body.is_active !== undefined) data.is_active = !!body.is_active;

  const wantsSectionsUpdate = Array.isArray(body.section_keys);

  try {
    await prisma.$transaction(async (tx) => {
      if (wantsSectionsUpdate) {
        const keys: string[] = body.section_keys.filter(
          (k: any) => typeof k === "string",
        );
        const sectionRows = keys.length
          ? await tx.sections.findMany({
              where: { key: { in: keys } },
              select: { id: true },
            })
          : [];

        await tx.plan_sections.deleteMany({ where: { plan_id: id } });

        if (sectionRows.length) {
          await tx.plan_sections.createMany({
            data: sectionRows.map((r) => ({
              plan_id: id,
              section_id: r.id,
              is_enabled: true,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (Object.keys(data).length) {
        await tx.subscription_plans.update({ where: { id }, data });
      }
    });

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
  if (!requireRole(user, ["super_admin"]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
