"use client";

import { useMemo } from "react";

const SOON_THRESHOLD_DAYS = 7;

export function useSubscriptionState(subscription) {
  return useMemo(() => {
    if (!subscription) {
      return { state: "loading", locked: false, daysLeft: null };
    }

    const { status, expiresAt } = subscription;

    if (status === "expired" || status === "cancelled") {
      return { state: "expired", locked: true, daysLeft: 0 };
    }

    if (expiresAt) {
      const msLeft = new Date(expiresAt).getTime() - Date.now();
      const daysLeft = Math.ceil(msLeft / 864e5);

      if (daysLeft <= 0) return { state: "expired", locked: true, daysLeft: 0 };
      if (daysLeft <= SOON_THRESHOLD_DAYS)
        return { state: "expiring_soon", locked: false, daysLeft };
    }

    return { state: "active", locked: false, daysLeft: null };
  }, [subscription]);
}
