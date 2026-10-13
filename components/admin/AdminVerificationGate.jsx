"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const EXEMPT_ROLES = ["super_admin", "admin"];
const ESCAPE_ROUTES = ["/admin/verify", "/admin/renew", "/admin/profile"];

export default function AdminVerificationGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, loading: authLoading } = useAdminAuth();

  const [state, setState] = useState("checking");

  const isExempt = EXEMPT_ROLES.includes(role);
  const hasHotelRole = role === "hotel_owner" || role === "branch_manager";

  // Escape routes always allowed
  const onEscapeRoute = ESCAPE_ROUTES.some((r) => pathname?.startsWith(r));

  useEffect(() => {
    if (authLoading || !role) return;

    // Non-gated roles pass through immediately
    if (isExempt || !hasHotelRole || onEscapeRoute) {
      setState("allowed");
      return;
    }

    let cancelled = false;
    setState("checking");

    (async () => {
      try {
        const res = await fetchWithAuth("/api/owner/verification");
        if (!res.ok) {
          if (!cancelled) setState("allowed");
          return;
        }
        const data = await res.json();
        const status = data.hotel?.verification_status || "pending";

        if (cancelled) return;

        if (status === "verified") {
          setState("allowed");
        } else {
          setState("blocked");
          router.replace("/admin/verify");
        }
      } catch {
        if (!cancelled) setState("allowed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, role, isExempt, hasHotelRole, onEscapeRoute, router]);

  // Spinner while checking — prevents a flash of blocked content
  if (state === "checking" && !isExempt && hasHotelRole && !onEscapeRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15121C]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#C9A227]/30 border-t-[#C9A227]" />
          <p
            className="text-[10px] uppercase tracking-[0.25em] text-[#6E687A]"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Checking…
          </p>
        </div>
      </div>
    );
  }

  if (state === "blocked") return null;

  return children;
}
