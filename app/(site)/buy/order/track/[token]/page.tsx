"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const STATUSES = [
  {
    key: "open",
    labelEn: "Received",
    labelPs: "ترلاسه شو",
    labelPrs: "دریافت شد",
  },
  {
    key: "in_progress",
    labelEn: "Preparing",
    labelPs: "چمتو کیږي",
    labelPrs: "در حال آماده‌سازی",
  },
  {
    key: "served",
    labelEn: "Ready / Served",
    labelPs: "وړاندې شو",
    labelPrs: "سرو شد",
  },
  {
    key: "paid",
    labelEn: "Paid",
    labelPs: "تادیه شو",
    labelPrs: "پرداخت شد",
  },
];

const trackText = {
  en: {
    dir: "ltr",
    orderLabel: "Order",
    items: "Items",
    total: "Total",
    paymentSection: "Payment",
    payButton: "Pay with HesabPay",
    paying: "Opening HesabPay…",
    payHint: "You'll be redirected to HesabPay to complete payment.",
    confirmingPayment: "Confirming payment…",
    paidLabel: "Paid",
    unpaidLabel: "Unpaid",
    failedLabel: "Payment failed",
    cancelled: "Order cancelled",
    rateItems: "Rate your items",
    submit: "Submit reviews",
    submitting: "Submitting…",
    thanks: "Thanks for your review!",
    autoUpdate: "This page updates automatically every 5 seconds.",
    commentPlaceholder: "Comment (optional)",
  },
  ps: {
    dir: "rtl",
    orderLabel: "فرمایش",
    items: "توکي",
    total: "ټول",
    paymentSection: "تادیه",
    payButton: "د حساب پی سره تادیه وکړئ",
    paying: "حساب پی پرانیستل کیږي…",
    payHint: "د تادیې بشپړولو لپاره به حساب پی ته یوړل شئ.",
    confirmingPayment: "تادیه تصدیق کیږي…",
    paidLabel: "تادیه شو",
    unpaidLabel: "نه تادیه شو",
    failedLabel: "تادیه ناکامه شوه",
    cancelled: "فرمایش لغوه شو",
    rateItems: "خپل توکي و ارزوئ",
    submit: "بیاکتنې وسپارئ",
    submitting: "سپارل کیږي…",
    thanks: "ستاسو د بیاکتنې مننه!",
    autoUpdate: "دا پاڼه هره ۵ ثانیه اتوماتیک تازه کیږي.",
    commentPlaceholder: "نظر (اختیاري)",
  },
  prs: {
    dir: "rtl",
    orderLabel: "سفارش",
    items: "آیتم‌ها",
    total: "مجموع",
    paymentSection: "پرداخت",
    payButton: "پرداخت با حساب پی",
    paying: "در حال باز کردن حساب پی…",
    payHint: "برای تکمیل پرداخت به حساب پی هدایت می‌شوید.",
    confirmingPayment: "در حال تأیید پرداخت…",
    paidLabel: "پرداخت شد",
    unpaidLabel: "پرداخت نشده",
    failedLabel: "پرداخت ناموفق",
    cancelled: "سفارش لغو شد",
    rateItems: "آیتم‌های خود را ارزیابی کنید",
    submit: "ارسال نظرات",
    submitting: "در حال ارسال…",
    thanks: "از نظر شما سپاسگزاریم!",
    autoUpdate: "این صفحه هر ۵ ثانیه به‌طور خودکار به‌روزرسانی می‌شود.",
    commentPlaceholder: "نظر (اختیاری)",
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

  // ---------- Poll the order ----------
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

  // ---------- lang / dir ----------
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", t.dir);
  }, [lang, mounted, t.dir]);

  // ---------- Confirm payment when HesabPay redirects back ----------
  useEffect(() => {
    if (!mounted) return;
    if (confirming) return;

    const paidFlag = searchParams.get("paid");
    if (paidFlag !== "1") return;

    // Extract the `data={...}` blob from the raw URL. HesabPay appends it
    // with a second `?`, so `searchParams.get("data")` returns null.
    const rawUrl = typeof window !== "undefined" ? window.location.href : "";
    let data: any = {};
    try {
      const idx = rawUrl.indexOf("data=");
      if (idx !== -1) {
        const json = decodeURIComponent(rawUrl.slice(idx + 5));
        data = JSON.parse(json);
      }
    } catch {
      /* ignore malformed */
    }

    // `ref` is the order id we baked into success_url in create-session.
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
        // The 5s poll above will pick up the new payment_status automatically.
      })
      .catch((err) => console.error("Confirm request failed:", err));

    // Strip the query string so a refresh doesn't re-trigger.
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, searchParams]);

  const canReview =
    order && ["served", "paid", "closed"].includes(order.status) && !submitted;

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

  const currentIdx = STATUSES.findIndex((s) => s.key === order.status);
  const isPaid = order.payment_status === "paid";

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
      }`}
      dir={t.dir}
    >
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

      <div className="relative mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
        <div
          className={`w-full rounded-3xl border p-6 shadow-xl backdrop-blur-sm transition-colors sm:p-7 ${
            isDark
              ? "border-[#2E2938] bg-[#1E1B26]/90"
              : "border-[#E4DFD4] bg-white/90"
          }`}
        >
          {/* Header */}
          <div className="text-center">
            <p
              className={`text-[10px] uppercase tracking-[0.3em] ${
                isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
              }`}
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {t.orderLabel}
            </p>
            <p
              className="mt-1 text-2xl font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {order.order_number}
            </p>
            <p
              className={`mt-1 text-xs ${
                isDark ? "text-[#9691A6]" : "text-[#8A8496]"
              }`}
            >
              {order.branch_name} ·{" "}
              {new Date(order.created_at).toLocaleTimeString()}
            </p>

            {/* Payment badge */}
            <div className="mt-2 flex justify-center">
              {confirming && !isPaid ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    isDark
                      ? "border-[#C9A227]/40 bg-[#C9A227]/10 text-[#E0B93A]"
                      : "border-[#A9821E]/40 bg-[#C9A227]/15 text-[#8A6E1A]"
                  }`}
                >
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  {t.confirmingPayment}
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
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
                  <CreditCard className="h-2.5 w-2.5" />
                  {isPaid
                    ? t.paidLabel
                    : order.payment_status === "failed"
                      ? t.failedLabel
                      : t.unpaidLabel}
                </span>
              )}
            </div>
          </div>

          {/* Status timeline */}
          {order.status === "cancelled" ? (
            <div
              className={`mt-6 flex items-center justify-center gap-2 rounded-xl py-4 ${
                isDark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-700"
              }`}
            >
              <XCircle className="h-5 w-5" /> {t.cancelled}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {STATUSES.map((s, idx) => {
                const done = idx <= currentIdx;
                const active = idx === currentIdx;
                const label =
                  lang === "ps"
                    ? s.labelPs
                    : lang === "prs"
                      ? s.labelPrs
                      : s.labelEn;
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                        done
                          ? "bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707]"
                          : isDark
                            ? "bg-[#2A2534] text-[#6E687A]"
                            : "bg-[#EDE8DE] text-[#A39D8F]"
                      } ${active ? "ring-4 ring-[#C9A227]/25" : ""}`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : idx === 2 ? (
                        <ChefHat className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        done
                          ? "font-semibold"
                          : isDark
                            ? "text-[#6E687A]"
                            : "text-[#A39D8F]"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Items */}
          <div
            className={`mt-6 border-t pt-4 ${
              isDark ? "border-[#2E2938]" : "border-[#E4DFD4]"
            }`}
          >
            <p
              className={`mb-2 text-[10px] uppercase tracking-[0.2em] ${
                isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
              }`}
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {t.items}
            </p>
            <ul className="space-y-1">
              {order.items.map((i: any) => (
                <li
                  key={i.id}
                  className={`flex justify-between text-sm ${
                    isDark ? "text-[#CFCADB]" : "text-[#1D1A22]"
                  }`}
                >
                  <span>
                    {i.quantity} × {i.name}
                  </span>
                  <span className="font-medium tabular-nums">
                    {i.line_total.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div
              className={`mt-3 flex justify-between border-t pt-3 text-base font-bold ${
                isDark ? "border-[#2E2938]" : "border-[#E4DFD4]"
              }`}
            >
              <span>{t.total}</span>
              <span className="text-[#E0B93A]">
                {order.total_amount.toFixed(2)} {order.currency}
              </span>
            </div>
          </div>

          {/* Pay button */}
          {!isPaid && order.status !== "cancelled" && (
            <div
              className={`mt-6 border-t pt-4 ${
                isDark ? "border-[#2E2938]" : "border-[#E4DFD4]"
              }`}
            >
              <p
                className={`mb-3 text-[10px] uppercase tracking-[0.2em] ${
                  isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                }`}
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {t.paymentSection}
              </p>
              <button
                onClick={payNow}
                disabled={paying || confirming}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 py-3 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/25 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/35 disabled:opacity-60"
              >
                {paying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {paying ? t.paying : t.payButton}
              </button>
              <p
                className={`mt-2 text-center text-[11px] ${
                  isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                }`}
              >
                {t.payHint}
              </p>
            </div>
          )}

          {/* Review form */}
          {canReview && (
            <div
              className={`mt-6 border-t pt-4 ${
                isDark ? "border-[#2E2938]" : "border-[#E4DFD4]"
              }`}
            >
              <p
                className={`mb-3 text-[10px] uppercase tracking-[0.2em] ${
                  isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                }`}
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {t.rateItems}
              </p>
              <div className="space-y-3">
                {order.items.map((i: any) => {
                  const key = i.menu_item_id || i.id;
                  return (
                    <div
                      key={key}
                      className={`rounded-xl border p-3 ${
                        isDark
                          ? "border-[#332C3E] bg-[#161320]"
                          : "border-[#E4DFD4] bg-[#FAF8F4]"
                      }`}
                    >
                      <p className="text-sm font-medium">{i.name}</p>
                      <div className="mt-1.5 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() =>
                              setRatings((r) => ({ ...r, [key]: n }))
                            }
                            className="p-0.5"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                (ratings[key] || 0) >= n
                                  ? "fill-[#C9A227] text-[#C9A227]"
                                  : isDark
                                    ? "text-[#332C3E]"
                                    : "text-[#D4CFC4]"
                              }`}
                            />
                          </button>
                        ))}
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
                        className={`mt-2 w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30 ${
                          isDark
                            ? "border-[#332C3E] bg-[#15121C] text-[#F0EAE2]"
                            : "border-[#E4DFD4] bg-white text-[#1D1A22]"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <button
                onClick={submitReviews}
                disabled={submitting || Object.keys(ratings).length === 0}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 py-2.5 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/25 transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? t.submitting : t.submit}
              </button>
            </div>
          )}

          {submitted && (
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-center text-xs ${
                isDark
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {t.thanks}
            </p>
          )}

          <p
            className={`mt-4 text-center text-[11px] ${
              isDark ? "text-[#6E5555]" : "text-[#A39D8F]"
            }`}
          >
            {t.autoUpdate}
          </p>
        </div>
      </div>
    </div>
  );
}
