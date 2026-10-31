import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

const PLAN_SELECT = {
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
  _count: { select: { hotels: true } },
};

function serializePlan(p: any) {
  const enabled = (p.sections ?? [])
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
    section_keys: enabled.map((s: any) => s.key),
    sections: enabled,
    section_count: enabled.length,
    hotel_count: p._count?.hotels ?? 0,
  };
}

async function resolveSectionIds(keys: string[]) {
  if (!keys.length) return [] as string[];
  const rows = await prisma.sections.findMany({
    where: { key: { in: keys } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
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
  if (q) where.name = { contains: q, mode: "insensitive" };

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
  if (!requireRole(user, ["super_admin"]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  const sectionKeys: string[] = Array.isArray(body.section_keys)
    ? body.section_keys.filter((k: any) => typeof k === "string")
    : [];

  try {
    const sectionIds = await resolveSectionIds(sectionKeys);
    const plan = await prisma.subscription_plans.create({
      data: {
        name: body.name.trim(),
        max_branches: body.max_branches != null ? Number(body.max_branches) : 1,
        max_pos_devices:
          body.max_pos_devices != null ? Number(body.max_pos_devices) : 2,
        price_monthly: body.price_monthly,
        is_active: body.is_active ?? true,
        sections: {
          create: sectionIds.map((id) => ({
            section_id: id,
            is_enabled: true,
          })),
        },
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
