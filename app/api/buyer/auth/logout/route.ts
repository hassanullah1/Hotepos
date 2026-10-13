import { NextResponse } from "next/server";
import { clearBuyerCookieOnResponse } from "@/lib/buyer-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  return clearBuyerCookieOnResponse(res);
}
