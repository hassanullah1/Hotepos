import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const provinces = await prisma.province.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { vehicles: true } } },
  });
  return NextResponse.json(provinces);
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  try {
    const province = await prisma.province.create({ data: { name } });
    return NextResponse.json(province, { status: 201 });
  } catch (e) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "A province with that name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create province" }, { status: 500 });
  }
}
