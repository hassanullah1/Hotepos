"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const AdminAuthContext = createContext({
  role: null,
  loading: true,
  subscription: null,
  setRole: () => {},
  setSubscription: () => {},
  logout: () => {},
});

const ROLE_MAP = {
  SUPERADMIN: "super_admin",
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  HOTEL_OWNER: "hotel_owner",
  BRANCH_MANAGER: "branch_manager",
  WAITER: "waiter",
  STAFF: "branch_manager",
};

export function normalizeRole(raw) {
  if (!raw) return null;
  const key = String(raw).toUpperCase();
  return ROLE_MAP[key] ?? String(raw).toLowerCase();
}

export function AdminAuthProvider({
  initialRole = null,
  initialSubscription = null, // ← must be accepted here
  children,
}) {
  const [role, setRole] = useState(() => normalizeRole(initialRole));
  const [loading, setLoading] = useState(!initialRole);
  const [subscription, setSubscription] = useState(initialSubscription);

  useEffect(() => {
    if (initialRole) {
      setRole(normalizeRole(initialRole));
      setLoading(false);
    }
  }, [initialRole]);

  useEffect(() => {
    // whenever the layout passes a new subscription, sync it in
    if (initialSubscription !== undefined) setSubscription(initialSubscription);
  }, [initialSubscription]);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{ role, loading, subscription, setRole, setSubscription, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
