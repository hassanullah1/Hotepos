import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public: anyone can view active plans, no auth. Cheapest first.
export async function GET() {
  try {
    const plans = await prisma.subscription_plans.findMany({
      where: { is_active: true },
      orderBy: { price_monthly: "asc" },
      select: {
        id: true,
        name: true,
        price_monthly: true,
        max_branches: true,
        max_pos_devices: true,
        is_active: true,
        sections: {
          where: { is_enabled: true },
          select: {
            config: true,
            sections: {
              select: {
                key: true,
                name: true,
                description: true,
                sort_order: true,
                is_active: true,
              },
            },
          },
        },
      },
    });

    const shaped = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price_monthly:
        plan.price_monthly === null ? null : Number(plan.price_monthly),
      max_branches: plan.max_branches,
      max_pos_devices: plan.max_pos_devices,
      is_active: plan.is_active,
      sections: (plan.sections ?? [])
        .filter((ps) => ps.sections?.key && ps.sections.is_active !== false)
        .map((ps) => ({
          key: ps.sections.key,
          name: ps.sections.name,
          description: ps.sections.description ?? null,
          sort_order: ps.sections.sort_order ?? 0,
        }))
        .sort((a, b) => a.sort_order - b.sort_order),
    }));

    return NextResponse.json(
      { plans: shaped },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    console.error("GET /api/public/subscription-plans failed", err);
    return NextResponse.json(
      { error: "Could not load plans" },
      { status: 500 },
    );
  }
}
