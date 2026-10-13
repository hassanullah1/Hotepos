// app/admin/verify/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  PhoneCall,
  MessageCircle,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export default function VerifyPage() {
  const { dir } = useAdminPreferences();

  const [loading, setLoading] = useState(true);
  const [hotel, setHotel] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/owner/verification");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setHotel(data.hotel);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );

  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6 dark:bg-gray-900">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );

  const status = hotel?.verification_status || "pending";

  const config = {
    pending: {
      Icon: Clock,
      title: "Not verified",
      message:
        "Please wait — our admin will review and approve your hotel soon.",
      tone: "amber",
    },
    contacted: {
      Icon: PhoneCall,
      title: "We're in touch",
      message: "Please answer the call or message to finish verifying.",
      tone: "sky",
    },
    verified: {
      Icon: ShieldCheck,
      title: "Verified",
      message: "Your hotel is fully verified. You have full access.",
      tone: "emerald",
    },
    rejected: {
      Icon: ShieldAlert,
      title: "Not verified",
      message: "We couldn't verify your hotel. Please contact us.",
      tone: "red",
    },
  }[status] ?? {
    Icon: Clock,
    title: "Not verified",
    message: "Please wait — our admin will review and approve your hotel soon.",
    tone: "amber",
  };

  const { Icon, title, message, tone } = config;

  const iconTone = {
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }[tone];

  const waText = encodeURIComponent(
    `Hi, I'd like to check on the verification for my hotel "${hotel?.name || ""}".`,
  );
  const waUrl = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`
    : `https://wa.me/?text=${waText}`;

  return (
    <div
      className="flex  items-center justify-center bg-white p-6 dark:bg-gray-900"
      dir={dir}
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Icon */}
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${iconTone}`}
        >
          <Icon size={28} strokeWidth={2} />
        </div>

        {/* Hotel name */}
        <p className="mt-5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {hotel?.name || "Your hotel"}
        </p>

        {/* Title */}
        <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h1>

        {/* Message */}
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {message}
        </p>

        {/* WhatsApp button (hidden when verified) */}
        {status !== "verified" && (
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            <MessageCircle size={15} />
            Contact us
          </a>
        )}
      </div>
    </div>
  );
}
