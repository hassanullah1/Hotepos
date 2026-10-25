"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";

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
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

import { fraunces as displayFont } from "@/app/fonts/fraunces";

// New cute popup — keep PaymentSuccessPopup.tsx in the same folder as this file
import PaymentSuccessPopup from "./PaymentSuccessPopup";

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

  // Accept every alias the backend may return
  const isCancelled =
    order.status === "rejected" || order.status === "cancelled";

  // Collapse aliases → canonical flow value
  const normalizeStatus = (s: string): string => {
    if (s === "served") return "ready";
    if (s === "paid" || s === "closed") return "completed";
    return s;
  };

  const statusFlow = ["open", "in_progress", "ready", "completed"];
  const normalized = normalizeStatus(order.status);
  const statusIdx = statusFlow.indexOf(normalized);
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
      key: "served",
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
          key: "cancelled",
          labelEn: "Cancelled",
          labelPs: "لغوه شو",
          labelPrs: "لغو شد",
          Icon: XCircle,
          done: false,
          active: true,
        }
      : {
          key: "completed",
          labelEn: "Completed",
          labelPs: "مکمل",
          labelPrs: "تکمیل",
          Icon: CheckCircle2,
          done: isPaid && safeStatusIdx >= 3,
          active: isPaid && safeStatusIdx === 3,
        },
  ];
}

function AfPayIcon({ className = "" }: { className?: string }) {
  return (
    <img src="/afpay.png" alt="AfPay" className={className} loading="lazy" />
  );
}

function VisaIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="19" rx="3.5" fill="#1A1F71" />
      <text
        x="16"
        y="14"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontWeight="700"
        fontStyle="italic"
        fontSize="9"
        fill="#FFFFFF"
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="19" rx="3.5" fill="#1A1A1A" />
      <circle cx="13" cy="10" r="4.5" fill="#EB001B" />
      <circle cx="19" cy="10" r="4.5" fill="#F79E1B" fillOpacity="0.9" />
      <path
        d="M16 6.7a4.5 4.5 0 0 0 0 6.6 4.5 4.5 0 0 0 0-6.6Z"
        fill="#FF5F00"
      />
    </svg>
  );
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
    payButton: "Pay now",
    paying: "Opening payment…",
    payHint: "You'll be redirected to a secure page to complete payment.",
    confirmingPayment: "Confirming…",
    paidLabel: "Paid",
    unpaidLabel: "Unpaid",
    failedLabel: "Payment failed",
    cancelled: "Order cancelled",
    rateItems: "Rate your items",
    submit: "Submit reviews",
    submitting: "Submitting…",
    thanks: "Thanks for your review!",
    alreadyReviewed: "You've already reviewed this order.",
    autoUpdate: "This page updates every 5 seconds.",
    commentPlaceholder: "Comment (optional)",
    orderNumber: "Order #",
    placedAt: "Placed",
    progress: "Progress",
    restaurant: "Restaurant",
    payRequiredTitle: "Payment required",
    payRequiredBody:
      "Please pay now. Once your payment is confirmed, we will receive your order and start preparing it. If you don't pay, your order will not be processed and you will not get it.",
    payStickyHint: "Pay now so we can start your order.",
    congratsTitle: "Congratulations!",
    congratsSub: "Your payment was successful",
    congratsBody:
      "Thank you! Please wait a little while — your order will be brought to you soon.",
    congratsEnjoy: "Bon appétit!",
    paidWaitTitle: "Payment received",
    paidWaitBody:
      "Thank you! Please wait a little while — your order will be brought to you soon.",
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
    payButton: "اوس تادیه وکړئ",
    paying: "تادیه پرانیستل کیږي…",
    payHint: "د تادیې بشپړولو لپاره به یوې خوندي پاڼې ته یوړل شئ.",
    confirmingPayment: "تصدیق کیږي…",
    paidLabel: "تادیه شو",
    unpaidLabel: "نه تادیه شو",
    failedLabel: "تادیه ناکامه شوه",
    cancelled: "فرمایش لغوه شو",
    rateItems: "خپل توکي و ارزوئ",
    submit: "بیاکتنې وسپارئ",
    submitting: "سپارل کیږي…",
    thanks: "ستاسو د بیاکتنې مننه!",
    alreadyReviewed: "تاسو لا دمخه دا فرمایش بیاکتنه کړې ده.",
    autoUpdate: "دا پاڼه هره ۵ ثانیه تازه کیږي.",
    commentPlaceholder: "نظر (اختیاري)",
    orderNumber: "د فرمایش #",
    placedAt: "وخت",
    progress: "پرمختګ",
    restaurant: "رستورانت",
    payRequiredTitle: "تادیه اړینه ده",
    payRequiredBody:
      "مهرباني وکړئ همدا اوس تادیه وکړئ. کله چې ستاسو تادیه تایید شي، موږ به ستاسو فرمایش ترلاسه کړو او چمتو کول به یې پیل کړو. که تادیه ونه کړئ، ستاسو فرمایش به نه پروسس کیږي او تاسو به یې ونه ترلاسه کړئ.",
    payStickyHint: "همدا اوس تادیه وکړئ چې فرمایش مو پیل کړو.",
    congratsTitle: "مبارک شه!",
    congratsSub: "ستاسو تادیه بریالۍ شوه",
    congratsBody:
      "مننه! مهرباني وکړئ لږ انتظار وکړئ — ستاسو فرمایش به ډیر ژر تاسو ته راوړل شي.",
    congratsEnjoy: "نوش جان!",
    paidWaitTitle: "تادیه ترلاسه شوه",
    paidWaitBody:
      "مننه! مهرباني وکړئ لږ انتظار وکړئ — ستاسو فرمایش به ډیر ژر تاسو ته راوړل شي.",
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
    payButton: "اکنون پرداخت کنید",
    paying: "در حال باز کردن پرداخت…",
    payHint: "برای تکمیل پرداخت به یک صفحه امن هدایت می‌شوید.",
    confirmingPayment: "در حال تأیید…",
    paidLabel: "پرداخت شد",
    unpaidLabel: "پرداخت نشده",
    failedLabel: "پرداخت ناموفق",
    cancelled: "سفارش لغو شد",
    rateItems: "آیتم‌های خود را ارزیابی کنید",
    submit: "ارسال نظرات",
    submitting: "در حال ارسال…",
    thanks: "از نظر شما سپاسگزاریم!",
    alreadyReviewed: "شما قبلاً این سفارش را ارزیابی کرده‌اید.",
    autoUpdate: "این صفحه هر ۵ ثانیه به‌روزرسانی می‌شود.",
    commentPlaceholder: "نظر (اختیاری)",
    orderNumber: "شماره سفارش",
    placedAt: "زمان",
    progress: "پیشرفت",
    restaurant: "رستورانت",
    payRequiredTitle: "پرداخت لازم است",
    payRequiredBody:
      "لطفاً همین حالا پرداخت کنید. پس از تأیید پرداخت، سفارش شما دریافت شده و آماده‌سازی آن آغاز می‌شود. اگر پرداخت نکنید، سفارش شما پردازش نمی‌شود و آن را دریافت نخواهید کرد.",
    payStickyHint: "همین حالا پرداخت کنید تا سفارش شما را شروع کنیم.",
    congratsTitle: "تبریک!",
    congratsSub: "پرداخت شما با موفقیت انجام شد",
    congratsBody:
      "متشکریم! لطفاً کمی صبر کنید — سفارش شما به زودی برای شما آورده می‌شود.",
    congratsEnjoy: "نوش جان!",
    paidWaitTitle: "پرداخت دریافت شد",
    paidWaitBody:
      "متشکریم! لطفاً کمی صبر کنید — سفارش شما به زودی برای شما آورده می‌شود.",
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

  // ── Congratulation popup ──
  const [showCongrats, setShowCongrats] = useState(false);
  const cameFromPayment = useRef(searchParams.get("paid") === "1");
  const prevPaid = useRef<boolean | null>(null);

  useEffect(() => {
    if (!order) return;
    const paidNow = order.payment_status === "paid";
    if (paidNow && (prevPaid.current === false || cameFromPayment.current)) {
      const key = `paid-popup-${token}`;
      try {
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          setShowCongrats(true);
        }
      } catch {
        setShowCongrats(true);
      }
    }
    prevPaid.current = paidNow;
  }, [order, token]);

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

  // Already reviewed? Accept several likely backend shapes.
  const alreadyReviewed =
    !!order &&
    (order.is_reviewed === true ||
      order.reviewed === true ||
      order.has_review === true ||
      (Array.isArray(order.reviews) && order.reviews.length > 0) ||
      (typeof order.reviews_count === "number" && order.reviews_count > 0));

  const canReview =
    order &&
    ["ready", "completed", "served", "paid", "closed"].includes(order.status) &&
    !submitted &&
    !alreadyReviewed;

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
  // Accept every alias the backend may return
  const isCancelled =
    order.status === "cancelled" || order.status === "rejected";
  const steps = buildStatusSteps(order);
  const needsPayment = !isPaid && !isCancelled;
  const orderFinished = ["completed", "paid", "closed"].includes(order.status);
  const showPaidWait = isPaid && !isCancelled && !orderFinished;

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-hidden transition-colors duration-300 ${
        needsPayment ? "pb-44" : ""
      } ${
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
          href="/order"
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

        {/* ============ Unpaid notice ============ */}
        {needsPayment && (
          <div
            role="alert"
            className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 sm:p-5 ${
              isDark
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-amber-300 bg-amber-50"
            }`}
          >
            <AlertTriangle
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                isDark ? "text-amber-300" : "text-amber-600"
              }`}
            />
            <div className="min-w-0">
              <p
                className={`text-sm font-bold ${
                  isDark ? "text-amber-200" : "text-amber-800"
                }`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t.payRequiredTitle}
              </p>
              <p
                className={`mt-1 text-[13px] leading-relaxed ${
                  isDark ? "text-amber-100/90" : "text-amber-900/90"
                }`}
              >
                {t.payRequiredBody}
              </p>
            </div>
          </div>
        )}

        {/* ============ Paid: please wait notice ============ */}
        {showPaidWait && (
          <div
            role="status"
            className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 sm:p-5 ${
              isDark
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-emerald-300 bg-emerald-50"
            }`}
          >
            <CheckCircle2
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                isDark ? "text-emerald-300" : "text-emerald-600"
              }`}
            />
            <div className="min-w-0">
              <p
                className={`text-sm font-bold ${
                  isDark ? "text-emerald-200" : "text-emerald-800"
                }`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t.paidWaitTitle}
              </p>
              <p
                className={`mt-1 text-[13px] leading-relaxed ${
                  isDark ? "text-emerald-100/90" : "text-emerald-900/90"
                }`}
              >
                {t.paidWaitBody}
              </p>
            </div>
          </div>
        )}

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

            {(submitted || alreadyReviewed) && (
              <div
                className={`flex items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold ${
                  isDark
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-emerald-300 bg-emerald-50 text-emerald-700"
                }`}
              >
                <CheckCircle2 size={16} />
                {submitted ? t.thanks : t.alreadyReviewed}
              </div>
            )}
          </div>

          {/* RIGHT: summary + payment status */}
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

      {/* ============ Sticky HesabPay bar ============ */}
      {needsPayment && (
        <div
          className={`fixed inset-x-0 bottom-0 z-40 pt-6 ${
            isDark
              ? "bg-gradient-to-t from-[#15121C] via-[#15121C]/95 to-transparent"
              : "bg-gradient-to-t from-[#F7F4EE] via-[#F7F4EE]/95 to-transparent"
          }`}
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
        >
          <div className="mx-auto max-w-2xl space-y-2 px-4">
            <p
              className={`flex items-center justify-center gap-1.5 text-center text-[11px] font-semibold ${
                isDark ? "text-amber-300" : "text-amber-700"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              {t.payStickyHint}
            </p>

            <button
              onClick={payNow}
              disabled={paying || confirming}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-5 py-3 text-sm font-bold text-[#1D1707] shadow-2xl shadow-[#C9A227]/30 transition hover:-translate-y-0.5 hover:shadow-[#C9A227]/50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <span className="inline-flex items-center gap-2">
                {paying && <Loader2 className="h-4 w-4 animate-spin" />}
                {paying ? t.paying : t.payButton}
                <span className="tabular-nums opacity-80">
                  · {order.total_amount.toFixed(2)} {order.currency}
                </span>
              </span>

              <span className="flex w-full items-center justify-center gap-3">
                <AfPayIcon className="h-5 w-8 shrink-0" />
                <VisaIcon className="h-5 w-8 shrink-0" />
                <MastercardIcon className="h-5 w-8 shrink-0" />
              </span>
            </button>

            <p
              className={`text-center text-[10px] ${
                isDark ? "text-[#9691A6]" : "text-[#8A8496]"
              }`}
            >
              {t.payHint}
            </p>
          </div>
        </div>
      )}

      {/* ============ Congratulation popup (cute burger mascot) ============ */}
      {showCongrats && (
        <PaymentSuccessPopup
          isDark={isDark}
          onClose={() => setShowCongrats(false)}
          texts={t}
        />
      )}

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
