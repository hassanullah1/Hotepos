import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOwnerWelcomeEmail } from "@/app/admin/email";
import { getAuthUser, requireRole } from "@/lib/auth";
import { provisionHotelFromSignup } from "@/lib/provisionHotel";

export async function POST(request, { params }) {
  const { id } = await params;

  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const signup = await prisma.pending_signups.findUnique({ where: { id } });
  if (!signup) {
    return NextResponse.json({ error: "Signup not found" }, { status: 404 });
  }
  if (signup.status === "paid" && signup.created_hotel_id) {
    return NextResponse.json(
      { error: "This signup was already approved" },
      { status: 409 },
    );
  }

  try {
    const { hotel, tempPassword } = await provisionHotelFromSignup(signup);
    await prisma.pending_signups.update({
      where: { id: signup.id },
      data: { status: "paid", paid_at: new Date(), created_hotel_id: hotel.id },
    });
    await sendOwnerWelcomeEmail({
      to: signup.email,
      ownerName: signup.owner_name,
      hotelName: signup.hotel_name,
      tempPassword,
    });

    return NextResponse.json({
      ok: true,
      hotel_id: hotel.id,
      hotel_slug: hotel.slug,
    });
  } catch (err) {
    console.error("Manual approve failed:", err);
    return NextResponse.json(
      { error: "Could not create hotel account" },
      { status: 500 },
    );
  }
}
