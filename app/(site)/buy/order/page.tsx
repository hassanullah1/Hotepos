// app/buy/order/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Fraunces } from "next/font/google";
import {
  Search,
  Loader2,
  Navigation,
  X,
  Star,
  ShoppingBag,
  MapPin,
  Flame,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

type Item = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  currency: string;
  branch: { id: string | null; name: string; city: string | null };
  hotel: { id: string | null; name: string; logo_url: string | null };
  avg_rating: number;
  review_count: number;
  order_count: number;
  distance_km: number | null;
};

const SORT_KEYS = [
  "recommended",
  "near",
  "reviews",
  "orders",
  "price_asc",
  "price_desc",
] as const;

const orderText = {
  en: {
    dir: "ltr",
    searchPlaceholder: "Search dishes, restaurants, cities…",
    showNearYou: "Showing dishes near you",
    showAll: "Order from any restaurant",
    clearLocation: "Clear location",
    noReviews: "No reviews yet",
    popular: "Popular",
    ordered: "ordered",
    order: "Order",
    noDishes: "No dishes found",
    noDishesHint: "Try a different search or clear the filters.",
    loadMore: "Load more",
    loadingMore: "Loading…",
    showingCount: "Showing {shown} of {total} dishes",
    sort: {
      recommended: "Recommended",
      near: "Near me",
      reviews: "Most reviewed",
      orders: "Most ordered",
      price_asc: "Cheapest",
      price_desc: "Premium",
    },
  },
  ps: {
    dir: "rtl",
    searchPlaceholder: "خواړه، رستورانتونه، ښارونه ولټوئ…",
    showNearYou: "ستاسو نږدې خواړه ښودل کیږي",
    showAll: "له هر رستورانت څخه فرمایش وکړئ",
    clearLocation: "ځای پاک کړئ",
    noReviews: "تر اوسه بیاکتنې نشته",
    popular: "مشهور",
    ordered: "فرمایش شوی",
    order: "فرمایش",
    noDishes: "خواړه ونه موندل شول",
    noDishesHint: "بله لټون وکړئ یا فلټرونه پاک کړئ.",
    loadMore: "نور ښودل",
    loadingMore: "بارول…",
    showingCount: "{shown} له {total} خواړو ښودل کیږي",
    sort: {
      recommended: "وړاندیز شوی",
      near: "زما نږدې",
      reviews: "ډېر بیاکتل شوي",
      orders: "ډېر فرمایش شوي",
      price_asc: "ارزانه",
      price_desc: "لوړ",
    },
  },
  prs: {
    dir: "rtl",
    searchPlaceholder: "جستجوی غذاها، رستورانت‌ها، شهرها…",
    showNearYou: "نمایش غذاهای نزدیک شما",
    showAll: "از هر رستورانت سفارش دهید",
    clearLocation: "پاک کردن موقعیت",
    noReviews: "هنوز نظری نیست",
    popular: "محبوب",
    ordered: "سفارش شده",
    order: "سفارش",
    noDishes: "غذایی یافت نشد",
    noDishesHint: "جستجوی دیگری امتحان کنید یا فیلترها را پاک کنید.",
    loadMore: "بیشتر",
    loadingMore: "در حال بارگذاری…",
    showingCount: "نمایش {shown} از {total} غذا",
    sort: {
      recommended: "پیشنهادی",
      near: "نزدیک من",
      reviews: "بیشترین نظرات",
      orders: "بیشترین سفارش",
      price_asc: "ارزان‌ترین",
      price_desc: "پریمیوم",
    },
  },
};

function interpolate(str: string, vars: Record<string, string | number>) {
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
  );
}

const PAGE_SIZE = 24;

export default function BuyerMenuDiscoveryPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lang = orderText[language] ? language : "en";
  const t = orderText[lang];
  const isRTL = t.dir === "rtl";
  const isDark = mounted ? resolvedTheme !== "light" : true;

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", t.dir);
  }, [lang, mounted, t.dir]);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [sort, setSort] = useState<string>("recommended");

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true); // first page / filter change
  const [loadingMore, setLoadingMore] = useState(false); // next page
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);

  // ---------- Debounce search ----------
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  // ---------- Fetch (first page or append) ----------
  const fetchItems = useCallback(
    async (targetPage: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: String(PAGE_SIZE),
          sort,
        });
        if (debouncedQ) params.set("q", debouncedQ);
        if (coords && sort === "near") {
          params.set("lat", String(coords.lat));
          params.set("lng", String(coords.lng));
          params.set("radius", "25");
        }

        const res = await fetch(`/api/public/menu-items?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load dishes");
        const data = await res.json();

        setItems((prev) =>
          append ? [...prev, ...(data.items || [])] : data.items || [],
        );
        setPage(data.page || targetPage);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err: any) {
        setError(err.message);
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [debouncedQ, coords, sort],
  );

  // ---------- Reset on filter change ----------
  useEffect(() => {
    setItems([]);
    setPage(1);
    fetchItems(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, sort, coords]);

  // ---------- Infinite scroll ----------
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          !loadingMore &&
          page < totalPages
        ) {
          fetchItems(page + 1, true);
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loading, loadingMore, page, totalPages, fetchItems]);

  function useGPS() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: +pos.coords.latitude.toFixed(6),
          lng: +pos.coords.longitude.toFixed(6),
        });
        setSort("near");
        setLocating(false);
      },
      (err) => {
        setError(err.message || "Could not get your location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  function handleSortClick(key: string) {
    if (key === "near" && !coords) {
      useGPS();
      return;
    }
    setSort(key);
  }

  function openItem(item: Item) {
    router.push(`/buy/order/item/${item.id}`);
  }

  const showingLabel = useMemo(() => {
    if (total === 0) return "";
    return interpolate(t.showingCount, {
      shown: items.length,
      total,
    });
  }, [items.length, total, t]);

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
        className={`blob-a pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl transition-colors ${
          isDark ? "bg-[#C9A227]/10" : "bg-[#C9A227]/15"
        }`}
        aria-hidden="true"
      />
      <div
        className={`blob-b pointer-events-none absolute top-40 -right-32 h-96 w-96 rounded-full blur-3xl transition-colors ${
          isDark ? "bg-[#C9A227]/8" : "bg-[#C9A227]/12"
        }`}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        {/* Search + filters card */}
        <div
          className={`rounded-2xl border p-4 backdrop-blur-sm transition-colors sm:p-5 ${
            isDark
              ? "border-[#2E2938] bg-[#1E1B26]/90"
              : "border-[#E4DFD4] bg-white/90"
          }`}
        >
          <div className="relative">
            <Search
              size={16}
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${
                isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
              } ${isRTL ? "right-3.5" : "left-3.5"}`}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.searchPlaceholder}
              dir={t.dir}
              className={`w-full rounded-xl border py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#C9A227]/30 ${
                isDark
                  ? "border-[#332C3E] bg-[#161320] text-[#F0EAE2] placeholder:text-[#5E5670] focus:border-[#C9A227]"
                  : "border-[#E4DFD4] bg-[#FAF8F4] text-[#1D1A22] placeholder:text-[#A39D8F] focus:border-[#A9821E]"
              } ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {coords && (
              <button
                onClick={() => {
                  setCoords(null);
                  if (sort === "near") setSort("recommended");
                }}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  isDark
                    ? "border-[#C9A227] bg-[#C9A227]/15 text-[#E0B93A] hover:bg-[#C9A227]/25"
                    : "border-[#A9821E] bg-[#C9A227]/15 text-[#8A6E1A] hover:bg-[#C9A227]/25"
                }`}
              >
                <X size={12} />
                {t.clearLocation}
              </button>
            )}

            {SORT_KEYS.map((key) => {
              const active = sort === key;
              const isNear = key === "near";
              return (
                <button
                  key={key}
                  onClick={() => handleSortClick(key)}
                  disabled={loading && active}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-gradient-to-r from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-md shadow-[#C9A227]/25"
                      : isDark
                        ? "border border-[#332C3E] bg-[#161320] text-[#B7B2C4] hover:border-[#C9A227]/50 hover:text-[#E0B93A]"
                        : "border border-[#E4DFD4] bg-white text-[#6E687A] hover:border-[#A9821E]/50 hover:text-[#8A6E1A]"
                  }`}
                >
                  {isNear &&
                    (locating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Navigation size={12} />
                    ))}
                  {t.sort[key as keyof typeof t.sort]}
                </button>
              );
            })}
          </div>

          <p
            className={`mt-3 text-center text-[11px] uppercase tracking-[0.2em] transition-colors ${
              isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
            }`}
          >
            {coords && sort === "near" ? t.showNearYou : t.showAll}
          </p>
        </div>

        {/* Content */}
        <div className="mt-6">
          {error && (
            <div
              className={`mb-5 rounded-xl border px-4 py-2.5 text-sm ${
                isDark
                  ? "border-[#E5484D]/40 bg-[#E5484D]/10 text-[#FF9B9E]"
                  : "border-red-300 bg-red-50 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          {/* First-page skeleton */}
          {loading && items.length === 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-72 animate-pulse rounded-2xl border ${
                    isDark
                      ? "border-[#2E2938] bg-[#1E1B26]/60"
                      : "border-[#E4DFD4] bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && items.length === 0 && (
            <div
              className={`rounded-2xl border border-dashed px-6 py-16 text-center ${
                isDark ? "border-[#332C3E]" : "border-[#E4DFD4]"
              }`}
            >
              <div
                className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border ${
                  isDark
                    ? "border-[#C9A227]/30 bg-[#C9A227]/10"
                    : "border-[#A9821E]/30 bg-[#C9A227]/10"
                }`}
              >
                <ShoppingBag
                  size={20}
                  className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
                />
              </div>
              <p
                className="text-base font-medium"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t.noDishes}
              </p>
              <p
                className={`mt-1.5 text-sm ${
                  isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
                }`}
              >
                {t.noDishesHint}
              </p>
            </div>
          )}

          {/* Items grid */}
          {items.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => openItem(it)}
                  className={`group flex flex-col overflow-hidden rounded-2xl border text-start backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    isDark
                      ? "border-[#2E2938] bg-[#1E1B26]/90 hover:border-[#C9A227]/50 hover:shadow-[#C9A227]/10"
                      : "border-[#E4DFD4] bg-white hover:border-[#A9821E]/40 hover:shadow-[#A9821E]/10"
                  }`}
                >
                  <div
                    className={`relative aspect-[4/3] overflow-hidden ${
                      isDark ? "bg-[#161320]" : "bg-[#EDE8DE]"
                    }`}
                  >
                    {it.image_url ? (
                      <img
                        src={it.image_url}
                        alt={it.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center ${
                          isDark ? "text-[#332C3E]" : "text-[#D4CFC4]"
                        }`}
                      >
                        <ShoppingBag size={32} />
                      </div>
                    )}

                    {it.distance_km !== null && (
                      <span
                        className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
                          isDark
                            ? "bg-[#15121C]/90 text-[#E0B93A]"
                            : "bg-white/95 text-[#8A6E1A] shadow-sm"
                        }`}
                      >
                        <MapPin size={10} />
                        {it.distance_km < 1
                          ? `${Math.round(it.distance_km * 1000)} m`
                          : `${it.distance_km.toFixed(1)} km`}
                      </span>
                    )}

                    {it.order_count > 50 && (
                      <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-2 py-0.5 text-[10px] font-semibold text-[#1D1707]">
                        <Flame size={10} />
                        {t.popular}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <h3
                      className="line-clamp-1 text-sm font-medium"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {it.name}
                    </h3>

                    <p
                      className={`mt-1 line-clamp-1 text-xs ${
                        isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                      }`}
                    >
                      {it.hotel.name || it.branch.name}
                      {it.branch.city ? ` · ${it.branch.city}` : ""}
                    </p>

                    <div
                      className={`mt-2.5 flex items-center gap-2 text-[11px] ${
                        isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
                      }`}
                    >
                      {it.review_count > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Star
                            size={12}
                            className="fill-[#C9A227] text-[#C9A227]"
                          />
                          <span
                            className={`font-semibold ${
                              isDark ? "text-[#F0EAE2]" : "text-[#1D1A22]"
                            }`}
                          >
                            {it.avg_rating.toFixed(1)}
                          </span>
                          <span
                            className={
                              isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                            }
                          >
                            ({it.review_count})
                          </span>
                        </span>
                      ) : (
                        <span
                          className={
                            isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                          }
                        >
                          {t.noReviews}
                        </span>
                      )}

                      {it.order_count > 0 && (
                        <>
                          <span
                            className={
                              isDark ? "text-[#332C3E]" : "text-[#D4CFC4]"
                            }
                          >
                            ·
                          </span>
                          <span>
                            {it.order_count} {t.ordered}
                          </span>
                        </>
                      )}
                    </div>

                    {it.description && (
                      <p
                        className={`mt-2 line-clamp-2 text-xs leading-relaxed ${
                          isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                        }`}
                      >
                        {it.description}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span
                        className={`text-base font-semibold ${
                          isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
                        }`}
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {it.price.toFixed(2)}{" "}
                        <span
                          className={`text-xs font-medium ${
                            isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                          }`}
                        >
                          {it.currency}
                        </span>
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition group-hover:bg-gradient-to-r group-hover:from-[#E0B93A] group-hover:to-[#A9821E] group-hover:text-[#1D1707] ${
                          isDark
                            ? "border-[#C9A227]/40 bg-[#C9A227]/10 text-[#E0B93A] group-hover:border-[#C9A227]"
                            : "border-[#A9821E]/40 bg-[#C9A227]/10 text-[#8A6E1A] group-hover:border-[#A9821E]"
                        }`}
                      >
                        {t.order}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Sentinel + Load more + end-of-list */}
          {items.length > 0 && (
            <div ref={sentinelRef} className="pt-8 text-center">
              {loadingMore ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2
                    className={`h-5 w-5 animate-spin ${
                      isDark ? "text-[#C9A227]" : "text-[#A9821E]"
                    }`}
                  />
                  <p
                    className={`text-xs ${
                      isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                    }`}
                  >
                    {t.loadingMore}
                  </p>
                </div>
              ) : page < totalPages ? (
                <>
                  <button
                    onClick={() => fetchItems(page + 1, true)}
                    className={`rounded-full border px-5 py-2 text-xs font-semibold transition ${
                      isDark
                        ? "border-[#332C3E] bg-[#161320] text-[#CFCADB] hover:border-[#C9A227]/60 hover:text-[#E0B93A]"
                        : "border-[#E4DFD4] bg-white text-[#6E687A] hover:border-[#A9821E]/60 hover:text-[#8A6E1A]"
                    }`}
                  >
                    {t.loadMore}
                  </button>
                  <p
                    className={`mt-3 text-[10px] uppercase tracking-[0.2em] ${
                      isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                    }`}
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {showingLabel}
                  </p>
                </>
              ) : (
                <>
                  <div
                    className={`mx-auto h-px w-20 ${
                      isDark ? "bg-[#2E2938]" : "bg-[#E4DFD4]"
                    }`}
                  />
                  <p
                    className={`mt-3 text-[10px] uppercase tracking-[0.2em] ${
                      isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                    }`}
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {showingLabel}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
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
