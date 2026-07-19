import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req, { params }) {
  const { id } = await params;
  const owner = await prisma.owner.findUnique({ where: { id } });
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(owner);
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { name, phone, tazkiraNumber, address, notes } = body;

  try {
    const owner = await prisma.owner.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name || undefined } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(tazkiraNumber !== undefined
          ? { tazkiraNumber: tazkiraNumber || null }
          : {}),
        ...(address !== undefined ? { address: address || null } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
      },
    });
    return NextResponse.json(owner);
  } catch (e) {
    if (e.code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e.code === "P2002")
      return NextResponse.json(
        { error: "Phone number or Tazkira number already exists" },
        { status: 409 },
      );
    return NextResponse.json(
      { error: "Failed to update owner" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  try {
    await prisma.owner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e.code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e.code === "P2003")
      return NextResponse.json(
        { error: "Cannot delete owner: this owner still has vehicles" },
        { status: 409 },
      );
    return NextResponse.json(
      { error: "Failed to delete owner" },
      { status: 500 },
    );
  }
}
