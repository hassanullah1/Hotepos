import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createExpiredHotel } from "@/lib/provisionHotel";

// POST /api/signup
// Body: { plan_id, hotel_name, owner_name, email, phone, channel, verification_id }
//
// channel = "hesabpay" → verifies email, checks the email isn't already
//                        registered, creates the hotel DIRECTLY
//                        (status="expired", owner with no password).
//                        Returns { hotel_id }.
// channel = "whatsapp" → verifies email, checks the email isn't already
//                        registered, creates a pending_signups row.
//                        Returns { signup_id }.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    plan_id,
    hotel_name,
    owner_name,
    email,
    phone,
    channel,
    verification_id,
  } = body;

  if (!verification_id) {
    return NextResponse.json({ error: "Email not verified" }, { status: 400 });
  }
  if (
    !plan_id ||
    !hotel_name?.trim() ||
    !owner_name?.trim() ||
    !email?.trim()
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // ── 1. Verify email proof ────────────────────────────────
    const proof = await prisma.email_verifications.findUnique({
      where: { id: verification_id },
    });
    if (!proof || !proof.verified_at) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 400 },
      );
    }
    if (proof.email !== normalizedEmail) {
      return NextResponse.json(
        { error: "Verification does not match email" },
        { status: 400 },
      );
    }

    // ── 2. Check if email is already registered ─────────────
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      include: {
        hotel_owners: {
          include: {
            hotels: {
              select: {
                id: true,
                subscription_status: true,
                subscription_expires_at: true,
              },
            },
          },
        },
      },
    });

    if (existingUser) {
      const existingHotel = existingUser.hotel_owners?.[0]?.hotels;

      // (a) Has an active subscription → block
      if (
        existingHotel &&
        existingHotel.subscription_status === "active" &&
        existingHotel.subscription_expires_at &&
        new Date(existingHotel.subscription_expires_at) > new Date()
      ) {
        return NextResponse.json(
          {
            error:
              "This email already has an active subscription. Please log in to manage or renew your account.",
            code: "email_already_active",
          },
          { status: 409 },
        );
      }

      // (b) Real user account (has password) → block
      if (existingUser.password_hash) {
        return NextResponse.json(
          {
            error:
              "This email is already registered. Please log in, or use Forgot password if you don't remember it.",
            code: "email_registered",
          },
          { status: 409 },
        );
      }

      // (c) Otherwise: email exists but no password AND no active hotel
      //     → previous abandoned signup. Allow retry — createExpiredHotel
      //     will reuse the existing hotel if one is linked.
    }

    // ── 3. Validate plan ────────────────────────────────────
    const plan = await prisma.subscription_plans.findUnique({
      where: { id: plan_id },
    });
    if (!plan || plan.is_active === false) {
      return NextResponse.json(
        { error: "This plan is not available" },
        { status: 404 },
      );
    }

    // ── 4. HesabPay: create hotel + owner now ───────────────
    const isHesabPay = channel !== "whatsapp";

    if (isHesabPay) {
      const { hotel } = await createExpiredHotel({
        hotel_name,
        owner_name,
        email: normalizedEmail,
        phone,
        subscription_plan_id: plan_id,
      });

      return NextResponse.json({ hotel_id: hotel.id }, { status: 201 });
    }

    // ── 5. WhatsApp: pending_signup for admin approval ──────
    const signup = await prisma.pending_signups.create({
      data: {
        subscription_plan_id: plan_id,
        hotel_name: hotel_name.trim(),
        owner_name: owner_name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        status: "whatsapp_requested",
      },
    });

    return NextResponse.json({ signup_id: signup.id }, { status: 201 });
  } catch (err) {
    console.error("Create signup failed:", err);
    return NextResponse.json(
      { error: "Could not start signup" },
      { status: 500 },
    );
  }
}
