import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

/**
 * GET  /api/sections       — list all active sections (auth: any logged-in user)
 * POST /api/sections       — create a section (super_admin only)
 */

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sections = await prisma.sections.findMany({
    where: { is_active: true },
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      icon: true,
      sort_order: true,
    },
  });

  return NextResponse.json({ sections });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const key = typeof body.key === "string" ? body.key.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!key || !name) {
    return NextResponse.json(
      { error: "key and name are required" },
      { status: 400 },
    );
  }

  try {
    const section = await prisma.sections.create({
      data: {
        key,
        name,
        description: body.description ?? null,
        icon: body.icon ?? null,
        sort_order: body.sort_order != null ? Number(body.sort_order) : 0,
        is_active: body.is_active ?? true,
      },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        icon: true,
        sort_order: true,
      },
    });
    return NextResponse.json({ section }, { status: 201 });
  } catch (err) {
    console.error("Create section error:", err);
    return NextResponse.json(
      { error: "Failed to create section (key may already exist)" },
      { status: 400 },
    );
  }
}
