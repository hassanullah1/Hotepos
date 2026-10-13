import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { assertManagedBranch } from "@/lib/owner-scope";

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id");
  if (!branchId)
    return NextResponse.json(
      { error: "branch_id is required" },
      { status: 400 },
    );

  const branch = await assertManagedBranch(branchId, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found or not accessible" },
      { status: 404 },
    );

  const areas = await prisma.dining_areas.findMany({
    where: { branch_id: branchId },
    select: {
      id: true,
      name: true,
      _count: { select: { dining_tables: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    areas: areas.map((a) => ({
      id: a.id,
      name: a.name,
      table_count: a._count.dining_tables,
    })),
  });
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.branch_id || !body.name)
    return NextResponse.json(
      { error: "branch_id and name are required" },
      { status: 400 },
    );

  const branch = await assertManagedBranch(body.branch_id, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found or not accessible" },
      { status: 404 },
    );

  try {
    const area = await prisma.dining_areas.create({
      data: { branch_id: body.branch_id, name: body.name },
    });
    return NextResponse.json({ area }, { status: 201 });
  } catch (err) {
    console.error("Create dining area error:", err);
    return NextResponse.json(
      { error: "Failed to create area" },
      { status: 400 },
    );
  }
}
