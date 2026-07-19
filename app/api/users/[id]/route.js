import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
};

export async function GET(_req, { params }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: SAFE_SELECT,
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req, { params }) {
  const body = await req.json().catch(() => ({}));
  const data = {};

  if (body.name?.trim()) data.name = body.name.trim();
  if (body.email?.trim()) data.email = body.email.trim().toLowerCase();
  if (["SUPERADMIN", "ADMIN", "STAFF"].includes(body.role))
    data.role = body.role;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  if (body.password) {
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }
    data.password = await bcrypt.hash(body.password, 10);
  }

  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: SAFE_SELECT,
    });
    return NextResponse.json(user);
  } catch (e) {
    if (e.code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e.code === "P2002")
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req, { params }) {
  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e.code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
