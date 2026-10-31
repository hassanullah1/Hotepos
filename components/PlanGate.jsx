"use client";

import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";

/**
 * Renders children only when the plan has `feature`.
 *   feature = "rooms"  → gated (hidden if not in plan)
 *   feature = 0 / undefined / null / "" / false  → no check, always renders
 *
 * Usage:
 *   <PlanGate feature="menu"><MenuManager /></PlanGate>
 *   <PlanGate feature={0}><Dashboard /></PlanGate>
 */
export function PlanGate({ feature, children, fallback }) {
  const { has, loading } = usePlanFeatures();

  // Optimistic while loading — avoids blank flash on page open.
  if (loading) return <>{children}</>;
  if (has(feature)) return <>{children}</>;

  if (fallback !== undefined) return <>{fallback}</>;

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-2xl border border-[#D4A93A]/30 bg-gradient-to-br from-[#D4A93A]/[0.08] to-transparent p-8 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[#D4A93A]/15 text-[#D4A93A]">
        <Lock className="h-6 w-6" strokeWidth={2} />
      </span>
      <div>
        <p className="text-lg font-semibold text-[#F1ECDD]">
          This feature requires a higher plan
        </p>
        <p className="mt-1 max-w-md text-sm text-[#A9B6C6]">
          Upgrade your subscription to unlock it.
        </p>
      </div>
      <Link
        href="/admin/upgrade"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D4A93A] to-[#b8902c] px-4 py-2.5 text-sm font-bold text-[#0B1B2E] shadow-md shadow-[#D4A93A]/25 transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        Upgrade plan
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
