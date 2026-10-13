import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  compareBuyerPassword,
  signBuyerToken,
  setBuyerCookieOnResponse,
} from "@/lib/buyer-auth";

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password)
      return NextResponse.json(
        { error: "identifier and password are required" },
        { status: 400 },
      );

    const buyer = await prisma.buyers.findFirst({
      where: {
        is_active: true,
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!buyer || !buyer.password_hash)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );

    const valid = await compareBuyerPassword(password, buyer.password_hash);
    if (!valid)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );

    const token = signBuyerToken({
      buyerId: buyer.id,
      email: buyer.email,
      phone: buyer.phone,
      full_name: buyer.full_name,
    });

    const res = NextResponse.json({
      user: {
        id: buyer.id,
        full_name: buyer.full_name,
        email: buyer.email,
        phone: buyer.phone,
      },
    });

    return setBuyerCookieOnResponse(res, token);
  } catch (err) {
    console.error("Buyer login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
