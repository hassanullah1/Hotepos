"use client";
import { cartKey } from "../cart-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Fraunces } from "next/font/google";
import {
  Loader2,
  Plus,
  Minus,
  ShoppingBag,
  MessageSquare,
  Utensils,
  ChevronRight,
  Store,
} from "lucide-react";
import { useBuyerAuth } from "@/providers/BuyerAuthProvider";
import { useLanguage } from "@/context/LanguageContext";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});



const branchText = {
  en: {
    dir: "ltr",
    back: "Back",
    items: "items",
    checkout: "Checkout",
    reviews: "Reviews",
    all: "All",
    loadMore: "Load more",
    loadingMore: "Loading…",
    noItems: "No dishes found",
    noItemsHint: "Try a different category.",
    noCategories: "No menu items yet",
    noCategoriesHint: "This restaurant hasn't added any dishes.",
    add: "Add",
    deliveryMode: "Delivery order",
    myOrders: "My orders",
    menu: "Menu",
  },
  ps: {
    dir: "rtl",
    back: "بیرته",
    items: "توکي",
    checkout: "چیک آوټ",
    reviews: "بیاکتنې",
    all: "ټول",
    loadMore: "نور ښودل",
    loadingMore: "بارول…",
    noItems: "خواړه ونه موندل شول",
    noItemsHint: "بله کټګوري وازموئ.",
    noCategories: "تر اوسه خواړه نشته",
    noCategoriesHint: "دا رستورانت لا تر اوسه خواړه نه دي اضافه کړي.",
    add: "اضافه کړئ",
    deliveryMode: "د تحویل فرمایش",
    myOrders: "زما فرمایشونه",
    menu: "مینو",
  },
  prs: {
    dir: "rtl",
    back: "بازگشت",
    items: "آیتم",
    checkout: "پرداخت",
    reviews: "نظرات",
    all: "همه",
    loadMore: "بیشتر",
    loadingMore: "در حال بارگذاری…",
    noItems: "غذایی یافت نشد",
    noItemsHint: "دسته‌بندی دیگری امتحان کنید.",
    noCategories: "هنوز غذایی نیست",
    noCategoriesHint: "این رستورانت هنوز غذایی اضافه نکرده است.",
    add: "افزودن",
    deliveryMode: "سفارش تحویل",
    myOrders: "سفارش‌های من",
    menu: "منو",
  },
};

export default function BranchOrderPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const searchParams = useSearchParams();
  const preselectItemId = searchParams.get("item");
  const router = useRouter();
  useBuyerAuth();
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lang = branchText[language] ? language : "en";
  const t = branchText[lang];
  const isRTL = t.dir === "rtl";
  const isDark = mounted ? resolvedTheme !== "light" : true;

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", t.dir);
  }, [lang, mounted, t.dir]);

  const [branch, setBranch] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [branchLoading, setBranchLoading] = useState(true);
  const [error, setError] = useState("");

  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [cart, setCart] = useState<Record<string, { item: any; qty: number }>>(
    {},
  );

  // ── restore cart ──
  const [cartRestored, setCartRestored] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(cartKey(branchId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.cart) setCart(parsed.cart);
      }
    } catch {
      /* ignore */
    }
    setCartRestored(true);
  }, [branchId]);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [categoryFilter]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/public/branches/${branchId}`);
        if (!res.ok) throw new Error("Branch not found");
        const d = await res.json();
        setBranch(d.branch);
        setCategories(d.categories || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setBranchLoading(false);
      }
    })();
  }, [branchId]);

  const loadItems = useCallback(
    async (targetPage: number, append = false) => {
      setItemsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: "20",
          category_id: categoryFilter,
        });

        const res = await fetch(
          `/api/public/branches/${branchId}/items?${params.toString()}`,
        );
        if (!res.ok) throw new Error("Failed to load items");
        const d = await res.json();

        setItems((prev) => (append ? [...prev, ...d.items] : d.items));
        setPage(d.page);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setItemsLoading(false);
      }
    },
    [branchId, categoryFilter],
  );

  useEffect(() => {
    if (branchLoading) return;
    loadItems(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchLoading, categoryFilter]);

  useEffect(() => {
    if (!preselectItemId || branchLoading) return;

    async function addPreselect() {
      const existing = items.find((i: any) => i.id === preselectItemId);
      if (existing) {
        addToCart(existing);
      } else {
        try {
          const res = await fetch(`/api/public/menu-items/${preselectItemId}`);
          if (res.ok) {
            const d = await res.json();
            if (d.item) {
              addToCart({
                id: d.item.id,
                name: d.item.name,
                description: d.item.description,
                image_url: d.item.image_url,
                price: d.item.price,
              });
            }
          }
        } catch {
          /* ignore */
        }
      }
      router.replace(`/buy/order/${branchId}`, { scroll: false });
    }
    addPreselect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectItemId, branchLoading]);

  useEffect(() => {
    if (!cartRestored) return;
    if (typeof window === "undefined") return;
    if (!branch) return;
    try {
      sessionStorage.setItem(
        cartKey(branchId),
        JSON.stringify({
          branch: {
            id: branch.id,
            name: branch.name,
            currency: branch.currency || "AFN",
          },
          cart,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [cart, cartRestored, branch, branchId]);

  function addToCart(item: any) {
    setCart((c) => {
      const existing = c[item.id];
      return {
        ...c,
        [item.id]: {
          item,
          qty: (existing?.qty || 0) + 1,
        },
      };
    });
  }
  function decFromCart(itemId: string) {
    setCart((c) => {
      const existing = c[itemId];
      if (!existing) return c;
      const nextQty = existing.qty - 1;
      const copy = { ...c };
      if (nextQty <= 0) delete copy[itemId];
      else copy[itemId] = { ...existing, qty: nextQty };
      return copy;
    });
  }

  const cartLines = useMemo(
    () =>
      Object.entries(cart).map(([id, v]) => ({
        id,
        item: v.item,
        qty: v.qty,
      })),
    [cart],
  );

  const cartTotal = useMemo(
    () => cartLines.reduce((s, l) => s + l.item.price * l.qty, 0),
    [cartLines],
  );
  const cartCount = useMemo(
    () => cartLines.reduce((s, l) => s + l.qty, 0),
    [cartLines],
  );

  function goToCheckout() {
    router.push(`/buy/order/${branchId}/checkout`);
  }

  // ── Infinite scroll ──
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !itemsLoading && page < totalPages) {
          loadItems(page + 1, true);
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [itemsLoading, page, totalPages, loadItems]);

  // ── Horizontal category scroll ──
  const catScrollRef = useRef<HTMLDivElement | null>(null);

  if (branchLoading)
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

  if (error && !branch)
    return (
      <div
        className={`flex min-h-screen items-center justify-center p-6 text-center ${
          isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
        }`}
      >
        <div>
          <p className="text-sm text-red-500">{error || "Not found"}</p>
          <Link
            href="/buy/order"
            className={`mt-3 inline-block text-xs font-semibold ${
              isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
            }`}
          >
            ← {t.back}
          </Link>
        </div>
      </div>
    );

  const currency = branch.currency || "AFN";
  const menuIsEmpty = categories.length === 0 && total === 0;

  return (
    <div
      className={`${displayFont.variable} relative transition-colors duration-300 ${
        isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
      }`}
      dir={t.dir}
    >
      {/* Grid texture (viewport-fixed) */}
      <svg
        className={`pointer-events-none fixed inset-0 -z-10 h-full w-full transition-opacity duration-300 ${
          isDark ? "opacity-[0.04]" : "opacity-[0.05]"
        }`}
        viewBox="0 0 300 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {Array.from({ length: 16 }).map((_, row) =>
          Array.from({ length: 16 }).map((_, col) => (
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
        className={`pointer-events-none fixed -top-32 -left-32 -z-10 h-96 w-96 rounded-full blur-3xl ${
          isDark ? "bg-[#C9A227]/10" : "bg-[#C9A227]/15"
        }`}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-3xl px-4 pt-3 pb-2">
        {/* Branch name row */}
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-md shadow-[#C9A227]/30">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-lg font-bold leading-tight sm:text-xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {branch?.name || "Restaurant"}
            </h1>
            <p
              className={`mt-0.5 flex items-center gap-1.5 text-[11px] ${
                isDark ? "text-[#9691A6]" : "text-[#8A8496]"
              }`}
            >
              <Utensils className="h-3 w-3 shrink-0" />
              <span className="truncate">{t.menu}</span>
              {branch?.city && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="truncate">{branch.city}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Horizontal scrolling category chips ── */}
      {categories.length > 0 && (
        <div className="relative mx-auto max-w-3xl">
          <div
            ref={catScrollRef}
            className="scrollbar-hide flex gap-1.5 overflow-x-auto px-4 pb-3 [scroll-snap-type:x_proximity] [-ms-overflow-style:none]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <button
              onClick={() => setCategoryFilter("all")}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition [scroll-snap-align:start] ${
                categoryFilter === "all"
                  ? "bg-gradient-to-r from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-sm shadow-[#C9A227]/25"
                  : isDark
                    ? "border border-[#332C3E] bg-[#161320] text-[#B7B2C4] hover:border-[#C9A227]/50 hover:text-[#E0B93A]"
                    : "border border-[#E4DFD4] bg-white text-[#6E687A] hover:border-[#A9821E]/50 hover:text-[#8A6E1A]"
              }`}
            >
              {t.all}
            </button>

            {categories.map((c) => {
              const active = categoryFilter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition [scroll-snap-align:start] ${
                    active
                      ? "bg-gradient-to-r from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-sm shadow-[#C9A227]/25"
                      : isDark
                        ? "border border-[#332C3E] bg-[#161320] text-[#B7B2C4] hover:border-[#C9A227]/50 hover:text-[#E0B93A]"
                        : "border border-[#E4DFD4] bg-white text-[#6E687A] hover:border-[#A9821E]/50 hover:text-[#8A6E1A]"
                  }`}
                >
                  {c.name}
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-bold ${
                      active
                        ? "bg-[#1D1707]/15 text-[#1D1707]"
                        : isDark
                          ? "bg-[#2A2534] text-[#6E687A]"
                          : "bg-[#EDE8DE] text-[#A39D8F]"
                    }`}
                  >
                    {c.item_count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Gradient fade edges */}
          <div
            className={`pointer-events-none absolute top-0 bottom-3 w-8 ${
              isDark
                ? "bg-gradient-to-r from-[#15121C] to-transparent"
                : "bg-gradient-to-r from-[#F7F4EE] to-transparent"
            } ${isRTL ? "right-0 rotate-180" : "left-0"}`}
          />
          <div
            className={`pointer-events-none absolute top-0 bottom-3 w-8 ${
              isDark
                ? "bg-gradient-to-l from-[#15121C] to-transparent"
                : "bg-gradient-to-l from-[#F7F4EE] to-transparent"
            } ${isRTL ? "left-0 rotate-180" : "right-0"}`}
          />
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* ITEMS LIST */}
      {/* ════════════════════════════════════════ */}
      <div className="mx-auto max-w-3xl px-4 py-5">
        {error && (
          <div
            className={`mb-4 rounded-xl border px-3.5 py-2.5 text-sm ${
              isDark
                ? "border-[#E5484D]/40 bg-[#E5484D]/10 text-[#FF9B9E]"
                : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        {menuIsEmpty && (
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
              <Utensils
                size={22}
                className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
              />
            </div>
            <p
              className="text-lg font-medium"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.noCategories}
            </p>
            <p
              className={`mt-2 text-sm ${
                isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
              }`}
            >
              {t.noCategoriesHint}
            </p>
          </div>
        )}

        {itemsLoading && items.length === 0 && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`h-24 animate-pulse rounded-2xl border ${
                  isDark
                    ? "border-[#2E2938] bg-[#1E1B26]/60"
                    : "border-[#E4DFD4] bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        {!itemsLoading && items.length === 0 && !menuIsEmpty && (
          <div
            className={`rounded-2xl border border-dashed px-6 py-16 text-center ${
              isDark ? "border-[#332C3E]" : "border-[#E4DFD4]"
            }`}
          >
            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border ${
                isDark
                  ? "border-[#C9A227]/30 bg-[#C9A227]/10"
                  : "border-[#A9821E]/30 bg-[#C9A227]/15"
              }`}
            >
              <Utensils
                size={20}
                className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
              />
            </div>
            <p className="text-sm font-medium">{t.noItems}</p>
            <p
              className={`mt-1 text-xs ${
                isDark ? "text-[#9691A6]" : "text-[#8A8496]"
              }`}
            >
              {t.noItemsHint}
            </p>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((i) => {
              const qty = cart[i.id]?.qty || 0;
              return (
                <div
                  key={i.id}
                  className={`group flex items-stretch overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isDark
                      ? "border-[#2E2938] bg-[#1E1B26]/90 hover:border-[#C9A227]/40"
                      : "border-[#E4DFD4] bg-white/90 hover:border-[#A9821E]/40"
                  }`}
                >
                  <Link
                    href={`/buy/order/item/${i.id}`}
                    className={`relative w-28 shrink-0 overflow-hidden sm:w-32 ${
                      isDark ? "bg-[#161320]" : "bg-[#EDE8DE]"
                    }`}
                  >
                    {i.image_url ? (
                      <img
                        src={i.image_url}
                        alt={i.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center ${
                          isDark ? "text-[#332C3E]" : "text-[#D4CFC4]"
                        }`}
                      >
                        <ShoppingBag size={28} />
                      </div>
                    )}
                    {qty > 0 && (
                      <span className="absolute top-2 left-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#E0B93A] to-[#A9821E] px-1.5 text-[11px] font-bold text-[#1D1707] shadow-md">
                        {qty}
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/buy/order/item/${i.id}`}
                        className="min-w-0 flex-1"
                      >
                        <h3
                          className="truncate text-[15px] font-semibold"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {i.name}
                        </h3>
                        {i.description && (
                          <p
                            className={`mt-0.5 line-clamp-2 text-[11px] leading-snug ${
                              isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                            }`}
                          >
                            {i.description}
                          </p>
                        )}
                      </Link>

                      <Link
                        href={`/buy/order/item/${i.id}`}
                        className={`shrink-0 rounded-full border p-1.5 transition ${
                          isDark
                            ? "border-[#332C3E] text-[#6E687A] hover:border-[#C9A227]/50 hover:text-[#E0B93A]"
                            : "border-[#E4DFD4] text-[#A39D8F] hover:border-[#A9821E]/50 hover:text-[#8A6E1A]"
                        }`}
                        title={t.reviews}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
                      <span
                        className={`text-[15px] font-bold ${
                          isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
                        }`}
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {i.price.toFixed(2)}{" "}
                        <span
                          className={`text-[10px] font-medium ${
                            isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                          }`}
                        >
                          {currency}
                        </span>
                      </span>

                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(i)}
                          className="flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 text-xs font-bold text-[#1D1707] shadow-sm shadow-[#C9A227]/25 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#C9A227]/35 active:translate-y-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {t.add}
                        </button>
                      ) : (
                        <div
                          className={`flex items-center gap-0.5 rounded-full border p-0.5 ${
                            isDark
                              ? "border-[#C9A227]/40 bg-[#C9A227]/10"
                              : "border-[#A9821E]/40 bg-[#C9A227]/10"
                          }`}
                        >
                          <button
                            onClick={() => decFromCart(i.id)}
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                              isDark
                                ? "text-[#E0B93A] hover:bg-[#C9A227]/20"
                                : "text-[#8A6E1A] hover:bg-[#C9A227]/20"
                            }`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span
                            className={`min-w-6 text-center text-sm font-bold tabular-nums ${
                              isDark ? "text-[#F0EAE2]" : "text-[#1D1A22]"
                            }`}
                          >
                            {qty}
                          </span>
                          <button
                            onClick={() => addToCart(i)}
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                              isDark
                                ? "text-[#E0B93A] hover:bg-[#C9A227]/20"
                                : "text-[#8A6E1A] hover:bg-[#C9A227]/20"
                            }`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {page < totalPages && (
          <div ref={loadMoreRef} className="py-8 text-center">
            {itemsLoading ? (
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
            ) : (
              <button
                onClick={() => loadItems(page + 1, true)}
                className={`rounded-full border px-5 py-2 text-xs font-semibold transition ${
                  isDark
                    ? "border-[#332C3E] bg-[#161320] text-[#CFCADB] hover:border-[#C9A227]/60 hover:text-[#E0B93A]"
                    : "border-[#E4DFD4] bg-white text-[#6E687A] hover:border-[#A9821E]/60 hover:text-[#8A6E1A]"
                }`}
              >
                {t.loadMore}
              </button>
            )}
          </div>
        )}

        {items.length > 0 && page >= totalPages && (
          <div className="py-8 text-center">
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
              {items.length} / {total}
            </p>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════ */}
      {/* CART BUTTON */}
      {/* ════════════════════════════════════════ */}
      {cartCount > 0 && (
        <div className="mx-auto max-w-2xl space-y-2 px-4 pb-4">
          <button
            onClick={goToCheckout}
            className="group flex w-full items-center gap-3 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-2 py-1 text-[#1D1707] shadow-2xl shadow-[#C9A227]/30 transition hover:-translate-y-0.5 hover:shadow-[#C9A227]/50 sm:px-3 sm:py-2"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1D1707]/15 sm:h-10 sm:w-10">
              <ShoppingBag className="h-4 w-4" />
              <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1D1707] px-1 text-[10px] font-bold text-[#E0B93A]">
                {cartCount}
              </span>
            </span>
            <div className="flex-1 text-start">
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] opacity-80 sm:text-[11px]">
                {cartCount} {t.items}
              </p>
              <p
                className="text-sm font-bold tabular-nums sm:text-base"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {cartTotal.toFixed(2)} {currency}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D1707] px-3 py-2 text-[11px] font-bold text-[#E0B93A] transition group-hover:bg-[#1D1707]/90 sm:px-4 sm:text-xs">
              {t.checkout}
              <ChevronRight className="h-3 w-3 rtl:rotate-180 sm:h-3.5 sm:w-3.5" />
            </span>
          </button>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
