"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { useSubscriptionState } from "@/hooks/useSubscriptionState";

const ALLOWED_WHEN_EXPIRED = [
  "/admin/renew",
  "/admin/profile",
  "/admin/support",
];

const EXEMPT_ROLES = ["super_admin", "admin"];

export default function AdminSubscriptionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, subscription } = useAdminAuth();
  const { locked } = useSubscriptionState(subscription);

  const isExempt = !!role && EXEMPT_ROLES.includes(role);
  const onAllowedRoute = useMemo(
    () => ALLOWED_WHEN_EXPIRED.some((p) => pathname?.startsWith(p)),
    [pathname],
  );

  // Redirect only when we have a real, locked subscription on a blocked route.
  const mustRedirect =
    !isExempt && !!role && subscription !== null && locked && !onAllowedRoute;

  useEffect(() => {
    if (!mustRedirect) return;
    router.replace("/admin/renew");
  }, [mustRedirect, router]);

  if (mustRedirect) {
    return (
      <div className="grid min-h-dvh w-full place-items-center bg-[#0B1826]">
        <div className="animate-pulse text-sm text-[#8FA0B3]">
          Redirecting to renewal…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}