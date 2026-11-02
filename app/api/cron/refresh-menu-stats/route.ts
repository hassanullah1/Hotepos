// app/api/cron/refresh-menu-stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$executeRawUnsafe(
      `REFRESH MATERIALIZED VIEW CONCURRENTLY menu_item_stats`,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cron refresh-menu-stats]", err);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
