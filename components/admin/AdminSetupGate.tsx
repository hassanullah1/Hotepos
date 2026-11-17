"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuth, type SetupInfo } from "@/providers/AdminAuthProvider";
import AdminSetupModal from "./AdminSetupModal";
import AdminSetupSuccess from "./AdminSetupSuccess";

const EXEMPT_ROLES = ["super_admin", "admin"];
const HESABPAY_PATTERN = /^07\d{8}$/;

export type SetupStep = "hotel" | "branch" | "hesabpay";

function hesabpaySkipKey(hotelId: string) {
  return `hesabpay_setup_skipped_${hotelId}`;
}

type Decision = { step: SetupStep; hotelId: string; allowSkip: boolean } | null;

function decide(
  role: string | null,
  setup: SetupInfo,
  skippedHesabpay: boolean,
): Decision {
  if (!role || !setup) return null;
  if (EXEMPT_ROLES.includes(role)) return null;
  if (role !== "hotel_owner" && role !== "branch_manager") return null;

  // Verification gate handles unverified — don't open setup modal on /admin/verify
  if (!setup.verified) return null;

  // No hotel → create one
  if (!setup.hasHotel) {
    return { step: "hotel", hotelId: "", allowSkip: true };
  }

  // No branch → add one
  if (!setup.hasBranch) {
    return {
      step: "branch",
      hotelId: setup.hotelId ?? "",
      allowSkip: setup.isOnline !== true,
    };
  }

  // Has branch, but no branch has a valid hesabpay yet
  if (!setup.hasHesabpay) {
    const allowSkip = setup.isOnline !== true;
    if (allowSkip && skippedHesabpay) return null;
    return {
      step: "hesabpay",
      hotelId: setup.hotelId ?? "",
      allowSkip,
    };
  }

  return null;
}

export default function AdminSetupGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, loading, setup, setSetup } = useAdminAuth();

  const [skippedHesabpay, setSkippedHesabpay] = useState(false);
  const [skipChecked, setSkipChecked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Read localStorage once per hotel id
  useEffect(() => {
    setSkipChecked(false);
    try {
      if (setup?.hotelId) {
        setSkippedHesabpay(
          localStorage.getItem(hesabpaySkipKey(setup.hotelId)) === "1",
        );
      } else {
        setSkippedHesabpay(false);
      }
    } catch {
      setSkippedHesabpay(false);
    }
    setSkipChecked(true);
  }, [setup?.hotelId]);

  const decision = useMemo(() => {
    if (loading || !skipChecked) return null;
    return decide(role, setup, skippedHesabpay);
  }, [loading, skipChecked, role, setup, skippedHesabpay]);

  function handleAllComplete() {
    // Optimistically mark complete so the modal doesn't reopen in this session.
    // The layout will refresh real data on the next navigation (force-dynamic).
    setSetup((prev) =>
      prev
        ? { ...prev, hasHotel: true, hasBranch: true, hasHesabpay: true }
        : prev,
    );
    setShowSuccess(true);
  }

  const needsSetup = !!decision && !showSuccess;

  return (
    <>
      {children}

      {needsSetup && decision && (
        <AdminSetupModal
          initialStep={decision.step}
          initialHotelId={decision.hotelId}
          allowSkip={decision.allowSkip}
          onAllComplete={handleAllComplete}
        />
      )}

      {showSuccess && (
        <AdminSetupSuccess onDone={() => setShowSuccess(false)} />
      )}
    </>
  );
}
