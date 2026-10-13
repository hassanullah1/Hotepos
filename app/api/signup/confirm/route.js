import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { provisionHotelFromSignup } from "@/lib/provisionHotel";
import { sendOwnerWelcomeEmail } from "@/app/admin/email";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// POST /api/signup/confirm
// Body: { ref, transaction_id, success }
//
// Called by /signup/success when HesabPay redirects the customer back.
// HesabPay's return URL carries ?data={"success":true,...,"transaction_id":"..."}
// which is their own confirmation signal. We trust that flag here.
//
// SECURITY NOTE: this endpoint trusts the URL success flag because we don't
// have a documented HesabPay endpoint to verify the transaction server-side.
// In production, ALSO configure the webhook URL in the HesabPay dashboard —
// the webhook is the authoritative source of truth. Both paths are idempotent
// (they no-op if the signup is already 'paid').
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const refMatch = String(body.ref || "").match(UUID_RE);
  const ref = refMatch ? refMatch[0] : "";
  const transaction_id = body.transaction_id || null;
  const success = body.success === true;

  if (!ref) {
    return NextResponse.json({ error: "ref required" }, { status: 400 });
  }
  if (!success) {
    return NextResponse.json(
      { error: "Payment not successful" },
      { status: 400 },
    );
  }

  const signup = await prisma.pending_signups.findUnique({
    where: { id: ref },
  });
  if (!signup) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Idempotent — already provisioned.
  if (signup.status === "paid" && signup.created_hotel_id) {
    return NextResponse.json({ ok: true, already_processed: true });
  }

  try {
    const { hotel, tempPassword } = await provisionHotelFromSignup(signup);

    await prisma.pending_signups.update({
      where: { id: signup.id },
      data: {
        status: "paid",
        paid_at: new Date(),
        created_hotel_id: hotel.id,
        hesabpay_session_id: transaction_id,
        reveal_password: tempPassword,
        reveal_expires_at: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    try {
      await sendOwnerWelcomeEmail({
        to: signup.email,
        ownerName: signup.owner_name,
        hotelName: signup.hotel_name,
        tempPassword,
      });
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr);
    }

    return NextResponse.json({ ok: true, hotel_id: hotel.id });
  } catch (err) {
    console.error("Confirm provisioning failed:", err);
    return NextResponse.json(
      { error: "Could not finalize signup" },
      { status: 500 },
    );
  }
}
