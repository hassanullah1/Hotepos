import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// PATCH /api/sections/[id] — update one section
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.key !== undefined) {
    if (!body.key.trim())
      return NextResponse.json(
        { error: "key cannot be empty" },
        { status: 400 },
      );
    // key is immutable in practice (code refers to it) — block changes
    const current = await prisma.sections.findUnique({ where: { id } });
    if (current && current.key !== body.key.trim())
      return NextResponse.json(
        { error: "key cannot be changed after creation" },
        { status: 400 },
      );
  }
  if (body.name !== undefined) {
    if (!body.name.trim())
      return NextResponse.json(
        { error: "name cannot be empty" },
        { status: 400 },
      );
    data.name = body.name.trim();
  }
  if (body.description !== undefined)
    data.description = body.description || null;
  if (body.icon !== undefined) data.icon = body.icon || null;
  if (body.sort_order !== undefined) data.sort_order = Number(body.sort_order);
  if (body.is_active !== undefined) data.is_active = !!body.is_active;

  try {
    const section = await prisma.sections.update({ where: { id }, data });
    return NextResponse.json({ section });
  } catch (err) {
    console.error("Update section error:", err);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 400 },
    );
  }
}

// DELETE /api/sections/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const inUse = await prisma.plan_sections.count({ where: { section_id: id } });
  if (inUse > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete — this section is attached to ${inUse} plan(s). Deactivate it instead.`,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.sections.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete section error:", err);
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 400 },
    );
  }
}
