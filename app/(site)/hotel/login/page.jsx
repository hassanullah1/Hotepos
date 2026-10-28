// app/login/page.js
"use client";

import { Suspense, useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  LayoutDashboard,
  Users,
  ShieldCheck,
  BedDouble,
  BellRing,
  CalendarDays,
  Settings,
  Wallet,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LoadingScreen from "@/components/LoadingScreen";

/* ------------------------------------------------------------------ */
/* Translations                                                        */
/* ------------------------------------------------------------------ */
const loginText = {
  en: {
    dir: "ltr",
    heading: "Admin access",
    subheading: "Sign in to manage branches, staff and service.",
    emailLabel: "Email",
    emailPlaceholder: "you@yourhotel.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    submit: "Sign in",
    submitting: "Signing in…",
    genericError: "Something went wrong. Please try again.",
    footer: "Authorized personnel only.",
    forgot: "Forgot password?",
    brandName: "Hotel",
    brandSub: "ADMIN",
    loading: "Loading…",
    heroTitle: "Run your hotel from one place",
    heroSubtitle:
      "Rooms, tables, staff and orders across every branch — live and in sync.",
    heroPerk1: "Live room & table status",
    heroPerk2: "Staff & branch control",
    heroPerk3: "Secure admin access",
    heroChip1: "Occupied today",
    heroChip2: "New booking just now",
    popupTitle: "Manage your hotel with Melmah",
  },
  ps: {
    dir: "rtl",
    heading: "د اډمین ننوتل",
    subheading: "د څانګو، کارکوونکو او خدماتو اداره کولو لپاره ننوځئ.",
    emailLabel: "بریښنالیک",
    emailPlaceholder: "you@yourhotel.com",
    passwordLabel: "پټنوم",
    passwordPlaceholder: "••••••••",
    submit: "ننوتل",
    submitting: "ننوتل روان دي…",
    genericError: "یو څه غلط شول. مهرباني وکړئ بیا هڅه وکړئ.",
    footer: "یوازې مجاز کارکوونکي.",
    forgot: "پټنوم هیر شو؟",
    brandName: "هوټل",
    brandSub: "ادمین",
    loading: "بارول…",
    heroTitle: "خپل هوټل له یو ځای څخه اداره کړئ",
    heroSubtitle:
      "خونې، مېزونه، کارکوونکي او فرمایشونه په هره څانګه کې — ژوندي او همغږي.",
    heroPerk1: "د خونو او مېزونو ژوندی حالت",
    heroPerk2: "د کارکوونکو او څانګو کنټرول",
    heroPerk3: "خوندي د اډمین لاسرسی",
    heroChip1: "نن ونیول شوي",
    heroChip2: "همدا اوس نوی بکنګ",
    popupTitle: "د ملمه سره خپل هوټل اداره کړئ",
  },
  prs: {
    dir: "rtl",
    heading: "دسترسی ادمین",
    subheading: "برای مدیریت شعبه‌ها، کارکنان و خدمات وارد شوید.",
    emailLabel: "ایمیل",
    emailPlaceholder: "you@yourhotel.com",
    passwordLabel: "رمز عبور",
    passwordPlaceholder: "••••••••",
    submit: "ورود",
    submitting: "در حال ورود…",
    genericError: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
    footer: "فقط کارمندان مجاز.",
    forgot: "رمز عبور را فراموش کرده‌اید؟",
    brandName: "هتل",
    brandSub: "ادمین",
    loading: "در حال بارگذاری…",
    heroTitle: "هتل خود را از یک جا مدیریت کنید",
    heroSubtitle:
      "اتاق‌ها، میزها، کارکنان و سفارش‌ها در همه شعبه‌ها — زنده و هماهنگ.",
    heroPerk1: "وضعیت زنده اتاق‌ها و میزها",
    heroPerk2: "کنترول کارکنان و شعبه‌ها",
    heroPerk3: "دسترسی امن ادمین",
    heroChip1: "اشغال امروز",
    heroChip2: "رزرو جدید همین حالا",
    popupTitle: "هتل خود را با ملمه مدیریت کنید",
  },
};

const THEME_KEY = "kohistan-admin-theme";

/* ------------------------------------------------------------------ */
/* Laptop: a cursor clicks the Melmah icon, the dashboard opens once   */
/* ------------------------------------------------------------------ */
function AdminArt({ t }) {
  const uid = useId().replace(/:/g, "");
  const u = (n) => `${n}cqw`;

  // Replay the whole story every CYCLE ms (remounting restarts the CSS timeline).
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setCycle((c) => c + 1), 17000);
    return () => clearInterval(id);
  }, []);

  const bars = [45, 62, 38, 75, 58, 88, 70];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const cells = Array.from({ length: 24 }).map((_, i) => i);
  const occupied = new Set([1, 4, 5, 8, 10, 13, 16, 18, 21]);
  const kpis = [
    { Icon: BedDouble, value: "87%", delta: "+4%" },
    { Icon: Users, value: "24", delta: "+2" },
    { Icon: BellRing, value: "3", delta: "" },
    { Icon: Wallet, value: "4.2k", delta: "+9%" },
  ];
  const nav = [LayoutDashboard, BedDouble, CalendarDays, Users, Settings];
  const bookings = [
    { n: "Ahmad Karimi", r: "207", c: "#4ADE80", i: "AK" },
    { n: "Sara Noori", r: "112", c: "#E0B93A", i: "SN" },
    { n: "Omar Wali", r: "305", c: "#60A5FA", i: "OW" },
  ];
  const card = {
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: u(1),
  };
  const winBtn = { width: u(4.2), height: u(3), position: "relative" };

  return (
    <div
      className="relative w-full"
      style={{ containerType: "inline-size" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 560 400"
        className="block h-auto w-full"
        fill="none"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`ad-lid-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#DADDE5" />
            <stop offset="1" stopColor="#A2A6B3" />
          </linearGradient>
          <linearGradient id={`ad-deck-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C4C8D3" />
            <stop offset="1" stopColor="#8C909E" />
          </linearGradient>
          <linearGradient id={`ad-hinge-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7E8291" />
            <stop offset="1" stopColor="#4F5260" />
          </linearGradient>
          <linearGradient id={`ad-front-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9A9EAC" />
            <stop offset="1" stopColor="#6A6E7C" />
          </linearGradient>
          <linearGradient id={`ad-key-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#30333F" />
            <stop offset="1" stopColor="#1A1C25" />
          </linearGradient>
          <linearGradient id={`ad-pad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D2D5DE" />
            <stop offset="1" stopColor="#A8ACB9" />
          </linearGradient>
          <filter
            id={`ad-blur-${uid}`}
            x="-20%"
            y="-50%"
            width="140%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <circle
          className="ad-ring"
          cx="280"
          cy="200"
          r="262"
          stroke="#E0B93A"
          strokeOpacity="0.3"
          strokeWidth="1.4"
          strokeDasharray="3 10"
          strokeLinecap="round"
        />
        <circle
          className="ad-ring ad-ring-rev"
          cx="280"
          cy="200"
          r="282"
          stroke="#E0B93A"
          strokeOpacity="0.2"
          strokeWidth="1"
          strokeDasharray="14 18"
        />

        <ellipse
          cx="280"
          cy="374"
          rx="262"
          ry="14"
          fill="#000"
          opacity="0.45"
          filter={`url(#ad-blur-${uid})`}
        />

        <rect
          x="60"
          y="18"
          width="440"
          height="278"
          rx="16"
          fill={`url(#ad-lid-${uid})`}
        />
        <rect
          x="60.5"
          y="18.5"
          width="439"
          height="277"
          rx="15.5"
          stroke="#fff"
          strokeOpacity="0.55"
        />
        <rect x="68" y="26" width="424" height="262" rx="11" fill="#08070C" />
        <rect x="76" y="36" width="408" height="238" rx="4" fill="#0E1220" />
        <circle cx="280" cy="31" r="2.2" fill="#1C1C28" />
        <circle cx="279.4" cy="30.4" r="0.7" fill="#6D7BA8" />

        <rect
          x="130"
          y="293"
          width="300"
          height="8"
          rx="3"
          fill={`url(#ad-hinge-${uid})`}
        />
        <path d="M58 298H502L532 350H28Z" fill={`url(#ad-deck-${uid})`} />
        <path d="M58 298H502" stroke="#fff" strokeOpacity="0.6" />
        <rect
          x="69.1"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="99.4"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="129.6"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="159.8"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="190.1"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="220.3"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="250.6"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="280.8"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="311.0"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="341.3"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="371.5"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="401.8"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="432.0"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="462.2"
          y="303.0"
          width="28.6"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="66.1"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="96.8"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="127.5"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="158.1"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="188.8"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="219.5"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="250.1"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="280.8"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="311.5"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="342.1"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="372.8"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="403.5"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="434.1"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="464.8"
          y="308.2"
          width="29.1"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="63.1"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="94.2"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="125.3"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="156.4"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="187.5"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="218.6"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="249.7"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="280.8"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="311.9"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="343.0"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="374.1"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="405.2"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="436.3"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="467.4"
          y="313.4"
          width="29.5"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="60.1"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="91.6"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="123.2"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="154.7"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="186.2"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="217.7"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="249.3"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="280.8"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="312.3"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="343.9"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="375.4"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="406.9"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="438.4"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="470.0"
          y="318.6"
          width="29.9"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="57.1"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="89.1"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="121.0"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="153.0"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="184.9"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="216.9"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="248.8"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="280.8"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="312.8"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="344.7"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="376.7"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="408.6"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="440.6"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <rect
          x="472.5"
          y="323.8"
          width="30.4"
          height="4.2"
          rx="1"
          fill={`url(#ad-key-${uid})`}
        />
        <path
          d="M228 330H332L337 346H223Z"
          fill={`url(#ad-pad-${uid})`}
          stroke="#8C909E"
          strokeWidth="0.8"
        />
        <path
          d="M28 350H532Q536 350 536 354V358Q536 364 528 364H32Q24 364 24 358V354Q24 350 28 350Z"
          fill={`url(#ad-front-${uid})`}
        />
        <rect
          x="250"
          y="350"
          width="60"
          height="5"
          rx="2.5"
          fill="#5A5E6C"
          opacity="0.8"
        />
      </svg>

      {/* ---------- screen (HTML, scales with the laptop) ---------- */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: "13.571%",
          top: "9%",
          width: "72.857%",
          height: "59.5%",
          borderRadius: u(0.7),
          background: "#0B0E19",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div key={cycle} className="absolute inset-0">
          {/* wallpaper */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 58"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id={`ad-wp-${uid}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#17203A" />
                <stop offset="1" stopColor="#0A0D18" />
              </linearGradient>
              <radialGradient id={`ad-wpg-${uid}`} cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#F4D77A" stopOpacity="0.9" />
                <stop offset="0.5" stopColor="#E0B93A" stopOpacity="0.45" />
                <stop offset="1" stopColor="#E0B93A" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`ad-wpw-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#4C6FD8" stopOpacity="0.55" />
                <stop offset="1" stopColor="#C9A227" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            <rect width="100" height="58" fill={`url(#ad-wp-${uid})`} />
            <circle cx="70" cy="22" r="26" fill={`url(#ad-wpg-${uid})`} />
            <path
              d="M0 40C18 30 34 46 52 38S86 28 100 36V58H0Z"
              fill={`url(#ad-wpw-${uid})`}
              opacity="0.55"
            />
            <path
              d="M0 46C20 38 38 52 58 44S90 38 100 44V58H0Z"
              fill={`url(#ad-wpw-${uid})`}
              opacity="0.4"
            />
          </svg>

          {/* desktop icons */}
          {[
            {
              top: 2.5,
              label: "Files",
              bg: "linear-gradient(135deg,#5B8DEF,#3556B8)",
            },
            {
              top: 11.5,
              label: "Reports",
              bg: "linear-gradient(135deg,#4ADE80,#1F8F52)",
            },
          ].map((ic) => (
            <div
              key={ic.label}
              className="absolute flex flex-col items-center"
              style={{ left: u(1.6), top: u(ic.top), width: u(8), gap: u(0.5) }}
            >
              <div
                style={{
                  width: u(5.4),
                  height: u(5.4),
                  borderRadius: u(1.2),
                  background: ic.bg,
                  boxShadow: "0 0.4cqw 1cqw rgba(0,0,0,0.4)",
                }}
              />
              <span
                style={{
                  fontSize: u(1.15),
                  color: "#fff",
                  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {ic.label}
              </span>
            </div>
          ))}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: u(1.6), top: u(20.5), width: u(8), gap: u(0.5) }}
          >
            <div
              className="ad-appicon relative flex items-center justify-center"
              style={{
                width: u(5.4),
                height: u(5.4),
                borderRadius: u(1.2),
                background: "linear-gradient(135deg, #F4D77A, #B8891A)",
                color: "#1D1707",
                fontWeight: 800,
                fontSize: u(3),
                boxShadow:
                  "0 0.4cqw 1cqw rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.35)",
              }}
            >
              M
              <span
                className="ad-clickring absolute rounded-full"
                style={{ inset: u(-0.7), border: "2px solid #F4D77A" }}
              />
            </div>
            <span
              style={{
                fontSize: u(1.15),
                color: "#fff",
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              Melmah
            </span>
          </div>

          {/* taskbar (Windows 11 style) */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: u(4),
              background: "rgba(14,17,28,0.82)",
              backdropFilter: "blur(8px)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="absolute grid grid-cols-2"
              style={{
                left: u(27),
                top: u(1),
                width: u(2),
                height: u(2),
                gap: u(0.18),
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  style={{ background: "#5AA2FF", borderRadius: u(0.15) }}
                />
              ))}
            </div>
            <div
              className="absolute flex items-center"
              style={{
                left: u(30.2),
                top: u(0.8),
                width: u(9),
                height: u(2.4),
                borderRadius: "9999px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.08)",
                paddingLeft: u(0.9),
              }}
            >
              <span
                style={{
                  width: u(1),
                  height: u(1),
                  borderRadius: "9999px",
                  border: "1px solid rgba(255,255,255,0.55)",
                }}
              />
            </div>
            <div
              className="ad-tbapp absolute flex items-center justify-center"
              style={{
                left: u(40.2),
                top: u(0.9),
                width: u(2.2),
                height: u(2.2),
                borderRadius: u(0.5),
                background: "linear-gradient(135deg,#F4D77A,#B8891A)",
                color: "#1D1707",
                fontWeight: 800,
                fontSize: u(1.3),
              }}
            >
              M
              <span
                className="absolute"
                style={{
                  bottom: u(-0.4),
                  left: "30%",
                  right: "30%",
                  height: u(0.25),
                  borderRadius: "9999px",
                  background: "#E0B93A",
                }}
              />
            </div>
            {[43.4, 46.6].map((x, i) => (
              <span
                key={x}
                className="absolute"
                style={{
                  left: u(x),
                  top: u(0.9),
                  width: u(2.2),
                  height: u(2.2),
                  borderRadius: u(0.5),
                  background: i
                    ? "linear-gradient(135deg,#4ADE80,#1F8F52)"
                    : "linear-gradient(135deg,#5B8DEF,#3556B8)",
                }}
              />
            ))}
            <div
              className="absolute flex items-center"
              style={{ right: u(1.4), top: 0, height: u(4), gap: u(1) }}
              dir="ltr"
            >
              <span
                style={{
                  width: u(1.1),
                  height: u(0.8),
                  borderRadius: u(0.2),
                  border: "1px solid rgba(255,255,255,0.7)",
                }}
              />
              <span
                style={{
                  width: u(1.5),
                  height: u(0.8),
                  borderRadius: u(0.2),
                  background: "rgba(255,255,255,0.75)",
                }}
              />
              <span
                style={{
                  fontSize: u(1.05),
                  lineHeight: 1.15,
                  color: "rgba(255,255,255,0.85)",
                  textAlign: "right",
                }}
              >
                9:41
                <br />
                28/10
              </span>
            </div>
          </div>

          {/* dashboard window: opens, maximizes, minimizes, repeats */}
          <div
            className="ad-win absolute flex flex-col overflow-hidden"
            style={{
              left: 0,
              top: 0,
              right: 0,
              bottom: u(4),
              background: "#0F1320",
              color: "#F4F1EA",
              boxShadow:
                "0 1.5cqw 4cqw rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.12)",
            }}
          >
            {/* title bar */}
            <div
              className="flex shrink-0 items-center"
              style={{
                height: u(3),
                background: "#171C2E",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
              dir="ltr"
            >
              <span
                className="flex items-center justify-center"
                style={{
                  marginLeft: u(1),
                  width: u(1.7),
                  height: u(1.7),
                  borderRadius: u(0.4),
                  background: "linear-gradient(135deg,#F4D77A,#B8891A)",
                  color: "#1D1707",
                  fontWeight: 800,
                  fontSize: u(1.1),
                }}
              >
                M
              </span>
              <span
                style={{
                  marginLeft: u(0.8),
                  fontSize: u(1.2),
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                Melmah
              </span>
              <span
                className="ad-blink"
                style={{
                  marginLeft: u(1),
                  width: u(0.8),
                  height: u(0.8),
                  borderRadius: "9999px",
                  background: "#4ADE80",
                }}
              />
              <div className="ms-auto flex" style={{ height: "100%" }}>
                <span
                  className="ad-minbtn flex items-center justify-center"
                  style={winBtn}
                >
                  <span
                    style={{ width: u(1.1), height: "1px", background: "#fff" }}
                  />
                </span>
                <span
                  className="ad-maxbtn flex items-center justify-center"
                  style={winBtn}
                >
                  <span
                    style={{
                      width: u(1),
                      height: u(1),
                      border: "1px solid #fff",
                      borderRadius: u(0.12),
                    }}
                  />
                </span>
                <span
                  className="flex items-center justify-center"
                  style={winBtn}
                >
                  <span
                    style={{
                      position: "absolute",
                      width: u(1.2),
                      height: "1px",
                      background: "#fff",
                      transform: "rotate(45deg)",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      width: u(1.2),
                      height: "1px",
                      background: "#fff",
                      transform: "rotate(-45deg)",
                    }}
                  />
                </span>
              </div>
            </div>

            <div className="flex min-h-0 flex-1">
              {/* sidebar: expands when maximized */}
              <div
                className="ad-side flex shrink-0 flex-col items-center overflow-hidden"
                style={{
                  width: 0,
                  background: "#0B0E19",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  paddingTop: u(1.4),
                  gap: u(1.1),
                }}
              >
                {nav.map((Icon, i) => (
                  <span
                    key={i}
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: u(4.6),
                      height: u(4.2),
                      borderRadius: u(1),
                      background:
                        i === 0 ? "rgba(224,185,58,0.18)" : "transparent",
                      color: i === 0 ? "#E0B93A" : "rgba(255,255,255,0.45)",
                    }}
                  >
                    <Icon style={{ width: u(2), height: u(2) }} />
                  </span>
                ))}
              </div>

              {/* main */}
              <div
                className="flex min-h-0 min-w-0 flex-1 flex-col"
                style={{ padding: u(1.6), gap: u(1.2) }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ gap: u(1) }}
                >
                  <div dir={t.dir}>
                    <div
                      style={{
                        fontSize: u(2.2),
                        fontWeight: 700,
                        lineHeight: 1.2,
                      }}
                    >
                      {t.popupTitle}
                    </div>
                    <div
                      style={{
                        marginTop: u(0.6),
                        width: u(8),
                        height: u(0.4),
                        borderRadius: "9999px",
                        background: "#E0B93A",
                      }}
                    />
                  </div>
                  <span
                    className="flex shrink-0 items-center"
                    style={{
                      gap: u(0.6),
                      padding: `${u(0.5)} ${u(1.1)}`,
                      borderRadius: "9999px",
                      background: "rgba(74,222,128,0.12)",
                      color: "#4ADE80",
                      fontSize: u(1.1),
                      fontWeight: 600,
                    }}
                    dir="ltr"
                  >
                    <span
                      className="ad-blink"
                      style={{
                        width: u(0.7),
                        height: u(0.7),
                        borderRadius: "9999px",
                        background: "#4ADE80",
                      }}
                    />
                    LIVE
                  </span>
                </div>

                <div className="flex" style={{ gap: u(1) }}>
                  {kpis.map(({ Icon, value, delta }, i) => (
                    <div
                      key={i}
                      className="ad-pop flex min-w-0 flex-1 items-center"
                      style={{
                        ...card,
                        padding: u(0.9),
                        gap: u(0.8),
                        animationDelay: `${3.0 + i * 0.12}s`,
                      }}
                    >
                      <span
                        className="flex shrink-0 items-center justify-center"
                        style={{
                          width: u(3),
                          height: u(3),
                          borderRadius: u(0.8),
                          background: "rgba(224,185,58,0.16)",
                          color: "#E0B93A",
                        }}
                      >
                        <Icon style={{ width: u(1.7), height: u(1.7) }} />
                      </span>
                      <span className="min-w-0" dir="ltr">
                        <span
                          className="block"
                          style={{
                            fontSize: u(2),
                            fontWeight: 700,
                            lineHeight: 1.1,
                          }}
                        >
                          {value}
                        </span>
                        {delta && (
                          <span
                            className="block"
                            style={{ fontSize: u(1), color: "#4ADE80" }}
                          >
                            {delta}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex min-h-0 flex-1" style={{ gap: u(1) }}>
                  <div
                    className="flex min-w-0 flex-[3] flex-col"
                    style={{ ...card, padding: u(1.1) }}
                    dir="ltr"
                  >
                    <div
                      style={{
                        fontSize: u(1.1),
                        color: "rgba(255,255,255,0.6)",
                        marginBottom: u(0.6),
                      }}
                      dir={t.dir}
                    >
                      {t.heroChip1}
                    </div>
                    <div
                      className="relative flex min-h-0 flex-1 items-end"
                      style={{
                        gap: u(0.9),
                        borderBottom: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      {[25, 50, 75].map((g) => (
                        <span
                          key={g}
                          className="absolute inset-x-0"
                          style={{
                            bottom: `${g}%`,
                            borderTop: "1px dashed rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                      {bars.map((h, i) => (
                        <span
                          key={i}
                          className="ad-bar relative flex-1"
                          style={{
                            height: `${h}%`,
                            borderRadius: `${u(0.5)} ${u(0.5)} 0 0`,
                            background:
                              "linear-gradient(180deg, #F4D77A, #B8891A)",
                            animationDelay: `${3.3 + i * 0.09}s`,
                          }}
                        />
                      ))}
                    </div>
                    <div
                      className="flex"
                      style={{ gap: u(0.9), marginTop: u(0.4) }}
                    >
                      {days.map((d, i) => (
                        <span
                          key={i}
                          className="flex-1 text-center"
                          style={{
                            fontSize: u(0.95),
                            color: "rgba(255,255,255,0.4)",
                          }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    className="grid min-w-0 flex-[2] grid-cols-6 content-center"
                    style={{ ...card, padding: u(1.1), gap: u(0.5) }}
                  >
                    {cells.map((i) => (
                      <span
                        key={i}
                        className={i === 11 ? "ad-pulse" : undefined}
                        style={{
                          aspectRatio: "1 / 0.8",
                          borderRadius: u(0.4),
                          background:
                            occupied.has(i) || i === 11
                              ? "#C9A227"
                              : "transparent",
                          border:
                            occupied.has(i) || i === 11
                              ? "none"
                              : "1px solid rgba(255,255,255,0.16)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* recent bookings: appears once the window is maximized */}
                <div
                  className="ad-book overflow-hidden"
                  style={{
                    ...card,
                    maxHeight: 0,
                    opacity: 0,
                    padding: `0 ${u(1.1)}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: u(1.05),
                      color: "rgba(255,255,255,0.6)",
                      padding: `${u(0.7)} 0 ${u(0.3)}`,
                    }}
                    dir={t.dir}
                  >
                    {t.heroChip2}
                  </div>
                  {bookings.map((b, i) => (
                    <div
                      key={i}
                      className="ad-row flex items-center"
                      style={{
                        height: u(2.3),
                        gap: u(0.9),
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        animationDelay: `${6.7 + i * 0.15}s`,
                      }}
                      dir="ltr"
                    >
                      <span
                        className="flex items-center justify-center"
                        style={{
                          width: u(1.7),
                          height: u(1.7),
                          borderRadius: "9999px",
                          background: "rgba(224,185,58,0.2)",
                          color: "#E0B93A",
                          fontSize: u(0.85),
                          fontWeight: 700,
                        }}
                      >
                        {b.i}
                      </span>
                      <span className="flex-1" style={{ fontSize: u(1.1) }}>
                        {b.n}
                      </span>
                      <span
                        style={{
                          fontSize: u(1.05),
                          color: "rgba(255,255,255,0.55)",
                        }}
                      >
                        {b.r}
                      </span>
                      <span
                        style={{
                          width: u(0.8),
                          height: u(0.8),
                          borderRadius: "9999px",
                          background: b.c,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* mouse cursor */}
          <svg
            className="ad-cursor absolute"
            style={{ left: 0, top: 0, width: u(3), height: u(3.6) }}
            viewBox="0 0 20 24"
          >
            <path
              d="M2 1L2 19L7 14.5L10.5 22L13.5 20.6L10.2 13.2L17 13Z"
              fill="#fff"
              stroke="#111"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* glass glare */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 38%)",
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Split-screen brand panel (desktop only)                             */
/* ------------------------------------------------------------------ */
function HeroPanel({ isDark, t }) {
  const perks = [
    { Icon: LayoutDashboard, text: t.heroPerk1 },
    { Icon: Users, text: t.heroPerk2 },
    { Icon: ShieldCheck, text: t.heroPerk3 },
  ];
  const bokeh = [
    { top: "8%", left: "10%", size: 120, delay: "0s" },
    { top: "62%", left: "78%", size: 170, delay: "3s" },
    { top: "30%", left: "86%", size: 90, delay: "6s" },
    { top: "78%", left: "6%", size: 110, delay: "9s" },
  ];
  const chip = isDark
    ? "border-[#332C3E] bg-[#1E1B26]/85 text-[#F0EAE2]"
    : "border-[#E6E1D6] bg-white/85 text-[#1D1A22]";

  return (
    <aside
      className={`relative hidden flex-col justify-between overflow-hidden border-s p-12 lg:flex xl:p-16 ${
        isDark ? "border-[#2E2938]" : "border-[#E6E1D6]"
      }`}
      style={{
        background: isDark
          ? "radial-gradient(ellipse at 50% 42%, rgba(224,185,58,0.16), transparent 62%), linear-gradient(135deg, #1E1B26, #15121C)"
          : "radial-gradient(ellipse at 50% 42%, rgba(201,162,39,0.28), transparent 62%), linear-gradient(135deg, #F6EDD6, #EBDEB8)",
      }}
    >
      {bokeh.map((b, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="ad-bokeh pointer-events-none absolute rounded-full bg-[#C9A227]/10 blur-2xl"
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
          }}
        />
      ))}

      <div
        className={`ad-up relative flex items-center gap-2 text-2xl font-semibold tracking-tight ${
          isDark ? "text-[#F0EAE2]" : "text-[#1D1A22]"
        }`}
      >
        {t.brandName}
        <span className="rounded-md border border-[#C9A227]/40 bg-[#C9A227]/10 px-2 py-0.5 text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
          {t.brandSub}
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-[560px]">
        <div className="ad-float">
          <AdminArt t={t} />
        </div>

        <div
          className={`ad-chip absolute -top-2 end-2 flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur ${chip}`}
        >
          <BedDouble size={14} className="text-[#C9A227]" />
          <span className="text-sm font-bold">87%</span>
          <span className="opacity-70">{t.heroChip1}</span>
        </div>

        <div
          className={`ad-chip absolute -bottom-2 start-2 flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur ${chip}`}
          style={{ animationDelay: "-2.5s" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="ad-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <BellRing size={14} className="text-[#C9A227]" />
          {t.heroChip2}
        </div>
      </div>

      <div
        className={`relative ${isDark ? "text-[#F0EAE2]" : "text-[#1D1A22]"}`}
      >
        <h2
          className="ad-up text-3xl font-semibold leading-tight tracking-tight xl:text-4xl"
          style={{ animationDelay: "0.15s" }}
        >
          {t.heroTitle}
        </h2>
        <p
          className={`ad-up mt-3 max-w-md text-base ${
            isDark ? "text-[#B7B2C4]" : "text-[#5F5968]"
          }`}
          style={{ animationDelay: "0.3s" }}
        >
          {t.heroSubtitle}
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
          {perks.map(({ Icon, text }, i) => (
            <li
              key={i}
              className="ad-up flex items-center gap-2"
              style={{ animationDelay: `${0.45 + i * 0.12}s` }}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  isDark
                    ? "bg-[#C9A227]/15 text-[#E0B93A]"
                    : "bg-[#C9A227]/20 text-[#8A6E1A]"
                }`}
              >
                <Icon size={14} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Login form (inside Suspense, uses useSearchParams)                  */
/* ------------------------------------------------------------------ */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lang = loginText[language] ? language : "en";
  const t = loginText[lang];
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
  }, []);

  // Keep <html lang> and <html dir> aligned with the current language.
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", t.dir);
    document.documentElement.classList.toggle("dark", isDark);
  }, [lang, mounted, t.dir, isDark]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.genericError);
        setLoading(false);
        return;
      }

      localStorage.setItem("auth_token", data.token);

      const redirectTo = searchParams.get("from") || "/admin";
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(t.genericError);
      setLoading(false);
    }
  }

  if (!mounted) {
    return <LoadingScreen text={t.loading} fullScreen />;
  }

  const pageBg = isDark ? "bg-[#15121C]" : "bg-[#F7F5F0]";
  const textPrimary = isDark ? "text-[#F0EAE2]" : "text-[#1D1A22]";
  const muted = isDark ? "text-[#A8A3B5]" : "text-[#6B6676]";
  const accent = isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]";
  const cardBg = isDark
    ? "border-[#2E2938] bg-[#1E1B26]/90 backdrop-blur-sm"
    : "border-[#E6E1D6] bg-white/90 shadow-sm backdrop-blur-sm";
  const inputWrap = isDark
    ? "border-[#332C3E] bg-[#161320]"
    : "border-[#DDD7C9] bg-white";
  const inputText = isDark
    ? "text-[#F0EAE2] placeholder:text-[#5E5670]"
    : "text-[#1D1A22] placeholder:text-[#A39D8F]";
  const labelCls = `mb-1.5 block text-sm font-medium ${
    isDark ? "text-[#D8D3E2]" : "text-[#3A3542]"
  }`;

  return (
    <div
      dir={t.dir}
      className={`relative min-h-screen w-full overflow-hidden transition-colors duration-300 lg:grid lg:grid-cols-2 ${pageBg} ${textPrimary}`}
    >
      {/* Table-grid texture + drifting gold blobs */}
      <svg
        className={`pointer-events-none absolute inset-0 h-full w-full ${
          isDark ? "opacity-[0.04]" : "opacity-[0.06]"
        }`}
        viewBox="0 0 300 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {Array.from({ length: 12 }).map((_, row) =>
          Array.from({ length: 12 }).map((_, col) => (
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
        className="blob-a pointer-events-none absolute -top-24 -start-24 h-96 w-96 rounded-full bg-[#C9A227]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="blob-b pointer-events-none absolute top-40 -end-32 h-96 w-96 rounded-full bg-[#C9A227]/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Mobile / tablet: soft desk scene near the bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center lg:hidden"
        aria-hidden="true"
      >
        <div className="ad-float mb-6 w-[300px] opacity-40 sm:w-[420px]">
          <AdminArt t={t} />
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <main className="relative w-full max-w-[400px]">
          {/* Brand (mobile only — desktop shows it in the side panel) */}
          <div className="mb-5 flex items-center justify-center gap-2 text-xl font-semibold tracking-tight lg:hidden">
            {t.brandName}
            <span className="rounded-md border border-[#C9A227]/40 bg-[#C9A227]/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.25em] text-[#C9A227]">
              {t.brandSub}
            </span>
          </div>

          <header className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t.heading}
            </h1>
            <p className={`mt-2 text-sm ${muted}`}>{t.subheading}</p>
          </header>

          <div className={`rounded-2xl border p-6 ${cardBg}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className={labelCls}>
                  {t.emailLabel}
                </label>
                <div
                  className={`flex items-center rounded-lg border focus-within:border-[#C9A227] focus-within:ring-2 focus-within:ring-[#C9A227]/30 ${inputWrap}`}
                >
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    dir="ltr"
                    className={`h-11 min-w-0 flex-1 bg-transparent px-3 text-base outline-none ${inputText}`}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    htmlFor="admin-password"
                    className={`text-sm font-medium ${
                      isDark ? "text-[#D8D3E2]" : "text-[#3A3542]"
                    }`}
                  >
                    {t.passwordLabel}
                  </label>
                  <Link
                    href="/hotel/forgot-password"
                    className={`text-sm font-medium hover:underline ${accent}`}
                  >
                    {t.forgot}
                  </Link>
                </div>
                <div
                  className={`flex items-center rounded-lg border focus-within:border-[#C9A227] focus-within:ring-2 focus-within:ring-[#C9A227]/30 ${inputWrap}`}
                >
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className={`h-11 min-w-0 flex-1 bg-transparent px-3 text-base outline-none ${inputText}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className={`me-1.5 flex h-8 w-8 items-center justify-center rounded-md ${muted} hover:opacity-80`}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    isDark
                      ? "bg-red-500/10 text-red-300"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#C9A227] px-4 text-base font-semibold text-[#1D1707] transition hover:bg-[#D4AC2E] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                {loading ? t.submitting : t.submit}
              </button>
            </form>
          </div>

          <p
            className={`mt-5 text-center text-[11px] uppercase tracking-[0.2em] ${muted}`}
          >
            {t.footer}
          </p>
        </main>
      </div>

      <HeroPanel isDark={isDark} t={t} />

      <style jsx global>{`
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

        /* ---- laptop scene ---- */
        @keyframes ad-float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-7px) rotate(0.6deg);
          }
        }
        @keyframes ad-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* One 17s story (restarted by React every 17s):
           cursor -> click icon -> window opens -> maximize -> minimize */
        @keyframes ad-cursor {
          0% {
            opacity: 0;
            transform: translate(58cqw, 32cqw);
          }
          3.5% {
            opacity: 1;
            transform: translate(58cqw, 32cqw);
          }
          11.8%,
          13% {
            opacity: 1;
            transform: translate(5.2cqw, 24cqw);
          }
          26% {
            opacity: 1;
            transform: translate(36cqw, 22cqw);
          }
          31%,
          33.5% {
            opacity: 1;
            transform: translate(63.95cqw, 4.55cqw);
          }
          47% {
            opacity: 1;
            transform: translate(44cqw, 19cqw);
          }
          61%,
          66% {
            opacity: 1;
            transform: translate(28cqw, 27cqw);
          }
          71%,
          73.5% {
            opacity: 1;
            transform: translate(62.1cqw, 1.4cqw);
          }
          80%,
          100% {
            opacity: 0;
            transform: translate(50cqw, 12cqw);
          }
        }
        @keyframes ad-win {
          0%,
          13.8% {
            opacity: 0;
            transform: translate(4.2cqw, 22.2cqw) scale(0.06);
            border-radius: 1.2cqw;
          }
          15% {
            opacity: 1;
          }
          17.65%,
          32.94% {
            opacity: 1;
            transform: translate(11cqw, 3.5cqw) scale(0.8);
            border-radius: 1.2cqw;
          }
          37.65%,
          74% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
            border-radius: 0;
          }
          77.06%,
          100% {
            opacity: 0;
            transform: translate(40cqw, 38.5cqw) scale(0.05);
            border-radius: 1.2cqw;
          }
        }
        @keyframes ad-maxhl {
          0%,
          30.5% {
            background: transparent;
          }
          31.5%,
          33.5% {
            background: rgba(255, 255, 255, 0.2);
          }
          35%,
          100% {
            background: transparent;
          }
        }
        @keyframes ad-minhl {
          0%,
          70.5% {
            background: transparent;
          }
          71.5%,
          73.5% {
            background: rgba(255, 255, 255, 0.2);
          }
          75%,
          100% {
            background: transparent;
          }
        }
        @keyframes ad-tbapp {
          0%,
          13.5% {
            opacity: 0;
            transform: translateY(1cqw) scale(0.6);
          }
          16%,
          94% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          99%,
          100% {
            opacity: 0;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes ad-click {
          0% {
            transform: scale(1);
          }
          40% {
            transform: scale(0.86);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes ad-clickring {
          0% {
            opacity: 0.9;
            transform: scale(0.8);
          }
          100% {
            opacity: 0;
            transform: scale(1.9);
          }
        }
        @keyframes ad-side {
          from {
            width: 0;
          }
          to {
            width: 8cqw;
          }
        }
        @keyframes ad-book {
          from {
            max-height: 0;
            opacity: 0;
          }
          to {
            max-height: 10.5cqw;
            opacity: 1;
          }
        }
        @keyframes ad-pop {
          0% {
            opacity: 0;
            transform: translateY(1.2cqw) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes ad-bar {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }
        @keyframes ad-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
        @keyframes ad-blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.25;
          }
        }
        @keyframes ad-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes ad-bokeh {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(24px, -34px) scale(1.15);
          }
        }
        @keyframes ad-chip {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-9px);
          }
        }
        @keyframes ad-ping {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.6);
            opacity: 0;
          }
        }

        .ad-float {
          animation: ad-float 7s ease-in-out infinite;
        }
        .ad-ring {
          transform-box: view-box;
          transform-origin: 280px 200px;
          animation: ad-spin 70s linear infinite;
        }
        .ad-ring-rev {
          animation-duration: 110s;
          animation-direction: reverse;
        }

        .ad-cursor {
          opacity: 0;
          animation: ad-cursor 17s ease-in-out both;
          will-change: transform;
        }
        .ad-win {
          opacity: 0;
          transform-origin: 0 0;
          animation: ad-win 17s cubic-bezier(0.3, 0.9, 0.3, 1) both;
          will-change: transform;
        }
        .ad-maxbtn {
          animation: ad-maxhl 17s linear both;
        }
        .ad-minbtn {
          animation: ad-minhl 17s linear both;
        }
        .ad-tbapp {
          opacity: 0;
          animation: ad-tbapp 17s ease-out both;
        }
        .ad-appicon {
          animation: ad-click 0.3s ease-out 2.1s both;
        }
        .ad-clickring {
          opacity: 0;
          animation: ad-clickring 0.7s ease-out 2.1s both;
        }
        .ad-side {
          animation: ad-side 0.6s ease-out 6.1s both;
        }
        .ad-book {
          animation: ad-book 0.6s ease-out 6.4s both;
        }
        .ad-row {
          opacity: 0;
          animation: ad-pop 0.4s ease-out both;
        }
        .ad-pop {
          opacity: 0;
          animation: ad-pop 0.45s ease-out both;
        }
        .ad-bar {
          transform-origin: bottom;
          transform: scaleY(0);
          animation: ad-bar 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .ad-pulse {
          animation: ad-pulse 2s ease-in-out infinite;
        }
        .ad-blink {
          animation: ad-blink 1.6s ease-in-out infinite;
        }
        .ad-up {
          animation: ad-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .ad-bokeh {
          animation: ad-bokeh 14s ease-in-out infinite;
        }
        .ad-chip {
          animation: ad-chip 5s ease-in-out infinite;
        }
        .ad-ping {
          animation: ad-ping 1.8s ease-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .blob-a,
          .blob-b,
          .ad-float,
          .ad-ring,
          .ad-cursor,
          .ad-win,
          .ad-maxbtn,
          .ad-minbtn,
          .ad-tbapp,
          .ad-appicon,
          .ad-clickring,
          .ad-side,
          .ad-book,
          .ad-row,
          .ad-pop,
          .ad-bar,
          .ad-pulse,
          .ad-blink,
          .ad-up,
          .ad-bokeh,
          .ad-chip,
          .ad-ping {
            animation: none !important;
          }
          .ad-win,
          .ad-pop,
          .ad-row,
          .ad-up,
          .ad-tbapp {
            opacity: 1;
          }
          .ad-bar {
            transform: scaleY(1);
          }
          .ad-side {
            width: 8cqw;
          }
          .ad-book {
            max-height: 10.5cqw;
            opacity: 1;
          }
          .ad-cursor,
          .ad-clickring {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page wrapper                                                        */
/* ------------------------------------------------------------------ */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen text="…" fullScreen />}>
      <LoginForm />
    </Suspense>
  );
}
