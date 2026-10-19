import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/cron/expire-pending-signups
//
// Flips any `pending` HesabPay signup whose 30-minute window has closed
// to `expired`. Run every 10–15 min (Vercel Cron or a VPS crontab).
export async function GET(request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.pending_signups.updateMany({
    where: {
      status: "pending",
      expires_at: { lt: new Date(), not: null },
    },
    data: { status: "expired" },
  });

  return NextResponse.json({
    expired: result.count,
    ran_at: new Date().toISOString(),
  });
}
