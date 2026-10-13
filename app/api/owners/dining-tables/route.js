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

  const tables = await prisma.dining_tables.findMany({
    where: { branch_id: branchId },
    include: { dining_areas: { select: { id: true, name: true } } },
    orderBy: { table_number: "asc" },
  });

  return NextResponse.json({
    tables: tables.map((t) => ({
      id: t.id,
      table_number: t.table_number,
      capacity: t.capacity,
      status: t.status,
      qr_code_token: t.qr_code_token,
      area: t.dining_areas,
    })),
  });
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.branch_id || !body.table_number)
    return NextResponse.json(
      { error: "branch_id and table_number are required" },
      { status: 400 },
    );

  const branch = await assertManagedBranch(body.branch_id, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found or not accessible" },
      { status: 404 },
    );

  if (body.area_id) {
    const area = await prisma.dining_areas.findFirst({
      where: { id: body.area_id, branch_id: body.branch_id },
    });
    if (!area)
      return NextResponse.json(
        { error: "Area not found in this branch" },
        { status: 404 },
      );
  }

  try {
    const table = await prisma.dining_tables.create({
      data: {
        branch_id: body.branch_id,
        area_id: body.area_id || null,
        table_number: body.table_number,
        capacity: body.capacity ?? 4,
        status: body.status || "available",
      },
      include: { dining_areas: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ table }, { status: 201 });
  } catch (err) {
    // Most likely the @@unique([branch_id, table_number]) constraint.
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A table with this number already exists in this branch" },
        { status: 409 },
      );
    }
    console.error("Create dining table error:", err);
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 400 },
    );
  }
}
