import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// User cancelled at HesabPay — redirect back to the signup form with a
// `payment=failed` hint. The hotel remains in "expired" state, waiting
// for the user to retry payment.
export async function GET(request) {
  const id = new URL(request.url).searchParams.get("id");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ;

  let planId = "";

  if (id) {
    const signup = await prisma.pending_signups.findUnique({
      where: { id },
      select: { subscription_plan_id: true },
    });
    planId = signup?.subscription_plan_id || "";
  }

  const target = planId
    ? `${appUrl}/signup?plan=${planId}&payment=failed`
    : `${appUrl}/signup?payment=failed`;

  return NextResponse.redirect(target);
}
