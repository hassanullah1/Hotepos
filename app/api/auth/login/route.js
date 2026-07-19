import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyPassword } from "../../../../lib/password";
import { signToken, AUTH_COOKIE_NAME } from "../../../../lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours, matches token expiry
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
