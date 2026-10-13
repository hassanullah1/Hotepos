import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/admin/learn           → list all
// GET /api/admin/learn?lang=ps   → filter by language
export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lang = new URL(request.url).searchParams.get("lang");

  const tutorials = await prisma.tutorials.findMany({
    where: lang ? { language: lang } : {},
    orderBy: [{ language: "asc" }, { sort_order: "asc" }],
  });

  return NextResponse.json({ tutorials });
}

// POST /api/admin/learn
// Body: { language, category, title, description, youtube_id, duration, sort_order }
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireRole(user, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    language,
    category,
    title,
    description,
    youtube_id,
    duration,
    sort_order,
  } = body;

  if (!language || !["en", "ps", "prs"].includes(language)) {
    return NextResponse.json(
      { error: "language must be en, ps, or prs" },
      { status: 400 },
    );
  }
  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!youtube_id?.trim()) {
    return NextResponse.json(
      { error: "youtube_id is required" },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.tutorials.create({
      data: {
        language,
        category: category?.trim() || "Tutorial",
        title: title.trim(),
        description: description?.trim() || null,
        youtube_id: youtube_id.trim(),
        duration: duration?.trim() || null,
        sort_order: Number.isFinite(sort_order) ? sort_order : 0,
      },
    });

    return NextResponse.json({ tutorial: created }, { status: 201 });
  } catch (err) {
    console.error("Create tutorial failed:", err);
    return NextResponse.json(
      { error: "Could not create tutorial" },
      { status: 500 },
    );
  }
}
