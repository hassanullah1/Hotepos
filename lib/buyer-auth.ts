// lib/buyer-auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const BUYER_JWT_SECRET = process.env.BUYER_JWT_SECRET;
const BUYER_JWT_EXPIRES_IN = "30d";

if (!BUYER_JWT_SECRET) {
  throw new Error("BUYER_JWT_SECRET is not set in your environment (.env)");
}

export const BUYER_COOKIE_NAME = "buyer_token";

export interface BuyerTokenPayload {
  buyerId: string;
  email: string | null;
  phone: string | null;
  full_name: string;
}

export function signBuyerToken(payload: BuyerTokenPayload): string {
  return jwt.sign(payload, BUYER_JWT_SECRET as string, {
    expiresIn: BUYER_JWT_EXPIRES_IN,
  });
}

export function verifyBuyerToken(token: string): BuyerTokenPayload {
  return jwt.verify(token, BUYER_JWT_SECRET as string) as BuyerTokenPayload;
}

export function hashBuyerPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function compareBuyerPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Sets the buyer cookie on a NextResponse (used in route handlers). */
export function setBuyerCookieOnResponse(response, token: string) {
  response.cookies.set(BUYER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}

export function clearBuyerCookieOnResponse(response) {
  response.cookies.set(BUYER_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}

/**
 * Read + verify the buyer cookie from next/headers.
 * Use in server components, server actions, or route handlers where you
 * don't have a Request object. Returns null if missing/invalid.
 */
export async function getBuyerSession(): Promise<BuyerTokenPayload | null> {
  const jar = await cookies();
  const token = jar.get(BUYER_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return verifyBuyerToken(token);
  } catch {
    return null;
  }
}

/**
 * Read + verify the buyer cookie from an explicit Request object.
 * Use in route handlers that receive `request`.
 */
export async function getBuyerFromRequest(
  request: Request,
): Promise<BuyerTokenPayload | null> {
  // Prefer the cookie (httpOnly, set by the login route)
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${BUYER_COOKIE_NAME}=`));
  const token = match ? decodeURIComponent(match.split("=")[1]) : null;
  if (!token) return null;
  try {
    return verifyBuyerToken(token);
  } catch {
    return null;
  }
}

/** Load the full buyer row from the DB (for /me routes). */
export async function getFullBuyer(session: BuyerTokenPayload) {
  return prisma.buyers.findUnique({
    where: { id: session.buyerId },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      is_active: true,
      created_at: true,
    },
  });
}
