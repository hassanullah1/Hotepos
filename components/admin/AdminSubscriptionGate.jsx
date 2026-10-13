"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { useSubscriptionState } from "@/hooks/useSubscriptionState";

// Pages that must remain reachable even when the subscription is dead
const ALLOWED_WHEN_EXPIRED = [
  "/admin/renew",
  "/admin/profile",
  "/admin/support",
];

// Super-admins are never blocked by a subscription
const EXEMPT_ROLES = ["super_admin", "admin"];

export default function AdminSubscriptionGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, subscription } = useAdminAuth();
  const { state, locked } = useSubscriptionState(subscription);

  useEffect(() => {
    if (role === null || subscription === null) return;
    if (EXEMPT_ROLES.includes(role)) return;
    if (!locked) return;

    const isAllowed = ALLOWED_WHEN_EXPIRED.some((p) => pathname?.startsWith(p));
    if (!isAllowed) {
      router.replace("/admin/renew");
    }
  }, [role, subscription, locked, pathname, router]);

  // Brief blank while redirecting — prevents a flash of locked content
  if (locked && !EXEMPT_ROLES.includes(role)) {
    const isAllowed = ALLOWED_WHEN_EXPIRED.some((p) => pathname?.startsWith(p));
    if (!isAllowed) {
      return (
        <div className="grid min-h-dvh w-full place-items-center bg-[#0B1826]">
          <div className="animate-pulse text-sm text-[#8FA0B3]">
            Redirecting to renewal…
          </div>
        </div>
      );
    }
  }

  return children;
}
