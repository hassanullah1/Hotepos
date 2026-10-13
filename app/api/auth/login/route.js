// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "identifier and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.users.findFirst({
      where: {
        is_active: true,
        OR: [
          { email: identifier },
          { phone: identifier },
          { username: identifier },
        ],
      },
      include: {
        roles: true,
        hotel_owners: { select: { hotel_id: true } }, // ← array, use [0]
        branches: { select: { hotel_id: true } },
      },
    });

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // owner → hotel_owners[0].hotel_id | branch roles → branches.hotel_id | super_admin → null
    const hotelId =
      user.hotel_owners?.[0]?.hotel_id ??
      user.branches?.hotel_id ??
      user.hotel_id ?? // fallback in case it's set on users
      null;

    const token = signToken({
      userId: user.id,
      roleId: user.role_id,
      roleName: user.roles.name,
      hotelId,
      branchId: user.branch_id,
    });

    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.roles.name,
        scope: user.roles.scope,
        hotel_id: hotelId,
        branch_id: user.branch_id,
      },
    });

    // ───── the missing piece ─────
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", // MUST be false on http://localhost
      path: "/",
      maxAge: 60 * 60 * 8, // 8h, matches JWT_EXPIRES_IN
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
