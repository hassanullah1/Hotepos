import crypto from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSignupOtpEmail } from "@/app/admin/email";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 },
    );
  }

  try {
    // Kill older unverified attempts so only the newest code is live
    await prisma.email_verifications.deleteMany({
      where: { email, verified_at: null },
    });

    const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    const record = await prisma.email_verifications.create({
      data: { email, otp, expires_at },
    });

    const sent = await sendSignupOtpEmail({
      to: email,
      ownerName: body.ownerName || "",
      hotelName: body.hotelName || "Hotel App",
      otp,
    });

    if (!sent.sent) {
      await prisma.email_verifications.delete({ where: { id: record.id } });
      return NextResponse.json(
        { error: "Could not send verification code. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { verification_id: record.id, email },
      { status: 201 },
    );
  } catch (err) {
    console.error("email-verifications/send failed:", err);
    return NextResponse.json({ error: "Could not send code" }, { status: 500 });
  }
}
