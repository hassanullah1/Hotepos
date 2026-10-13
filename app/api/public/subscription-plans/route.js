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
        features: true,
      },
    });

    const shaped = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price_monthly: plan.price_monthly === null ? null : Number(plan.price_monthly),
      max_branches: plan.max_branches,
      max_pos_devices: plan.max_pos_devices,
      features: normalizeFeatures(plan.features),
    }));

    return NextResponse.json(
      { plans: shaped },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (err) {
    console.error("GET /api/public/subscription-plans failed", err);
    return NextResponse.json({ error: "Could not load plans" }, { status: 500 });
  }
}

// `features` is a free-form Json column. Accepts either a plain array
// (["24/7 support", "Custom reports"]) or an object of booleans/strings
// ({ support_247: true, custom_reports: true }) and always returns an
// array of display strings so the frontend never has to branch on shape.
function normalizeFeatures(features) {
  if (Array.isArray(features)) return features;
  if (features && Array.isArray(features.list)) return features.list;
  if (features && typeof features === "object") {
    return Object.entries(features)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => (typeof value === "string" ? value : key.replace(/_/g, " ")));
  }
  return [];
}
