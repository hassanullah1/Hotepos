// app/login/page.js
"use client";

import { Suspense, useEffect, useState } from "react";
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
  },
};

const THEME_KEY = "kohistan-admin-theme";

/* ------------------------------------------------------------------ */
/* Overhead reception desk: guest ledger, bell, key, tablet, coffee    */
/* ------------------------------------------------------------------ */
function AdminArt() {
  return (
    <svg
      viewBox="0 0 560 460"
      className="h-auto w-full"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ad-pad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7E553A" />
          <stop offset="1" stopColor="#47301F" />
        </linearGradient>
        <radialGradient id="ad-padhi" cx="35%" cy="25%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ad-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FCF8EE" />
          <stop offset="1" stopColor="#EBE2CA" />
        </linearGradient>
        <linearGradient id="ad-spine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0.32" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ad-brass" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#FFF3BC" />
          <stop offset="0.45" stopColor="#E0B93A" />
          <stop offset="1" stopColor="#8A6310" />
        </radialGradient>
        <linearGradient id="ad-brass2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E7C65A" />
          <stop offset="1" stopColor="#6B4E0C" />
        </linearGradient>
        <linearGradient id="ad-redtag" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C2382F" />
          <stop offset="1" stopColor="#7A1B18" />
        </linearGradient>
        <linearGradient id="ad-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#332D44" />
          <stop offset="1" stopColor="#15121C" />
        </linearGradient>
        <linearGradient id="ad-chip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4D77A" />
          <stop offset="1" stopColor="#B8891A" />
        </linearGradient>
        <linearGradient id="ad-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1D2438" />
          <stop offset="1" stopColor="#0E1220" />
        </linearGradient>
        <radialGradient id="ad-cup" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#D5CDBB" />
        </radialGradient>
        <radialGradient id="ad-coffee" cx="40%" cy="35%" r="80%">
          <stop offset="0" stopColor="#8A5230" />
          <stop offset="1" stopColor="#2B1508" />
        </radialGradient>
        <linearGradient id="ad-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5DAE45" />
          <stop offset="1" stopColor="#245F20" />
        </linearGradient>
        <linearGradient id="ad-pen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B4A7A" />
          <stop offset="1" stopColor="#141B38" />
        </linearGradient>
        <radialGradient id="ad-steam">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="ad-cardclip">
          <rect x="-48" y="-30" width="96" height="60" rx="7" />
        </clipPath>
        <filter id="ad-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <circle
        className="ad-ring"
        cx="280"
        cy="230"
        r="212"
        stroke="#E0B93A"
        strokeOpacity="0.35"
        strokeWidth="1.4"
        strokeDasharray="3 10"
        strokeLinecap="round"
      />
      <circle
        className="ad-ring ad-ring-rev"
        cx="280"
        cy="230"
        r="226"
        stroke="#E0B93A"
        strokeOpacity="0.22"
        strokeWidth="1"
        strokeDasharray="14 18"
      />
      <rect
        x="38"
        y="44"
        width="500"
        height="400"
        rx="24"
        fill="#000"
        opacity="0.4"
        filter="url(#ad-blur)"
      />
      <rect
        x="30"
        y="30"
        width="500"
        height="400"
        rx="22"
        fill="url(#ad-pad)"
      />
      <rect
        x="30"
        y="30"
        width="500"
        height="400"
        rx="22"
        fill="url(#ad-padhi)"
      />
      <rect
        x="40"
        y="40"
        width="480"
        height="380"
        rx="16"
        fill="none"
        stroke="#E0B93A"
        strokeOpacity="0.55"
        strokeWidth="1.2"
        strokeDasharray="5 5"
      />
      <rect
        x="94"
        y="72"
        width="292"
        height="222"
        rx="8"
        fill="#000"
        opacity="0.4"
        filter="url(#ad-blur)"
      />
      <rect x="86" y="56" width="288" height="218" rx="8" fill="#2B1F18" />
      <rect
        x="92"
        y="62"
        width="138"
        height="206"
        rx="3"
        fill="url(#ad-paper)"
      />
      <rect
        x="230"
        y="62"
        width="138"
        height="206"
        rx="3"
        fill="url(#ad-paper)"
      />
      <rect x="206" y="62" width="48" height="206" fill="url(#ad-spine)" />
      <path
        d="M96 94H226M234 94H364"
        stroke="#9DB4D6"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <path
        d="M96 108H226M234 108H364"
        stroke="#9DB4D6"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <path
        d="M96 122H226M234 122H364"
        stroke="#9DB4D6"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <path
        d="M96 136H226M234 136H364"
        stroke="#9DB4D6"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <path
        d="M96 150H226M234 150H364"
        stroke="#9DB4D6"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <path
        d="M96 164H226M234 164H364"
        stroke="#9DB4D6"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <path
        d="M96 178H226M234 178H364"
        stroke="#9DB4D6"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <path
        d="M96 192H226M234 192H364"
        stroke="#9DB4D6"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <path
        d="M96 206H226M234 206H364"
        stroke="#9DB4D6"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <path
        d="M96 220H226M234 220H364"
        stroke="#9DB4D6"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <path
        d="M96 234H226M234 234H364"
        stroke="#9DB4D6"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <path
        d="M96 248H226M234 248H364"
        stroke="#9DB4D6"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <path
        d="M133 76V262M186 76V262M271 76V262M324 76V262"
        stroke="#C9788A"
        strokeOpacity="0.45"
        strokeWidth="0.7"
      />
      <rect
        x="100"
        y="79"
        width="22"
        height="4"
        rx="2"
        fill="#6E687A"
        opacity="0.7"
      />
      <rect
        x="140"
        y="79"
        width="30"
        height="4"
        rx="2"
        fill="#6E687A"
        opacity="0.7"
      />
      <rect
        x="194"
        y="79"
        width="24"
        height="4"
        rx="2"
        fill="#6E687A"
        opacity="0.7"
      />
      <rect
        x="238"
        y="79"
        width="22"
        height="4"
        rx="2"
        fill="#6E687A"
        opacity="0.7"
      />
      <rect
        x="278"
        y="79"
        width="30"
        height="4"
        rx="2"
        fill="#6E687A"
        opacity="0.7"
      />
      <rect
        x="332"
        y="79"
        width="22"
        height="4"
        rx="2"
        fill="#6E687A"
        opacity="0.7"
      />
      <path
        d="M100.0 105.0q2.5 -5.1 5.0 0q2.5 3.8 5.0 0q2.5 -4.0 5.0 0q2.5 3.4 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M137.0 105.0q2.5 -6.0 5.0 0q2.5 2.5 5.0 0q2.5 -5.2 5.0 0q2.5 3.4 5.0 0q2.5 -4.7 5.0 0q2.5 4.1 5.0 0q2.5 -4.8 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M190.0 105.0q2.5 -6.1 5.0 0q2.5 3.4 5.0 0q2.5 -4.1 5.0 0q2.5 2.7 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100.0 119.0q2.5 -3.3 5.0 0q2.5 3.3 5.0 0q2.5 -5.4 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M137.0 119.0q2.5 -5.8 5.0 0q2.5 4.0 5.0 0q2.5 -4.9 5.0 0q2.5 3.5 5.0 0q2.5 -3.5 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M190.0 119.0q2.5 -6.2 5.0 0q2.5 2.7 5.0 0q2.5 -3.8 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100.0 133.0q2.5 -5.5 5.0 0q2.5 2.3 5.0 0q2.5 -4.1 5.0 0q2.5 2.6 5.0 0q2.5 -4.0 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M137.0 133.0q2.5 -4.8 5.0 0q2.5 2.7 5.0 0q2.5 -4.3 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M190.0 133.0q2.5 -3.5 5.0 0q2.5 2.1 5.0 0q2.5 -5.8 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100.0 147.0q2.5 -4.9 5.0 0q2.5 2.3 5.0 0q2.5 -3.6 5.0 0q2.5 2.3 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M137.0 147.0q2.5 -3.3 5.0 0q2.5 2.7 5.0 0q2.5 -3.8 5.0 0q2.5 2.5 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M190.0 147.0q2.5 -4.5 5.0 0q2.5 3.1 5.0 0q2.5 -4.2 5.0 0q2.5 3.2 5.0 0q2.5 -5.6 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100.0 161.0q2.5 -3.3 5.0 0q2.5 3.1 5.0 0q2.5 -4.3 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M137.0 161.0q2.5 -3.5 5.0 0q2.5 3.9 5.0 0q2.5 -3.2 5.0 0q2.5 3.2 5.0 0q2.5 -4.5 5.0 0q2.5 2.7 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M190.0 161.0q2.5 -5.3 5.0 0q2.5 2.4 5.0 0q2.5 -4.7 5.0 0q2.5 3.4 5.0 0q2.5 -3.2 5.0 0q2.5 2.3 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100.0 175.0q2.5 -5.4 5.0 0q2.5 3.0 5.0 0q2.5 -4.4 5.0 0q2.5 3.1 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M137.0 175.0q2.5 -5.9 5.0 0q2.5 4.1 5.0 0q2.5 -4.6 5.0 0q2.5 2.1 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M190.0 175.0q2.5 -5.6 5.0 0q2.5 2.8 5.0 0q2.5 -3.4 5.0 0q2.5 2.5 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100.0 189.0q2.5 -5.1 5.0 0q2.5 2.7 5.0 0q2.5 -5.1 5.0 0q2.5 3.7 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M137.0 189.0q2.5 -5.7 5.0 0q2.5 3.0 5.0 0q2.5 -5.6 5.0 0q2.5 4.0 5.0 0q2.5 -5.8 5.0 0q2.5 3.6 5.0 0q2.5 -5.0 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M190.0 189.0q2.5 -5.8 5.0 0q2.5 3.4 5.0 0q2.5 -5.4 5.0 0q2.5 2.6 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100.0 203.0q2.5 -4.0 5.0 0q2.5 3.3 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M137.0 203.0q2.5 -3.7 5.0 0q2.5 2.5 5.0 0q2.5 -6.1 5.0 0q2.5 2.2 5.0 0q2.5 -6.0 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M190.0 203.0q2.5 -4.9 5.0 0q2.5 4.2 5.0 0q2.5 -5.2 5.0 0q2.5 2.1 5.0 0q2.5 -6.1 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100.0 217.0q2.5 -6.0 5.0 0q2.5 3.8 5.0 0q2.5 -3.6 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M137.0 217.0q2.5 -3.2 5.0 0q2.5 3.7 5.0 0q2.5 -5.6 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M190.0 217.0q2.5 -3.5 5.0 0q2.5 2.8 5.0 0q2.5 -5.6 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100.0 231.0q2.5 -5.8 5.0 0q2.5 4.1 5.0 0q2.5 -5.5 5.0 0q2.5 3.8 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M137.0 231.0q2.5 -3.1 5.0 0q2.5 3.9 5.0 0q2.5 -5.1 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M190.0 231.0q2.5 -3.5 5.0 0q2.5 2.8 5.0 0q2.5 -4.2 5.0 0q2.5 3.1 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100.0 245.0q2.5 -3.8 5.0 0q2.5 2.3 5.0 0q2.5 -3.8 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M137.0 245.0q2.5 -3.4 5.0 0q2.5 2.9 5.0 0q2.5 -3.5 5.0 0q2.5 3.7 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M190.0 245.0q2.5 -4.6 5.0 0q2.5 3.4 5.0 0q2.5 -3.9 5.0 0q2.5 2.1 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M238.0 105.0q2.5 -4.2 5.0 0q2.5 2.8 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M275.0 105.0q2.5 -4.1 5.0 0q2.5 3.8 5.0 0q2.5 -3.1 5.0 0q2.5 3.0 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M328.0 105.0q2.5 -4.0 5.0 0q2.5 3.6 5.0 0q2.5 -3.8 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M238.0 119.0q2.5 -3.6 5.0 0q2.5 4.1 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M275.0 119.0q2.5 -3.5 5.0 0q2.5 4.1 5.0 0q2.5 -5.1 5.0 0q2.5 4.1 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M328.0 119.0q2.5 -5.6 5.0 0q2.5 2.2 5.0 0q2.5 -3.9 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M238.0 133.0q2.5 -4.7 5.0 0q2.5 3.7 5.0 0q2.5 -4.3 5.0 0q2.5 3.9 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M275.0 133.0q2.5 -5.1 5.0 0q2.5 2.5 5.0 0q2.5 -3.7 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M328.0 133.0q2.5 -4.5 5.0 0q2.5 3.8 5.0 0q2.5 -4.0 5.0 0q2.5 3.6 5.0 0q2.5 -6.0 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M238.0 147.0q2.5 -3.9 5.0 0q2.5 3.5 5.0 0q2.5 -6.1 5.0 0q2.5 3.7 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M275.0 147.0q2.5 -4.4 5.0 0q2.5 2.3 5.0 0q2.5 -5.5 5.0 0q2.5 2.4 5.0 0q2.5 -3.8 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M328.0 147.0q2.5 -3.6 5.0 0q2.5 2.9 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M238.0 161.0q2.5 -3.7 5.0 0q2.5 3.0 5.0 0q2.5 -5.5 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M275.0 161.0q2.5 -3.5 5.0 0q2.5 3.2 5.0 0q2.5 -5.9 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M328.0 161.0q2.5 -4.9 5.0 0q2.5 2.3 5.0 0q2.5 -5.8 5.0 0q2.5 4.1 5.0 0q2.5 -5.9 5.0 0"
        stroke="#2B3E7A"
        strokeWidth="0.9"
        opacity="0.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        className="ad-write"
        pathLength="100"
        d="M238 175c4-12 8-12 12 0s8 12 12 0s8-12 12 0s8 12 12 0s8-12 12 0s8 12 12 0s8-12 12 0s8 12 12 0"
        stroke="#2B3E7A"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M230 62V268"
        stroke="#000"
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      <g className="ad-pen">
        <g transform="rotate(-42 238 175)">
          <ellipse
            cx="300"
            cy="182"
            rx="62"
            ry="4"
            fill="#000"
            opacity="0.28"
            filter="url(#ad-blur)"
          />
          <rect
            x="246"
            y="171.5"
            width="92"
            height="7"
            rx="3.5"
            fill="url(#ad-pen)"
          />
          <path d="M238 175L248 171.5V178.5Z" fill="#E7E2D6" />
          <rect x="296" y="172.5" width="38" height="2" rx="1" fill="#E0B93A" />
          <rect x="333" y="171.5" width="6" height="7" rx="2" fill="#E0B93A" />
        </g>
      </g>
      <g className="ad-plant">
        <ellipse
          cx="66"
          cy="78"
          rx="44"
          ry="40"
          fill="#000"
          opacity="0.28"
          filter="url(#ad-blur)"
        />
        <g transform="rotate(0 60 70)">
          <ellipse cx="88" cy="70" rx="30" ry="11" fill="url(#ad-leaf)" />
          <path d="M62 70H114" stroke="#1F5A1C" strokeWidth="1" opacity="0.5" />
          <path
            d="M78 70L90 62M78 70L90 78M92 70L102 64M92 70L102 76"
            stroke="#1F5A1C"
            strokeWidth="0.7"
            opacity="0.4"
          />
        </g>
        <g transform="rotate(38 60 70)">
          <ellipse cx="88" cy="70" rx="30" ry="11" fill="url(#ad-leaf)" />
          <path d="M62 70H114" stroke="#1F5A1C" strokeWidth="1" opacity="0.5" />
          <path
            d="M78 70L90 62M78 70L90 78M92 70L102 64M92 70L102 76"
            stroke="#1F5A1C"
            strokeWidth="0.7"
            opacity="0.4"
          />
        </g>
        <g transform="rotate(81 60 70)">
          <ellipse cx="88" cy="70" rx="30" ry="11" fill="url(#ad-leaf)" />
          <path d="M62 70H114" stroke="#1F5A1C" strokeWidth="1" opacity="0.5" />
          <path
            d="M78 70L90 62M78 70L90 78M92 70L102 64M92 70L102 76"
            stroke="#1F5A1C"
            strokeWidth="0.7"
            opacity="0.4"
          />
        </g>
        <g transform="rotate(125 60 70)">
          <ellipse cx="88" cy="70" rx="30" ry="11" fill="url(#ad-leaf)" />
          <path d="M62 70H114" stroke="#1F5A1C" strokeWidth="1" opacity="0.5" />
          <path
            d="M78 70L90 62M78 70L90 78M92 70L102 64M92 70L102 76"
            stroke="#1F5A1C"
            strokeWidth="0.7"
            opacity="0.4"
          />
        </g>
        <g transform="rotate(168 60 70)">
          <ellipse cx="88" cy="70" rx="30" ry="11" fill="url(#ad-leaf)" />
          <path d="M62 70H114" stroke="#1F5A1C" strokeWidth="1" opacity="0.5" />
          <path
            d="M78 70L90 62M78 70L90 78M92 70L102 64M92 70L102 76"
            stroke="#1F5A1C"
            strokeWidth="0.7"
            opacity="0.4"
          />
        </g>
        <g transform="rotate(200 60 70)">
          <ellipse cx="88" cy="70" rx="30" ry="11" fill="url(#ad-leaf)" />
          <path d="M62 70H114" stroke="#1F5A1C" strokeWidth="1" opacity="0.5" />
          <path
            d="M78 70L90 62M78 70L90 78M92 70L102 64M92 70L102 76"
            stroke="#1F5A1C"
            strokeWidth="0.7"
            opacity="0.4"
          />
        </g>
        <g transform="rotate(240 60 70)">
          <ellipse cx="88" cy="70" rx="30" ry="11" fill="url(#ad-leaf)" />
          <path d="M62 70H114" stroke="#1F5A1C" strokeWidth="1" opacity="0.5" />
          <path
            d="M78 70L90 62M78 70L90 78M92 70L102 64M92 70L102 76"
            stroke="#1F5A1C"
            strokeWidth="0.7"
            opacity="0.4"
          />
        </g>
        <g transform="rotate(277 60 70)">
          <ellipse cx="88" cy="70" rx="30" ry="11" fill="url(#ad-leaf)" />
          <path d="M62 70H114" stroke="#1F5A1C" strokeWidth="1" opacity="0.5" />
          <path
            d="M78 70L90 62M78 70L90 78M92 70L102 64M92 70L102 76"
            stroke="#1F5A1C"
            strokeWidth="0.7"
            opacity="0.4"
          />
        </g>
        <g transform="rotate(321 60 70)">
          <ellipse cx="88" cy="70" rx="30" ry="11" fill="url(#ad-leaf)" />
          <path d="M62 70H114" stroke="#1F5A1C" strokeWidth="1" opacity="0.5" />
          <path
            d="M78 70L90 62M78 70L90 78M92 70L102 64M92 70L102 76"
            stroke="#1F5A1C"
            strokeWidth="0.7"
            opacity="0.4"
          />
        </g>
        <circle cx="60" cy="70" r="12" fill="#B5603B" />
        <circle cx="60" cy="70" r="8" fill="#6B3A22" />
      </g>
      <ellipse
        cx="462"
        cy="130"
        rx="50"
        ry="48"
        fill="#000"
        opacity="0.38"
        filter="url(#ad-blur)"
      />
      <circle
        className="ad-wave"
        cx="455"
        cy="120"
        r="46"
        stroke="#E0B93A"
        strokeWidth="2"
      />
      <circle
        className="ad-wave"
        style={{ animationDelay: "0.18s" }}
        cx="455"
        cy="120"
        r="46"
        stroke="#E0B93A"
        strokeWidth="1.4"
      />
      <circle
        cx="455"
        cy="120"
        r="46"
        fill="url(#ad-brass2)"
        stroke="#5A400A"
        strokeWidth="1"
      />
      <circle
        cx="455"
        cy="120"
        r="40"
        fill="none"
        stroke="#FFF3BC"
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      <g className="ad-bell">
        <circle
          cx="455"
          cy="120"
          r="32"
          fill="url(#ad-brass)"
          stroke="#8A6310"
          strokeWidth="1"
        />
        <ellipse
          cx="444"
          cy="106"
          rx="13"
          ry="7"
          fill="#fff"
          opacity="0.5"
          transform="rotate(-35 444 106)"
        />
        <circle
          cx="455"
          cy="120"
          r="8"
          fill="#B8891A"
          stroke="#6B4E0C"
          strokeWidth="1"
        />
        <circle cx="453" cy="118" r="3" fill="#FFF3BC" opacity="0.8" />
      </g>
      <g className="ad-tag">
        <ellipse
          cx="486"
          cy="322"
          rx="38"
          ry="64"
          fill="#000"
          opacity="0.3"
          filter="url(#ad-blur)"
        />
        <path
          d="M486 238L512 200"
          stroke="url(#ad-brass2)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M500 214l8 6M506 206l8 6"
          stroke="#8A6310"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          cx="518"
          cy="192"
          r="11"
          fill="none"
          stroke="url(#ad-brass2)"
          strokeWidth="5"
        />
        <circle
          cx="480"
          cy="244"
          r="16"
          fill="none"
          stroke="#C7C2D2"
          strokeWidth="3.5"
        />
        <circle
          cx="480"
          cy="262"
          r="6"
          fill="none"
          stroke="#C7C2D2"
          strokeWidth="3"
        />
        <rect
          x="452"
          y="270"
          width="56"
          height="94"
          rx="12"
          fill="url(#ad-redtag)"
        />
        <rect
          x="457"
          y="275"
          width="46"
          height="84"
          rx="8"
          fill="none"
          stroke="#F4D77A"
          strokeOpacity="0.55"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <circle cx="480" cy="284" r="4.2" fill="#2B1F18" />
        <text
          x="480"
          y="330"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill="#F4D77A"
          fontFamily="Georgia, serif"
        >
          207
        </text>
        <text
          x="480"
          y="346"
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          fill="#F4D77A"
          opacity="0.85"
          fontFamily="system-ui, sans-serif"
          letterSpacing="1.4"
        >
          SUITE
        </text>
      </g>
      <g transform="translate(-70 0)">
        <rect
          x="250"
          y="316"
          width="188"
          height="124"
          rx="16"
          fill="#000"
          opacity="0.4"
          filter="url(#ad-blur)"
        />
        <rect
          x="240"
          y="300"
          width="184"
          height="116"
          rx="14"
          fill="#0B0A10"
          stroke="#3A3346"
          strokeWidth="1.4"
        />
        <rect
          x="246"
          y="306"
          width="172"
          height="104"
          rx="9"
          fill="url(#ad-screen)"
        />
        <circle cx="256" cy="317" r="3" fill="#C9A227" />
        <rect x="264" y="314.5" width="56" height="5" rx="2.5" fill="#655E75" />
        <circle className="ad-blink" cx="406" cy="317" r="3" fill="#4ADE80" />
        <rect
          x="250"
          y="330"
          width="16"
          height="12"
          rx="3"
          fill="none"
          stroke="#3A3346"
          strokeWidth="1"
        />
        <rect
          x="274"
          y="330"
          width="16"
          height="12"
          rx="3"
          fill="#C9A227"
          opacity="0.9"
        />
        <rect
          x="298"
          y="330"
          width="16"
          height="12"
          rx="3"
          fill="none"
          stroke="#3A3346"
          strokeWidth="1"
        />
        <rect
          x="322"
          y="330"
          width="16"
          height="12"
          rx="3"
          fill="none"
          stroke="#3A3346"
          strokeWidth="1"
        />
        <rect
          x="346"
          y="330"
          width="16"
          height="12"
          rx="3"
          fill="#C9A227"
          opacity="0.9"
        />
        <rect
          x="370"
          y="330"
          width="16"
          height="12"
          rx="3"
          fill="none"
          stroke="#3A3346"
          strokeWidth="1"
        />
        <rect
          x="394"
          y="330"
          width="16"
          height="12"
          rx="3"
          fill="none"
          stroke="#3A3346"
          strokeWidth="1"
        />
        <rect
          x="250"
          y="348"
          width="16"
          height="12"
          rx="3"
          fill="none"
          stroke="#3A3346"
          strokeWidth="1"
        />
        <rect
          x="274"
          y="348"
          width="16"
          height="12"
          rx="3"
          fill="#C9A227"
          opacity="0.9"
        />
        <rect
          x="298"
          y="348"
          width="16"
          height="12"
          rx="3"
          fill="#C9A227"
          opacity="0.9"
        />
        <rect
          x="322"
          y="348"
          width="16"
          height="12"
          rx="3"
          fill="none"
          stroke="#3A3346"
          strokeWidth="1"
        />
        <rect
          className="ad-pulse"
          x="346"
          y="348"
          width="16"
          height="12"
          rx="3"
          fill="#E0B93A"
        />
        <rect
          x="370"
          y="348"
          width="16"
          height="12"
          rx="3"
          fill="#C9A227"
          opacity="0.9"
        />
        <rect
          x="394"
          y="348"
          width="16"
          height="12"
          rx="3"
          fill="none"
          stroke="#3A3346"
          strokeWidth="1"
        />
        <rect
          x="250"
          y="366"
          width="16"
          height="12"
          rx="3"
          fill="none"
          stroke="#3A3346"
          strokeWidth="1"
        />
        <rect
          x="274"
          y="366"
          width="16"
          height="12"
          rx="3"
          fill="#C9A227"
          opacity="0.9"
        />
        <rect
          x="298"
          y="366"
          width="16"
          height="12"
          rx="3"
          fill="none"
          stroke="#3A3346"
          strokeWidth="1"
        />
        <rect
          x="322"
          y="366"
          width="16"
          height="12"
          rx="3"
          fill="#C9A227"
          opacity="0.9"
        />
        <rect
          x="346"
          y="366"
          width="16"
          height="12"
          rx="3"
          fill="none"
          stroke="#3A3346"
          strokeWidth="1"
        />
        <rect
          x="370"
          y="366"
          width="16"
          height="12"
          rx="3"
          fill="#C9A227"
          opacity="0.9"
        />
        <rect
          x="394"
          y="366"
          width="16"
          height="12"
          rx="3"
          fill="none"
          stroke="#3A3346"
          strokeWidth="1"
        />
        <path
          className="ad-spark"
          pathLength="100"
          d="M250 400L268 396L286 401L304 393L322 397L340 390L358 394L376 387L408 392"
          stroke="#E0B93A"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      <ellipse
        cx="88"
        cy="364"
        rx="48"
        ry="46"
        fill="#000"
        opacity="0.35"
        filter="url(#ad-blur)"
      />
      <circle
        cx="80"
        cy="350"
        r="44"
        fill="url(#ad-cup)"
        stroke="#CFC6B2"
        strokeWidth="1"
      />
      <rect
        x="104"
        y="343"
        width="22"
        height="14"
        rx="7"
        fill="url(#ad-cup)"
        stroke="#CFC6B2"
        strokeWidth="1"
      />
      <circle
        cx="80"
        cy="350"
        r="31"
        fill="url(#ad-cup)"
        stroke="#CFC6B2"
        strokeWidth="1"
      />
      <circle cx="80" cy="350" r="25" fill="url(#ad-coffee)" />
      <path
        d="M80 360C68 352 70 342 76 342C79 342 80 345 80 346C80 345 81 342 84 342C90 342 92 352 80 360Z"
        fill="#F1DDBF"
        opacity="0.85"
      />
      <circle
        className="ad-ripple"
        cx="80"
        cy="350"
        r="9"
        stroke="#F1DDBF"
        strokeWidth="1.2"
      />
      <circle
        className="ad-steam"
        cx="80"
        cy="346"
        r="30"
        fill="url(#ad-steam)"
      />
      <circle
        className="ad-steam"
        style={{ animationDelay: "2s" }}
        cx="86"
        cy="350"
        r="26"
        fill="url(#ad-steam)"
      />
      <g transform="translate(412 398) rotate(-10)">
        <rect
          x="-44"
          y="-26"
          width="96"
          height="60"
          rx="7"
          fill="#000"
          opacity="0.35"
          filter="url(#ad-blur)"
        />
        <rect
          x="-48"
          y="-30"
          width="96"
          height="60"
          rx="7"
          fill="url(#ad-card)"
          stroke="#4A4458"
          strokeWidth="1"
        />
        <rect
          x="-38"
          y="-14"
          width="20"
          height="15"
          rx="3"
          fill="url(#ad-chip)"
        />
        <path d="M-28 -14V1M-38 -6.5H-18" stroke="#8A6310" strokeWidth="0.8" />
        <path
          d="M-8 -6q5 6 0 12M-1 -9q8 9 0 18M6 -12q11 12 0 24"
          stroke="#E0B93A"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <text
          x="-38"
          y="21"
          fontSize="7"
          fontWeight="700"
          fill="#E0B93A"
          fontFamily="system-ui, sans-serif"
          letterSpacing="2"
        >
          HOTEL
        </text>
        <g clipPath="url(#ad-cardclip)">
          <rect
            className="ad-shimmer"
            x="-70"
            y="-40"
            width="20"
            height="80"
            fill="#fff"
            opacity="0.2"
            transform="skewX(-20)"
          />
        </g>
      </g>
      <g transform="translate(446 108)">
        <path
          className="ad-twinkle"
          style={{ animationDelay: "0s" }}
          d="M0 -7L1.8 -1.8L7 0L1.8 1.8L0 7L-1.8 1.8L-7 0L-1.8 -1.8Z"
          fill="#fff"
        />
      </g>
      <g transform="translate(470 132)">
        <path
          className="ad-twinkle"
          style={{ animationDelay: "1.1s" }}
          d="M0 -7L1.8 -1.8L7 0L1.8 1.8L0 7L-1.8 1.8L-7 0L-1.8 -1.8Z"
          fill="#fff"
        />
      </g>
      <g transform="translate(436 134)">
        <path
          className="ad-twinkle"
          style={{ animationDelay: "2.2s" }}
          d="M0 -7L1.8 -1.8L7 0L1.8 1.8L0 7L-1.8 1.8L-7 0L-1.8 -1.8Z"
          fill="#fff"
        />
      </g>
      <g transform="translate(486 230)">
        <path
          className="ad-twinkle"
          style={{ animationDelay: "3.0s" }}
          d="M0 -7L1.8 -1.8L7 0L1.8 1.8L0 7L-1.8 1.8L-7 0L-1.8 -1.8Z"
          fill="#fff"
        />
      </g>
      <g transform="translate(430 384)">
        <path
          className="ad-twinkle"
          style={{ animationDelay: "1.7s" }}
          d="M0 -7L1.8 -1.8L7 0L1.8 1.8L0 7L-1.8 1.8L-7 0L-1.8 -1.8Z"
          fill="#fff"
        />
      </g>
      <g transform="translate(300 150)">
        <path
          className="ad-twinkle"
          style={{ animationDelay: "3.6s" }}
          d="M0 -7L1.8 -1.8L7 0L1.8 1.8L0 7L-1.8 1.8L-7 0L-1.8 -1.8Z"
          fill="#fff"
        />
      </g>
    </svg>
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
          <AdminArt />
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
          <AdminArt />
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

        /* ---- desk scene ---- */
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
        @keyframes ad-bell {
          0%,
          68% {
            transform: scale(1);
          }
          70% {
            transform: scale(0.9);
          }
          74% {
            transform: scale(1.04);
          }
          80%,
          100% {
            transform: scale(1);
          }
        }
        @keyframes ad-wave {
          0%,
          69% {
            opacity: 0;
            transform: scale(1);
          }
          70% {
            opacity: 0.85;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.9);
          }
        }
        @keyframes ad-tag {
          from {
            transform: rotate(-4deg);
          }
          to {
            transform: rotate(4deg);
          }
        }
        @keyframes ad-plant {
          from {
            transform: rotate(-1.6deg);
          }
          to {
            transform: rotate(1.6deg);
          }
        }
        @keyframes ad-write {
          0%,
          4% {
            stroke-dashoffset: 100;
            opacity: 1;
          }
          50%,
          88% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          95%,
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }
        @keyframes ad-pen {
          0%,
          4% {
            transform: translate(0px, 0px);
          }
          50% {
            transform: translate(96px, -3px);
          }
          56% {
            transform: translate(96px, -14px);
          }
          72% {
            transform: translate(0px, -14px);
          }
          78%,
          100% {
            transform: translate(0px, 0px);
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
        @keyframes ad-spark {
          0% {
            stroke-dashoffset: 100;
          }
          50%,
          85% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -100;
          }
        }
        @keyframes ad-steam {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.8);
          }
          35% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
            transform: translateY(-26px) scale(1.25);
          }
        }
        @keyframes ad-ripple {
          0% {
            opacity: 0.8;
            transform: scale(0.5);
          }
          100% {
            opacity: 0;
            transform: scale(2.6);
          }
        }
        @keyframes ad-shimmer {
          0%,
          55% {
            transform: translateX(0) skewX(-20deg);
          }
          100% {
            transform: translateX(170px) skewX(-20deg);
          }
        }
        @keyframes ad-twinkle {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.3) rotate(0deg);
          }
          50% {
            opacity: 0.95;
            transform: scale(1) rotate(45deg);
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
          transform-origin: 280px 230px;
          animation: ad-spin 70s linear infinite;
        }
        .ad-ring-rev {
          animation-duration: 110s;
          animation-direction: reverse;
        }
        .ad-bell {
          transform-box: view-box;
          transform-origin: 455px 120px;
          animation: ad-bell 5s ease-in-out infinite;
        }
        .ad-wave {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: ad-wave 5s ease-out infinite;
        }
        .ad-tag {
          transform-box: view-box;
          transform-origin: 480px 244px;
          animation: ad-tag 3.6s ease-in-out infinite alternate;
        }
        .ad-plant {
          transform-box: view-box;
          transform-origin: 60px 70px;
          animation: ad-plant 5s ease-in-out infinite alternate;
        }
        .ad-write {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: ad-write 7s linear infinite;
        }
        .ad-pen {
          animation: ad-pen 7s linear infinite;
        }
        .ad-pulse {
          animation: ad-pulse 2s ease-in-out infinite;
        }
        .ad-spark {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: ad-spark 6s ease-in-out infinite;
        }
        .ad-steam {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: ad-steam 5.5s ease-out infinite;
        }
        .ad-ripple {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: ad-ripple 3s ease-out infinite;
        }
        .ad-shimmer {
          animation: ad-shimmer 5s ease-in-out infinite;
        }
        .ad-twinkle {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: ad-twinkle 5s ease-in-out infinite;
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
          .ad-bell,
          .ad-wave,
          .ad-tag,
          .ad-plant,
          .ad-write,
          .ad-pen,
          .ad-pulse,
          .ad-spark,
          .ad-steam,
          .ad-ripple,
          .ad-shimmer,
          .ad-twinkle,
          .ad-blink,
          .ad-up,
          .ad-bokeh,
          .ad-chip,
          .ad-ping {
            animation: none !important;
          }
          .ad-write,
          .ad-spark {
            stroke-dashoffset: 0;
          }
          .ad-up {
            opacity: 1;
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
