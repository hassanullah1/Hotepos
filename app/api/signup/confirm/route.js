import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { activateHotel } from "@/lib/provisionHotel";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// POST /api/signup/confirm
// Body: { ref, transaction_id, success }
// ref = hotel_id (success page polls with hotel_id)
//
// Client-side fallback used by /signup/success when the webhook is slow.
// Activates the hotel if it was created in the last 30 min and is still
// expired. This gives users a smooth retry window while preventing
// someone from activating an old abandoned hotel.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const refMatch = String(body.ref || "").match(UUID_RE);
  const ref = refMatch ? refMatch[0] : "";
  const success = body.success === true;

  if (!ref)
    return NextResponse.json({ error: "ref required" }, { status: 400 });
  if (!success) {
    return NextResponse.json(
      { error: "Payment not successful" },
      { status: 400 },
    );
  }

  const hotel = await prisma.hotels.findUnique({ where: { id: ref } });
  if (!hotel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Already active → idempotent
  if (
    hotel.subscription_status === "active" &&
    hotel.subscription_expires_at &&
    hotel.subscription_expires_at > new Date()
  ) {
    return NextResponse.json({ ok: true, already_processed: true });
  }

  // Refuse if hotel was created > 30 min ago and is still expired —
  // the signed webhook is the only trusted source after this window.
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  if (!hotel.created_at || new Date(hotel.created_at) < thirtyMinAgo) {
    return NextResponse.json(
      { error: "Signup expired", code: "signup_expired" },
      { status: 410 },
    );
  }

  try {
    const { resetLinkSent } = await activateHotel(hotel.id);
    return NextResponse.json({
      ok: true,
      hotel_id: hotel.id,
      reset_link_sent: resetLinkSent,
    });
  } catch (err) {
    console.error("Confirm activation failed:", err);
    return NextResponse.json(
      { error: "Could not finalize signup" },
      { status: 500 },
    );
  }
}
