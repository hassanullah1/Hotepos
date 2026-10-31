"use client";
import { cartKey } from "../../cart-storage";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { fraunces as displayFont } from "@/app/fonts/fraunces";
import {
  Loader2,
  Plus,
  Minus,
  ShoppingBag,
  X,
  LogIn,
  ArrowLeft,
  ArrowRight,
  Phone,
  MapPin,
  Navigation,
  CheckCircle2,
  PackageOpen,
  Pencil,
  StickyNote,
} from "lucide-react";
import { useBuyerAuth } from "@/providers/BuyerAuthProvider";
import { useLanguage } from "@/context/LanguageContext";

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
    subtotal: "Subtotal",
    delivery: "Delivery",
    deliveryFree: "Free",
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
    subtotal: "فرعي مجموعه",
    delivery: "تحویل",
    deliveryFree: "وړیا",
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
    subtotal: "جمع جزء",
    delivery: "تحویل",
    deliveryFree: "رایگان",
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

/** Flat delivery fee (AFN). Charged unless hotel.delivery_type = "free".
 *  MUST match `PAID_DELIVERY_FEE` in `app/api/public/orders/route.ts`. */
const PAID_DELIVERY_FEE = 50;

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type DeliveryType = "none" | "paid" | "free";

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
  const [deliveryType, setDeliveryType] = useState<DeliveryType | null>(null);
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
          const stored = parsed.branch.delivery_type;
          if (stored === "none" || stored === "paid" || stored === "free") {
            setDeliveryType(stored);
          }
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

  // ── Authoritative delivery_type from the API ──
  useEffect(() => {
    if (!branchId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/branches/${branchId}`, {
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("fetch_failed");
        const d = await res.json();
        if (cancelled) return;
        const dt = d?.branch?.delivery_type;
        setDeliveryType(
          dt === "paid" || dt === "free" || dt === "none" ? dt : "paid",
        );
        if (d?.branch?.name) setBranchName(d.branch.name);
        if (d?.branch?.currency) setCurrency(d.branch.currency);
      } catch {
        if (cancelled) return;
        // Unknown → default to "paid" (charges 50, same as "none")
        setDeliveryType((prev) => prev ?? "paid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [branchId]);

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

  // ── Delivery fee ──
  // "free" → 0; "none" or "paid" → PAID_DELIVERY_FEE (server enforces the same)
  const isFreeDelivery = deliveryType === "free";
  const deliveryFee = isFreeDelivery ? 0 : PAID_DELIVERY_FEE;
  const grandTotal = cartTotal + deliveryFee;

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
  const submitDisabled = saving || (!!buyer && !canSubmit);

  async function submit() {
    if (!buyer) {
      router.push(
        `/login?next=${encodeURIComponent(`/order/${branchId}/checkout`)}`,
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
        // delivery_fee is intentionally NOT sent — server computes it.
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

      router.replace(`/order/track/${d.order.public_token}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const ArrowBack = isRTL ? ArrowRight : ArrowLeft;

  const muted = isDark ? "text-[#9691A6]" : "text-[#8A8496]";
  const soft = isDark ? "text-[#B7B2C4]" : "text-[#6E687A]";
  const gold = isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]";
  const panel = isDark
    ? "border-[#2E2938] bg-[#1E1B26]/90"
    : "border-[#E4DFD4] bg-white/90";
  const inputCls = isDark
    ? "border-[#332C3E] bg-[#161320] text-[#F0EAE2] placeholder:text-[#5E5670] focus:border-[#C9A227]"
    : "border-[#E4DFD4] bg-[#FAF8F4] text-[#1D1A22] placeholder:text-[#A39D8F] focus:border-[#A9821E]";
  const stepBadge = isDark
    ? "bg-[#C9A227]/20 text-[#E0B93A]"
    : "bg-[#C9A227]/15 text-[#8A6E1A]";

  // ── loading ──
  if (!loaded || deliveryType === null)
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
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full border ${
            isDark
              ? "border-[#C9A227]/30 bg-[#C9A227]/10"
              : "border-[#A9821E]/30 bg-[#C9A227]/15"
          }`}
        >
          <PackageOpen
            size={24}
            className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
          />
        </div>
        <h1
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t.emptyCart}
        </h1>
        <p className={`mt-2 max-w-xs text-sm ${muted}`}>{t.emptyCartHint}</p>
        <Link
          href={`/order/${branchId}`}
          className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-6 text-sm font-bold text-[#1D1707] shadow-md shadow-[#C9A227]/25 transition hover:-translate-y-0.5 active:scale-95"
        >
          <ArrowBack size={14} />
          {t.browseMenu}
        </Link>
      </div>
    );

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-hidden pb-44 transition-colors duration-300 ${
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

      <div className="relative mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-6">
        {/* Back chip + title */}
        <Link
          href={`/order/${branchId}`}
          className={`group mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 hover:text-[#E0B93A] ${panel} ${soft}`}
        >
          <ArrowBack
            size={14}
            className="transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
          />
          {t.back}
        </Link>

        <div className="mb-4 flex items-end justify-between gap-3">
          <h1
            className="text-xl font-medium leading-tight sm:text-2xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.title}
          </h1>
          {branchName && (
            <p className={`truncate text-xs ${muted}`}>{branchName}</p>
          )}
        </div>

        {/* ═════════ STEP 1 — CUSTOMER ═════════ */}
        <section className="mb-4">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${stepBadge}`}
            >
              1
            </span>
            <h2 className="text-sm font-semibold">{t.step1}</h2>
          </div>

          <div
            className={`overflow-hidden rounded-2xl border shadow-lg ${panel} ${
              isDark ? "shadow-black/20" : "shadow-[#8A6E1A]/5"
            }`}
          >
            {meLoading ? (
              <div
                className={`flex items-center justify-center gap-2 py-5 text-xs ${muted}`}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : buyer ? (
              <>
                <div className="flex items-center gap-3 p-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-sm font-bold text-[#1D1707] shadow-md shadow-[#C9A227]/30">
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
                      className={`mt-0.5 flex items-center gap-1.5 text-[13px] ${muted}`}
                    >
                      <Phone size={11} className="shrink-0" />
                      <span dir="ltr" className="truncate">
                        {buyer.phone || "—"}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/account"
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 ${
                      isDark
                        ? "border-[#332C3E] text-[#B7B2C4] hover:border-[#C9A227]/50 hover:text-[#E0B93A]"
                        : "border-[#E4DFD4] text-[#6E687A] hover:border-[#A9821E]/50 hover:text-[#8A6E1A]"
                    }`}
                  >
                    <Pencil size={11} />
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
                      href="/account"
                      className="shrink-0 font-semibold underline"
                    >
                      {t.updateAccount}
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(
                  `/order/${branchId}/checkout`,
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
        </section>

        {/* ═════════ STEP 2 — ITEMS ═════════ */}
        <section className="mb-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${stepBadge}`}
              >
                2
              </span>
              <h2 className="text-sm font-semibold">{t.step2}</h2>
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
              href={`/order/${branchId}`}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 ${
                isDark
                  ? "border-[#332C3E] text-[#E0B93A] hover:border-[#C9A227]/50"
                  : "border-[#E4DFD4] text-[#8A6E1A] hover:border-[#A9821E]/50"
              }`}
            >
              <Plus size={11} />
              {t.addMore}
            </Link>
          </div>

          <div
            className={`overflow-hidden rounded-2xl border shadow-lg ${panel} ${
              isDark ? "shadow-black/20" : "shadow-[#8A6E1A]/5"
            }`}
          >
            <ul>
              {cartLines.map((l, idx) => (
                <li
                  key={l.id}
                  className={`flex items-center gap-3 px-3.5 py-3 ${
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
                    <p className={`mt-0.5 text-[11px] tabular-nums ${muted}`}>
                      {l.item.price.toFixed(2)} {currency}
                    </p>
                  </div>

                  <div
                    className={`flex shrink-0 items-center gap-0.5 rounded-full border p-0.5 ${
                      isDark
                        ? "border-[#C9A227]/40 bg-[#C9A227]/10"
                        : "border-[#A9821E]/40 bg-[#C9A227]/10"
                    }`}
                  >
                    <button
                      onClick={() => decOne(l.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90 ${
                        isDark
                          ? "text-[#E0B93A] hover:bg-[#C9A227]/20"
                          : "text-[#8A6E1A] hover:bg-[#C9A227]/20"
                      }`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-bold tabular-nums">
                      {l.qty}
                    </span>
                    <button
                      onClick={() => addOne(l.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90 ${
                        isDark
                          ? "text-[#E0B93A] hover:bg-[#C9A227]/20"
                          : "text-[#8A6E1A] hover:bg-[#C9A227]/20"
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeLine(l.id)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${
                      isDark
                        ? "text-red-400 hover:bg-red-500/10"
                        : "text-red-500 hover:bg-red-50"
                    }`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div
              className={`border-t ${
                isDark
                  ? "border-[#2E2938] bg-[#161320]"
                  : "border-[#E4DFD4] bg-[#FAF8F4]"
              }`}
            >
              {/* Subtotal + delivery breakdown */}
              <div className="space-y-1 px-3.5 pt-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={muted}>{t.subtotal}</span>
                  <span className="tabular-nums">
                    {cartTotal.toFixed(2)} {currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={muted}>{t.delivery}</span>
                  <span
                    className={`tabular-nums ${
                      isFreeDelivery
                        ? isDark
                          ? "text-emerald-400"
                          : "text-emerald-700"
                        : ""
                    }`}
                  >
                    {isFreeDelivery
                      ? t.deliveryFree
                      : `${deliveryFee.toFixed(2)} ${currency}`}
                  </span>
                </div>
              </div>

              {/* Grand total */}
              <div className="flex items-center justify-between px-3.5 py-3">
                <span className={`text-xs ${muted}`}>{t.total}</span>
                <span
                  className={`text-2xl font-semibold tabular-nums ${gold}`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {grandTotal.toFixed(2)}{" "}
                  <span className={`text-sm font-medium ${muted}`}>
                    {currency}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════ STEP 3 — DELIVERY ═════════ */}
        <section className="mb-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${stepBadge}`}
            >
              3
            </span>
            <h2 className="text-sm font-semibold">{t.step3}</h2>
          </div>

          <div
            className={`overflow-hidden rounded-2xl border shadow-lg ${panel} ${
              isDark ? "shadow-black/20" : "shadow-[#8A6E1A]/5"
            }`}
          >
            <div className="space-y-2 p-3.5">
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
                  className={`w-full resize-none rounded-xl border py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#C9A227]/30 ${inputCls} ${
                    isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
                  }`}
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
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin
                      size={13}
                      className={
                        deliveryLat != null && deliveryLng != null
                          ? isDark
                            ? "shrink-0 text-sky-400"
                            : "shrink-0 text-sky-600"
                          : isDark
                            ? "shrink-0 text-[#6E687A]"
                            : "shrink-0 text-[#A39D8F]"
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
                          className={`mt-0.5 text-[10px] tabular-nums ${muted}`}
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
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition active:scale-95 disabled:opacity-60 ${
                      isDark
                        ? "bg-[#C9A227]/20 text-[#E0B93A] hover:bg-[#C9A227]/30"
                        : "bg-[#C9A227]/15 text-[#8A6E1A] hover:bg-[#C9A227]/25"
                    }`}
                  >
                    {locating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Navigation className="h-3.5 w-3.5" />
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
                  className={`pointer-events-none absolute top-3.5 ${
                    isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                  } ${isRTL ? "right-3" : "left-3"}`}
                />
                <input
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder={t.deliveryNotes}
                  className={`w-full rounded-xl border py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#C9A227]/30 ${inputCls} ${
                    isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
                  }`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Order note (optional) */}
        <div className="mb-2">
          <textarea
            placeholder={t.notePlaceholder}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={`w-full rounded-2xl border px-3.5 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#C9A227]/30 ${inputCls}`}
          />
        </div>

        {error && (
          <p className="mb-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
      </div>

      {/* Sticky submit pill */}
      {mounted &&
        createPortal(
          <div
            dir={t.dir}
            className={`${displayFont.variable} pointer-events-none fixed inset-x-0 bottom-0 z-[9999] flex justify-center px-4`}
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 14px)" }}
          >
            <div className="pointer-events-auto w-full max-w-md space-y-2">
              {buyer && hasContact && !hasAddress && (
                <p
                  className={`rounded-2xl border px-3 py-2 text-center text-sm font-bold leading-snug shadow-lg backdrop-blur-md ${
                    isDark
                      ? "border-[#E0873A]/50 bg-[#1E1B26]/95 text-[#F0EAE2] shadow-black/40"
                      : "border-[#E0873A]/50 bg-white/95 text-[#1D1A22] shadow-[#8A6E1A]/20"
                  }`}
                >
                  {t.requiredHint}
                </p>
              )}

              <div
                className={`flex items-center gap-3 rounded-full border py-1.5 ps-4 pe-1.5 shadow-lg backdrop-blur-md ${
                  isDark
                    ? "border-[#C9A227]/40 bg-[#1E1B26]/95 shadow-black/40"
                    : "border-[#A9821E]/30 bg-white/95 shadow-[#8A6E1A]/20"
                }`}
              >
                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#C9A227]/15">
                    <ShoppingBag className={`h-4 w-4 ${gold}`} />
                    <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1D1707] px-1 text-[10px] font-bold text-[#E0B93A]">
                      {cartCount}
                    </span>
                  </span>
                  <p
                    className={`text-base font-bold tabular-nums ${gold}`}
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {grandTotal.toFixed(2)}{" "}
                    <span className={`text-[10px] font-medium ${muted}`}>
                      {currency}
                    </span>
                  </p>
                </div>

                <button
                  onClick={submit}
                  disabled={submitDisabled}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 text-sm font-bold text-[#1D1707] transition hover:shadow-md hover:shadow-[#C9A227]/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none disabled:active:scale-100"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {saving ? t.placing : !buyer ? t.signIn : t.placeOrder}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
