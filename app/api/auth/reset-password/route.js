import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/auth/reset-password
// Body: { token, password }
export async function POST(request) {
  const { token, password } = await request.json().catch(() => ({}));

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const user = await prisma.users.findFirst({
    where: {
      reset_token: token,
      reset_token_expires_at: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  await prisma.users.update({
    where: { id: user.id },
    data: {
      password_hash: await bcrypt.hash(password, 12),
      reset_token: null,
      reset_token_expires_at: null,
    },
  });

  return NextResponse.json({ ok: true });
}
