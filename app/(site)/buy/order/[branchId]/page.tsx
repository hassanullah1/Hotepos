"use client";

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
  X,
  LogIn,
  MessageSquare,
  Utensils,
  ChevronRight,
  Sparkles,
  Search,
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
    confirmOrder: "Confirm order",
    total: "Total",
    orderingAs: "Ordering as",
    signInToOrder: "Sign in to place your order",
    signIn: "Sign in to order",
    placeOrder: "Place order",
    placing: "Placing order…",
    notePlaceholder: "Add a note (optional)",
    reviews: "Reviews",
    searchPlaceholder: "Search dishes in this menu…",
    all: "All",
    loadMore: "Load more",
    loadingMore: "Loading…",
    noItems: "No dishes found",
    noItemsHint: "Try a different search or category.",
    noCategories: "No menu items yet",
    noCategoriesHint: "This restaurant hasn't added any dishes.",
    add: "Add",
  },
  ps: {
    dir: "rtl",
    back: "بیرته",
    items: "توکي",
    checkout: "چیک آوټ",
    confirmOrder: "فرمایش تایید کړئ",
    total: "ټول",
    orderingAs: "فرمایش د",
    signInToOrder: "د فرمایش کولو لپاره ننوځئ",
    signIn: "د فرمایش لپاره ننوځئ",
    placeOrder: "فرمایش وکړئ",
    placing: "فرمایش کیږي…",
    notePlaceholder: "یادونه اضافه کړئ (اختیاري)",
    reviews: "بیاکتنې",
    searchPlaceholder: "پدې مینو کې خواړه ولټوئ…",
    all: "ټول",
    loadMore: "نور ښودل",
    loadingMore: "بارول…",
    noItems: "خواړه ونه موندل شول",
    noItemsHint: "بله لټون یا کټګوري وازموئ.",
    noCategories: "تر اوسه خواړه نشته",
    noCategoriesHint: "دا رستورانت لا تر اوسه خواړه نه دي اضافه کړي.",
    add: "اضافه کړئ",
  },
  prs: {
    dir: "rtl",
    back: "بازگشت",
    items: "آیتم",
    checkout: "پرداخت",
    confirmOrder: "تأیید سفارش",
    total: "مجموع",
    orderingAs: "سفارش به نام",
    signInToOrder: "برای سفارش وارد شوید",
    signIn: "ورود برای سفارش",
    placeOrder: "ثبت سفارش",
    placing: "در حال ثبت…",
    notePlaceholder: "یادداشت اضافه کنید (اختیاری)",
    reviews: "نظرات",
    searchPlaceholder: "جستجوی غذا در این منو…",
    all: "همه",
    loadMore: "بیشتر",
    loadingMore: "در حال بارگذاری…",
    noItems: "غذایی یافت نشد",
    noItemsHint: "جستجو یا دسته‌بندی دیگری امتحان کنید.",
    noCategories: "هنوز غذایی نیست",
    noCategoriesHint: "این رستورانت هنوز غذایی اضافه نکرده است.",
    add: "افزودن",
  },
};

export default function BranchOrderPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const searchParams = useSearchParams();
  const preselectItemId = searchParams.get("item");
  const router = useRouter();
  const { buyer, loading: meLoading } = useBuyerAuth();
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

  // Branch + categories
  const [branch, setBranch] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [branchLoading, setBranchLoading] = useState(true);
  const [error, setError] = useState("");

  // Items (paginated)
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Cart — full item data so it survives filter changes
  const [cart, setCart] = useState<Record<string, { item: any; qty: number }>>(
    {},
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // ---------- Debounce search ----------
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  // ---------- Reset page on filter change ----------
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [categoryFilter, debouncedSearch]);

  // ---------- Load branch + categories ----------
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

  // ---------- Load items ----------
  const loadItems = useCallback(
    async (targetPage: number, append = false) => {
      setItemsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: "20",
          category_id: categoryFilter,
        });
        if (debouncedSearch) params.set("q", debouncedSearch);

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
    [branchId, categoryFilter, debouncedSearch],
  );

  useEffect(() => {
    if (branchLoading) return;
    loadItems(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchLoading, categoryFilter, debouncedSearch]);

  // ---------- Auto-add preselect item ----------
  useEffect(() => {
    if (!preselectItemId || branchLoading) return;

    const existing = items.find((i: any) => i.id === preselectItemId);
    if (existing) {
      addToCart(existing);
      setCartOpen(true);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/public/menu-items/${preselectItemId}`);
        if (!res.ok) return;
        const d = await res.json();
        if (d.item) {
          addToCart({
            id: d.item.id,
            name: d.item.name,
            description: d.item.description,
            image_url: d.item.image_url,
            price: d.item.price,
          });
          setCartOpen(true);
        }
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectItemId, branchLoading]);

  // ---------- Cart helpers ----------
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

  // ---------- Submit ----------
  async function submit() {
    if (!buyer) {
      router.push(
        `/buy/login?next=${encodeURIComponent(`/buy/order/${branchId}`)}`,
      );
      return;
    }
    if (!cartLines.length) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          branch_id: branchId,
          order_type: "takeaway",
          note,
          items: cartLines.map((l) => ({
            menu_item_id: l.item.id,
            quantity: l.qty,
          })),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to place order");
      router.push(`/buy/order/track/${d.order.public_token}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ---------- Infinite scroll trigger ----------
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

  // ---------- Loading screen ----------
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
  const hasItems = total > 0 || items.length > 0;
  const menuIsEmpty = categories.length === 0 && total === 0;

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-hidden pb-32 transition-colors duration-300 ${
        isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
      }`}
      dir={t.dir}
    >
      {/* Grid texture */}
      <svg
        className={`pointer-events-none fixed inset-0 h-full w-full transition-opacity duration-300 ${
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
        className={`pointer-events-none fixed -top-32 -left-32 h-96 w-96 rounded-full blur-3xl ${
          isDark ? "bg-[#C9A227]/10" : "bg-[#C9A227]/15"
        }`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none fixed top-40 -right-32 h-96 w-96 rounded-full blur-3xl ${
          isDark ? "bg-[#C9A227]/8" : "bg-[#C9A227]/12"
        }`}
        aria-hidden="true"
      />

      {/* Sticky filters bar */}
      <div
        className={`sticky top-0 z-20 border-b backdrop-blur-xl transition-colors ${
          isDark
            ? "border-[#2E2938]/60 bg-[#15121C]/90"
            : "border-[#E4DFD4]/60 bg-[#F7F4EE]/90"
        }`}
      >
        <div className="mx-auto max-w-3xl px-4 py-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${
                isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
              } ${isRTL ? "right-3" : "left-3"}`}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full rounded-xl border py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#C9A227]/30 ${
                isDark
                  ? "border-[#332C3E] bg-[#161320] text-[#F0EAE2] placeholder:text-[#5E5670] focus:border-[#C9A227]"
                  : "border-[#E4DFD4] bg-[#FAF8F4] text-[#1D1A22] placeholder:text-[#A39D8F] focus:border-[#A9821E]"
              } ${isRTL ? "pr-9 pl-3" : "pl-9 pr-3"}`}
            />
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="-mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
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
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-gradient-to-r from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-sm shadow-[#C9A227]/25"
                        : isDark
                          ? "border border-[#332C3E] bg-[#161320] text-[#B7B2C4] hover:border-[#C9A227]/50 hover:text-[#E0B93A]"
                          : "border border-[#E4DFD4] bg-white text-[#6E687A] hover:border-[#A9821E]/50 hover:text-[#8A6E1A]"
                    }`}
                  >
                    {c.name}
                    <span
                      className={`rounded-full px-1 text-[10px] font-bold ${
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
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-3xl px-4 py-5">
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

        {/* Whole menu empty */}
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

        {/* First-load skeleton */}
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

        {/* No results for filter */}
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
              <Search
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

        {/* Items list */}
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
                    className={`relative w-24 shrink-0 overflow-hidden sm:w-28 ${
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
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/buy/order/item/${i.id}`}
                        className="min-w-0 flex-1"
                      >
                        <h3
                          className="truncate text-sm font-medium"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {i.name}
                        </h3>
                        {i.description && (
                          <p
                            className={`mt-0.5 line-clamp-1 text-[11px] ${
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

                    <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                      <span
                        className={`text-sm font-semibold ${
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
                          className="flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-3.5 text-xs font-semibold text-[#1D1707] shadow-sm shadow-[#C9A227]/25 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#C9A227]/35 active:translate-y-0"
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

        {/* Infinite scroll trigger + Load more */}
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

        {/* End of list marker */}
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

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4">
          <div className="mx-auto max-w-3xl">
            <button
              onClick={() => setCartOpen(true)}
              className="group flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-5 py-3.5 text-[#1D1707] shadow-2xl shadow-[#C9A227]/30 transition hover:-translate-y-0.5 hover:shadow-[#C9A227]/50"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1D1707]/15">
                <ShoppingBag className="h-4 w-4" />
                <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1D1707] px-1 text-[10px] font-bold text-[#E0B93A]">
                  {cartCount}
                </span>
              </span>
              <div className="flex-1 text-start">
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] opacity-80">
                  {cartCount} {t.items}
                </p>
                <p
                  className="text-base font-bold tabular-nums"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {cartTotal.toFixed(2)} {currency}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D1707] px-4 py-2 text-xs font-bold text-[#E0B93A] transition group-hover:bg-[#1D1707]/90">
                {t.checkout}
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCartOpen(false);
          }}
        >
          <div
            className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border p-5 shadow-2xl sm:rounded-3xl sm:p-6 ${
              isDark
                ? "border-[#2E2938] bg-[#1B1823]"
                : "border-[#E4DFD4] bg-white"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    isDark
                      ? "bg-[#C9A227]/15 text-[#E0B93A]"
                      : "bg-[#C9A227]/15 text-[#8A6E1A]"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <h3
                  className="text-lg font-medium"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {t.confirmOrder}
                </h3>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className={`rounded-full p-1.5 transition ${
                  isDark
                    ? "text-[#6E687A] hover:bg-[#2A2534] hover:text-[#F0EAE2]"
                    : "text-[#A39D8F] hover:bg-[#F7F4EE] hover:text-[#1D1A22]"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              className={`max-h-56 space-y-1.5 overflow-y-auto rounded-2xl border p-3.5 ${
                isDark
                  ? "border-[#2E2938] bg-[#161320]"
                  : "border-[#E4DFD4] bg-[#FAF8F4]"
              }`}
            >
              {cartLines.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-2 py-1 text-sm"
                >
                  <span
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                      isDark
                        ? "bg-[#C9A227]/15 text-[#E0B93A]"
                        : "bg-[#C9A227]/15 text-[#8A6E1A]"
                    }`}
                  >
                    {l.qty}
                  </span>
                  <span className="flex-1 truncate">{l.item.name}</span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {(l.item.price * l.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div
              className={`mt-4 flex items-center justify-between border-t pt-4 ${
                isDark ? "border-[#2E2938]" : "border-[#E4DFD4]"
              }`}
            >
              <span
                className={`text-xs font-semibold uppercase tracking-[0.15em] ${
                  isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                }`}
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {t.total}
              </span>
              <span
                className={`text-xl font-bold tabular-nums ${
                  isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
                }`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {cartTotal.toFixed(2)}{" "}
                <span
                  className={`text-xs font-medium ${
                    isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                  }`}
                >
                  {currency}
                </span>
              </span>
            </div>

            <div className="mt-4">
              {meLoading ? (
                <div
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs ${
                    isDark
                      ? "border-[#332C3E] bg-[#161320] text-[#9691A6]"
                      : "border-[#E4DFD4] bg-[#FAF8F4] text-[#8A8496]"
                  }`}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              ) : buyer ? (
                <div
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs ${
                    isDark
                      ? "border-[#C9A227]/30 bg-[#C9A227]/5 text-[#E0B93A]"
                      : "border-[#A9821E]/30 bg-[#C9A227]/10 text-[#8A6E1A]"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {t.orderingAs}{" "}
                    <strong className="font-semibold">{buyer.full_name}</strong>
                    {buyer.phone ? (
                      <span className="opacity-70"> · {buyer.phone}</span>
                    ) : null}
                  </span>
                </div>
              ) : (
                <Link
                  href={`/buy/login?next=${encodeURIComponent(
                    `/buy/order/${branchId}`,
                  )}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  {t.signInToOrder}
                </Link>
              )}
            </div>

            <textarea
              placeholder={t.notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className={`mt-3 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#C9A227]/30 ${
                isDark
                  ? "border-[#332C3E] bg-[#161320] text-[#F0EAE2] placeholder:text-[#5E5670] focus:border-[#C9A227]"
                  : "border-[#E4DFD4] bg-[#FAF8F4] text-[#1D1A22] placeholder:text-[#A39D8F] focus:border-[#A9821E]"
              }`}
            />

            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

            <button
              onClick={submit}
              disabled={saving || !buyer}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 py-3 text-sm font-bold text-[#1D1707] shadow-md shadow-[#C9A227]/25 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? t.placing : !buyer ? t.signIn : t.placeOrder}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
