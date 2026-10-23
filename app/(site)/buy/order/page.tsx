// app/buy/order/page.tsx
"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { fraunces as displayFont } from "@/app/fonts/fraunces";
import {
  Search,
  Loader2,
  Navigation,
  X,
  Star,
  ShoppingBag,
  MapPin,
  Flame,
  ShieldCheck,
  ChevronDown,
  Check,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";



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

type Province = { id: string; name: string };

const SORT_KEYS = [
  "recommended",
  "near",
  "reviews",
  "orders",
  "price_asc",
  "price_desc",
] as const;

const CARD_BASE =
  "wallet-card-body relative h-[42px] w-[66px] shrink-0 overflow-hidden rounded-[7px] ring-1 select-none";

function Chip({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`absolute ${className}`}
      width="12"
      height="9"
      viewBox="0 0 12 9"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="chipGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F9E7A0" />
          <stop offset="0.5" stopColor="#D4A93A" />
          <stop offset="1" stopColor="#9A7416" />
        </linearGradient>
      </defs>
      <rect
        x="0.4"
        y="0.4"
        width="11.2"
        height="8.2"
        rx="1.6"
        fill="url(#chipGold)"
        stroke="#7A5A10"
        strokeWidth="0.4"
      />
      <path
        d="M0.4 3h3.6v3H0.4M8 3h3.6v3H8M4 0.4v8.2M8 0.4v8.2M4 3h4M4 6h4"
        fill="none"
        stroke="#7A5A10"
        strokeWidth="0.35"
      />
    </svg>
  );
}

function Contactless({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`absolute ${className}`}
      width="8"
      height="9"
      viewBox="0 0 8 9"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M1.2 2.2c1.6 1.4 1.6 3.2 0 4.6" />
      <path d="M3.4 1.2c2.4 2 2.4 4.6 0 6.6" />
      <path d="M5.6 0.4c3 2.6 3 5.6 0 8.2" />
    </svg>
  );
}

function CardFinish() {
  return (
    <>
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/25" />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
      <span className="card-sheen pointer-events-none absolute inset-0" />
    </>
  );
}

const EMBOSS = {
  textShadow: "0 0.5px 0 rgba(0,0,0,0.55), 0 -0.3px 0 rgba(255,255,255,0.25)",
};

function MiniVisa() {
  return (
    <div
      className={`${CARD_BASE} bg-gradient-to-br from-[#2F3BB8] via-[#1A1F71] to-[#0B0E40] text-white/90 ring-white/20`}
    >
      <span className="absolute -right-6 -top-8 h-20 w-20 rounded-full bg-white/10" />
      <span className="absolute -bottom-10 -left-6 h-20 w-24 rounded-full bg-[#4C5BFF]/20" />
      <span className="absolute right-[6px] top-[4px] text-[11px] font-black italic leading-none tracking-tight text-white">
        VISA
      </span>
      <Chip className="left-[7px] top-[14px]" />
      <Contactless className="left-[22px] top-[14px] opacity-80" />
      <span
        className="absolute bottom-[10px] left-[7px] font-mono text-[4.6px] leading-none tracking-[0.14em]"
        style={EMBOSS}
      >
        4242 •••• •••• 1881
      </span>
      <span
        className="absolute bottom-[4px] left-[7px] text-[3.6px] font-medium uppercase leading-none tracking-wider text-white/75"
        style={EMBOSS}
      >
        A. Ahmadi
      </span>
      <span
        className="absolute bottom-[4px] right-[7px] font-mono text-[3.6px] leading-none text-white/75"
        style={EMBOSS}
      >
        12/28
      </span>
      <CardFinish />
    </div>
  );
}

function MiniMastercard() {
  return (
    <div
      className={`${CARD_BASE} bg-gradient-to-br from-[#3B3B40] via-[#1B1B1F] to-[#0A0A0C] text-white/90 ring-white/15`}
    >
      <span className="absolute -left-8 -top-10 h-24 w-24 rounded-full bg-white/[0.06]" />
      <span className="absolute -bottom-12 right-0 h-24 w-24 rounded-full bg-[#EB001B]/10" />
      <Chip className="left-[7px] top-[7px]" />
      <Contactless className="left-[22px] top-[7px] opacity-80" />
      <span
        className="absolute left-[7px] top-[21px] font-mono text-[4.6px] leading-none tracking-[0.14em]"
        style={EMBOSS}
      >
        5412 •••• •••• 7730
      </span>
      <span
        className="absolute bottom-[4px] left-[7px] text-[3.6px] font-medium uppercase leading-none tracking-wider text-white/75"
        style={EMBOSS}
      >
        A. Ahmadi
      </span>
      <span
        className="absolute bottom-[4px] left-[34px] font-mono text-[3.6px] leading-none text-white/75"
        style={EMBOSS}
      >
        09/29
      </span>
      <span className="absolute bottom-[3px] right-[6px] flex items-center">
        <span className="h-[12px] w-[12px] rounded-full bg-[#EB001B]" />
        <span className="-ml-[5px] h-[12px] w-[12px] rounded-full bg-[#F79E1B]/90 mix-blend-screen" />
      </span>
      <CardFinish />
    </div>
  );
}

function MiniAfPay() {
  return (
    <div className={`${CARD_BASE} bg-white ring-black/15`}>
      <img
        src="/afpay.png"
        alt="AfPay"
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <CardFinish />
    </div>
  );
}

function MiniHesabPay() {
  return (
    <div
      className={`${CARD_BASE} bg-gradient-to-br from-[#F0CB55] via-[#C9A227] to-[#7A5C12] text-[#2A1F00] ring-white/30`}
    >
      <img
        src="/hesab.jpg"
        alt="HesabPay"
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <CardFinish />
    </div>
  );
}

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
    payWith: "Pay with",
    secure: "Secure",
    payHook: "Choose how you pay",
    orderIn: "Order in",
    loadingProvinces: "Loading provinces…",
    noProvinces: "No provinces available",
    noProvinceHint:
      "Provinces haven't been set up yet. Ask the platform admin to add them.",
    searchProvince: "Search province…",
    noProvinceResults: "No province matches",
    payMsg: {
      visa: {
        title: "Visa, tap and order",
        sub: "Pay with your card in seconds",
      },
      mc: { title: "Mastercard welcome", sub: "Use any card, zero hassle" },
      afpay: {
        title: "AfPay, pay from your phone",
        sub: "Your wallet, your dinner, done",
      },
      hesab: {
        title: "HesabPay, local speed",
        sub: "Fast, simple, made for you",
      },
    },
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
    payWith: "تادیه د",
    secure: "خوندي",
    payHook: "خپل تادیه غوره کړئ",
    orderIn: "فرمایش په",
    loadingProvinces: "ولایتونه بارول…",
    noProvinces: "هیڅ ولایت نشته",
    noProvinceHint: "ولایتونه لا نه دي جوړ شوي. له اډمین څخه وغواړئ.",
    searchProvince: "ولایت ولټوئ…",
    noProvinceResults: "هیڅ ولایت ونه موندل شو",
    payMsg: {
      visa: {
        title: "ویزا، ټک کړئ او فرمایش ورکړئ",
        sub: "په څو ثانیو کې د کارت تادیه",
      },
      mc: { title: "ماسټرکارډ ښه راغلاست", sub: "هر کارت وکاروئ، بې ستونزې" },
      afpay: {
        title: "AfPay، له موبایل څخه تادیه",
        sub: "ستاسو والټ، ستاسو خواړه",
      },
      hesab: { title: "حسابپی، ګړندی او ساده", sub: "ستاسو لپاره جوړ شوی" },
    },
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
    payWith: "پرداخت با",
    secure: "امن",
    payHook: "روش پرداخت خود را انتخاب کنید",
    orderIn: "سفارش در",
    loadingProvinces: "در حال بارگذاری ولایت‌ها…",
    noProvinces: "ولایتی موجود نیست",
    noProvinceHint: "ولایت‌ها هنوز تنظیم نشده‌اند. از مدیر پلتفرم بخواهید.",
    searchProvince: "جستجوی ولایت…",
    noProvinceResults: "ولایتی مطابقت ندارد",
    payMsg: {
      visa: {
        title: "ویزا، لمس کنید و سفارش دهید",
        sub: "پرداخت با کارت در چند ثانیه",
      },
      mc: { title: "مستر کارت خوش آمدید", sub: "هر کارتی، بدون دردسر" },
      afpay: { title: "AfPay، پرداخت از موبایل", sub: "کیف پول شما، غذای شما" },
      hesab: { title: "حساب‌پی، سریع و ساده", sub: "ساخته شده برای شما" },
    },
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
const PROVINCE_STORAGE_KEY = "buyer_province_id";

/* ---------------- Province combobox (portal, always on top) ---------------- */
function ProvinceCombobox({
  provinces,
  value,
  onChange,
  t,
  isDark,
  isRTL,
  isReady,
}: {
  provinces: Province[];
  value: string;
  onChange: (id: string) => void;
  t: any;
  isDark: boolean;
  isRTL: boolean;
  isReady: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const selected = provinces.find((p) => p.id === value) || null;

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return provinces;
    return provinces.filter((p) => p.name.toLowerCase().includes(s));
  }, [provinces, search]);

  // Measure + follow the button on scroll / resize
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      setRect({
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        width: r.width,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // Close on outside click (button or portal)
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
      setSearch("");
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) setHighlight(0);
  }, [open, search]);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLButtonElement>(
      `[data-idx="${highlight}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setSearch("");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = filtered[highlight];
      if (pick) {
        onChange(pick.id);
        setOpen(false);
        setSearch("");
      }
    }
  }

  const btnText = !isReady
    ? t.loadingProvinces
    : selected?.name || (provinces.length ? t.orderIn : t.noProvinces);

  // Compute clamped position
  const dropdownWidth = rect ? Math.max(rect.width, 200) : 220;
  const viewportW =
    typeof window !== "undefined" ? window.innerWidth : dropdownWidth + 32;
  const left = rect
    ? Math.min(Math.max(8, rect.left), viewportW - dropdownWidth - 8)
    : 8;
  const top = rect ? rect.bottom + 6 : 0;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={!isReady || provinces.length === 0}
        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-sm font-medium outline-none transition focus:ring-4 focus:ring-[#C9A227]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-xs ${
          isDark
            ? "border-[#332C3E] bg-[#161320] text-[#F0EAE2] hover:border-[#C9A227]/60 focus:border-[#C9A227]"
            : "border-[#E4DFD4] bg-[#FAF8F4] text-[#1D1A22] hover:border-[#A9821E]/60 focus:border-[#A9821E]"
        }`}
      >
        <MapPin
          size={14}
          className={`shrink-0 ${isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"}`}
        />
        <span className="min-w-0 flex-1 truncate">
          {!isReady && (
            <Loader2 size={12} className="mr-1 inline animate-spin" />
          )}
          {btnText}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          } ${isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"}`}
        />
      </button>

      {open &&
        mounted &&
        rect &&
        createPortal(
          <div
            ref={dropdownRef}
            dir={t.dir}
            style={{
              position: "fixed",
              top,
              left,
              width: dropdownWidth,
              zIndex: 9999,
            }}
            className={`overflow-hidden rounded-xl border shadow-2xl ${
              isDark
                ? "border-[#332C3E] bg-[#1E1B26] shadow-black/60"
                : "border-[#E4DFD4] bg-white shadow-[#00000030]"
            }`}
          >
            {/* search */}
            <div
              className={`relative border-b p-2 ${
                isDark ? "border-[#2E2938]" : "border-[#EFEAE0]"
              }`}
            >
              <Search
                size={14}
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${
                  isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                } ${isRTL ? "right-4" : "left-4"}`}
              />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t.searchProvince}
                dir={t.dir}
                className={`w-full rounded-lg border py-1.5 text-xs outline-none ${
                  isRTL ? "pr-8 pl-2" : "pl-8 pr-2"
                } ${
                  isDark
                    ? "border-[#332C3E] bg-[#161320] text-[#F0EAE2] placeholder:text-[#5E5670] focus:border-[#C9A227]"
                    : "border-[#E4DFD4] bg-[#FAF8F4] text-[#1D1A22] placeholder:text-[#A39D8F] focus:border-[#A9821E]"
                }`}
              />
            </div>

            {/* list */}
            <div ref={listRef} className="max-h-72 overflow-y-auto p-1">
              {filtered.length === 0 && (
                <div
                  className={`px-3 py-4 text-center text-xs ${
                    isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                  }`}
                >
                  {t.noProvinceResults}
                </div>
              )}
              {filtered.map((p, i) => {
                const active = p.id === value;
                const highlighted = i === highlight;
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-idx={i}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => {
                      onChange(p.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-start text-xs font-medium transition ${
                      highlighted
                        ? isDark
                          ? "bg-[#C9A227]/20 text-[#E0B93A]"
                          : "bg-[#C9A227]/15 text-[#8A6E1A]"
                        : isDark
                          ? "text-[#CFCADB] hover:bg-white/5"
                          : "text-[#1D1A22] hover:bg-[#FAF8F4]"
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {active && (
                      <Check
                        size={12}
                        className={`shrink-0 ${
                          isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/* ---------------- Payment wallet ---------------- */
function PaymentWallet({
  isDark,
  t,
  isRTL,
}: {
  isDark: boolean;
  t: any;
  isRTL: boolean;
}) {
  const methods = [
    { id: "visa", label: "Visa", node: <MiniVisa /> },
    { id: "mc", label: "Mastercard", node: <MiniMastercard /> },
    { id: "afpay", label: "AfPay", node: <MiniAfPay /> },
    { id: "hesab", label: "HesabPay", node: <MiniHesabPay /> },
  ];
  const n = methods.length;
  const INTERVAL = 3200;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % n), INTERVAL);
    return () => clearInterval(id);
  }, [paused, reduced, n]);

  const msg = t.payMsg?.[methods[index].id];

  const dir = isRTL ? -1 : 1;
  const ANGLES = [0, 9, 18, 27].map((a) => a * dir);
  const frontLeft = isRTL ? "calc(100% - 50px)" : "50px";

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`mb-3 overflow-hidden rounded-2xl border transition-colors ${
        isDark
          ? "border-[#2E2938] bg-[#1E1B26]/90"
          : "border-[#E4DFD4] bg-white/90"
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div
          dir="ltr"
          className="pw-stage relative h-[80px] w-[142px] shrink-0"
          style={{ ["--pw-dir" as any]: dir }}
        >
          <span className="pw-glow" aria-hidden="true" />
          {methods.map((m, i) => {
            const offset = (i - index + n) % n;
            const leaving = offset === n - 1;
            return (
              <div
                key={m.id}
                className="pw-arm"
                style={{
                  left: frontLeft,
                  transform: `rotate(${ANGLES[offset]}deg)`,
                  zIndex: n - offset,
                  opacity: offset === 0 ? 1 : 0.9 - offset * 0.18,
                }}
              >
                <div
                  className={`pw-card ${offset === 0 ? "pw-front" : ""} ${
                    leaving ? "pw-leaving" : ""
                  }`}
                  style={{
                    transform: `scale(${
                      offset === 0 ? 1.12 : 0.97 - offset * 0.05
                    })`,
                    filter:
                      offset === 0
                        ? "none"
                        : `brightness(${1 - offset * 0.14})`,
                  }}
                >
                  {m.node}
                </div>
              </div>
            );
          })}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-start text-[9.5px] font-semibold uppercase ${
              isRTL ? "tracking-normal" : "tracking-[0.18em]"
            } ${isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"}`}
          >
            {t.payHook}
          </p>

          <div key={`msg-${index}`} className="pw-msg mt-1 text-start">
            <p
              className={`truncate text-[13px] font-semibold leading-tight ${
                isDark ? "text-[#F0EAE2]" : "text-[#1D1A22]"
              }`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {msg?.title ?? methods[index].label}
            </p>
            <p
              className={`mt-0.5 truncate text-[11px] leading-tight ${
                isDark ? "text-[#9691A6]" : "text-[#8A8496]"
              }`}
            >
              {msg?.sub}
            </p>
          </div>
        </div>

        <div
          className={`hidden shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9.5px] font-semibold leading-none sm:flex ${
            isDark
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          <ShieldCheck className="h-3 w-3" />
          {t.secure}
        </div>
      </div>

      <style jsx global>{`
        .pw-arm {
          position: absolute;
          top: 10px;
          width: 66px;
          height: 42px;
          margin-left: -33px;
          transform-origin: 50% 141px;
          transition:
            transform 0.95s cubic-bezier(0.34, 1.35, 0.5, 1),
            opacity 0.6s ease;
          will-change: transform;
        }
        .pw-card {
          width: 100%;
          height: 100%;
          transform-origin: 50% 50%;
          transition:
            transform 0.95s cubic-bezier(0.34, 1.35, 0.5, 1),
            filter 0.6s ease;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.25) inset,
            0 8px 14px -6px rgba(0, 0, 0, 0.6);
          border-radius: 7px;
          perspective: 320px;
        }
        .pw-front > .wallet-card-body {
          animation: pw-tilt 3.8s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        @keyframes pw-tilt {
          0%,
          100% {
            transform: rotateY(-12deg) rotateX(5deg);
          }
          50% {
            transform: rotateY(12deg) rotateX(-4deg);
          }
        }
        .pw-front {
          animation: pw-float 2.6s ease-in-out 0.9s infinite;
          box-shadow:
            0 10px 18px -8px rgba(0, 0, 0, 0.6),
            0 0 18px -4px rgba(201, 162, 39, 0.55);
        }
        @keyframes pw-float {
          0%,
          100% {
            translate: 0 0;
            rotate: -1.5deg;
          }
          50% {
            translate: 0 -3px;
            rotate: 1.5deg;
          }
        }
        .pw-leaving {
          animation: pw-leave 0.95s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes pw-leave {
          0% {
            translate: 0 0;
          }
          35% {
            translate: 0 -14px;
            rotate: calc(10deg * var(--pw-dir, 1));
          }
          100% {
            translate: 0 0;
            rotate: 0deg;
          }
        }
        .pw-glow {
          position: absolute;
          left: 50%;
          bottom: -2px;
          width: 120px;
          height: 16px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: radial-gradient(
            ellipse at center,
            rgba(201, 162, 39, 0.55),
            transparent 72%
          );
          filter: blur(5px);
          animation: pw-glow 3.2s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes pw-glow {
          0%,
          100% {
            opacity: 0.35;
            transform: translateX(-50%) scaleX(0.8);
          }
          50% {
            opacity: 0.9;
            transform: translateX(-50%) scaleX(1.1);
          }
        }
        .pw-msg {
          animation: pw-msg-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: 0.12s;
        }
        @keyframes pw-msg-in {
          0% {
            opacity: 0;
            transform: translateY(8px);
            filter: blur(3px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        .card-sheen {
          background: linear-gradient(
            115deg,
            transparent 30%,
            rgba(255, 255, 255, 0.65) 48%,
            transparent 66%
          );
          transform: translateX(-140%);
          animation: sheen-run 4.5s ease-in-out infinite;
        }
        @keyframes sheen-run {
          0%,
          55% {
            transform: translateX(-140%);
          }
          78%,
          100% {
            transform: translateX(140%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .pw-arm,
          .pw-card,
          .pw-front,
          .pw-leaving,
          .pw-front > .wallet-card-body,
          .pw-glow,
          .pw-msg,
          .card-sheen {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------- Dish card (memoized so typing doesn't re-render the grid) ---------------- */
const DishCard = memo(function DishCard({
  it,
  idx,
  isDark,
  t,
  onOpen,
  onPrefetch,
}: {
  it: Item;
  idx: number;
  isDark: boolean;
  t: any;
  onOpen: (item: Item) => void;
  onPrefetch: (item: Item) => void;
}) {
  return (
    <div
      className="dish-slot"
      style={{ animationDelay: `${Math.min(idx, 11) * 45}ms` }}
    >
      <button
        onClick={() => onOpen(it)}
        onMouseEnter={() => onPrefetch(it)}
        onFocus={() => onPrefetch(it)}
        className={`dish-card group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border text-start backdrop-blur-sm ${
          isDark
            ? "border-[#2E2938] bg-[#1E1B26]/90 hover:border-[#C9A227]/60"
            : "border-[#E4DFD4] bg-white hover:border-[#A9821E]/50"
        }`}
      >
        <span className="dish-sheen pointer-events-none absolute inset-0 z-20" />

        <div
          className={`relative aspect-[4/3] overflow-hidden ${
            isDark ? "bg-[#161320]" : "bg-[#EDE8DE]"
          }`}
        >
          {it.image_url ? (
            <img
              src={it.image_url}
              alt={it.name}
              width={400}
              height={300}
              loading={idx < 4 ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
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

          <span
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t to-transparent ${
              isDark ? "from-[#1E1B26]" : "from-white"
            }`}
          />

          {it.distance_km !== null && (
            <span
              className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
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
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-2 py-0.5 text-[10px] font-semibold text-[#1D1707] shadow-sm">
              <Flame size={10} />
              {t.popular}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3.5">
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
            className={`mt-2 flex items-center gap-2 text-[11px] ${
              isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
            }`}
          >
            {it.review_count > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star size={12} className="fill-[#C9A227] text-[#C9A227]" />
                <span
                  className={`font-semibold ${
                    isDark ? "text-[#F0EAE2]" : "text-[#1D1A22]"
                  }`}
                >
                  {it.avg_rating.toFixed(1)}
                </span>
                <span className={isDark ? "text-[#6E687A]" : "text-[#A39D8F]"}>
                  ({it.review_count})
                </span>
              </span>
            ) : (
              <span className={isDark ? "text-[#6E687A]" : "text-[#A39D8F]"}>
                {t.noReviews}
              </span>
            )}

            {it.order_count > 0 && (
              <>
                <span className={isDark ? "text-[#332C3E]" : "text-[#D4CFC4]"}>
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

          <div
            className={`mt-auto flex items-center justify-between border-t pt-3 ${
              isDark ? "border-[#2E2938]" : "border-[#EFEAE0]"
            }`}
          >
            <span
              className={`text-base font-semibold ${
                isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
              }`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {Number(it.price).toFixed(2)}{" "}
              <span
                className={`text-xs font-medium ${
                  isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                }`}
              >
                {it.currency}
              </span>
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-[#E0B93A] group-hover:to-[#A9821E] group-hover:text-[#1D1707] group-hover:shadow-md group-hover:shadow-[#C9A227]/30 ${
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
    </div>
  );
});

/* ---------------- Main page ---------------- */
export default function BuyerMenuDiscoveryPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lang = (orderText as any)[language]
    ? (language as keyof typeof orderText)
    : "en";
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

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provinceId, setProvinceId] = useState<string>("");
  const [provinceReady, setProvinceReady] = useState(false);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  // ---- Load provinces + AUTO-SELECT first (or saved) ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/public/provinces");
        const data = await res.json();
        if (cancelled) return;

        const list: Province[] = data.provinces || [];
        setProvinces(list);

        let saved: string | null = null;
        try {
          saved = window.localStorage.getItem(PROVINCE_STORAGE_KEY);
        } catch {
          /* ignore */
        }

        if (saved && list.some((p) => p.id === saved)) {
          setProvinceId(saved);
        } else if (list.length > 0) {
          setProvinceId(list[0].id);
        } else {
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      } finally {
        if (!cancelled) setProvinceReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!provinceReady) return;
    try {
      if (provinceId) {
        window.localStorage.setItem(PROVINCE_STORAGE_KEY, provinceId);
      } else {
        window.localStorage.removeItem(PROVINCE_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [provinceId, provinceReady]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  const fetchItems = useCallback(
    async (targetPage: number, append = false) => {
      if (!provinceId) return;

      // cancel any request still in flight so old results never overwrite new ones
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      busyRef.current = true;
      setLoadingMore(append);
      setLoading(!append);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: String(PAGE_SIZE),
          sort,
          province_id: provinceId,
        });
        if (debouncedQ) params.set("q", debouncedQ);
        if (coords && sort === "near") {
          params.set("lat", String(coords.lat));
          params.set("lng", String(coords.lng));
          params.set("radius", "25");
        }

        const res = await fetch(`/api/public/menu-items?${params.toString()}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("Failed to load dishes");
        const data = await res.json();

        const incoming: Item[] = data.items || [];
        setItems((prev) => {
          if (!append) return incoming;
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...incoming.filter((i) => !seen.has(i.id))];
        });
        setPage(data.page || targetPage);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        busyRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      } catch (err: any) {
        if (err?.name === "AbortError") return; // a newer request took over
        setError(err?.message || "Something went wrong");
        busyRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedQ, coords, sort, provinceId],
  );

  useEffect(() => {
    setItems([]);
    setPage(1);
    if (!provinceReady) return;
    if (!provinceId) {
      abortRef.current?.abort();
      busyRef.current = false;
      setLoading(false);
      setLoadingMore(false);
      setTotal(0);
      setTotalPages(1);
      return;
    }
    fetchItems(1, false);
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, sort, coords, provinceId, provinceReady]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !busyRef.current &&
          page < totalPages &&
          provinceId
        ) {
          fetchItems(page + 1, true);
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, page, totalPages, fetchItems, provinceId]);

  function requestLocation() {
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
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  function handleSortClick(key: string) {
    if (key === "near" && !coords) {
      requestLocation();
      return;
    }
    setSort(key);
  }

  const openItem = useCallback(
    (item: Item) => {
      router.push(`/buy/order/item/${item.id}?province_id=${provinceId}`);
    },
    [router, provinceId],
  );

  const prefetchItem = useCallback(
    (item: Item) => {
      router.prefetch(`/buy/order/item/${item.id}?province_id=${provinceId}`);
    },
    [router, provinceId],
  );

  const showingLabel = useMemo(() => {
    if (total === 0) return "";
    return interpolate(t.showingCount, {
      shown: items.length,
      total,
    });
  }, [items.length, total, t]);

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
      }`}
      dir={t.dir}
    >
      {/* decorative layers — clipped in their own wrapper so the page
          itself does not clip the province dropdown */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
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
          className={`blob-a absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl transition-colors ${
            isDark ? "bg-[#C9A227]/10" : "bg-[#C9A227]/15"
          }`}
          aria-hidden="true"
        />
        <div
          className={`blob-b absolute top-40 -right-32 h-96 w-96 rounded-full blur-3xl transition-colors ${
            isDark ? "bg-[#C9A227]/8" : "bg-[#C9A227]/12"
          }`}
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <PaymentWallet isDark={isDark} t={t} isRTL={isRTL} />

        <div className="rounded-2xl bg-gradient-to-br from-[#C9A227]/45 via-[#C9A227]/10 to-[#C9A227]/25 p-px shadow-sm">
          <div
            className={`rounded-[15px] p-3.5 backdrop-blur-md transition-colors sm:p-5 ${
              isDark ? "bg-[#1E1B26]/95" : "bg-white/95"
            }`}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <ProvinceCombobox
                provinces={provinces}
                value={provinceId}
                onChange={setProvinceId}
                t={t}
                isDark={isDark}
                isRTL={isRTL}
                isReady={provinceReady}
              />

              <div className="relative flex-1">
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
                  disabled={!provinceId}
                  className={`w-full rounded-xl border py-2.5 text-sm outline-none transition-all duration-300 focus:ring-4 focus:ring-[#C9A227]/20 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDark
                      ? "border-[#332C3E] bg-[#161320] text-[#F0EAE2] placeholder:text-[#5E5670] focus:border-[#C9A227] focus:shadow-[0_0_0_1px_rgba(201,162,39,0.4)]"
                      : "border-[#E4DFD4] bg-[#FAF8F4] text-[#1D1A22] placeholder:text-[#A39D8F] focus:border-[#A9821E] focus:shadow-[0_0_0_1px_rgba(169,130,30,0.35)]"
                  } ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                />
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {coords && (
                <button
                  onClick={() => {
                    setCoords(null);
                    if (sort === "near") setSort("recommended");
                  }}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                    isDark
                      ? "border-[#C9A227] bg-[#C9A227]/15 text-[#E0B93A] hover:bg-[#C9A227]/25"
                      : "border-[#A9821E] bg-[#C9A227]/15 text-[#8A6E1A] hover:bg-[#C9A227]/25"
                  }`}
                >
                  <X size={11} />
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
                    disabled={!provinceId || (loading && active)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
                      active
                        ? "bg-gradient-to-r from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-md shadow-[#C9A227]/25"
                        : isDark
                          ? "border border-[#332C3E] bg-[#161320] text-[#B7B2C4] hover:-translate-y-0.5 hover:border-[#C9A227]/60 hover:text-[#E0B93A]"
                          : "border border-[#E4DFD4] bg-white text-[#6E687A] hover:-translate-y-0.5 hover:border-[#A9821E]/60 hover:text-[#8A6E1A]"
                    }`}
                  >
                    {isNear &&
                      (locating ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Navigation size={11} />
                      ))}
                    {t.sort[key as keyof typeof t.sort]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5">
          {error && (
            <div
              className={`mb-4 rounded-xl border px-3.5 py-2 text-sm ${
                isDark
                  ? "border-[#E5484D]/40 bg-[#E5484D]/10 text-[#FF9B9E]"
                  : "border-red-300 bg-red-50 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          {provinceReady && provinces.length === 0 && (
            <div
              className={`rounded-2xl border border-dashed px-6 py-14 text-center ${
                isDark ? "border-[#332C3E]" : "border-[#E4DFD4]"
              }`}
            >
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border ${
                  isDark
                    ? "border-[#C9A227]/30 bg-[#C9A227]/10"
                    : "border-[#A9821E]/30 bg-[#C9A227]/10"
                }`}
              >
                <MapPin
                  size={20}
                  className={isDark ? "text-[#C9A227]" : "text-[#A9821E]"}
                />
              </div>
              <p
                className="text-base font-medium"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t.noProvinces}
              </p>
              <p
                className={`mt-1.5 text-sm ${
                  isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
                }`}
              >
                {t.noProvinceHint}
              </p>
            </div>
          )}

          {loading && items.length === 0 && provinceId && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-64 animate-pulse rounded-2xl border ${
                    isDark
                      ? "border-[#2E2938] bg-[#1E1B26]/60"
                      : "border-[#E4DFD4] bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}

          {!loading && !error && provinceId && items.length === 0 && (
            <div
              className={`rounded-2xl border border-dashed px-6 py-14 text-center ${
                isDark ? "border-[#332C3E]" : "border-[#E4DFD4]"
              }`}
            >
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border ${
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

          {items.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((it, idx) => (
                <DishCard
                  key={it.id}
                  it={it}
                  idx={idx}
                  isDark={isDark}
                  t={t}
                  onOpen={openItem}
                  onPrefetch={prefetchItem}
                />
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div ref={sentinelRef} className="pt-7 text-center">
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

      {/* global because DishCard is a separate component */}
      <style jsx global>{`
        .dish-slot {
          position: relative;
          animation: card-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes card-in {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .dish-slot::after {
          content: "";
          position: absolute;
          left: 14%;
          right: 14%;
          bottom: -8px;
          height: 16px;
          border-radius: 999px;
          background: radial-gradient(
            ellipse at center,
            rgba(201, 162, 39, 0.45),
            transparent 72%
          );
          opacity: 0;
          transform: scaleX(0.55);
          transition:
            opacity 0.45s ease,
            transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
          z-index: 0;
        }
        .dish-slot:hover::after {
          opacity: 1;
          transform: scaleX(1);
        }
        .dish-card {
          z-index: 1;
          transform-origin: bottom center;
          transition:
            transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.45s ease,
            border-color 0.45s ease;
          will-change: transform;
        }
        .dish-card:hover {
          transform: translateY(-9px) rotate(-0.6deg) scale(1.015);
          box-shadow:
            0 18px 30px -18px rgba(0, 0, 0, 0.45),
            0 10px 22px -14px rgba(201, 162, 39, 0.35);
        }
        .dish-card:active {
          transform: translateY(-4px) scale(0.995);
          transition-duration: 0.15s;
        }
        .dish-card:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 2px rgba(201, 162, 39, 0.65),
            0 18px 30px -18px rgba(0, 0, 0, 0.45);
        }
        .dish-sheen {
          background: linear-gradient(
            115deg,
            transparent 32%,
            rgba(255, 255, 255, 0.5) 48%,
            transparent 64%
          );
          transform: translateX(-130%);
          opacity: 0;
          transition:
            transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.3s ease;
        }
        .dish-card:hover .dish-sheen {
          transform: translateX(130%);
          opacity: 1;
        }
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
          .blob-b,
          .dish-slot {
            animation: none !important;
          }
          .dish-card,
          .dish-sheen,
          .dish-slot::after {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
