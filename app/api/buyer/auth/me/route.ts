import { NextResponse } from "next/server";
import { getBuyerSession, getFullBuyer } from "@/lib/buyer-auth";

export async function GET() {
  const session = await getBuyerSession();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });

  const buyer = await getFullBuyer(session);
  if (!buyer || buyer.is_active === false) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user: buyer });
}
