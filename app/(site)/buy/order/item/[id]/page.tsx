"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Fraunces } from "next/font/google";
import {
  Loader2,
  Star,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Utensils,
  MessageSquare,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const itemText = {
  en: {
    dir: "ltr",
    back: "Back to dishes",
    reviews: "Reviews",
    noReviews: "No reviews yet",
    noReviewsHint: "Be the first to review this dish after ordering.",
    order: "Order this dish",
    viewOnMap: "View restaurant",
    anonymous: "Anonymous",
    avgRating: "Average",
    totalReviews: "reviews",
    totalOrders: "orders",
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
    viewOnMap: "رستورانت وګورئ",
    anonymous: "ناشناس",
    avgRating: "منځنی",
    totalReviews: "بیاکتنې",
    totalOrders: "فرمایشونه",
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
    viewOnMap: "مشاهده رستورانت",
    anonymous: "ناشناس",
    avgRating: "میانگین",
    totalReviews: "نظر",
    totalOrders: "سفارش",
    loading: "در حال بارگذاری…",
    notFound: "غذا یافت نشد",
  },
};

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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
          href="/buy/order"
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

      <div
        className={`pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl ${
          isDark ? "bg-[#C9A227]/10" : "bg-[#C9A227]/15"
        }`}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-5 py-6 sm:px-6 sm:py-8">
        {/* Back link */}
        <Link
          href="/buy/order"
          className={`group mb-5 inline-flex items-center gap-1.5 text-xs font-semibold transition ${
            isDark
              ? "text-[#B7B2C4] hover:text-[#E0B93A]"
              : "text-[#6E687A] hover:text-[#8A6E1A]"
          }`}
        >
          <ArrowBack
            size={13}
            className="transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
          />
          {t.back}
        </Link>

        {/* Dish card */}
        <div
          className={`overflow-hidden rounded-3xl border backdrop-blur-sm transition-colors ${
            isDark
              ? "border-[#2E2938] bg-[#1E1B26]/90"
              : "border-[#E4DFD4] bg-white/90"
          }`}
        >
          <div className="grid gap-0 sm:grid-cols-[1fr_1.2fr]">
            {/* Image */}
            <div
              className={`relative aspect-square sm:aspect-auto ${
                isDark ? "bg-[#161320]" : "bg-[#EDE8DE]"
              }`}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center ${
                    isDark ? "text-[#332C3E]" : "text-[#D4CFC4]"
                  }`}
                >
                  <ShoppingBag size={48} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col p-5 sm:p-6">
              <p
                className={`text-[10px] uppercase tracking-[0.2em] ${
                  isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                }`}
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {item.hotel?.name || item.branch?.name}
                {item.branch?.city ? ` · ${item.branch.city}` : ""}
              </p>

              <h1
                className="mt-1.5 text-2xl font-medium sm:text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {item.name}
              </h1>

              {/* Rating row */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                {item.review_count > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Star size={14} className="fill-[#C9A227] text-[#C9A227]" />
                    <span className="font-semibold">
                      {item.avg_rating.toFixed(1)}
                    </span>
                    <span
                      className={isDark ? "text-[#9691A6]" : "text-[#8A8496]"}
                    >
                      ({item.review_count} {t.totalReviews})
                    </span>
                  </span>
                ) : (
                  <span
                    className={isDark ? "text-[#6E687A]" : "text-[#A39D8F]"}
                  >
                    {t.noReviews}
                  </span>
                )}

                {item.order_count > 0 && (
                  <>
                    <span
                      className={isDark ? "text-[#332C3E]" : "text-[#D4CFC4]"}
                    >
                      ·
                    </span>
                    <span
                      className={isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"}
                    >
                      {item.order_count} {t.totalOrders}
                    </span>
                  </>
                )}
              </div>

              {item.description && (
                <p
                  className={`mt-3 text-sm leading-relaxed ${
                    isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
                  }`}
                >
                  {item.description}
                </p>
              )}

              <div className="mt-auto pt-5">
                <p
                  className={`mb-3 text-2xl font-semibold ${
                    isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
                  }`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.price.toFixed(2)}{" "}
                  <span
                    className={`text-sm font-medium ${
                      isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                    }`}
                  >
                    {item.currency}
                  </span>
                </p>

                <Link
                  href={`/buy/order/${item.branch?.id}?item=${item.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-5 py-3 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/25 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/35"
                >
                  <ShoppingBag size={15} />
                  {t.order}
                </Link>

                {item.branch?.latitude && item.branch?.longitude && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${item.branch.latitude}&mlon=${item.branch.longitude}#map=16/${item.branch.latitude}/${item.branch.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 text-[11px] ${
                      isDark
                        ? "text-[#9691A6] hover:text-[#E0B93A]"
                        : "text-[#8A8496] hover:text-[#8A6E1A]"
                    }`}
                  >
                    <MapPin size={11} />
                    {t.viewOnMap}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare
              size={16}
              className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
            />
            <h2
              className="text-lg font-medium"
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
              className={`rounded-2xl border border-dashed px-6 py-12 text-center ${
                isDark ? "border-[#332C3E]" : "border-[#E4DFD4]"
              }`}
            >
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border ${
                  isDark
                    ? "border-[#C9A227]/30 bg-[#C9A227]/10"
                    : "border-[#A9821E]/30 bg-[#C9A227]/15"
                }`}
              >
                <Star
                  size={20}
                  className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
                />
              </div>
              <p className="text-sm font-medium">{t.noReviews}</p>
              <p
                className={`mt-1 text-xs ${
                  isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                }`}
              >
                {t.noReviewsHint}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r: any) => (
                <div
                  key={r.id}
                  className={`rounded-2xl border p-4 transition-colors ${
                    isDark
                      ? "border-[#2E2938] bg-[#1E1B26]/90"
                      : "border-[#E4DFD4] bg-white/90"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
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
    </div>
  );
}
