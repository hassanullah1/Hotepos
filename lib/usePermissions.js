// lib/usePermissions.js
"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// Reads permission codes AND the role name off your existing
// /api/auth/me response ({ user: { role, permissions, ... } }).
//
// Usage:
//   const { hasPermission, hasRole, role, loading } = usePermissions();
//   {hasPermission("users.create") && <Link href="/admin/users/create">+ New User</Link>}
//   {hasRole("super_admin") && <AdminOnlyThing />}
//   {hasRole(["super_admin", "hotel_owner"]) && <OwnerOrAdminThing />}
export function usePermissions() {
  const [codes, setCodes] = useState(null); // null = not loaded yet
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth("/api/auth/me")
      .then((res) =>
        res.ok ? res.json() : { user: { permissions: [], role: null } },
      )
      .then((data) => {
        if (cancelled) return;
        setCodes(data.user?.permissions || []);
        setRole(data.user?.role || null);
      })
      .catch(() => {
        if (!cancelled) {
          setCodes([]);
          setRole(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // While still loading, both checks return false so buttons stay
  // hidden rather than flashing on then off.
  const hasPermission = useCallback(
    (code) => Boolean(codes && codes.includes(code)),
    [codes],
  );

  // Accepts a single role name or an array of role names.
  const hasRole = useCallback(
    (nameOrNames) => {
      if (!role) return false;
      if (Array.isArray(nameOrNames)) return nameOrNames.includes(role);
      return role === nameOrNames;
    },
    [role],
  );

  return { hasPermission, hasRole, role, loading, permissions: codes || [] };
}
