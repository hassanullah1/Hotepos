import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/app/admin/email";

// POST /api/auth/forgot-password
// Body: { email }
//
// Behaviour:
//   404 → no user with that email
//   403 → user exists but is_active === false
//   200 → reset link sent
//
// NOTE: returning different responses lets anyone check whether an email
// is registered. That trade-off is intentional here — clearer UX was
// chosen over account-enumeration protection.
export async function POST(request) {
  const { email } = await request.json().catch(() => ({}));

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();

  const user = await prisma.users.findUnique({
    where: { email: normalized },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, code: "not_found", error: "No account with this email." },
      { status: 404 },
    );
  }

  if (user.is_active === false) {
    return NextResponse.json(
      { ok: false, code: "inactive", error: "This account is not active." },
      { status: 403 },
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.users.update({
    where: { id: user.id },
    data: {
      reset_token: token,
      reset_token_expires_at: expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ;
  const link = `${baseUrl}/hotel/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      ownerName: user.full_name,
      link,
    });
  } catch (err) {
    console.error("Password reset email failed:", err);
    return NextResponse.json(
      { error: "Could not send the email. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, email: user.email });
}
