import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export async function POST(request) {
  const { ref: rawRef } = await request.json().catch(() => ({}));
  const match = String(rawRef || "").match(UUID_RE);
  const ref = match ? match[0] : "";
  if (!ref)
    return NextResponse.json({ error: "ref required" }, { status: 400 });

  const tempPassword = crypto.randomBytes(6).toString("hex");
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const signup = await tx.pending_signups.findUnique({
        where: { id: ref },
      });
      if (!signup || signup.status !== "paid" || !signup.created_hotel_id) {
        throw new Error("not_ready");
      }

      const owner = await tx.hotel_owners.findFirst({
        where: { hotel_id: signup.created_hotel_id },
        include: { users: true },
      });
      if (!owner?.users) throw new Error("owner_missing");

      // Atomic guard — only one caller can flip password_hash from null.
      const updated = await tx.users.updateMany({
        where: { id: owner.users.id, password_hash: null },
        data: { password_hash: passwordHash },
      });
      if (updated.count === 0) throw new Error("already_claimed");

      return { email: owner.users.email, hotel_name: signup.hotel_name };
    });

    return NextResponse.json({
      ok: true,
      email: result.email,
      password: tempPassword,
      hotel_name: result.hotel_name,
    });
  } catch (err) {
    const map = {
      not_ready: { status: 400, error: "Signup is not ready yet." },
      owner_missing: { status: 404, error: "Owner account not found." },
      already_claimed: {
        status: 409,
        error:
          "Credentials already revealed. Use Forgot Password if you lost them.",
      },
    };
    const out = map[err.message] || {
      status: 500,
      error: "Could not issue credentials.",
    };
    return NextResponse.json({ error: out.error }, { status: out.status });
  }
}
