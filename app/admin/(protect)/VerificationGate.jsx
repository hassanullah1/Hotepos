"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const EXEMPT_ROLES = ["super_admin", "admin"];

// Routes a locked user is always allowed to visit
const ESCAPE_ROUTES = ["/admin/verify", "/admin/renew", "/admin/profile"];

export default function VerificationGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, loading: authLoading } = useAdminAuth();

  const [state, setState] = useState("checking"); // checking | allowed | blocked
  const [blockedBy, setBlockedBy] = useState(null); // "verification" | "subscription"

  const isExempt = EXEMPT_ROLES.includes(role);
  const hasHotelRole = role === "hotel_owner" || role === "branch_manager";

  useEffect(() => {
    // While auth is still loading, don't decide anything
    if (authLoading || !role) return;

    // Exempt roles never gated
    if (isExempt) {
      setState("allowed");
      return;
    }

    // Non-hotel roles (waiter, cashier, etc.) are not gated by verification
    if (!hasHotelRole) {
      setState("allowed");
      return;
    }

    // Escape routes always allowed
    if (ESCAPE_ROUTES.some((r) => pathname?.startsWith(r))) {
      setState("allowed");
      return;
    }

    let cancelled = false;
    setState("checking");

    (async () => {
      try {
        const res = await fetchWithAuth("/api/owner/verification");
        if (!res.ok) {
          // If we can't check, allow (avoid locking everyone out on a
          // network hiccup) — the sidebar banner still warns.
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
          setBlockedBy("verification");
          router.replace("/admin/verify");
        }
      } catch {
        if (!cancelled) setState("allowed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, role, isExempt, hasHotelRole, pathname, router]);

  // Don't render children while we're checking, to avoid a flash of
  // the blocked page's content before the redirect happens.
  if (state === "checking" && !isExempt && hasHotelRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15121C]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#C9A227]/30 border-t-[#C9A227]" />
      </div>
    );
  }

  return children;
}
