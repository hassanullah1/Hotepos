"use client";
import { cartKey } from "../../cart-storage";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Navigation,
  Truck,
  ShieldCheck,
  CheckCircle2,
  PackageOpen,
  Pencil,
  StickyNote,
} from "lucide-react";
import { useBuyerAuth } from "@/providers/BuyerAuthProvider";
import { useLanguage } from "@/context/LanguageContext";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});



const checkoutText = {
  en: {
    dir: "ltr",
    back: "Back to menu",
    title: "Checkout",
    deliveryMode: "Delivery order",
    emptyCart: "Your cart is empty",
    emptyCartHint: "Add some dishes from the menu first.",
    browseMenu: "Browse menu",
    step1: "Deliver to",
    step2: "Your items",
    step3: "Delivery details",
    contactNotSet: "Contact info missing",
    edit: "Edit",
    fullName: "Full name",
    phone: "Phone number",
    deliveryAddress: "Street address, building, floor, apartment",
    deliveryNotes: "Delivery notes (optional) — e.g. ring the bell",
    addressSection: "Delivery address",
    useMyLocation: "Use my location",
    locating: "Locating…",
    gpsNotAvailable: "GPS is not available in this browser",
    gpsError: "Could not read your location",
    removePin: "Remove pin",
    gpsPinned: "GPS pinned",
    notePlaceholder: "Add a note for the restaurant (optional)",
    items: "items",
    total: "Total",
    placeOrder: "Place order",
    placing: "Placing order…",
    signInToOrder: "Sign in to place your order",
    signIn: "Sign in to order",
    requiredHint: "Please enter your delivery address to place the order.",
    missingContact: "Add your phone number in your account to place orders.",
    updateAccount: "Update account",
    orderFailed: "Failed to place order",
    addMore: "Add more items",
  },
  ps: {
    dir: "rtl",
    back: "بیرته مینو ته",
    title: "چیک آوټ",
    deliveryMode: "د تحویل فرمایش",
    emptyCart: "ستاسو کارټ خالي دی",
    emptyCartHint: "لومړی له مینو څخه خواړه اضافه کړئ.",
    browseMenu: "مینو ته وګورئ",
    step1: "تحویل به",
    step2: "ستاسو توکي",
    step3: "د تحویل معلومات",
    contactNotSet: "د اړیکې معلومات نشته",
    edit: "سمون",
    fullName: "بشپړ نوم",
    phone: "د تلیفون شمېره",
    deliveryAddress: "کوڅه، ودانۍ، پوړ، اپارتمان",
    deliveryNotes: "د تحویل یادونه (اختیاري) — لکه زنګ ووهئ",
    addressSection: "د تحویل پته",
    useMyLocation: "زما ځای وکاروئ",
    locating: "ځای موندل کیږي…",
    gpsNotAvailable: "پدې براوزر کې GPS نشته",
    gpsError: "ستاسو ځای نه لوستل شو",
    removePin: "پین لرې کړئ",
    gpsPinned: "GPS ټاکل شوی",
    notePlaceholder: "د رستورانت لپاره یادونه (اختیاري)",
    items: "توکي",
    total: "ټول",
    placeOrder: "فرمایش وکړئ",
    placing: "فرمایش کیږي…",
    signInToOrder: "د فرمایش کولو لپاره ننوځئ",
    signIn: "د فرمایش لپاره ننوځئ",
    requiredHint: "د فرمایش کولو لپاره خپله پته ولیکئ.",
    missingContact: "د فرمایش کولو لپاره د خپل حساب شمېره اضافه کړئ.",
    updateAccount: "حساب تازه کړئ",
    orderFailed: "فرمایش ناکام شو",
    addMore: "نور توکي اضافه کړئ",
  },
  prs: {
    dir: "rtl",
    back: "بازگشت به منو",
    title: "پرداخت",
    deliveryMode: "سفارش تحویل",
    emptyCart: "سبد شما خالی است",
    emptyCartHint: "ابتدا از منو غذایی اضافه کنید.",
    browseMenu: "مشاهده منو",
    step1: "تحویل به",
    step2: "آیتم‌های شما",
    step3: "جزئیات تحویل",
    contactNotSet: "اطلاعات تماس ناقص است",
    edit: "ویرایش",
    fullName: "نام کامل",
    phone: "شماره تلفن",
    deliveryAddress: "آدرس، ساختمان، طبقه، آپارتمان",
    deliveryNotes: "یادداشت تحویل (اختیاری) — مثلاً زنگ بزنید",
    addressSection: "آدرس تحویل",
    useMyLocation: "از موقعیت من استفاده کن",
    locating: "در حال یافتن…",
    gpsNotAvailable: "GPS در این مرورگر موجود نیست",
    gpsError: "موقعیت شما خوانده نشد",
    removePin: "حذف پین",
    gpsPinned: "GPS ثبت شد",
    notePlaceholder: "یادداشت برای رستورانت (اختیاری)",
    items: "آیتم",
    total: "مجموع",
    placeOrder: "ثبت سفارش",
    placing: "در حال ثبت…",
    signInToOrder: "برای سفارش وارد شوید",
    signIn: "ورود برای سفارش",
    requiredHint: "برای ثبت سفارش، آدرس تحویل را وارد کنید.",
    missingContact: "برای سفارش، شماره تلفن در حساب خود اضافه کنید.",
    updateAccount: "به‌روزرسانی حساب",
    orderFailed: "ثبت سفارش ناموفق بود",
    addMore: "افزودن آیتم بیشتر",
  },
};

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CheckoutPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const router = useRouter();
  const { buyer, loading: meLoading } = useBuyerAuth();
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lang = checkoutText[language] ? language : "en";
  const t = checkoutText[lang];
  const isRTL = t.dir === "rtl";
  const isDark = mounted ? resolvedTheme !== "light" : true;

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", t.dir);
  }, [lang, mounted, t.dir]);

  // ── cart + branch info from sessionStorage ──
  const [loaded, setLoaded] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [currency, setCurrency] = useState("AFN");
  const [cart, setCart] = useState<Record<string, { item: any; qty: number }>>(
    {},
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(cartKey(branchId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.branch) {
          setBranchName(parsed.branch.name || "");
          setCurrency(parsed.branch.currency || "AFN");
        }
        if (parsed?.cart) setCart(parsed.cart);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [branchId]);

  useEffect(() => {
    if (!loaded) return;
    if (typeof window === "undefined") return;
    try {
      const existingRaw = sessionStorage.getItem(cartKey(branchId));
      const existing = existingRaw ? JSON.parse(existingRaw) : null;
      const branch = existing?.branch || { name: branchName, currency };
      sessionStorage.setItem(
        cartKey(branchId),
        JSON.stringify({ branch, cart }),
      );
    } catch {
      /* ignore */
    }
  }, [cart, loaded, branchId, branchName, currency]);

  // ── form fields ──
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [note, setNote] = useState("");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function useMyLocation() {
    setGeoError("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError(t.gpsNotAvailable);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeliveryLat(pos.coords.latitude);
        setDeliveryLng(pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        setGeoError(err.message || t.gpsError);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
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

  function addOne(itemId: string) {
    setCart((c) => {
      const existing = c[itemId];
      if (!existing) return c;
      return { ...c, [itemId]: { ...existing, qty: existing.qty + 1 } };
    });
  }
  function decOne(itemId: string) {
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
  function removeLine(itemId: string) {
    setCart((c) => {
      const copy = { ...c };
      delete copy[itemId];
      return copy;
    });
  }

  const hasContact = !!(buyer?.full_name?.trim() && buyer?.phone?.trim());
  const hasAddress = !!deliveryAddress.trim();
  const formValid = hasContact && hasAddress;
  const canSubmit = !saving && !!buyer && cartLines.length > 0 && formValid;

  async function submit() {
    if (!buyer) {
      router.push(
        `/buy/login?next=${encodeURIComponent(
          `/buy/order/${branchId}/checkout`,
        )}`,
      );
      return;
    }
    if (!cartLines.length || !formValid) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        branch_id: branchId,
        note,
        delivery_address: deliveryAddress.trim(),
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        delivery_notes: deliveryNotes.trim() || null,
        items: cartLines.map((l) => ({
          menu_item_id: l.item.id,
          quantity: l.qty,
        })),
      };

      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.error === "BUYER_PHONE_MISSING") {
          throw new Error(t.missingContact);
        }
        throw new Error(d.error || t.orderFailed);
      }

      try {
        sessionStorage.removeItem(cartKey(branchId));
      } catch {
        /* ignore */
      }

      router.replace(`/buy/order/track/${d.order.public_token}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── loading ──
  if (!loaded)
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

  // ── empty cart ──
  if (cartLines.length === 0)
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center px-6 text-center ${
          isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
        }`}
        dir={t.dir}
      >
        <div
          className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full border ${
            isDark
              ? "border-[#C9A227]/30 bg-[#C9A227]/10"
              : "border-[#A9821E]/30 bg-[#C9A227]/15"
          }`}
        >
          <PackageOpen
            size={26}
            className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
          />
        </div>
        <h1
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t.emptyCart}
        </h1>
        <p
          className={`mt-2 max-w-xs text-sm ${
            isDark ? "text-[#9691A6]" : "text-[#8A8496]"
          }`}
        >
          {t.emptyCartHint}
        </p>
        <Link
          href={`/buy/order/${branchId}`}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-5 py-2.5 text-sm font-bold text-[#1D1707] shadow-md shadow-[#C9A227]/25 transition hover:-translate-y-0.5"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" />
          {t.browseMenu}
        </Link>
      </div>
    );

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

      <div className="relative mx-auto max-w-2xl px-4 py-5">
    

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 1 — CUSTOMER (display card, no inputs) */}
        {/* ═══════════════════════════════════════════ */}
        <div className="mb-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                isDark
                  ? "bg-[#C9A227]/20 text-[#E0B93A]"
                  : "bg-[#C9A227]/15 text-[#8A6E1A]"
              }`}
            >
              1
            </span>
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.15em] ${
                isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
              }`}
            >
              {t.step1}
            </span>
          </div>

          <div
            className={`overflow-hidden rounded-2xl border ${
              isDark
                ? "border-[#2E2938] bg-[#1E1B26]/90"
                : "border-[#E4DFD4] bg-white/90"
            }`}
          >
            {meLoading ? (
              <div
                className={`flex items-center justify-center gap-2 py-6 text-xs ${
                  isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                }`}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : buyer ? (
              <>
                {/* Customer display — no inputs */}
                <div className="flex items-center gap-3 p-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-base font-bold text-[#1D1707] shadow-md shadow-[#C9A227]/30`}
                  >
                    {initials(buyer.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[15px] font-semibold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {buyer.full_name || "—"}
                    </p>
                    <div
                      className={`mt-0.5 flex items-center gap-1.5 text-[13px] ${
                        isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                      }`}
                    >
                      <Phone size={11} className="shrink-0" />
                      <span dir="ltr" className="truncate">
                        {buyer.phone || "—"}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/buy/account"
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                      isDark
                        ? "border-[#332C3E] text-[#B7B2C4] hover:border-[#C9A227]/40 hover:text-[#E0B93A]"
                        : "border-[#E4DFD4] text-[#6E687A] hover:border-[#A9821E]/40 hover:text-[#8A6E1A]"
                    }`}
                  >
                    <Pencil size={10} />
                    {t.edit}
                  </Link>
                </div>

                {!hasContact && (
                  <div
                    className={`flex items-start gap-2 border-t px-4 py-2.5 text-[11px] ${
                      isDark
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    <span className="flex-1">{t.missingContact}</span>
                    <Link
                      href="/buy/account"
                      className="shrink-0 font-semibold underline"
                    >
                      {t.updateAccount}
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <Link
                href={`/buy/login?next=${encodeURIComponent(
                  `/buy/order/${branchId}/checkout`,
                )}`}
                className={`flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition ${
                  isDark
                    ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              >
                <LogIn className="h-4 w-4" />
                {t.signInToOrder}
              </Link>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 2 — ITEMS                              */}
        {/* ═══════════════════════════════════════════ */}
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  isDark
                    ? "bg-[#C9A227]/20 text-[#E0B93A]"
                    : "bg-[#C9A227]/15 text-[#8A6E1A]"
                }`}
              >
                2
              </span>
              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.15em] ${
                  isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
                }`}
              >
                {t.step2}
              </span>
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                  isDark
                    ? "bg-[#2A2534] text-[#9691A6]"
                    : "bg-[#EDE8DE] text-[#8A8496]"
                }`}
              >
                {cartCount}
              </span>
            </div>
            <Link
              href={`/buy/order/${branchId}`}
              className={`text-[11px] font-semibold underline ${
                isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
              }`}
            >
              + {t.addMore}
            </Link>
          </div>

          <div
            className={`overflow-hidden rounded-2xl border ${
              isDark
                ? "border-[#2E2938] bg-[#1E1B26]/90"
                : "border-[#E4DFD4] bg-white/90"
            }`}
          >
            <ul>
              {cartLines.map((l, idx) => (
                <li
                  key={l.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx > 0
                      ? isDark
                        ? "border-t border-[#2E2938]"
                        : "border-t border-[#E4DFD4]"
                      : ""
                  }`}
                >
                  <div
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl ${
                      isDark ? "bg-[#161320]" : "bg-[#EDE8DE]"
                    }`}
                  >
                    {l.item.image_url ? (
                      <img
                        src={l.item.image_url}
                        alt={l.item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center ${
                          isDark ? "text-[#332C3E]" : "text-[#D4CFC4]"
                        }`}
                      >
                        <ShoppingBag size={18} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {l.item.name}
                    </p>
                    <p
                      className={`mt-0.5 text-[11px] tabular-nums ${
                        isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                      }`}
                    >
                      {l.item.price.toFixed(2)} {currency}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      onClick={() => decOne(l.id)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                        isDark
                          ? "border-[#332C3E] text-[#CFCADB] hover:bg-[#2A2534]"
                          : "border-[#E4DFD4] text-[#6E687A] hover:bg-[#F7F4EE]"
                      }`}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-bold tabular-nums">
                      {l.qty}
                    </span>
                    <button
                      onClick={() => addOne(l.id)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                        isDark
                          ? "border-[#332C3E] text-[#CFCADB] hover:bg-[#2A2534]"
                          : "border-[#E4DFD4] text-[#6E687A] hover:bg-[#F7F4EE]"
                      }`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeLine(l.id)}
                      className={`ms-1 flex h-7 w-7 items-center justify-center rounded-full transition ${
                        isDark
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-red-500 hover:bg-red-50"
                      }`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div
              className={`flex items-center justify-between border-t px-4 py-3 ${
                isDark
                  ? "border-[#2E2938] bg-[#161320]"
                  : "border-[#E4DFD4] bg-[#FAF8F4]"
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
                <span className="text-xs font-medium opacity-70">
                  {currency}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 3 — DELIVERY ADDRESS + NOTES           */}
        {/* ═══════════════════════════════════════════ */}
        <div className="mb-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                isDark
                  ? "bg-[#C9A227]/20 text-[#E0B93A]"
                  : "bg-[#C9A227]/15 text-[#8A6E1A]"
              }`}
            >
              3
            </span>
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.15em] ${
                isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
              }`}
            >
              {t.step3}
            </span>
          </div>

          <div
            className={`overflow-hidden rounded-2xl border ${
              isDark
                ? "border-[#2E2938] bg-[#1E1B26]/90"
                : "border-[#E4DFD4] bg-white/90"
            }`}
          >
            <div className="space-y-2 p-4">
              {/* Address */}
              <div className="relative">
                <MapPin
                  size={15}
                  className={`pointer-events-none absolute top-3 ${
                    isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                  } ${isRTL ? "right-3" : "left-3"}`}
                />
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder={`${t.deliveryAddress} *`}
                  rows={3}
                  className={`w-full resize-none rounded-xl border py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#C9A227]/30 ${
                    isDark
                      ? "border-[#332C3E] bg-[#161320] text-[#F0EAE2] placeholder:text-[#5E5670] focus:border-[#C9A227]"
                      : "border-[#E4DFD4] bg-[#FAF8F4] text-[#1D1A22] placeholder:text-[#A39D8F] focus:border-[#A9821E]"
                  } ${isRTL ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                />
              </div>

              {/* GPS */}
              <div
                className={`rounded-xl border px-3 py-2.5 ${
                  isDark
                    ? "border-[#332C3E] bg-[#161320]"
                    : "border-[#E4DFD4] bg-[#FAF8F4]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin
                      size={13}
                      className={
                        deliveryLat != null && deliveryLng != null
                          ? isDark
                            ? "text-sky-400 shrink-0"
                            : "text-sky-600 shrink-0"
                          : isDark
                            ? "text-[#6E687A] shrink-0"
                            : "text-[#A39D8F] shrink-0"
                      }
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-[12px] font-semibold ${
                          deliveryLat != null && deliveryLng != null
                            ? isDark
                              ? "text-sky-300"
                              : "text-sky-700"
                            : isDark
                              ? "text-[#CFCADB]"
                              : "text-[#6E687A]"
                        }`}
                      >
                        {deliveryLat != null && deliveryLng != null
                          ? t.gpsPinned
                          : "GPS"}
                      </p>
                      {deliveryLat != null && deliveryLng != null && (
                        <p
                          className={`mt-0.5 text-[10px] tabular-nums ${
                            isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                          }`}
                          dir="ltr"
                        >
                          {deliveryLat.toFixed(5)}, {deliveryLng.toFixed(5)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition disabled:opacity-60 ${
                      isDark
                        ? "bg-[#C9A227]/20 text-[#E0B93A] hover:bg-[#C9A227]/30"
                        : "bg-[#C9A227]/15 text-[#8A6E1A] hover:bg-[#C9A227]/25"
                    }`}
                  >
                    {locating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Navigation className="h-3 w-3" />
                    )}
                    {locating ? t.locating : t.useMyLocation}
                  </button>
                </div>

                {geoError && (
                  <p className="mt-1.5 text-[10px] text-red-500">{geoError}</p>
                )}

                {deliveryLat != null && deliveryLng != null && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryLat(null);
                      setDeliveryLng(null);
                    }}
                    className={`mt-1.5 text-[10px] underline ${
                      isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                    }`}
                  >
                    {t.removePin}
                  </button>
                )}
              </div>

              {/* Delivery notes */}
              <div className="relative">
                <StickyNote
                  size={15}
                  className={`pointer-events-none absolute top-3 ${
                    isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                  } ${isRTL ? "right-3" : "left-3"}`}
                />
                <input
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder={t.deliveryNotes}
                  className={`w-full rounded-xl border py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#C9A227]/30 ${
                    isDark
                      ? "border-[#332C3E] bg-[#161320] text-[#F0EAE2] placeholder:text-[#5E5670] focus:border-[#C9A227]"
                      : "border-[#E4DFD4] bg-[#FAF8F4] text-[#1D1A22] placeholder:text-[#A39D8F] focus:border-[#A9821E]"
                  } ${isRTL ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order note (optional) */}
        <div className="mb-2">
          <textarea
            placeholder={t.notePlaceholder}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={`w-full rounded-xl border px-3 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#C9A227]/30 ${
              isDark
                ? "border-[#332C3E] bg-[#161320] text-[#F0EAE2] placeholder:text-[#5E5670] focus:border-[#C9A227]"
                : "border-[#E4DFD4] bg-[#FAF8F4] text-[#1D1A22] placeholder:text-[#A39D8F] focus:border-[#A9821E]"
            }`}
          />
        </div>

        {error && (
          <p className="mb-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
      </div>

      {/* Sticky submit bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 border-t px-3 py-3 backdrop-blur-xl sm:px-4 sm:py-4 ${
          isDark
            ? "border-[#2E2938] bg-[#15121C]/95"
            : "border-[#E4DFD4] bg-[#F7F4EE]/95"
        }`}
      >
        <div className="mx-auto max-w-2xl">
          {buyer && hasContact && !hasAddress && (
            <p className="mb-2 text-center text-[11px] text-amber-600 dark:text-amber-300">
              {t.requiredHint}
            </p>
          )}

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 py-3.5 text-sm font-bold text-[#1D1707] shadow-lg shadow-[#C9A227]/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#C9A227]/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !hasContact || !hasAddress ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {saving
              ? t.placing
              : !buyer
                ? t.signIn
                : `${t.placeOrder} · ${cartTotal.toFixed(2)} ${currency}`}
          </button>
        </div>
      </div>
    </div>
  );
}
