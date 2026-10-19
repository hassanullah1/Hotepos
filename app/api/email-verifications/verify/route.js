import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MAX_ATTEMPTS = 5;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { verification_id, otp } = body;

  if (!verification_id || !otp) {
    return NextResponse.json(
      { error: "verification_id and otp are required" },
      { status: 400 },
    );
  }

  try {
    const row = await prisma.email_verifications.findUnique({
      where: { id: verification_id },
    });

    if (!row) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Idempotent: already verified
    if (row.verified_at) {
      return NextResponse.json({ verified: true });
    }

    if (row.expires_at < new Date()) {
      return NextResponse.json(
        { error: "Code expired. Please request a new one." },
        { status: 400 },
      );
    }

    if (row.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 },
      );
    }

    if (row.otp !== String(otp).trim()) {
      const updated = await prisma.email_verifications.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        {
          error: "Incorrect code.",
          remaining_attempts: Math.max(0, MAX_ATTEMPTS - updated.attempts),
        },
        { status: 400 },
      );
    }

    await prisma.email_verifications.update({
      where: { id: row.id },
      data: { verified_at: new Date() },
    });

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error("email-verifications/verify failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
