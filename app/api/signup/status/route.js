import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("ref") || "";
  const match = raw.match(UUID_RE);
  const ref = match ? match[0] : "";
  if (!ref)
    return NextResponse.json({ error: "ref required" }, { status: 400 });

  const signup = await prisma.pending_signups.findUnique({
    where: { id: ref },
  });
  if (!signup)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const can_reveal =
    signup.status === "paid" &&
    !!signup.reveal_password &&
    signup.reveal_expires_at &&
    signup.reveal_expires_at > new Date();

  let reveal = null;
  if (can_reveal) {
    reveal = signup.reveal_password;
    // Clear it the moment we hand it out — one-time reveal.
    await prisma.pending_signups.update({
      where: { id: signup.id },
      data: { reveal_password: null, reveal_expires_at: null },
    });
  }

  return NextResponse.json({
    id: signup.id,
    status: signup.status,
    hotel_name: signup.hotel_name,
    email: signup.email,
    reveal_password: reveal,
  });
}
