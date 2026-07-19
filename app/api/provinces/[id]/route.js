import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req, { params }) {
  const { id } = await params;

  const province = await prisma.province.findUnique({ where: { id: id } });
  if (!province)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(province);
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  try {
    const province = await prisma.province.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(province);
  } catch (e) {
    if (e.code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e.code === "P2002")
      return NextResponse.json(
        { error: "A province with that name already exists" },
        { status: 409 },
      );
    return NextResponse.json(
      { error: "Failed to update province" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  try {
    await prisma.province.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e.code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    // P2003: vehicles still reference this province (FK is optional, so this
    // shouldn't normally happen, but guard anyway)
    return NextResponse.json(
      { error: "Failed to delete province" },
      { status: 500 },
    );
  }
}
