"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Subscription = {
  status: string;
  planName: string | null;
  expiresAt: string | null;
} | null;

export type SetupBranch = {
  id: string;
  name: string;
  hesabpay_account_number: string | null;
};

export type SetupInfo = {
  verified: boolean;
  hasHotel: boolean;
  hasBranch: boolean;
  hasHesabpay: boolean;
  hotelId: string | null;
  hotelName: string | null;
  isOnline: boolean;
  branches: SetupBranch[];
} | null;

const AdminAuthContext = createContext<{
  role: string | null;
  loading: boolean;
  subscription: Subscription;
  setup: SetupInfo;
  setRole: (r: string | null) => void;
  setSubscription: (s: Subscription) => void;
  setSetup: (s: SetupInfo | ((prev: SetupInfo) => SetupInfo)) => void;
  logout: () => void;
}>({
  role: null,
  loading: true,
  subscription: null,
  setup: null,
  setRole: () => {},
  setSubscription: () => {},
  setSetup: () => {},
  logout: () => {},
});

const ROLE_MAP: Record<string, string> = {
  SUPERADMIN: "super_admin",
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  HOTEL_OWNER: "hotel_owner",
  BRANCH_MANAGER: "branch_manager",
  WAITER: "waiter",
  STAFF: "branch_manager",
};

export function normalizeRole(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = String(raw).toUpperCase();
  return ROLE_MAP[key] ?? String(raw).toLowerCase();
}

export function AdminAuthProvider({
  initialRole = null,
  initialSubscription = null,
  initialSetup = null,
  children,
}: {
  initialRole?: string | null;
  initialSubscription?: Subscription;
  initialSetup?: SetupInfo;
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<string | null>(() => normalizeRole(initialRole));
  const [loading, setLoading] = useState(!initialRole);
  const [subscription, setSubscription] = useState<Subscription>(initialSubscription);
  const [setup, setSetup] = useState<SetupInfo>(initialSetup);

  useEffect(() => {
    if (initialRole) {
      setRole(normalizeRole(initialRole));
      setLoading(false);
    }
  }, [initialRole]);

  useEffect(() => {
    if (initialSubscription !== undefined) setSubscription(initialSubscription);
  }, [initialSubscription]);

  useEffect(() => {
    if (initialSetup !== undefined) setSetup(initialSetup);
  }, [initialSetup]);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{ role, loading, subscription, setup, setRole, setSubscription, setSetup, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}