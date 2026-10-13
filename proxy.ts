// proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { verifyBuyerToken } from "@/lib/buyer-auth";

const ADMIN_COOKIE = "auth_token";
const BUYER_COOKIE = "buyer_token";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ---------- ADMIN routes ----------
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return redirectTo(req, "/login", { from: pathname });
    try {
      verifyToken(token);
    } catch {
      return redirectTo(req, "/login", { from: pathname });
    }
  }

  // ---------- BUYER-only routes ----------
  if (pathname.startsWith("/account")) {
    const token = req.cookies.get(BUYER_COOKIE)?.value;
    if (!token) return redirectTo(req, "/order/login", { next: pathname });
    try {
      verifyBuyerToken(token);
    } catch {
      return redirectTo(req, "/order/login", { next: pathname });
    }
  }

  return NextResponse.next();
}

function redirectTo(
  req: NextRequest,
  pathname: string,
  params: Record<string, string>,
) {
  // `new URL(...)` — not `.clone()` — because Next.js 16 types
  // `req.nextUrl` as a standard URL, which has no clone() method.
  const url = new URL(req.nextUrl);
  url.pathname = pathname;
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
