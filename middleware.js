import { NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "./lib/auth";

// Map of route prefixes -> roles allowed to access them.
// Add more entries here as you build out role-restricted admin sections.
const ROLE_PROTECTED_ROUTES = [
  { prefix: "/admin/users", roles: ["SUPERADMIN"] },
  { prefix: "/api/admin/users", roles: ["SUPERADMIN"] },
  // { prefix: "/admin/billing", roles: ["SUPERADMIN", "ADMIN"] },
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Login page must stay public
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 },
        );
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const matchedRule = ROLE_PROTECTED_ROUTES.find((rule) =>
      pathname.startsWith(rule.prefix),
    );

    if (matchedRule && !matchedRule.roles.includes(payload.role)) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
