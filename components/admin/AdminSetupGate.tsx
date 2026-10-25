"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import AdminSetupModal from "./AdminSetupModal";

const EXEMPT_ROLES = ["super_admin", "admin"];
const HESABPAY_PATTERN = /^07\d{8}$/;

export type SetupStep = "hotel" | "branch" | "hesabpay";

type GateState = "checking" | "needs_setup" | "allowed";

/* localStorage key so that a user who clicks “Skip for now” on the
   HesabPay step isn't asked about it again on every page load. */
function hesabpaySkipKey(hotelId: string) {
  return `hesabpay_setup_skipped_${hotelId}`;
}

export default function AdminSetupGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, loading: authLoading } = useAdminAuth();
  const { t } = useAdminPreferences();

  const [state, setState] = useState<GateState>("checking");
  const [initialStep, setInitialStep] = useState<SetupStep>("hotel");
  const [initialHotelId, setInitialHotelId] = useState<string>("");
  const [recheckKey, setRecheckKey] = useState(0);

  const isExempt = EXEMPT_ROLES.includes(role);
  const isOwner = role === "hotel_owner";
  const isBranchManager = role === "branch_manager";

  useEffect(() => {
    if (authLoading || !role) return;

    if (isExempt || isBranchManager || !isOwner) {
      setState("allowed");
      return;
    }

    let cancelled = false;
    setState("checking");

    (async () => {
      try {
        /* ── Safety net: skip if owner isn't verified ── */
        const verifRes = await fetchWithAuth("/api/owner/verification");
        if (cancelled) return;
        if (verifRes.ok) {
          const vData = await verifRes.json();
          const vStatus = vData.hotel?.verification_status || "pending";
          if (vStatus !== "verified") {
            setState("allowed");
            return;
          }
        }

        /* ── Step 1: any hotel? ── */
        const hotelsRes = await fetchWithAuth("/api/owners/hotel");
        if (cancelled) return;
        if (!hotelsRes.ok) {
          setState("allowed");
          return;
        }
        const hotelsData = await hotelsRes.json();
        const hotels: any[] = hotelsData.hotels || [];

        if (hotels.length === 0) {
          setInitialStep("hotel");
          setInitialHotelId("");
          setState("needs_setup");
          return;
        }

        const hotelId: string =
          hotelsData.selectedHotelId || hotels[0].id || "";
        if (!hotelId) {
          setInitialStep("hotel");
          setInitialHotelId("");
          setState("needs_setup");
          return;
        }

        /* ── Step 2: any branch? ── */
        const branchesRes = await fetchWithAuth(
          `/api/branches?hotel_id=${hotelId}`,
        );
        if (cancelled) return;

        let branches: any[] = [];
        if (branchesRes.ok) {
          const bData = await branchesRes.json();
          branches = bData.branches || [];
        }

        if (branches.length === 0) {
          setInitialStep("branch");
          setInitialHotelId(hotelId);
          setState("needs_setup");
          return;
        }

        /* ── Step 3: valid HesabPay? (OPTIONAL) ── */
        const hotelRes = await fetchWithAuth(`/api/owners/hotel/${hotelId}`);
        if (cancelled) return;
        if (!hotelRes.ok) {
          setState("allowed");
          return;
        }
        const hotelData = await hotelRes.json();
        const hp = String(
          hotelData.hotel?.hesabpay_account_number || "",
        ).trim();

        if (!HESABPAY_PATTERN.test(hp)) {
          /* Respect the user's choice to skip this step for this hotel. */
          let skipped = false;
          try {
            skipped = localStorage.getItem(hesabpaySkipKey(hotelId)) === "1";
          } catch {
            /* localStorage unavailable — treat as not skipped */
          }

          if (skipped) {
            setState("allowed");
            return;
          }

          setInitialStep("hesabpay");
          setInitialHotelId(hotelId);
          setState("needs_setup");
          return;
        }

        /* ── All good ── */
        setState("allowed");
      } catch {
        if (!cancelled) setState("allowed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, role, isExempt, isOwner, isBranchManager, recheckKey]);

  return (
    <>
      {children}

      {state === "checking" && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#15121C]/95 px-6 py-5 ring-1 ring-white/10">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#C9A227]/30 border-t-[#C9A227]" />
            <p
              className="text-[10px] uppercase tracking-[0.25em] text-[#6E687A]"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {t?.setup?.checking || "Checking setup…"}
            </p>
          </div>
        </div>
      )}

      {state === "needs_setup" && (
        <AdminSetupModal
          initialStep={initialStep}
          initialHotelId={initialHotelId}
          onAllComplete={() => setRecheckKey((k) => k + 1)}
        />
      )}
    </>
  );
}
