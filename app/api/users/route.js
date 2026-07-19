import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SAFE_SELECT = { id: true, name: true, email: true, role: true, isActive: true, createdAt: true };

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: SAFE_SELECT });
  return NextResponse.json(users);
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: ["SUPERADMIN", "ADMIN", "STAFF"].includes(body.role) ? body.role : "STAFF",
        isActive: body.isActive ?? true,
      },
      select: SAFE_SELECT,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e.code === "P2002") return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
