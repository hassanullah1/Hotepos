import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// POST /api/signup/confirm
// Body: { ref }  — hotel_id
//
// READ-ONLY. The webhook is the ONLY thing that activates a hotel.
// This endpoint exists so the success page can "ping" without side effects.
// Do NOT trust any client-sent flag (success, paid, etc.). Verify nothing —
// just report the DB state.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { ref?: string };
    const refMatch = String(body.ref || "").match(UUID_RE);
    const ref = refMatch ? refMatch[0] : "";

    if (!ref) {
      return NextResponse.json(
        { ok: false, error: "ref_required" },
        { status: 200 },
      );
    }

    const hotel = await prisma.hotels.findUnique({
      where: { id: ref },
      select: {
        id: true,
        subscription_status: true,
        subscription_expires_at: true,
      },
    });

    if (!hotel) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 200 },
      );
    }

    const isActive =
      (hotel.subscription_status === "active" ||
        hotel.subscription_status === "trial") &&
      hotel.subscription_expires_at &&
      new Date(hotel.subscription_expires_at) > new Date();

    if (isActive) {
      return NextResponse.json({ ok: true, already_processed: true });
    }

    // Webhook hasn't fired yet — report state, don't error.
    return NextResponse.json({
      ok: false,
      status: hotel.subscription_status || "pending",
    });
  } catch (err) {
    console.error("[signup/confirm] error:", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 200 });
  }
}