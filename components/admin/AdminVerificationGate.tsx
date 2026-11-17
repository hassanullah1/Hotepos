"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/providers/AdminAuthProvider";

const EXEMPT_ROLES = ["super_admin", "admin"];
const ESCAPE_ROUTES = ["/admin/verify", "/admin/renew", "/admin/profile"];

export default function AdminVerificationGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, loading, setup } = useAdminAuth();

  const isExempt = !!role && EXEMPT_ROLES.includes(role);
  const isHotelRole = role === "hotel_owner" || role === "branch_manager";
  const onEscape = ESCAPE_ROUTES.some((r) => pathname?.startsWith(r));

  const mustRedirect =
    !loading && !isExempt && isHotelRole && !!setup && !setup.verified && !onEscape;

  useEffect(() => {
    if (!mustRedirect) return;
    router.replace("/admin/verify");
  }, [mustRedirect, router]);

  if (mustRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15121C]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#C9A227]/30 border-t-[#C9A227]" />
      </div>
    );
  }

  return <>{children}</>;
}