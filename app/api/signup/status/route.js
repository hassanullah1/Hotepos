import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// GET /api/signup/status?ref=<hotel_id>
// Success page polls this. Returns status mapped to "pending" | "paid" | "expired"
// so the existing UI works unchanged. reveal_password is always null now
// (users set their own password via the reset link).
export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("ref") || "";
  const match = raw.match(UUID_RE);
  const ref = match ? match[0] : "";
  if (!ref) {
    return NextResponse.json({ error: "ref required" }, { status: 400 });
  }

  const hotel = await prisma.hotels.findUnique({
    where: { id: ref },
    include: { hotel_owner: { include: { users: true } } },
  });
  if (!hotel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const isActive =
    (hotel.subscription_status === "active" ||
      hotel.subscription_status === "trial") &&
    hotel.subscription_expires_at &&
    hotel.subscription_expires_at > now;

  const isRecent =
    hotel.created_at &&
    now.getTime() - new Date(hotel.created_at).getTime() < 30 * 60 * 1000;

  let status;
  if (isActive) status = "paid";
  else if (isRecent) status = "pending";
  else status = "expired";

  return NextResponse.json({
    id: hotel.id,
    status,
    hotel_name: hotel.name,
    email: hotel.hotel_owner?.users?.email || null,
    reveal_password: null, // password is set via reset link, not revealed here
  });
}
