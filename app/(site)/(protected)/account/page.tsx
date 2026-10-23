// app/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { fraunces as displayFont } from "@/app/fonts/fraunces";
import {
  Loader2,
  LogOut,
  Receipt,
  Utensils,
  Mail,
  Phone,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Star,
  ChefHat,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useBuyerAuth } from "@/providers/BuyerAuthProvider";
import { useLanguage } from "@/context/LanguageContext";

const accountText = {
  en: {
    dir: "ltr",
    badge: "Your account",
    welcomeA: "Welcome back,",
    signOut: "Sign out",
    myOrders: "Order history",
    orderAgain: "Order again",
    noOrders: "No orders yet",
    noOrdersHint: "Your order history will show up here.",
    browseDishes: "Browse dishes",
    totalOrders: "Orders",
    totalSpent: "Spent",
    leaveReview: "Review",
    viewOrder: "View",
    colRestaurant: "Restaurant",
    colOrder: "Order",
    colDate: "Date",
    colStatus: "Status",
    colTotal: "Total",
    colActions: "Actions",
    reviewReady: "Ready to review",
    status: {
      open: "Received",
      in_progress: "Preparing",
      served: "Served",
      paid: "Paid",
      closed: "Closed",
      cancelled: "Cancelled",
    },
    signInTitle: "Sign in to view your account",
    signInHint: "Your orders, loyalty, and history — all in one place.",
    signInCta: "Go to sign in",
    loading: "Loading…",
  },
  ps: {
    dir: "rtl",
    badge: "ستاسو حساب",
    welcomeA: "بیرته ښه راغلاست،",
    signOut: "وتل",
    myOrders: "د فرمایشونو تاریخ",
    orderAgain: "بیا فرمایش وکړئ",
    noOrders: "تر اوسه فرمایش نشته",
    noOrdersHint: "ستاسو د فرمایشونو تاریخ به دلته ښکاره شي.",
    browseDishes: "خواړه وګورئ",
    totalOrders: "فرمایشونه",
    totalSpent: "لګښت",
    leaveReview: "بیاکتنه",
    viewOrder: "کتل",
    colRestaurant: "رستورانت",
    colOrder: "فرمایش",
    colDate: "نیټه",
    colStatus: "حالت",
    colTotal: "ټول",
    colActions: "کړنې",
    reviewReady: "د بیاکتنې لپاره چمتو",
    status: {
      open: "ترلاسه شو",
      in_progress: "چمتو کیږي",
      served: "وړاندې شو",
      paid: "تادیه شو",
      closed: "بند شو",
      cancelled: "لغوه شو",
    },
    signInTitle: "د خپل حساب لیدلو لپاره ننوځئ",
    signInHint: "ستاسو فرمایشونه، وفاداري او تاریخ — ټول په یو ځای کې.",
    signInCta: "ننوتلو ته لاړ شئ",
    loading: "بارول…",
  },
  prs: {
    dir: "rtl",
    badge: "حساب شما",
    welcomeA: "خوش آمدید،",
    signOut: "خروج",
    myOrders: "تاریخچه سفارشات",
    orderAgain: "دوباره سفارش دهید",
    noOrders: "هنوز سفارشی نیست",
    noOrdersHint: "تاریخچه سفارشات شما اینجا نمایش داده می‌شود.",
    browseDishes: "مشاهده غذاها",
    totalOrders: "سفارشات",
    totalSpent: "هزینه",
    leaveReview: "نظر",
    viewOrder: "نمایش",
    colRestaurant: "رستورانت",
    colOrder: "سفارش",
    colDate: "تاریخ",
    colStatus: "وضعیت",
    colTotal: "مجموع",
    colActions: "عملیات",
    reviewReady: "آماده برای نظر",
    status: {
      open: "دریافت شد",
      in_progress: "در حال آماده‌سازی",
      served: "سرو شد",
      paid: "پرداخت شد",
      closed: "بسته شد",
      cancelled: "لغو شد",
    },
    signInTitle: "برای مشاهده حساب خود وارد شوید",
    signInHint: "سفارشات، وفاداری و تاریخچه شما — همه در یک جا.",
    signInCta: "رفتن به ورود",
    loading: "در حال بارگذاری…",
  },
};

export default function BuyerAccountPage() {
  const router = useRouter();
  const { buyer, loading: meLoading, logout } = useBuyerAuth();
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lang = accountText[language] ? language : "en";
  const t = accountText[lang];
  const isRTL = t.dir === "rtl";
  const isDark = mounted ? resolvedTheme !== "light" : true;

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", t.dir);
  }, [lang, mounted, t.dir]);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (meLoading) return;

    if (!buyer) {
      router.replace("/login?next=/account");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/public/my-orders", {
          credentials: "same-origin",
        });
        const data = await res.json();
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [buyer, meLoading, router]);

  async function handleLogout() {
    await logout();
    router.push("/order");
    router.refresh();
  }

  const ArrowCta = isRTL ? ArrowLeft : ArrowRight;

  // ---------- Loading ----------
  if (meLoading || loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors ${
          isDark ? "bg-[#15121C]" : "bg-[#F7F4EE]"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className={`h-7 w-7 animate-spin ${
              isDark ? "text-[#C9A227]" : "text-[#A9821E]"
            }`}
          />
          <p
            className={`text-xs uppercase tracking-[0.2em] ${
              isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
            }`}
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {t.loading}
          </p>
        </div>
      </div>
    );
  }

  // ---------- Not signed in ----------
  if (!buyer) {
    return (
      <div
        className={`relative min-h-screen overflow-hidden flex items-center justify-center p-6 transition-colors ${
          isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
        }`}
        dir={t.dir}
      >
        <div
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, #C9A227 0px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative w-full max-w-md text-center">
          <div
            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border transition ${
              isDark
                ? "border-[#C9A227]/30 bg-[#C9A227]/10"
                : "border-[#A9821E]/30 bg-[#C9A227]/15"
            }`}
          >
            <Utensils
              className={`h-7 w-7 ${isDark ? "text-[#C9A227]" : "text-[#A9821E]"}`}
            />
          </div>
          <h1
            className="text-2xl font-medium sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.signInTitle}
          </h1>
          <p
            className={`mt-3 text-sm ${
              isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
            }`}
          >
            {t.signInHint}
          </p>
          <Link
            href="/login?next=/account"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-5 py-3 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/30"
          >
            {t.signInCta}
            <ArrowCta size={15} />
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Signed in ----------
  const totalSpent = orders.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0,
  );

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

      {/* Blobs */}
      <div
        className={`pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl ${
          isDark ? "bg-[#C9A227]/10" : "bg-[#C9A227]/15"
        }`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute top-40 -right-32 h-96 w-96 rounded-full blur-3xl ${
          isDark ? "bg-[#C9A227]/8" : "bg-[#C9A227]/12"
        }`}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-12">
        {/* ---------- Profile hero ---------- */}
        <div
          className={`overflow-hidden rounded-3xl border backdrop-blur-sm transition-colors ${
            isDark
              ? "border-[#2E2938] bg-[#1E1B26]/90"
              : "border-[#E4DFD4] bg-white/90"
          }`}
        >
          <div className="relative p-6 sm:p-8">
            <div
              className="pointer-events-none absolute -top-16 -end-16 h-48 w-48 rounded-full bg-[#C9A227]/15 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-start">
              <div className="relative shrink-0">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#E0B93A] to-[#8A6E1A] p-[3px]">
                  <div
                    className={`flex h-full w-full items-center justify-center rounded-full transition-colors ${
                      isDark ? "bg-[#15121C]" : "bg-[#F7F4EE]"
                    }`}
                  >
                    <span
                      className={`text-2xl font-semibold ${
                        isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
                      }`}
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {(buyer.full_name || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                    isDark
                      ? "border-[#C9A227]/40 bg-[#C9A227]/10 text-[#E0B93A]"
                      : "border-[#A9821E]/40 bg-[#C9A227]/15 text-[#8A6E1A]"
                  }`}
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  <Sparkles size={10} />
                  {t.badge}
                </span>

                <h1
                  className="mt-2 text-2xl font-medium leading-tight sm:text-3xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {t.welcomeA}{" "}
                  <span
                    className={
                      "text-[#C9A227] " + (isRTL ? "not-italic" : "italic")
                    }
                  >
                    {(buyer.full_name || "").split(" ")[0]}
                  </span>
                </h1>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {buyer.email && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
                        isDark
                          ? "border-[#332C3E] bg-[#161320] text-[#B7B2C4]"
                          : "border-[#E4DFD4] bg-[#FAF8F4] text-[#6E687A]"
                      }`}
                    >
                      <Mail size={11} />
                      <span dir="ltr">{buyer.email}</span>
                    </span>
                  )}
                  {buyer.phone && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
                        isDark
                          ? "border-[#332C3E] bg-[#161320] text-[#B7B2C4]"
                          : "border-[#E4DFD4] bg-[#FAF8F4] text-[#6E687A]"
                      }`}
                    >
                      <Phone size={11} />
                      <span dir="ltr">{buyer.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {orders.length > 0 && (
              <div
                className={`mt-6 grid grid-cols-2 gap-3 border-t pt-5 ${
                  isDark ? "border-[#2E2938]" : "border-[#E4DFD4]"
                }`}
              >
                <Stat
                  icon={<Receipt size={14} />}
                  label={t.totalOrders}
                  value={String(orders.length)}
                  isDark={isDark}
                />
                <Stat
                  icon={<Star size={14} />}
                  label={t.totalSpent}
                  value={`${totalSpent.toFixed(2)} ${
                    orders[0]?.currency || "AFN"
                  }`}
                  isDark={isDark}
                />
              </div>
            )}
          </div>
        </div>

        {/* ---------- Orders section ---------- */}
        <div className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2
              className="text-xl font-medium sm:text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.myOrders}
            </h2>
            <Link
              href="/order"
              className={`group inline-flex items-center gap-1.5 text-xs font-semibold transition ${
                isDark
                  ? "text-[#E0B93A] hover:text-[#F0C94A]"
                  : "text-[#8A6E1A] hover:text-[#A9821E]"
              }`}
            >
              {t.orderAgain}
              <ArrowCta
                size={13}
                className="transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
              />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div
              className={`rounded-2xl border border-dashed px-6 py-16 text-center ${
                isDark ? "border-[#332C3E]" : "border-[#E4DFD4]"
              }`}
            >
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border ${
                  isDark
                    ? "border-[#C9A227]/30 bg-[#C9A227]/10"
                    : "border-[#A9821E]/30 bg-[#C9A227]/15"
                }`}
              >
                <Receipt
                  size={22}
                  className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
                />
              </div>
              <p
                className="text-lg font-medium"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t.noOrders}
              </p>
              <p
                className={`mx-auto mt-2 max-w-xs text-sm ${
                  isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
                }`}
              >
                {t.noOrdersHint}
              </p>
              <Link
                href="/order"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-5 py-2.5 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition hover:-translate-y-0.5"
              >
                <ShoppingBag size={14} />
                {t.browseDishes}
              </Link>
            </div>
          ) : (
            <OrdersTable orders={orders} t={t} isDark={isDark} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Orders Table                                                        */
/* ------------------------------------------------------------------ */

function OrdersTable({
  orders,
  t,
  isDark,
}: {
  orders: any[];
  t: any;
  isDark: boolean;
}) {
  const border = isDark ? "border-[#2E2938]" : "border-[#E4DFD4]";
  const headBg = isDark ? "bg-[#161320]" : "bg-[#FAF8F4]";
  const rowHover = isDark ? "hover:bg-[#C9A227]/5" : "hover:bg-[#C9A227]/5";

  return (
    <>
      {/* ---------- Desktop / tablet table ---------- */}
      <div
        className={`hidden overflow-hidden rounded-2xl border backdrop-blur-sm sm:block ${border} ${
          isDark ? "bg-[#1E1B26]/90" : "bg-white/90"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className={`${headBg} ${border}`}>
                <Th isDark={isDark}>{t.colRestaurant}</Th>
                <Th isDark={isDark}>{t.colOrder}</Th>
                <Th isDark={isDark}>{t.colDate}</Th>
                <Th isDark={isDark}>{t.colStatus}</Th>
                <Th isDark={isDark} align="end">
                  {t.colTotal}
                </Th>
                <Th isDark={isDark} align="end">
                  {t.colActions}
                </Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const status = String(o.status || "").toLowerCase();
                const statusLabel = t.status[status] || o.status;
                const canReview = ["served", "paid", "closed"].includes(status);

                return (
                  <tr
                    key={o.id}
                    className={`border-t transition-colors ${border} ${rowHover}`}
                  >
                    {/* Restaurant */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {o.logo_url ? (
                          <img
                            src={o.logo_url}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              isDark
                                ? "bg-[#C9A227]/15 text-[#E0B93A]"
                                : "bg-[#C9A227]/15 text-[#8A6E1A]"
                            }`}
                          >
                            <Utensils size={14} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-semibold"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {o.hotel_name || o.branch_name || "—"}
                          </p>
                          {o.branch_name &&
                            o.hotel_name &&
                            o.branch_name !== o.hotel_name && (
                              <p
                                className={`truncate text-[11px] ${
                                  isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                                }`}
                              >
                                {o.branch_name}
                              </p>
                            )}
                        </div>
                      </div>
                    </td>

                    {/* Order # */}
                    <td className="px-4 py-3">
                      <span
                        className={`text-[12px] ${
                          isDark ? "text-[#CFCADB]" : "text-[#4A4A55]"
                        }`}
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {o.order_number || "—"}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <span
                        className={`text-[12px] ${
                          isDark ? "text-[#CFCADB]" : "text-[#4A4A55]"
                        }`}
                      >
                        {o.created_at
                          ? new Date(o.created_at).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColorFor(
                          status,
                          isDark,
                        )}`}
                      >
                        {statusIcon(status)}
                        {statusLabel}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 text-end">
                      <span
                        className={`text-sm font-semibold ${
                          isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
                        }`}
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {Number(o.total_amount || 0).toFixed(2)}{" "}
                        <span
                          className={`text-[10px] font-medium ${
                            isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                          }`}
                        >
                          {o.currency || "AFN"}
                        </span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/order/track/${o.public_token}`}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                            isDark
                              ? "border-[#332C3E] bg-[#161320] text-[#CFCADB] hover:border-[#C9A227]/60 hover:text-[#E0B93A]"
                              : "border-[#E4DFD4] bg-white text-[#6E687A] hover:border-[#A9821E]/60 hover:text-[#8A6E1A]"
                          }`}
                        >
                          {t.viewOrder}
                        </Link>

                        {canReview && (
                          <Link
                            href={`/order/track/${o.public_token}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-2.5 py-1.5 text-[11px] font-bold text-[#1D1707] shadow-sm shadow-[#C9A227]/25 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#C9A227]/35"
                          >
                            <Star size={10} />
                            {t.leaveReview}
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- Mobile: stacked table-style rows ---------- */}
      <div className="space-y-3 sm:hidden">
        {orders.map((o) => {
          const status = String(o.status || "").toLowerCase();
          const statusLabel = t.status[status] || o.status;
          const canReview = ["served", "paid", "closed"].includes(status);

          return (
            <div
              key={o.id}
              className={`rounded-2xl border p-4 transition-colors ${border} ${
                isDark ? "bg-[#1E1B26]/90" : "bg-white/90"
              }`}
            >
              {/* Row 1: logo + name + total */}
              <div className="flex items-start gap-3">
                {o.logo_url ? (
                  <img
                    src={o.logo_url}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                      isDark
                        ? "bg-[#C9A227]/15 text-[#E0B93A]"
                        : "bg-[#C9A227]/15 text-[#8A6E1A]"
                    }`}
                  >
                    <Utensils size={16} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-semibold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {o.hotel_name || o.branch_name || "—"}
                  </p>
                  <p
                    className={`mt-0.5 truncate text-[11px] ${
                      isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                    }`}
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {o.order_number || "—"}
                  </p>
                </div>

                <div className="shrink-0 text-end">
                  <p
                    className={`text-sm font-semibold ${
                      isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
                    }`}
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {Number(o.total_amount || 0).toFixed(2)}
                  </p>
                  <p
                    className={`text-[10px] ${
                      isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                    }`}
                  >
                    {o.currency || "AFN"}
                  </p>
                </div>
              </div>

              {/* Row 2: status + date */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColorFor(
                    status,
                    isDark,
                  )}`}
                >
                  {statusIcon(status)}
                  {statusLabel}
                </span>
                <span
                  className={`text-[11px] ${
                    isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                  }`}
                >
                  {o.created_at
                    ? new Date(o.created_at).toLocaleDateString()
                    : "—"}
                </span>
              </div>

              {/* Row 3: actions */}
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/order/track/${o.public_token}`}
                  className={`flex-1 inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${
                    isDark
                      ? "border-[#332C3E] bg-[#161320] text-[#CFCADB]"
                      : "border-[#E4DFD4] bg-white text-[#6E687A]"
                  }`}
                >
                  {t.viewOrder}
                  <ChevronRight size={11} className="rtl:rotate-180" />
                </Link>
                {canReview && (
                  <Link
                    href={`/order/track/${o.public_token}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-3 py-2 text-[11px] font-bold text-[#1D1707] shadow-sm shadow-[#C9A227]/25"
                  >
                    <Star size={11} />
                    {t.leaveReview}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function Th({
  children,
  isDark,
  align = "start",
}: {
  children: React.ReactNode;
  isDark: boolean;
  align?: "start" | "end";
}) {
  return (
    <th
      className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] ${
        align === "end" ? "text-end" : "text-start"
      } ${isDark ? "text-[#6E687A]" : "text-[#A39D8F]"}`}
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      {children}
    </th>
  );
}

function Stat({
  icon,
  label,
  value,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
        isDark
          ? "border-[#332C3E] bg-[#161320]"
          : "border-[#E4DFD4] bg-[#FAF8F4]"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isDark
            ? "bg-[#C9A227]/15 text-[#E0B93A]"
            : "bg-[#C9A227]/15 text-[#8A6E1A]"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${
            isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
          }`}
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {label}
        </p>
        <p
          className="mt-0.5 truncate text-sm font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function statusColorFor(s: string, isDark: boolean) {
  if (isDark) {
    switch (s) {
      case "open":
        return "border-sky-500/40 bg-sky-500/10 text-sky-300";
      case "in_progress":
        return "border-amber-500/40 bg-amber-500/10 text-amber-300";
      case "served":
        return "border-teal-500/40 bg-teal-500/10 text-teal-300";
      case "paid":
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
      case "cancelled":
        return "border-red-500/40 bg-red-500/10 text-red-300";
      default:
        return "border-[#332C3E] bg-[#161320] text-[#9691A6]";
    }
  }
  switch (s) {
    case "open":
      return "border-sky-300 bg-sky-50 text-sky-700";
    case "in_progress":
      return "border-amber-300 bg-amber-50 text-amber-700";
    case "served":
      return "border-teal-300 bg-teal-50 text-teal-700";
    case "paid":
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "border-red-300 bg-red-50 text-red-700";
    default:
      return "border-slate-300 bg-slate-50 text-slate-600";
  }
}

function statusIcon(s: string) {
  switch (s) {
    case "open":
      return <Receipt size={10} />;
    case "in_progress":
      return <ChefHat size={10} />;
    case "served":
      return <Utensils size={10} />;
    case "paid":
      return <CheckCircle2 size={10} />;
    case "cancelled":
      return <XCircle size={10} />;
    default:
      return <Clock size={10} />;
  }
}
