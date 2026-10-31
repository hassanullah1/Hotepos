"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function SectionGuard({
  section,
  children,
}: {
  section: string;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/owner/sections");
        if (!res.ok) {
          if (!cancelled) setStatus("denied");
          return;
        }
        const data = await res.json();
        if (cancelled) return;

        // Platform admins bypass
        if (data?.all) {
          setStatus("ok");
          return;
        }

        const keys: string[] = data?.section_keys ?? [];
        setStatus(keys.includes(section) ? "ok" : "denied");
      } catch {
        if (!cancelled) setStatus("denied");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [section]);

  if (status === "loading") {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="mx-auto max-w-lg p-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/40 dark:bg-amber-950/30">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Lock size={22} />
          </span>
          <h1 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Not included in your plan
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            The <code className="rounded bg-black/5 px-1">{section}</code>{" "}
            feature is not available on your current subscription.
          </p>
          <Link
            href="/admin/renew"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Upgrade plan <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
