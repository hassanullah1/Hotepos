// app/about/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import LoadingScreen from "@/components/LoadingScreen";
import { fraunces as displayFont } from "@/app/fonts/fraunces";
import {
  Sparkles,
  Building2,
  Users,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";



const aboutText = {
  en: {
    badge: "About us",
    titleA: "Built for the people",
    titleHighlight: "behind the front desk",
    subtitle:
      "Melmah is a hotel management system made for Afghan hotels — simple, fast, and reliable.",
    loading: "Loading…",
    values: [
      {
        title: "Simple by design",
        body: "Every screen is built so your team can learn it in minutes, not weeks.",
      },
      {
        title: "Built for here",
        body: "Made for the way hotels actually run across Afghanistan.",
      },
      {
        title: "Always supported",
        body: "Real help, real people, whenever you need it.",
      },
    ],
    storyLabel: "Our story",
    storyText:
      "We started Melmah after watching too many hotels lose hours to spreadsheets, paper slips, and apps that weren't built for them. One system, one place for everything — that's the idea.",
    ctaTitle: "Ready to see it in action?",
    ctaButton: "View pricing",
    ctaSecondary: "Sign in",
  },
  ps: {
    badge: "زموږ په اړه",
    titleA: "د هغو خلکو لپاره جوړ شوی",
    titleHighlight: "چې د استقبال تر شا دي",
    subtitle:
      "ستیوو یو د هوټل مدیریت سیستم دی چې د افغان هوټلونو لپاره جوړ شوی — ساده، ګړندی او باوري.",
    loading: "بارول…",
    values: [
      {
        title: "په ډیزاین ساده",
        body: "هره پرده د دې لپاره جوړه شوې چې ټیم یې په دقیقو کې زده کړي، نه په اونیو.",
      },
      {
        title: "دلته لپاره جوړ شوی",
        body: "د هغه ډول جوړ شوی چې هوټلونه په افغانستان کې واقعی کار کوي.",
      },
      {
        title: "تل ملاتړ شوي",
        body: "ریښتینی مرستې، ریښتینی خلک، هر کله چې ورته اړتیا ولرئ.",
      },
    ],
    storyLabel: "زموږ کیسه",
    storyText:
      "موږ ستیوو هغه وخت پیل کړ کله چې ولیدل ډېر هوټلونه خپل ساعتونه د سپریډ شیټونو، کاغذي ټکټونو او هغو اپلیکیشنونو سره له لاسه ورکوي چې د دوی لپاره نه و جوړ شوي. یو سیستم، یو ځای د هر څه لپاره — دا مفکوره ده.",
    ctaTitle: "چمتو یاست چې په عمل کې یې وګورئ؟",
    ctaButton: "بیې وګورئ",
    ctaSecondary: "ننوتل",
  },
  prs: {
    badge: "درباره ما",
    titleA: "ساخته‌شده برای کسانی",
    titleHighlight: "که پشت میز پذیرش هستند",
    subtitle:
      "ستیوو یک سیستم مدیریت هوتل است که برای هوتل‌های افغانستان ساخته شده — ساده، سریع و قابل اعتماد.",
    loading: "در حال بارگذاری…",
    values: [
      {
        title: "ساده به‌طور طراحی",
        body: "هر صفحه طوری ساخته شده که تیم شما در چند دقیقه یاد بگیرد، نه چند هفته.",
      },
      {
        title: "ساخته‌شده برای اینجا",
        body: "برای همان روشی ساخته شده که هوتل‌ها در افغانستان واقعاً کار می‌کنند.",
      },
      {
        title: "همیشه پشتیبانی می‌شود",
        body: "کمک واقعی، افراد واقعی، هر زمان که نیاز داشته باشید.",
      },
    ],
    storyLabel: "داستان ما",
    storyText:
      "ما ستیوو را زمانی شروع کردیم که دیدیم بسیاری از هوتل‌ها ساعت‌های خود را با صفحه‌گسترده، رسیدهای کاغذی و اپلیکیشن‌هایی که برای آن‌ها ساخته نشده بود از دست می‌دهند. یک سیستم، یک جا برای همه چیز — این ایده است.",
    ctaTitle: "آماده‌اید آن را در عمل ببینید؟",
    ctaButton: "مشاهده قیمت‌ها",
    ctaSecondary: "ورود",
  },
};

export default function AboutPage() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const lang = aboutText[language] ? language : "en";
  const t = aboutText[lang];
  const isRTL = lang === "ps" || lang === "prs";
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Apply dir to the document like the login page does
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  }, [lang, mounted, isRTL]);

  if (!mounted) {
    return <LoadingScreen text={aboutText.en.loading} fullScreen />;
  }

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-hidden bg-[#15121C] text-[#F0EAE2]`}
    >
      {/* Table-grid texture — same signature as the rest of the site */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
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
              stroke="#F0EAE2"
              strokeWidth="1"
            />
          )),
        )}
      </svg>

      {/* Drifting ambient gold blobs */}
      <div
        className="blob-a pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#C9A227]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="blob-b pointer-events-none absolute top-40 -right-32 h-96 w-96 rounded-full bg-[#C9A227]/8 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl px-6 py-20 sm:py-28">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-3 py-1 text-xs font-semibold text-[#C9A227]">
            <Sparkles size={12} />
            {t.badge}
          </span>

          <h1
            className="mt-5 text-4xl font-medium tracking-tight text-[#F0EAE2] sm:text-5xl md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.titleA}{" "}
            <span
              className={"text-[#C9A227] " + (isRTL ? "not-italic" : "italic")}
            >
              {t.titleHighlight}
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[#B7B2C4]">
            {t.subtitle}
          </p>
        </div>

        {/* Three value cards — kept short */}
        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {t.values.map((v, i) => {
            const Icon = [Building2, Users, ShieldCheck][i] || Building2;
            return (
              <div
                key={i}
                className="group rounded-2xl border border-[#2E2938] bg-[#1E1B26]/90 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A227]/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Icon size={18} />
                </div>
                <h3
                  className="mt-4 text-base font-medium text-[#F0EAE2]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {v.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#B7B2C4]">
                  {v.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* Short story block */}
        <div className="mt-16 rounded-2xl border border-[#2E2938] bg-[#1E1B26]/90 p-8 backdrop-blur-sm sm:p-10">
          <p
            className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A227]"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {t.storyLabel}
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[#F0EAE2] sm:text-xl">
            {t.storyText}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2
            className="text-2xl font-medium text-[#F0EAE2] sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.ctaTitle}
          </h2>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A227] to-[#A9821E] px-6 py-3 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/30 active:translate-y-0 active:scale-[0.98]"
            >
              {t.ctaButton}
              <ArrowIcon
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
              />
            </Link>

            <Link
              href="/hotel/login"
              className="inline-flex items-center gap-2 rounded-lg border border-[#332C3E] px-6 py-3 text-sm font-semibold text-[#F0EAE2] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A227] hover:text-[#C9A227]"
            >
              {t.ctaSecondary}
            </Link>
          </div>
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
