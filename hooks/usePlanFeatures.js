"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const EXEMPT_ROLES = new Set(["super_admin", "admin"]);
const HOTEL_ROLES = new Set(["hotel_owner", "branch_manager"]);

function normalizePlanFeatures(plan) {
  const out = {};
  const raw = plan?.features;

  if (Array.isArray(raw)) {
    for (const key of raw) {
      if (typeof key === "string" && key) out[key] = true;
    }
  } else if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw)) {
      if (key) out[key] = Boolean(value);
    }
  }

  if (typeof plan?.is_rooms === "boolean" && !("rooms" in out)) {
    out.rooms = plan.is_rooms;
  }

  return out;
}

export function usePlanFeatures() {
  const { role, subscription } = useAdminAuth();
  const isExempt = EXEMPT_ROLES.has(role);
  const hasHotelRole = HOTEL_ROLES.has(role);

  // null = loading (optimistic — everything shows)
  // {}   = loaded, no feature keys
  const [features, setFeatures] = useState(null);

  useEffect(() => {
    if (!hasHotelRole || isExempt) {
      setFeatures({});
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetchWithAuth("/api/owner/plan");
        if (!res.ok) {
          if (!cancelled) setFeatures({});
          return;
        }
        const data = await res.json();
        if (!cancelled) setFeatures(normalizePlanFeatures(data?.plan));
      } catch {
        if (!cancelled) setFeatures({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHotelRole, isExempt, subscription?.id, subscription?.status]);

  const has = useMemo(
    () => (key) => {
      if (!key) return true;
      if (isExempt) return true;
      if (features === null) return true;
      return features[key] === true;
    },
    [features, isExempt],
  );

  return { features, has, loading: features === null };
}
