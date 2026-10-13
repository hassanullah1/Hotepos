import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/signup
// Body: { plan_id, hotel_name, owner_name, email, phone }
// Creates a pending_signups row. Used as the first step before either
// the WhatsApp flow or the HesabPay flow, so both have a real record to
// point back to instead of trusting whatever the client sends at payment
// time.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { plan_id, hotel_name, owner_name, email, phone, channel } = body;

  if (!plan_id) {
    return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
  }
  if (!hotel_name?.trim()) {
    return NextResponse.json({ error: "hotel_name is required" }, { status: 400 });
  }
  if (!owner_name?.trim()) {
    return NextResponse.json({ error: "owner_name is required" }, { status: 400 });
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const plan = await prisma.subscription_plans.findUnique({ where: { id: plan_id } });
  if (!plan || plan.is_active === false) {
    return NextResponse.json({ error: "This plan is not available" }, { status: 404 });
  }

  try {
    const signup = await prisma.pending_signups.create({
      data: {
        subscription_plan_id: plan_id,
        hotel_name: hotel_name.trim(),
        owner_name: owner_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        // "whatsapp_requested" tells the admin approval list this needs a
        // human to confirm payment before provisioning; plain "pending"
        // is for HesabPay signups still waiting on the webhook.
        status: channel === "whatsapp" ? "whatsapp_requested" : "pending",
      },
    });

    return NextResponse.json({ id: signup.id }, { status: 201 });
  } catch (err) {
    console.error("Create pending signup failed:", err);
    return NextResponse.json({ error: "Could not start signup" }, { status: 500 });
  }
}
