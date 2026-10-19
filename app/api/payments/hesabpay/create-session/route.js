import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/payments/hesabpay/create-session
// Body: { hotel_id }
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { hotel_id } = body;
  if (!hotel_id) {
    return NextResponse.json(
      { error: "hotel_id is required" },
      { status: 400 },
    );
  }

  const hotel = await prisma.hotels.findUnique({
    where: { id: hotel_id },
    include: {
      subscription_plans: true,
      hotel_owner: { include: { users: true } },
    },
  });
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  if (
    hotel.subscription_status === "active" &&
    hotel.subscription_expires_at &&
    hotel.subscription_expires_at > new Date()
  ) {
    return NextResponse.json(
      { error: "This hotel is already active", code: "already_active" },
      { status: 409 },
    );
  }

  const plan = hotel.subscription_plans;
  if (!plan) {
    return NextResponse.json(
      { error: "No plan attached to hotel" },
      { status: 400 },
    );
  }

  const apiKey = process.env.HESABPAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Payments are not configured yet" },
      { status: 500 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
          email: hotel.hotel_owner?.users?.email,
          items: [
            {
              id: hotel.id, // ← webhook receives this as reference
              name: `${plan.name} plan — monthly subscription`,
              price: Number(plan.price_monthly),
            },
          ],
          redirect_success_url: `${appUrl}/signup/success?ref=${hotel.id}`,
          redirect_failure_url: `${appUrl}/api/payments/hesabpay/cancelled?id=${hotel.id}`,
        }),
      },
    );

    const data = await res.json().catch(() => null);
    const paymentUrl = data?.url || data?.payment_url;

    if (!res.ok || !data || data.success !== true || !paymentUrl) {
      console.error("HesabPay create-session failed:", res.status, data);
      return NextResponse.json(
        { error: data?.message || "Could not start payment" },
        { status: 502 },
      );
    }

    return NextResponse.json({ payment_url: paymentUrl });
  } catch (err) {
    console.error("HesabPay create-session error:", err);
    return NextResponse.json(
      { error: "Could not start payment" },
      { status: 500 },
    );
  }
}
