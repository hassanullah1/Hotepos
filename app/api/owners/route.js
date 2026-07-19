import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { tazkiraNumber: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [owners, total] = await Promise.all([
    prisma.owner.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        tazkiraNumber: true,
        createdAt: true,
        _count: { select: { vehicles: true } },
      },
    }),
    prisma.owner.count({ where }),
  ]);

  return NextResponse.json({ owners, total, page, pageSize });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, phone, password, address, tazkiraNumber, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const data = { name, phone, address, tazkiraNumber, notes };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const owner = await prisma.owner.create({ data });
    return NextResponse.json(owner, { status: 201 });
  } catch (err) {
    if (err.code === "P2002") {
      const field = err.meta?.target?.[0] || "field";
      return NextResponse.json(
        { error: `An owner with this ${field} already exists` },
        { status: 409 },
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create owner" },
      { status: 500 },
    );
  }
}
