"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { fraunces as displayFont } from "@/app/fonts/fraunces";
import {
  Loader2,
  Star,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Utensils,
  MessageSquare,
  Flame,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const itemText = {
  en: {
    dir: "ltr",
    back: "Back to dishes",
    reviews: "Reviews",
    noReviews: "No reviews yet",
    noReviewsHint: "Be the first to review this dish after ordering.",
    order: "Order this dish",
    orderNow: "Order now",
    orderHint: "Next step: choose quantity and place your order",
    viewOnMap: "View restaurant",
    anonymous: "Anonymous",
    avgRating: "Average rating",
    totalReviews: "reviews",
    totalOrders: "orders",
    price: "Price",
    loading: "Loading…",
    notFound: "Dish not found",
  },
  ps: {
    dir: "rtl",
    back: "بیرته خواړو ته",
    reviews: "بیاکتنې",
    noReviews: "تر اوسه بیاکتنې نشته",
    noReviewsHint: "د فرمایش وروسته لومړی کس اوسئ چې بیاکتنه وکړئ.",
    order: "دا خواړه فرمایش کړئ",
    orderNow: "اوس فرمایش کړئ",
    orderHint: "بل ګام: مقدار وټاکئ او فرمایش ثبت کړئ",
    viewOnMap: "رستورانت وګورئ",
    anonymous: "ناشناس",
    avgRating: "منځنی درجه",
    totalReviews: "بیاکتنې",
    totalOrders: "فرمایشونه",
    price: "بیه",
    loading: "بارول…",
    notFound: "خواړه ونه موندل شول",
  },
  prs: {
    dir: "rtl",
    back: "بازگشت به غذاها",
    reviews: "نظرات",
    noReviews: "هنوز نظری نیست",
    noReviewsHint: "بعد از سفارش، اولین کسی باشید که نظر می‌دهید.",
    order: "این غذا را سفارش دهید",
    orderNow: "همین حالا سفارش دهید",
    orderHint: "مرحله بعد: تعداد را انتخاب کرده و سفارش را ثبت کنید",
    viewOnMap: "مشاهده رستورانت",
    anonymous: "ناشناس",
    avgRating: "میانگین امتیاز",
    totalReviews: "نظر",
    totalOrders: "سفارش",
    price: "قیمت",
    loading: "در حال بارگذاری…",
    notFound: "غذا یافت نشد",
  },
};

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lang = itemText[language] ? language : "en";
  const t = itemText[lang];
  const isRTL = t.dir === "rtl";
  const isDark = mounted ? resolvedTheme !== "light" : true;

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", t.dir);
  }, [lang, mounted, t.dir]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/menu-items/${id}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(t.notFound);
        const d = await res.json();
        if (!cancelled) setData(d);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const ArrowBack = isRTL ? ArrowRight : ArrowLeft;
  const ArrowForward = isRTL ? ArrowLeft : ArrowRight;

  if (loading)
    return (
      <div
        className={`flex min-h-screen items-center justify-center transition-colors ${
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

  if (error || !data?.item)
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center transition-colors ${
          isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
        }`}
        dir={t.dir}
      >
        <p className="text-sm text-red-500">{error || t.notFound}</p>
        <Link
          href="/"
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
          }`}
        >
          <ArrowBack size={13} /> {t.back}
        </Link>
      </div>
    );

  const item = data.item;
  const reviews = data.reviews || [];
  const orderHref = `/order/${item.branch?.id}?item=${item.id}`;
  const hasMap = item.branch?.latitude && item.branch?.longitude;
  const mapHref = hasMap
    ? `https://www.openstreetmap.org/?mlat=${item.branch.latitude}&mlon=${item.branch.longitude}#map=16/${item.branch.latitude}/${item.branch.longitude}`
    : "";
  const restaurantName = item.hotel?.name || item.branch?.name;

  const muted = isDark ? "text-[#9691A6]" : "text-[#8A8496]";
  const soft = isDark ? "text-[#B7B2C4]" : "text-[#6E687A]";
  const gold = isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]";
  const panel = isDark
    ? "border-[#2E2938] bg-[#1E1B26]/90"
    : "border-[#E4DFD4] bg-white/90";

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
      }`}
      dir={t.dir}
    >
      {/* Soft glow */}
      <div
        className={`pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl ${
          isDark ? "bg-[#C9A227]/10" : "bg-[#C9A227]/15"
        }`}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-4 py-4 pb-20 sm:px-6 sm:py-6 sm:pb-8">
        {/* Back link */}
        <Link
          href="/"
          className={`group mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 ${panel} ${soft} hover:text-[#E0B93A]`}
        >
          <ArrowBack
            size={14}
            className="transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
          />
          {t.back}
        </Link>

        {/* Dish card */}
        <div
          className={`overflow-hidden rounded-2xl border shadow-lg backdrop-blur-sm ${panel} ${
            isDark ? "shadow-black/30" : "shadow-[#8A6E1A]/10"
          }`}
        >
          <div className="grid sm:grid-cols-[1fr_1fr]">
            {/* Image */}
            <div
              className={`group relative aspect-[16/10] overflow-hidden sm:aspect-auto sm:min-h-[340px] ${
                isDark ? "bg-[#161320]" : "bg-[#EDE8DE]"
              }`}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center ${
                    isDark ? "text-[#332C3E]" : "text-[#D4CFC4]"
                  }`}
                >
                  <ShoppingBag size={40} />
                </div>
              )}

              {item.review_count > 0 && (
                <div className="absolute bottom-3 start-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                  <Star size={12} className="fill-[#E0B93A] text-[#E0B93A]" />
                  {item.avg_rating.toFixed(1)}
                  <span className="font-normal text-white/70">
                    ({item.review_count})
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col p-4 sm:p-5">
              {/* Restaurant chip */}
              {restaurantName && (
                <div className="mb-2">
                  {hasMap ? (
                    <a
                      href={mapHref}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition active:scale-95 ${
                        isDark
                          ? "border-[#332C3E] text-[#B7B2C4] hover:border-[#E0B93A]/60 hover:text-[#E0B93A]"
                          : "border-[#E4DFD4] text-[#6E687A] hover:border-[#A9821E]/60 hover:text-[#8A6E1A]"
                      }`}
                      title={t.viewOnMap}
                    >
                      <MapPin size={12} />
                      {restaurantName}
                      {item.branch?.city ? ` · ${item.branch.city}` : ""}
                    </a>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${muted}`}
                    >
                      <MapPin size={12} />
                      {restaurantName}
                      {item.branch?.city ? ` · ${item.branch.city}` : ""}
                    </span>
                  )}
                </div>
              )}

              <h1
                className="text-xl font-medium leading-tight sm:text-2xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {item.name}
              </h1>

              {/* Stats */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div
                  className={`rounded-xl border px-2.5 py-1.5 ${
                    isDark
                      ? "border-[#2E2938] bg-[#161320]"
                      : "border-[#E4DFD4] bg-[#F7F4EE]"
                  }`}
                >
                  <p className={`text-[11px] ${muted}`}>{t.avgRating}</p>
                  <p className="flex items-center gap-1 text-sm font-semibold">
                    <Star
                      size={15}
                      className={
                        item.review_count > 0
                          ? "fill-[#C9A227] text-[#C9A227]"
                          : isDark
                            ? "text-[#332C3E]"
                            : "text-[#D4CFC4]"
                      }
                    />
                    {item.review_count > 0 ? item.avg_rating.toFixed(1) : "—"}
                  </p>
                </div>
                <div
                  className={`rounded-xl border px-2.5 py-1.5 ${
                    isDark
                      ? "border-[#2E2938] bg-[#161320]"
                      : "border-[#E4DFD4] bg-[#F7F4EE]"
                  }`}
                >
                  <p className={`text-[11px] ${muted}`}>{t.totalOrders}</p>
                  <p className="flex items-center gap-1 text-sm font-semibold">
                    <Flame
                      size={15}
                      className={item.order_count > 0 ? "text-[#E0873A]" : muted}
                    />
                    {item.order_count || 0}
                  </p>
                </div>
              </div>

              {item.description && (
                <p className={`mt-3 text-[13px] leading-relaxed ${soft}`}>
                  {item.description}
                </p>
              )}

              {/* Price + order */}
              <div
                className={`mt-auto border-t pt-4 ${
                  isDark ? "border-[#2E2938]" : "border-[#E4DFD4]"
                }`}
              >
                <div className="mb-2.5 flex items-baseline justify-between">
                  <span className={`text-xs ${muted}`}>{t.price}</span>
                  <p
                    className={`text-2xl font-semibold ${gold}`}
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {item.price.toFixed(2)}{" "}
                    <span className={`text-sm font-medium ${muted}`}>
                      {item.currency}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare
              size={16}
              className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
            />
            <h2
              className="text-base font-medium"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.reviews}
            </h2>
            {item.review_count > 0 && (
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  isDark
                    ? "border-[#C9A227]/40 bg-[#C9A227]/10 text-[#E0B93A]"
                    : "border-[#A9821E]/40 bg-[#C9A227]/10 text-[#8A6E1A]"
                }`}
              >
                {item.review_count}
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <div
              className={`rounded-2xl border border-dashed px-6 py-10 text-center ${
                isDark ? "border-[#332C3E]" : "border-[#E4DFD4]"
              }`}
            >
              <div
                className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border ${
                  isDark
                    ? "border-[#C9A227]/30 bg-[#C9A227]/10"
                    : "border-[#A9821E]/30 bg-[#C9A227]/15"
                }`}
              >
                <Star
                  size={19}
                  className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
                />
              </div>
              <p className="text-sm font-medium">{t.noReviews}</p>
              <p className={`mt-1 text-xs ${muted}`}>{t.noReviewsHint}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {reviews.map((r: any) => (
                <div
                  key={r.id}
                  className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${panel}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isDark
                          ? "bg-[#C9A227]/15 text-[#E0B93A]"
                          : "bg-[#C9A227]/15 text-[#8A6E1A]"
                      }`}
                    >
                      <Utensils size={14} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">
                          {r.author_name || t.anonymous}
                        </p>
                        <span className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={11}
                              className={
                                n <= r.rating
                                  ? "fill-[#C9A227] text-[#C9A227]"
                                  : isDark
                                    ? "text-[#332C3E]"
                                    : "text-[#D4CFC4]"
                              }
                            />
                          ))}
                        </span>
                      </div>

                      {r.created_at && (
                        <p
                          className={`mt-0.5 text-[10px] ${
                            isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                          }`}
                        >
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      )}

                      {r.comment && (
                        <p
                          className={`mt-2 text-sm leading-relaxed ${
                            isDark ? "text-[#CFCADB]" : "text-[#1D1A22]"
                          }`}
                        >
                          {r.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky order pill: always visible on mobile and desktop.
          Rendered in document.body so parent layouts can't break
          position: fixed. */}
      {mounted &&
        createPortal(
          <div
            dir={t.dir}
            className={`${displayFont.variable} pointer-events-none fixed inset-x-0 bottom-4 z-[9999] flex justify-center px-4`}
            style={{
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div
              className={`pointer-events-auto flex w-full max-w-[17rem] items-center gap-2.5 rounded-full border py-1 ps-3.5 pe-1 shadow-lg backdrop-blur-md ${
                isDark
                  ? "border-[#C9A227]/40 bg-[#1E1B26]/95 shadow-black/40"
                  : "border-[#A9821E]/30 bg-white/95 shadow-[#8A6E1A]/20"
              }`}
            >
              <p
                className={`shrink-0 text-sm font-bold ${gold}`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {item.price.toFixed(2)}{" "}
                <span className={`text-[10px] font-medium ${muted}`}>
                  {item.currency}
                </span>
              </p>
              <Link
                href={orderHref}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-3 text-[13px] font-bold text-[#1D1707] transition active:scale-95"
              >
                {t.orderNow}
                <ArrowForward size={16} />
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}