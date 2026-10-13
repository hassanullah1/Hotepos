// providers/BuyerAuthProvider.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Buyer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_active?: boolean;
  created_at?: string;
}

interface BuyerAuthContextValue {
  buyer: Buyer | null;
  loading: boolean;
  setBuyer: (buyer: Buyer | null) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const BuyerAuthContext = createContext<BuyerAuthContextValue>({
  buyer: null,
  loading: true,
  setBuyer: () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function BuyerAuthProvider({ children }: { children: React.ReactNode }) {
  const [buyer, setBuyerState] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);

  // Wrap the setter so the context exposes the exact declared signature.
  const setBuyer = useCallback((value: Buyer | null) => {
    setBuyerState(value);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/buyer/auth/me", {
        credentials: "same-origin",
      });
      const data = await res.json();
      setBuyerState(data.user || null);
    } catch {
      setBuyerState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/buyer/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    setBuyerState(null);
  }, []);

  return (
    <BuyerAuthContext.Provider
      value={{ buyer, loading, setBuyer, logout, refresh }}
    >
      {children}
    </BuyerAuthContext.Provider>
  );
}

export function useBuyerAuth() {
  return useContext(BuyerAuthContext);
}
