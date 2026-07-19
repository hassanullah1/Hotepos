import { NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "../../../../lib/session";
import { prisma } from "../../../../lib/prisma";
import { hashPassword } from "../../../../lib/password";

const VALID_ROLES = ["SUPERADMIN", "ADMIN", "STAFF"];

export async function POST(request) {
  const currentUser = await getCurrentUser();

  if (!requireRole(currentUser, ["SUPERADMIN"])) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password and role are required" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!requireRole(currentUser, ["SUPERADMIN"])) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ users });
}
