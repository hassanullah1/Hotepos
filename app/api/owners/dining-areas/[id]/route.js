import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { assertManagedBranch } from "@/lib/owner-scope";

async function loadAreaScoped(id, userId) {
  const area = await prisma.dining_areas.findUnique({ where: { id } });
  if (!area) return null;
  const branch = await assertManagedBranch(area.branch_id, userId);
  return branch ? area : null;
}

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadAreaScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  if (!body.name)
    return NextResponse.json({ error: "name is required" }, { status: 400 });

  try {
    const area = await prisma.dining_areas.update({
      where: { id },
      data: { name: body.name },
    });
    return NextResponse.json({ area });
  } catch (err) {
    console.error("Update dining area error:", err);
    return NextResponse.json(
      { error: "Failed to update area" },
      { status: 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadAreaScoped(id, user.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    // Tables referencing this area have area_id as optional (onUpdate:
    // NoAction, no cascade) — unset them instead of failing the delete.
    await prisma.$transaction([
      prisma.dining_tables.updateMany({
        where: { area_id: id },
        data: { area_id: null },
      }),
      prisma.dining_areas.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete dining area error:", err);
    return NextResponse.json(
      { error: "Failed to delete area" },
      { status: 400 },
    );
  }
}
