"use client";

import { useEffect, useState } from "react";
import {
  BedDouble,
  UtensilsCrossed,
  Receipt,
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  Building2,
  ShoppingBag,
  LogIn,
  Sparkles,
  Check,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function Hero({
  stats,
  isRTL,
  onPrimaryCta,
  onSecondaryCta,
 
}) {
  const t = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [displayTitle, setDisplayTitle] = useState("");
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [counts, setCounts] = useState({ hotels: 0, cities: 0, orders: 0 });

  const fullTitle = t.heroTitle || "Run every hotel operation from one screen";
  const subtitle =
    t.heroSubtitle ||
    "Melmah brings bookings, food orders, receipts and daily checklists into a single system built for how hotel teams actually work.";

  const statHotelsLabel = t.heroStatHotels || "Hotels onboard";
  const statCitiesLabel = t.heroStatCities || "Cities";
  const statOrdersLabel = t.heroStatOrders || "Orders processed";

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  // Entrance
  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Typing animation
  useEffect(() => {
    if (!loaded) return;
    let index = 0;
    const interval = setInterval(() => {
      setDisplayTitle(fullTitle.slice(0, index + 1));
      index++;
      if (index === fullTitle.length) {
        clearInterval(interval);
        setTimeout(() => setShowSubtitle(true), 350);
        setTimeout(() => setShowActions(true), 700);
        setTimeout(() => setShowStats(true), 1100);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [loaded, fullTitle]);

  // Count-up animation
  useEffect(() => {
    if (!showStats) return;
    const targetHotels = parseInt(stats?.hotels) || 40;
    const targetCities = parseInt(stats?.cities) || 6;
    const targetOrders =
      parseInt(String(stats?.orders).replace(/,/g, "")) || 12000;

    const duration = 1500;
    const startTime = performance.now();

    const updateCounts = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounts({
        hotels: Math.floor(ease * targetHotels),
        cities: Math.floor(ease * targetCities),
        orders: Math.floor(ease * targetOrders),
      });
      if (progress < 1) requestAnimationFrame(updateCounts);
    };
    requestAnimationFrame(updateCounts);
  }, [showStats, stats]);

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="relative min-h-screen overflow-hidden bg-[#0B1220]"
    >
      {/* Brass glow (top-right) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, #C9A227 0%, transparent 70%)",
        }}
      />

      {/* Second glow (bottom-left) */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-30%] left-[-15%] h-[500px] w-[500px] rounded-full opacity-10 blur-3xl"
        style={{
          background: "radial-gradient(circle, #5B93BF 0%, transparent 70%)",
        }}
      />

      {/* Grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#F1ECDD 1px, transparent 1px), linear-gradient(90deg, #F1ECDD 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ===== OVERLAY CONTENT ===== */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
        {/* Eyebrow badge */}
        <div
          className={`mb-6 inline-flex items-center gap-2 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E0B93A] transition-all duration-700 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          <Sparkles size={12} />
          {t.heroBadge || "Hotel operations, simplified"}
        </div>

        {/* Title with typing effect */}
        <h1
          className="max-w-3xl min-h-[4rem] font-serif text-4xl leading-[1.1] text-white drop-shadow-lg sm:text-5xl lg:text-[3.8rem]"
          style={{
            fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)",
          }}
        >
          {displayTitle}
          <span className="ml-1 inline-block h-[0.8em] w-[2px] animate-pulse-fast bg-[#C9A227] align-middle" />
        </h1>

        {/* Subtitle */}
        <p
          className={`mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 drop-shadow-md transition-all duration-700 ${
            showSubtitle
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          {subtitle}
        </p>

        {/* ===== THREE PRIMARY ACTIONS (compact) ===== */}
        <div
          className={`mt-10 flex flex-wrap items-center justify-center gap-3 transition-all duration-700 ${
            showActions
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
        >
          {/* Register Hotel — gold */}
          <button
            type="button"
            onClick={onPrimaryCta}
            className="group inline-flex items-center gap-2 rounded-xl border border-[#C9A227]/60 bg-gradient-to-b from-[#C9A227] to-[#b8902c] px-5 py-2.5 text-sm font-semibold text-[#0B1220] shadow-lg shadow-[#C9A227]/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#C9A227]/40"
          >
            <Building2 size={16} strokeWidth={2.25} />
            <span>{t.heroRegister || "Register your hotel"}</span>
            <Arrow
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
            />
          </button>

          {/* Login as Admin — outlined */}
          <button
            type="button"
            onClick={onSecondaryCta}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/[0.08]"
          >
            <LogIn size={16} strokeWidth={2.25} />
            <span>{t.heroLogin || "Login as Admin"}</span>
            <Arrow
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
            />
          </button>
        </div>

        {/* Hint row under buttons */}
        <div
          className={`mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11px] text-slate-500 transition-all duration-700 ${
            showActions ? "opacity-100" : "opacity-0"
          }`}
        >
          <span>{t.heroRegisterHint || "Set up in minutes"}</span>
          <span className="hidden sm:inline">·</span>
          <span>{t.heroOrderHint || "From any hotel near you"}</span>
          <span className="hidden sm:inline">·</span>
          <span>{t.heroLoginHint || "Owners, managers & staff"}</span>
        </div>

        {/* ===== Feature chips row ===== */}
        <div
          className={`mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-slate-400 transition-all duration-700 ${
            showActions ? "opacity-100" : "opacity-0"
          }`}
        >
          {[
            t.heroFeature1 || "Multi-branch",
            t.heroFeature2 || "Online orders",
            t.heroFeature3 || "Room management",
            t.heroFeature4 || "Staff & payroll",
          ].map((label, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <Check size={11} className="text-[#C9A227]" />
              {label}
            </span>
          ))}
        </div>

        {/* ===== Stats ===== */}
        <dl
          className={`mt-14 flex flex-wrap justify-center gap-x-12 gap-y-6 border-t border-white/10 pt-10 transition-all duration-700 ${
            showStats ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div>
            <dt className="text-sm text-slate-400">{statHotelsLabel}</dt>
            <dd
              className="mt-1 text-3xl text-white"
              style={{
                fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)",
              }}
            >
              {counts.hotels}+
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-400">{statCitiesLabel}</dt>
            <dd
              className="mt-1 text-3xl text-white"
              style={{
                fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)",
              }}
            >
              {counts.cities}+
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-400">{statOrdersLabel}</dt>
            <dd
              className="mt-1 text-3xl text-white"
              style={{
                fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)",
              }}
            >
              {counts.orders.toLocaleString()}+
            </dd>
          </div>
        </dl>
      </div>

      <style jsx>{`
        @keyframes pulseFast {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        .animate-pulse-fast {
          animation: pulseFast 0.7s step-end infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-fast {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
