// app/api/contact/route.js
import { NextResponse } from "next/server";
import { sendContactMessage } from "@/lib/email";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (!body.name?.trim() || !body.message?.trim()) {
    return NextResponse.json(
      { error: "Name and message required" },
      { status: 400 },
    );
  }
  // send via your existing nodemailer transporter
  await sendContactMessage({
    from: body.email,
    name: body.name,
    hotel: body.hotel,
    message: body.message,
  });
  return NextResponse.json({ ok: true });
}
