import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export async function POST(request: Request) {
  try {
    // ── auth ──
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!payload?.userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── body ──
    const body = await request.json().catch(() => ({}));

    const refMatch = String(body.ref || "").match(UUID_RE);
    const hotelId = refMatch ? refMatch[0] : "";

    const planMatch = String(body.plan || "").match(UUID_RE);
    const planId = planMatch ? planMatch[0] : "";

    const monthsNum = parseInt(String(body.months ?? ""), 10);

    if (!hotelId || !planId || !Number.isFinite(monthsNum) || monthsNum < 1)
      return NextResponse.json({ error: "Bad params" }, { status: 400 });

    // ── ownership ──
    const owner = await prisma.hotel_owners.findFirst({
      where: { user_id: payload.userId, hotel_id: hotelId },
      select: { hotel_id: true },
    });
    if (!owner)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // ── load hotel ──
    const hotel = await prisma.hotels.findUnique({
      where: { id: hotelId },
      select: {
        id: true,
        subscription_expires_at: true,
        subscription_plan_id: true,
      },
    });
    if (!hotel)
      return NextResponse.json({ error: "Unknown hotel" }, { status: 404 });

    // ── plan ──
    const plan = await prisma.subscription_plans.findUnique({
      where: { id: planId },
      select: { max_branches: true, max_pos_devices: true, name: true },
    });
    if (!plan)
      return NextResponse.json({ error: "Unknown plan" }, { status: 404 });

    // ── eligibility re-check ──
    const branchCount = await prisma.branches.count({
      where: { hotel_id: hotelId },
    });
    const posCount = await prisma.pos_devices.count({
      where: { branches: { hotel_id: hotelId }, is_active: true },
    });

    if (plan.max_branches != null && branchCount > plan.max_branches)
      return NextResponse.json(
        { error: `${plan.name} only allows ${plan.max_branches} branches` },
        { status: 400 },
      );
    if (plan.max_pos_devices != null && posCount > plan.max_pos_devices)
      return NextResponse.json(
        {
          error: `${plan.name} only allows ${plan.max_pos_devices} POS devices`,
        },
        { status: 400 },
      );

    const now = new Date();
    const current = hotel.subscription_expires_at
      ? new Date(hotel.subscription_expires_at)
      : null;

    // ── idempotency heuristic ──
    // If expiry is already ~"months" ahead AND plan matches, this exact
    // renewal was already applied (webhook retry, page refresh, etc.)
    const threshold = new Date(now.getTime() + (monthsNum - 0.5) * 30 * 864e5);
    const planChanged = hotel.subscription_plan_id !== planId;

    if (current && !planChanged && current > threshold) {
      return NextResponse.json({ ok: true, already_applied: true });
    }

    // ── atomic extend ──
    // Only ONE caller can win the race — the WHERE requires the hotel to
    // still be "not yet extended". Concurrent calls: second one gets count=0.
    const base = current && current.getTime() > now.getTime() ? current : now;
    const newExpiry = new Date(base);
    newExpiry.setMonth(newExpiry.getMonth() + monthsNum);

    const updated = await prisma.hotels.updateMany({
      where: {
        id: hotelId,
        OR: [
          { subscription_expires_at: { lt: threshold } },
          { subscription_expires_at: null },
        ],
      },
      data: {
        subscription_status: "active",
        subscription_expires_at: newExpiry,
        subscription_plan_id: planId,
      },
    });

    if (updated.count === 0) {
      // Someone else already applied this renewal
      return NextResponse.json({ ok: true, already_applied: true });
    }

    console.log(
      "[renew/confirm] ✅ renewed hotel:",
      hotelId,
      "plan:",
      planId,
      "months:",
      monthsNum,
      "new_expiry:",
      newExpiry.toISOString(),
    );

    return NextResponse.json({
      ok: true,
      new_expiry: newExpiry.toISOString(),
      plan_id: planId,
    });
  } catch (err) {
    console.error("[renew/confirm] fatal:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
