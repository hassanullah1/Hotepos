import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/payments/hesabpay/create-session
// Body: { pending_signup_id }
//
// Creates a HesabPay payment session for a pending signup and returns the
// URL to redirect the customer to.
//
// Confirmed against HesabPay's own sample code:
//   POST https://api.hesab.com/api/v1/payment/create-session
//   Header: Authorization: API-KEY <your_api_key>
//   Body:   { email?, items: [{ id, name, price }], redirect_success_url?, redirect_failure_url? }
//   Response: { success: true, payment_url } or { success: false, message }
//
// ⚠️ Still unconfirmed: there's no explicit "reference"/"metadata" field in
// HesabPay's documented body, so the pending_signups id is passed as the
// item's `id` instead, on the assumption the webhook payload echoes items
// back. Verify this once you see a real webhook payload (see the webhook
// route's comments) and adjust if HesabPay correlates sessions some other
// way (e.g. a session id you'd need to store and match against instead).
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { pending_signup_id } = body;
  if (!pending_signup_id) {
    return NextResponse.json(
      { error: "pending_signup_id is required" },
      { status: 400 },
    );
  }

  const signup = await prisma.pending_signups.findUnique({
    where: { id: pending_signup_id },
    include: { subscription_plans: true },
  });
  if (!signup) {
    return NextResponse.json({ error: "Signup not found" }, { status: 404 });
  }
  if (signup.status === "paid") {
    return NextResponse.json(
      { error: "This signup has already been paid" },
      { status: 409 },
    );
  }

  const apiKey = process.env.HESABPAY_API_KEY;
  if (!apiKey) {
    console.error("HESABPAY_API_KEY is not set");
    return NextResponse.json(
      { error: "Payments are not configured yet" },
      { status: 500 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const plan = signup.subscription_plans;

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
          email: signup.email,
          items: [
            {
              // Doubling as the correlation id for the webhook — see the
              // ⚠️ note above.
              id: signup.id,
              name: `${plan.name} plan — monthly subscription`,
              price: Number(plan.price_monthly),
            },
          ],
          redirect_success_url: `${appUrl}/signup/success?ref=${signup.id}`,
          redirect_failure_url: `${appUrl}/signup?plan=${plan.id}&payment=failed`,
        }),
      },
    );

    const data = await res.json().catch(() => null);

    // Confirmed from a real response: { success, url, message, expires_at }
    // — not `payment_url` as originally guessed.
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
