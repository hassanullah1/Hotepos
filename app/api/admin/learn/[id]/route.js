import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// PATCH /api/admin/learn/:id
export async function PATCH(request, { params }) {
  const { id } = await params;

  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const data = {};

  if ("language" in body) {
    if (!["en", "ps", "prs"].includes(body.language)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }
    data.language = body.language;
  }
  if ("category" in body) data.category = body.category?.trim() || "Tutorial";
  if ("title" in body) data.title = body.title?.trim();
  if ("description" in body)
    data.description = body.description?.trim() || null;
  if ("youtube_id" in body) data.youtube_id = body.youtube_id?.trim();
  if ("duration" in body) data.duration = body.duration?.trim() || null;
  if ("sort_order" in body) data.sort_order = Number(body.sort_order) || 0;
  if ("is_active" in body) data.is_active = !!body.is_active;

  data.updated_at = new Date();

  try {
    const updated = await prisma.tutorials.update({
      where: { id },
      data,
    });
    return NextResponse.json({ tutorial: updated });
  } catch (err) {
    console.error("Update tutorial failed:", err);
    return NextResponse.json(
      { error: "Could not update tutorial" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/learn/:id
export async function DELETE(request, { params }) {
  const { id } = await params;

  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.tutorials.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete tutorial failed:", err);
    return NextResponse.json(
      { error: "Could not delete tutorial" },
      { status: 500 },
    );
  }
}
