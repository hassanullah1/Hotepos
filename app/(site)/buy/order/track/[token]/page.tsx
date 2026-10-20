"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Fraunces } from "next/font/google";
import {
  Loader2,
  CheckCircle2,
  Clock,
  ChefHat,
  XCircle,
  Star,
  Send,
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  Receipt,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

type StatusStep = {
  key: string;
  labelEn: string;
  labelPs: string;
  labelPrs: string;
  Icon: any;
  done: boolean;
  active: boolean;
};

/**
 * Builds the stepper steps dynamically — ALWAYS returns 5 steps:
 *  Step 1: Received
 *  Step 2: Paid / Unpaid   ← GATE (must be paid to advance)
 *  Step 3: Preparing
 *  Step 4: Ready
 *  Step 5: Completed  OR  Cancelled
 *
 * If not paid → steps 3, 4, 5 stay grey (do not advance).
 */
function buildStatusSteps(order: any): StatusStep[] {
  const isPaid = order.payment_status === "paid";
  const isCancelled = order.status === "cancelled";
  console.log(order)

  const statusFlow = ["open", "in_progress", "ready", "completed"];
  const statusIdx = statusFlow.indexOf(order.status);
  const safeStatusIdx = statusIdx < 0 ? 0 : statusIdx;

  return [
    // ---------- Step 1: Received ----------
    {
      key: "open",
      labelEn: "Received",
      labelPs: "ترلاسه شو",
      labelPrs: "دریافت شد",
      Icon: Receipt,
      done: true, // order exists → it was received
      active: false,
    },

    // ---------- Step 2: Paid / Unpaid (GATE) ----------
    {
      key: "payment",
      labelEn: isPaid ? "Paid" : "Unpaid",
      labelPs: isPaid ? "تادیه شو" : "نه تادیه شو",
      labelPrs: isPaid ? "پرداخت شد" : "پرداخت نشده",
      Icon: isPaid ? CheckCircle2 : CreditCard,
      done: isPaid,
      // If unpaid (and not cancelled), this is the blocking/current step
      active: !isPaid && !isCancelled,
    },

    // ---------- Step 3: Preparing ----------
    {
      key: "in_progress",
      labelEn: "Preparing",
      labelPs: "چمتو کیږي",
      labelPrs: "در حال آماده‌سازی",
      Icon: ChefHat,
      done: isPaid && !isCancelled && safeStatusIdx >= 2,
      active: isPaid && !isCancelled && safeStatusIdx <= 1,
    },

    // ---------- Step 4: Ready ----------
    {
      key: "ready",
      labelEn: "Ready",
      labelPs: "وړاندې شو",
      labelPrs: "سرو شد",
      Icon: Clock,
      done: isPaid && !isCancelled && safeStatusIdx >= 3,
      active: isPaid && !isCancelled && safeStatusIdx === 2,
    },

    // ---------- Step 5: Completed OR Cancelled ----------
    isCancelled
      ? {
          key: "rejected",
          labelEn: "Cancelled",
          labelPs: "لغوه شو",
          labelPrs: "لغو شد",
          Icon: XCircle,
          done: false,
          active: true,
        }
      : {
          key: "paid",
          labelEn: "Completed",
          labelPs: "مکمل",
          labelPrs: "تکمیل",
          Icon: CheckCircle2,
          done: isPaid && safeStatusIdx >= 3,
          active: isPaid && safeStatusIdx === 3,
        },
  ];
}

const trackText = {
  en: {
    dir: "ltr",
    backToMenu: "Back to menu",
    orderLabel: "Order",
    items: "Items",
    summary: "Summary",
    subtotal: "Subtotal",
    total: "Total",
    paymentSection: "Payment",
    payButton: "Pay with HesabPay",
    paying: "Opening HesabPay…",
    payHint: "You'll be redirected to HesabPay to complete payment.",
    confirmingPayment: "Confirming…",
    paidLabel: "Paid",
    unpaidLabel: "Unpaid",
    failedLabel: "Payment failed",
    cancelled: "Order cancelled",
    rateItems: "Rate your items",
    submit: "Submit reviews",
    submitting: "Submitting…",
    thanks: "Thanks for your review!",
    autoUpdate: "This page updates every 5 seconds.",
    commentPlaceholder: "Comment (optional)",
    orderNumber: "Order #",
    placedAt: "Placed",
    progress: "Progress",
    restaurant: "Restaurant",
  },
  ps: {
    dir: "rtl",
    backToMenu: "بیرته مینو ته",
    orderLabel: "فرمایش",
    items: "توکي",
    summary: "لنډیز",
    subtotal: "فرعي مجموعه",
    total: "ټول",
    paymentSection: "تادیه",
    payButton: "د حساب پی سره تادیه وکړئ",
    paying: "حساب پی پرانیستل کیږي…",
    payHint: "د تادیې بشپړولو لپاره به حساب پی ته یوړل شئ.",
    confirmingPayment: "تصدیق کیږي…",
    paidLabel: "تادیه شو",
    unpaidLabel: "نه تادیه شو",
    failedLabel: "تادیه ناکامه شوه",
    cancelled: "فرمایش لغوه شو",
    rateItems: "خپل توکي و ارزوئ",
    submit: "بیاکتنې وسپارئ",
    submitting: "سپارل کیږي…",
    thanks: "ستاسو د بیاکتنې مننه!",
    autoUpdate: "دا پاڼه هره ۵ ثانیه تازه کیږي.",
    commentPlaceholder: "نظر (اختیاري)",
    orderNumber: "د فرمایش #",
    placedAt: "وخت",
    progress: "پرمختګ",
    restaurant: "رستورانت",
  },
  prs: {
    dir: "rtl",
    backToMenu: "بازگشت به منو",
    orderLabel: "سفارش",
    items: "آیتم‌ها",
    summary: "خلاصه",
    subtotal: "جمع فرعی",
    total: "مجموع",
    paymentSection: "پرداخت",
    payButton: "پرداخت با حساب پی",
    paying: "در حال باز کردن حساب پی…",
    payHint: "برای تکمیل پرداخت به حساب پی هدایت می‌شوید.",
    confirmingPayment: "در حال تأیید…",
    paidLabel: "پرداخت شد",
    unpaidLabel: "پرداخت نشده",
    failedLabel: "پرداخت ناموفق",
    cancelled: "سفارش لغو شد",
    rateItems: "آیتم‌های خود را ارزیابی کنید",
    submit: "ارسال نظرات",
    submitting: "در حال ارسال…",
    thanks: "از نظر شما سپاسگزاریم!",
    autoUpdate: "این صفحه هر ۵ ثانیه به‌روزرسانی می‌شود.",
    commentPlaceholder: "نظر (اختیاری)",
    orderNumber: "شماره سفارش",
    placedAt: "زمان",
    progress: "پیشرفت",
    restaurant: "رستورانت",
  },
};

export default function TrackPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lang = trackText[language] ? language : "en";
  const t = trackText[lang];
  const isRTL = t.dir === "rtl";
  const isDark = mounted ? resolvedTheme !== "light" : true;

  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    async function tick() {
      try {
        const res = await fetch(`/api/public/orders/${token}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Not found");
        const d = await res.json();
        if (active) setOrder(d.order);
      } catch (e: any) {
        if (active) setError(e.message);
      }
    }
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [token]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", t.dir);
  }, [lang, mounted, t.dir]);

  useEffect(() => {
    if (!mounted) return;
    if (confirming) return;

    const paidFlag = searchParams.get("paid");
    if (paidFlag !== "1") return;

    const rawUrl = typeof window !== "undefined" ? window.location.href : "";
    let data: any = {};
    try {
      const idx = rawUrl.indexOf("data=");
      if (idx !== -1) {
        const json = decodeURIComponent(rawUrl.slice(idx + 5));
        data = JSON.parse(json);
      }
    } catch {}

    const refOrderId = searchParams.get("ref");
    if (!refOrderId) return;

    setConfirming(true);
    fetch("/api/payments/hesabpay/order/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        ref: refOrderId,
        transaction_id: data?.transaction_id || null,
        success: data?.success === true,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) console.error("Confirm returned:", d);
      })
      .catch((err) => console.error("Confirm request failed:", err));

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, searchParams]);

  const canReview =
    order &&
    ["ready", "completed", "served", "paid", "closed"].includes(order.status) &&
    !submitted;

  async function payNow() {
    if (!order?.id) return;
    setPaying(true);
    try {
      const res = await fetch("/api/payments/hesabpay/order/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ order_id: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment");
      window.location.href = data.payment_url;
    } catch (e: any) {
      alert(e.message);
      setPaying(false);
    }
  }

  async function submitReviews() {
    const payload = Object.entries(ratings)
      .filter(([, r]) => r >= 1 && r <= 5)
      .map(([id, r]) => ({
        menu_item_id: id,
        rating: r,
        comment: comments[id] || "",
      }));
    if (!payload.length) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ order_token: token, reviews: payload }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to submit");
      }
      setSubmitted(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !order)
    return (
      <div
        className={`flex min-h-screen items-center justify-center p-6 text-center ${
          isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
        }`}
      >
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );

  if (!order)
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          isDark ? "bg-[#15121C]" : "bg-[#F7F4EE]"
        }`}
      >
        <Loader2
          className={`h-7 w-7 animate-spin ${
            isDark ? "text-[#C9A227]" : "text-[#A9821E]"
          }`}
        />
      </div>
    );

  const isPaid = order.payment_status === "paid";
  const isCancelled = order.status === "cancelled";
  const steps = buildStatusSteps(order);

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
      }`}
      dir={t.dir}
    >
      {/* Grid texture */}
      <svg
        className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300 ${
          isDark ? "opacity-[0.04]" : "opacity-[0.05]"
        }`}
        viewBox="0 0 300 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {Array.from({ length: 14 }).map((_, row) =>
          Array.from({ length: 14 }).map((_, col) => (
            <rect
              key={`${row}-${col}`}
              x={10 + col * 36}
              y={10 + row * 36}
              width="18"
              height="18"
              rx="4"
              fill="none"
              stroke={isDark ? "#F0EAE2" : "#1D1A22"}
              strokeWidth="1"
            />
          )),
        )}
      </svg>

      {/* Drifting gold blobs */}
      <div
        className={`blob-a pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl ${
          isDark ? "bg-[#C9A227]/10" : "bg-[#C9A227]/15"
        }`}
        aria-hidden="true"
      />
      <div
        className={`blob-b pointer-events-none absolute top-40 -right-32 h-96 w-96 rounded-full blur-3xl ${
          isDark ? "bg-[#C9A227]/8" : "bg-[#C9A227]/12"
        }`}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl px-5 py-8 sm:px-6 sm:py-10">
        {/* Back link */}
        <Link
          href="/buy/order"
          className={`group mb-5 inline-flex items-center gap-1.5 text-xs font-semibold transition ${
            isDark
              ? "text-[#B7B2C4] hover:text-[#E0B93A]"
              : "text-[#6E687A] hover:text-[#8A6E1A]"
          }`}
        >
          <ArrowLeft
            size={13}
            className="transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
          />
          {t.backToMenu}
        </Link>

        {/* ============ Header card ============ */}
        <div
          className={`overflow-hidden rounded-3xl border backdrop-blur-sm transition-colors ${
            isDark
              ? "border-[#2E2938] bg-[#1E1B26]/90"
              : "border-[#E4DFD4] bg-white/90"
          }`}
        >
          <div className="relative p-6 sm:p-7">
            <div
              className="pointer-events-none absolute -top-16 -end-16 h-40 w-40 rounded-full bg-[#C9A227]/15 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[10px] uppercase tracking-[0.3em] ${
                    isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                  }`}
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {t.orderLabel}
                </p>
                <h1
                  className="mt-1 text-2xl font-semibold sm:text-3xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {order.order_number}
                </h1>
                <p
                  className={`mt-1 text-xs ${
                    isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                  }`}
                >
                  {order.branch_name} ·{" "}
                  {new Date(order.created_at).toLocaleTimeString()}
                </p>
              </div>

              {/* Payment badge */}
              {confirming && !isPaid ? (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    isDark
                      ? "border-[#C9A227]/40 bg-[#C9A227]/10 text-[#E0B93A]"
                      : "border-[#A9821E]/40 bg-[#C9A227]/15 text-[#8A6E1A]"
                  }`}
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t.confirmingPayment}
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    isPaid
                      ? isDark
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : order.payment_status === "failed"
                        ? isDark
                          ? "border-red-500/40 bg-red-500/10 text-red-300"
                          : "border-red-300 bg-red-50 text-red-700"
                        : isDark
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                          : "border-amber-300 bg-amber-50 text-amber-700"
                  }`}
                >
                  <CreditCard className="h-3 w-3" />
                  {isPaid
                    ? t.paidLabel
                    : order.payment_status === "failed"
                      ? t.failedLabel
                      : t.unpaidLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ============ Progress stepper (5 steps) ============ */}
        <div
          className={`mt-5 overflow-hidden rounded-3xl border backdrop-blur-sm transition-colors ${
            isDark
              ? "border-[#2E2938] bg-[#1E1B26]/90"
              : "border-[#E4DFD4] bg-white/90"
          }`}
        >
          <div className="p-5 sm:p-6">
            <p
              className={`mb-5 text-[10px] uppercase tracking-[0.2em] ${
                isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
              }`}
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {t.progress}
            </p>

            <ol className="flex items-start justify-between gap-1 sm:gap-2">
              {steps.map((s, idx) => {
                const label =
                  lang === "ps"
                    ? s.labelPs
                    : lang === "prs"
                      ? s.labelPrs
                      : s.labelEn;
                const Icon = s.Icon;
                const isCancelledStep = s.key === "cancelled";
                const isPaymentStep = s.key === "payment";
                const reached = s.done || s.active;

                const prevReached =
                  idx > 0 && (steps[idx - 1].done || steps[idx - 1].active);
                const nextReached =
                  idx < steps.length - 1 &&
                  (steps[idx + 1].done || steps[idx + 1].active);

                const beforeGold = idx > 0 && prevReached && reached;
                const afterGold = reached && nextReached;

                // Unpaid state → show payment step in amber to signal "action needed"
                const isUnpaidStep = isPaymentStep && !isPaid && !isCancelled;

                return (
                  <li
                    key={s.key}
                    className="flex flex-1 flex-col items-center text-center"
                  >
                    <div className="flex w-full items-center">
                      {idx > 0 && (
                        <span
                          className={`h-0.5 flex-1 transition-colors ${
                            beforeGold
                              ? "bg-gradient-to-r from-[#E0B93A] to-[#C9A227]"
                              : isDark
                                ? "bg-[#2A2534]"
                                : "bg-[#EDE8DE]"
                          }`}
                        />
                      )}

                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
                          isCancelledStep
                            ? "bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md shadow-red-500/30"
                            : isUnpaidStep
                              ? "bg-gradient-to-br from-amber-400 to-amber-600 text-[#1D1707] shadow-md shadow-amber-500/30"
                              : reached
                                ? "bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-md shadow-[#C9A227]/30"
                                : isDark
                                  ? "bg-[#2A2534] text-[#6E687A]"
                                  : "bg-[#EDE8DE] text-[#A39D8F]"
                        } ${
                          s.active
                            ? isCancelledStep
                              ? "ring-4 ring-red-500/25"
                              : isUnpaidStep
                                ? "ring-4 ring-amber-500/25"
                                : "ring-4 ring-[#C9A227]/25"
                            : ""
                        }`}
                      >
                        <Icon size={16} strokeWidth={2.25} />
                      </span>

                      {idx < steps.length - 1 && (
                        <span
                          className={`h-0.5 flex-1 transition-colors ${
                            afterGold
                              ? "bg-gradient-to-r from-[#E0B93A] to-[#C9A227]"
                              : isDark
                                ? "bg-[#2A2534]"
                                : "bg-[#EDE8DE]"
                          }`}
                        />
                      )}
                    </div>

                    <span
                      className={`mt-2 text-[11px] font-medium sm:text-xs ${
                        isCancelledStep
                          ? "text-red-500"
                          : isUnpaidStep
                            ? "text-amber-500"
                            : reached
                              ? isDark
                                ? "text-[#F0EAE2]"
                                : "text-[#1D1A22]"
                              : isDark
                                ? "text-[#6E687A]"
                                : "text-[#A39D8F]"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* ============ Two column grid ============ */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* LEFT: items + review */}
          <div className="space-y-5">
            {/* Items card */}
            <div
              className={`overflow-hidden rounded-3xl border backdrop-blur-sm transition-colors ${
                isDark
                  ? "border-[#2E2938] bg-[#1E1B26]/90"
                  : "border-[#E4DFD4] bg-white/90"
              }`}
            >
              <div
                className={`flex items-center justify-between border-b px-5 py-4 ${
                  isDark ? "border-[#2E2938]" : "border-[#E4DFD4]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag
                    size={15}
                    className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
                  />
                  <h2
                    className="text-sm font-semibold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {t.items}
                  </h2>
                </div>
                <span
                  className={`text-xs ${
                    isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                  }`}
                >
                  {order.items.length}
                </span>
              </div>

              <ul>
                {order.items.map((i: any, idx: number) => (
                  <li
                    key={i.id}
                    className={`flex items-center justify-between gap-3 px-5 py-3.5 ${
                      idx > 0
                        ? isDark
                          ? "border-t border-[#2E2938]"
                          : "border-t border-[#E4DFD4]"
                        : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          isDark
                            ? "bg-[#C9A227]/15 text-[#E0B93A]"
                            : "bg-[#C9A227]/15 text-[#8A6E1A]"
                        }`}
                      >
                        {i.quantity}×
                      </span>
                      <span className="truncate text-sm font-medium">
                        {i.name}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
                      }`}
                    >
                      {i.line_total.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Review card */}
            {canReview && (
              <div
                className={`overflow-hidden rounded-3xl border backdrop-blur-sm transition-colors ${
                  isDark
                    ? "border-[#2E2938] bg-[#1E1B26]/90"
                    : "border-[#E4DFD4] bg-white/90"
                }`}
              >
                <div
                  className={`flex items-center gap-2 border-b px-5 py-4 ${
                    isDark ? "border-[#2E2938]" : "border-[#E4DFD4]"
                  }`}
                >
                  <Star
                    size={15}
                    className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
                  />
                  <h2
                    className="text-sm font-semibold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {t.rateItems}
                  </h2>
                </div>

                <div className="space-y-3 p-5">
                  {order.items.map((i: any) => {
                    const key = i.menu_item_id || i.id;
                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-4 ${
                          isDark
                            ? "border-[#332C3E] bg-[#161320]"
                            : "border-[#E4DFD4] bg-[#FAF8F4]"
                        }`}
                      >
                        <p className="text-sm font-medium">{i.name}</p>

                        <div className="mt-2 flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() =>
                                setRatings((r) => ({ ...r, [key]: n }))
                              }
                              className="p-0.5 transition hover:scale-110"
                            >
                              <Star
                                className={`h-6 w-6 transition ${
                                  (ratings[key] || 0) >= n
                                    ? "fill-[#C9A227] text-[#C9A227]"
                                    : isDark
                                      ? "text-[#332C3E]"
                                      : "text-[#D4CFC4]"
                                }`}
                              />
                            </button>
                          ))}
                          {ratings[key] ? (
                            <span
                              className={`ml-2 text-xs font-semibold ${
                                isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
                              }`}
                            >
                              {ratings[key]} / 5
                            </span>
                          ) : null}
                        </div>

                        <input
                          value={comments[key] || ""}
                          onChange={(e) =>
                            setComments((c) => ({
                              ...c,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder={t.commentPlaceholder}
                          className={`mt-3 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#C9A227]/30 ${
                            isDark
                              ? "border-[#332C3E] bg-[#15121C] text-[#F0EAE2] placeholder:text-[#5E5670] focus:border-[#C9A227]"
                              : "border-[#E4DFD4] bg-white text-[#1D1A22] placeholder:text-[#A39D8F] focus:border-[#A9821E]"
                          }`}
                        />
                      </div>
                    );
                  })}

                  <button
                    onClick={submitReviews}
                    disabled={submitting || Object.keys(ratings).length === 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 py-3 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/25 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/35 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {submitting ? t.submitting : t.submit}
                  </button>
                </div>
              </div>
            )}

            {submitted && (
              <div
                className={`flex items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold ${
                  isDark
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-emerald-300 bg-emerald-50 text-emerald-700"
                }`}
              >
                <CheckCircle2 size={16} />
                {t.thanks}
              </div>
            )}
          </div>

          {/* RIGHT: summary + payment */}
          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            {/* Summary card */}
            <div
              className={`overflow-hidden rounded-3xl border backdrop-blur-sm transition-colors ${
                isDark
                  ? "border-[#2E2938] bg-[#1E1B26]/90"
                  : "border-[#E4DFD4] bg-white/90"
              }`}
            >
              <div className="p-5 sm:p-6">
                <p
                  className={`mb-4 text-[10px] uppercase tracking-[0.2em] ${
                    isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                  }`}
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {t.summary}
                </p>

                <dl className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <dt
                      className={`text-xs ${
                        isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                      }`}
                    >
                      {t.orderNumber}
                    </dt>
                    <dd
                      className="text-end text-xs font-semibold"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {order.order_number}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <dt
                      className={`inline-flex items-center gap-1 text-xs ${
                        isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                      }`}
                    >
                      <MapPin size={11} />
                      {t.restaurant}
                    </dt>
                    <dd className="max-w-[55%] truncate text-end text-xs font-medium">
                      {order.branch_name}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <dt
                      className={`inline-flex items-center gap-1 text-xs ${
                        isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                      }`}
                    >
                      <Clock size={11} />
                      {t.placedAt}
                    </dt>
                    <dd className="text-end text-xs font-medium">
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </dd>
                  </div>
                </dl>

                <div
                  className={`mt-5 space-y-2 border-t pt-4 ${
                    isDark ? "border-[#2E2938]" : "border-[#E4DFD4]"
                  }`}
                >
                  <div className="flex justify-between text-sm">
                    <span
                      className={`text-xs ${
                        isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                      }`}
                    >
                      {t.subtotal}
                    </span>
                    <span className="font-medium tabular-nums">
                      {order.total_amount.toFixed(2)}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between border-t pt-3 ${
                      isDark ? "border-[#2E2938]" : "border-[#E4DFD4]"
                    }`}
                  >
                    <span
                      className="text-base font-bold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {t.total}
                    </span>
                    <span
                      className={`text-base font-bold tabular-nums ${
                        isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
                      }`}
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {order.total_amount.toFixed(2)} {order.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pay CTA card */}
            {!isPaid && !isCancelled && (
              <div
                className={`overflow-hidden rounded-3xl border backdrop-blur-sm transition-colors ${
                  isDark
                    ? "border-[#C9A227]/40 bg-gradient-to-br from-[#C9A227]/10 to-[#1E1B26]/90"
                    : "border-[#A9821E]/40 bg-gradient-to-br from-[#C9A227]/10 to-white/90"
                }`}
              >
                <div className="p-5 sm:p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck
                      size={15}
                      className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
                    />
                    <p
                      className="text-sm font-semibold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {t.paymentSection}
                    </p>
                  </div>

                  <button
                    onClick={payNow}
                    disabled={paying || confirming}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 py-3 text-sm font-bold text-[#1D1707] shadow-md shadow-[#C9A227]/25 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {paying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    {paying ? t.paying : t.payButton}
                  </button>

                  <p
                    className={`mt-2.5 text-center text-[11px] leading-relaxed ${
                      isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                    }`}
                  >
                    {t.payHint}
                  </p>
                </div>
              </div>
            )}

            {isPaid && (
              <div
                className={`flex items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold ${
                  isDark
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-emerald-300 bg-emerald-50 text-emerald-700"
                }`}
              >
                <CheckCircle2 size={16} />
                {t.paidLabel}
              </div>
            )}
          </aside>
        </div>

        <p
          className={`mt-8 text-center text-[11px] ${
            isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
          }`}
        >
          {t.autoUpdate}
        </p>
      </div>

      <style jsx>{`
        @keyframes drift-a {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(30px, 40px);
          }
        }
        @keyframes drift-b {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-40px, 30px);
          }
        }
        .blob-a {
          animation: drift-a 11s ease-in-out infinite;
        }
        .blob-b {
          animation: drift-b 13s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .blob-a,
          .blob-b {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
