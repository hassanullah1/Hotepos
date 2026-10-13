import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

const ALLOWED_MONTHS = [1, 2, 3, 4, 6, 12];

export async function POST(request: Request) {
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
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { plan_id, months } = body;
  if (!plan_id)
    return NextResponse.json({ error: "plan_id is required" }, { status: 400 });

  const monthsNum = Number(months);
  if (!ALLOWED_MONTHS.includes(monthsNum))
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });

  // ── hotel ──
  const owner = await prisma.hotel_owners.findFirst({
    where: { user_id: payload.userId },
    select: {
      hotel_id: true,
      hotels: { select: { id: true } },
    },
  });
  const hotel = owner?.hotels;
  if (!hotel)
    return NextResponse.json(
      { error: "No hotel linked to this account" },
      { status: 404 },
    );

  // ── plan ──
  const plan = await prisma.subscription_plans.findUnique({
    where: { id: plan_id },
  });
  if (!plan || plan.is_active === false)
    return NextResponse.json({ error: "Plan not available" }, { status: 404 });
  if (plan.price_monthly === null || plan.price_monthly === undefined)
    return NextResponse.json(
      { error: "This plan uses custom pricing — please use WhatsApp." },
      { status: 400 },
    );

  // ── eligibility ──
  const branchCount = await prisma.branches.count({
    where: { hotel_id: hotel.id },
  });
  const posCount = await prisma.pos_devices.count({
    where: { branches: { hotel_id: hotel.id }, is_active: true },
  });

  if (plan.max_branches != null && branchCount > plan.max_branches)
    return NextResponse.json(
      {
        error: `Your account has ${branchCount} branches, but ${plan.name} only allows ${plan.max_branches}.`,
      },
      { status: 400 },
    );
  if (plan.max_pos_devices != null && posCount > plan.max_pos_devices)
    return NextResponse.json(
      {
        error: `Your account has ${posCount} active POS devices, but ${plan.name} only allows ${plan.max_pos_devices}.`,
      },
      { status: 400 },
    );

  const apiKey = process.env.HESABPAY_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: "Payments not configured" },
      { status: 500 },
    );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const total = Number(plan.price_monthly) * monthsNum;

  const user = await prisma.users.findUnique({
    where: { id: payload.userId },
    select: { email: true },
  });

  // ── The item.id is the hotel_id — already a UUID, accepted by HesabPay.
  //    The plan and months travel in the redirect URL instead of being
  //    stored in a DB column.
  const redirectUrl =
    `${appUrl}/admin/renew?status=paid` +
    `&ref=${hotel.id}` +
    `&plan=${plan.id}` +
    `&months=${monthsNum}`;

  try {
    const res = await fetch(
      "https://api.hesab.com/api/v1/payment/create-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `API-KEY ${apiKey}`,
        },
        body: JSON.stringify({
          email: user?.email || undefined,
          items: [
            {
              id: hotel.id, // plain UUID — accepted by HesabPay
              name: `${plan.name} — renewal (${monthsNum} ${
                monthsNum === 1 ? "month" : "months"
              })`,
              price: total,
            },
          ],
          redirect_success_url: redirectUrl,
          redirect_failure_url: `${appUrl}/admin/renew?status=failed`,
        }),
      },
    );

    const data = await res.json().catch(() => null);
    const paymentUrl = data?.url || data?.payment_url;

    if (!res.ok || !data || data.success !== true || !paymentUrl) {
      console.error(
        "HesabPay renewal create-session failed:",
        res.status,
        data,
      );
      return NextResponse.json(
        { error: data?.message || "Could not start payment" },
        { status: 502 },
      );
    }

    return NextResponse.json({ payment_url: paymentUrl });
  } catch (err) {
    console.error("HesabPay renewal error:", err);
    return NextResponse.json(
      { error: "Could not start payment" },
      { status: 500 },
    );
  }
}
