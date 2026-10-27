import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/app/admin/email";

// POST /api/buyer/auth/forgot-password  { email }
// 404 = no buyer | 403 = inactive | 200 = sent
export async function POST(request) {
  const { email } = await request.json().catch(() => ({}));

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();

  const buyer = await prisma.buyers.findUnique({
    where: { email: normalized },
  });

  if (!buyer) {
    return NextResponse.json(
      { ok: false, code: "not_found", error: "No account with this email." },
      { status: 404 },
    );
  }

  if (buyer.is_active === false) {
    return NextResponse.json(
      { ok: false, code: "inactive", error: "This account is not active." },
      { status: 403 },
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await prisma.buyers.update({
    where: { id: buyer.id },
    data: { reset_token: token, reset_token_expires_at: expiresAt },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  // NOTE: buyer reset lives at /reset-password (NOT /hotel/reset-password)
  const link = `${baseUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail({
      to: buyer.email,
      ownerName: buyer.full_name,
      link,
    });
  } catch (err) {
    console.error("Buyer password reset email failed:", err);
    return NextResponse.json(
      { error: "Could not send the email. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, email: buyer.email });
}
