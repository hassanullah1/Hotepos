import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { assertManagedBranch } from "@/lib/owner-scope";

async function loadTableScoped(id, userId) {
  const table = await prisma.dining_tables.findUnique({ where: { id } });
  if (!table) return null;
  const branch = await assertManagedBranch(table.branch_id, userId);
  return branch ? table : null;
}

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadTableScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const data = {};
  if (body.table_number !== undefined) data.table_number = body.table_number;
  if (body.capacity !== undefined) data.capacity = body.capacity;
  if (body.status !== undefined) data.status = body.status;

  if (body.area_id !== undefined) {
    if (body.area_id) {
      const area = await prisma.dining_areas.findFirst({
        where: { id: body.area_id, branch_id: existing.branch_id },
      });
      if (!area)
        return NextResponse.json(
          { error: "Area not found in this branch" },
          { status: 404 },
        );
    }
    data.area_id = body.area_id || null;
  }

  try {
    const table = await prisma.dining_tables.update({
      where: { id },
      data,
      include: { dining_areas: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ table });
  } catch (err) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A table with this number already exists in this branch" },
        { status: 409 },
      );
    }
    console.error("Update dining table error:", err);
    return NextResponse.json(
      { error: "Failed to update table" },
      { status: 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadTableScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const openSession = await prisma.table_sessions.findFirst({
    where: { table_id: id, status: "open" },
  });
  if (openSession)
    return NextResponse.json(
      { error: "Can't delete a table with an open session. Close it first." },
      { status: 400 },
    );

  try {
    await prisma.dining_tables.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete dining table error:", err);
    return NextResponse.json(
      { error: "Failed to delete table" },
      { status: 400 },
    );
  }
}
