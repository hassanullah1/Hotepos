import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/payments/hesabpay/create-session
// Body: { hotel_id }
//
// Starts a HesabPay checkout for a pending hotel signup.
// The webhook is the only thing that activates the hotel after payment —
// this endpoint just gets the buyer to HesabPay's checkout page.
export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { hotel_id } = body || {};
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
      new Date(hotel.subscription_expires_at) > new Date()
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
      console.error("[create-session] HESABPAY_API_KEY missing");
      return NextResponse.json(
        { error: "Payments are not configured yet" },
        { status: 500 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error("[create-session] NEXT_PUBLIC_APP_URL missing");
      return NextResponse.json(
        { error: "App URL not configured" },
        { status: 500 },
      );
    }

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
          // paid=1 lets the success page know the buyer came back from HesabPay.
          // ref is the hotel UUID, which is what the webhook and confirm both use.
          redirect_success_url: `${appUrl}/signup/success?paid=1&ref=${hotel.id}`,
          redirect_failure_url: `${appUrl}/api/payments/hesabpay/cancelled?id=${hotel.id}`,
        }),
      },
    );

    const data = await res.json().catch(() => null);
    const paymentUrl = data?.url || data?.payment_url || data?.checkout_url;

    console.log(
      "[create-session] hesabpay status:",
      res.status,
      "has_url:",
      !!paymentUrl,
    );

    // Only require: HTTP OK + a payment URL. Don't gate on `success === true`
    // because different HesabPay endpoints use different response shapes.
    if (!res.ok || !paymentUrl) {
      console.error("[create-session] failed:", res.status, data);
      return NextResponse.json(
        { error: data?.message || data?.error || "Could not start payment" },
        { status: 502 },
      );
    }

    return NextResponse.json({ payment_url: paymentUrl });
  } catch (err) {
    console.error("[create-session] error:", err);
    return NextResponse.json(
      { error: "Could not start payment" },
      { status: 500 },
    );
  }
}
