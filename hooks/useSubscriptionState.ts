"use client";

import { useMemo } from "react";

const SOON_THRESHOLD_DAYS = 4;

export type SubscriptionInput = {
  status: string;
  planName: string | null;
  expiresAt: string | null;
} | null;

export type SubscriptionState =
  | { state: "loading"; locked: false; daysLeft: null }
  | { state: "expired"; locked: true; daysLeft: 0 }
  | { state: "expiring_soon"; locked: false; daysLeft: number }
  | { state: "active"; locked: false; daysLeft: null };

export function useSubscriptionState(
  subscription: SubscriptionInput,
): SubscriptionState {
  return useMemo<SubscriptionState>(() => {
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
      if (daysLeft <= SOON_THRESHOLD_DAYS) {
        return { state: "expiring_soon", locked: false, daysLeft };
      }
    }

    return { state: "active", locked: false, daysLeft: null };
  }, [subscription]);
}
