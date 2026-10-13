import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/public/tutorials?lang=ps
export async function GET(request) {
  const lang = new URL(request.url).searchParams.get("lang") || "en";

  try {
    const tutorials = await prisma.tutorials.findMany({
      where: {
        language: lang,
        is_active: true,
      },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
      select: {
        id: true,
        category: true,
        title: true,
        description: true,
        youtube_id: true,
        duration: true,
      },
    });

    return NextResponse.json({ tutorials });
  } catch (err) {
    console.error("Load tutorials failed:", err);
    return NextResponse.json(
      { error: "Could not load tutorials" },
      { status: 500 },
    );
  }
}
