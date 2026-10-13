"use client";

import { BuyerAuthProvider } from "@/providers/BuyerAuthProvider";

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return <BuyerAuthProvider>{children}</BuyerAuthProvider>;
}
