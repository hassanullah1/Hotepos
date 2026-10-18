// app/api/contact/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const hotel = typeof body.hotel === "string" ? body.hotel.trim() : "";

  if (!name || !message) {
    return NextResponse.json(
      { error: "Name and message required" },
      { status: 400 },
    );
  }

  // Email sending intentionally disabled.
  // Log so the submission isn't silently lost; replace with DB insert if needed.
  console.log("[contact] new submission:", { name, email, hotel, message });

  return NextResponse.json({ ok: true });
}
