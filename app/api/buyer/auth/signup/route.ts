import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  hashBuyerPassword,
  signBuyerToken,
  setBuyerCookieOnResponse,
} from "@/lib/buyer-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const full_name = String(body.full_name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");

    if (!full_name)
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!email && !phone)
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 },
      );
    if (password.length < 6)
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );

    if (email) {
      const exists = await prisma.buyers.findUnique({ where: { email } });
      if (exists)
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 },
        );
    }
    if (phone) {
      const exists = await prisma.buyers.findUnique({ where: { phone } });
      if (exists)
        return NextResponse.json(
          { error: "Phone already registered" },
          { status: 409 },
        );
    }

    const password_hash = await hashBuyerPassword(password);

    const buyer = await prisma.buyers.create({
      data: {
        full_name,
        email: email || null,
        phone: phone || null,
        password_hash,
      },
      select: { id: true, full_name: true, email: true, phone: true },
    });

    const token = signBuyerToken({
      buyerId: buyer.id,
      email: buyer.email,
      phone: buyer.phone,
      full_name: buyer.full_name,
    });

    const res = NextResponse.json({ user: buyer }, { status: 201 });
    return setBuyerCookieOnResponse(res, token);
  } catch (err) {
    console.error("Buyer signup error:", err);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
