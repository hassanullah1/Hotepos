import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const { ref, password } = await request.json().catch(() => ({}));
  if (!ref || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const signup = await prisma.pending_signups.findUnique({
    where: { id: ref },
  });
  if (!signup || signup.status !== "paid" || !signup.created_hotel_id) {
    return NextResponse.json({ error: "Signup not ready" }, { status: 400 });
  }

  const owner = await prisma.hotel_owners.findFirst({
    where: { hotel_id: signup.created_hotel_id },
    include: { users: true },
  });
  if (!owner?.users) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }
  if (owner.users.password_hash) {
    return NextResponse.json(
      { error: "Password already set" },
      { status: 400 },
    );
  }

  await prisma.users.update({
    where: { id: owner.users.id },
    data: { password_hash: await bcrypt.hash(password, 10) },
  });

  return NextResponse.json({ ok: true });
}
