"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  Building2,
  MonitorSmartphone,
  Sparkles,
  Crown,
  Zap,
  Store,
  Rocket,
  Gem,
  ChevronDown,
  Infinity as InfinityIcon,
} from "lucide-react";
import { Fraunces } from "next/font/google";
import { useTranslation } from "@/hooks/useTranslation";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const PLANS_ENDPOINT = "/api/public/subscription-plans";
const VISIBLE_FEATURES = 5;

// Icons cycle by position, so any number of plans works.
const TIER_ICONS = [Store, Building2, Zap, Rocket, Crown, Gem];

const isNil = (v) => v === null || v === undefined;

/* ---------- hooks ---------- */

function useCountUp(value, duration = 900) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (isNil(value)) return undefined;
    const start = prevRef.current ?? 0;
    const end = value;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      else prevRef.current = end;
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return display;
}

// Italic breaks Arabic-script letters (Pashto, Dari), so we read <html dir>.
function useIsRTL() {
  const [isRTL, setIsRTL] = useState(false);
  useEffect(() => {
    const read = () =>
      setIsRTL(document.documentElement.getAttribute("dir") === "rtl");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir", "lang"],
    });
    return () => observer.disconnect();
  }, []);
  return isRTL;
}

/* ---------- small pieces ---------- */

function AnimatedPrice({ value }) {
  const animated = useCountUp(value ?? 0);
  return <>{Math.round(animated).toLocaleString()}</>;
}

// Capacity meter: bar length is relative to the biggest plan, so people
// can compare plans at a glance. Unlimited = full striped bar + infinity.
function Meter({ icon: Icon, label, value, max, visible, delay }) {
  const unlimited = isNil(value);
  const pct = unlimited ? 100 : Math.max(8, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-[#CFCADB]">
        <Icon size={14} className="shrink-0 text-[#C9A227]" />
        <span className="flex-1">{label}</span>
        {unlimited && <InfinityIcon size={15} className="text-[#E0B93A]" />}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#2A2534]">
        <div
          className={
            "h-full rounded-full transition-[width] duration-1000 ease-out " +
            (unlimited
              ? "meter-unlimited"
              : "bg-gradient-to-r from-[#A9821E] to-[#E0B93A]")
          }
          style={{
            width: visible ? `${pct}%` : "0%",
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

function PlanCTA({ plan, featured, t }) {
  const isCustom = isNil(plan.price_monthly);
  const href = isCustom
    ? "/contact"
    : `/signup?plan=${encodeURIComponent(plan.id)}`;
  return (
    <Link
      href={href}
      className={
        "inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0B93A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1B26] " +
        (featured
          ? "bg-gradient-to-r from-[#E0B93A] to-[#C9A227] text-[#1D1707] shadow-lg shadow-[#C9A227]/25 hover:shadow-[#C9A227]/40"
          : "border border-[#3A3347] text-[#F0EAE2] hover:border-[#C9A227] hover:bg-[#C9A227]/10 hover:text-[#E0B93A]")
      }
    >
      {isCustom ? t.pricingTalkToSales : t.pricingGetStarted}
    </Link>
  );
}

/* ---------- plan card ---------- */

function PlanCard({
  plan,
  index,
  featured,
  mounted,
  maxes,
  t,
  isRTL,
  widthClass,
}) {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef(null);
  const Icon = TIER_ICONS[index % TIER_ICONS.length];
  const hasPrice = !isNil(plan.price_monthly);
  const features = Array.isArray(plan.features) ? plan.features : [];
  const shown = expanded ? features : features.slice(0, VISIBLE_FEATURES);
  const hidden = features.length - VISIBLE_FEATURES;
  const delay = Math.min(index, 8) * 90;

  const branchLabel = isNil(plan.max_branches)
    ? t.pricingBranchesUnlimited
    : plan.max_branches === 1
      ? t.pricingBranchesSingular
      : t.pricingBranchesPlural.replace("{count}", plan.max_branches);

  const posLabel = isNil(plan.max_pos_devices)
    ? t.pricingPosUnlimited
    : plan.max_pos_devices === 1
      ? t.pricingPosSingular
      : t.pricingPosPlural.replace("{count}", plan.max_pos_devices);

  // Cursor-following spotlight (responds to the person's pointer)
  function onMove(e) {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <div
      className={`${widthClass} transition-all duration-700 ease-out ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ transitionDelay: mounted ? `${delay}ms` : "0ms" }}
    >
      <div
        ref={cardRef}
        onMouseMove={onMove}
        className={
          "plan-card group relative h-full overflow-hidden rounded-[22px] p-px " +
          (featured ? "shadow-2xl shadow-[#C9A227]/20" : "")
        }
      >
        {/* Border: spinning gold light for the featured plan, quiet line for the rest */}
        {featured ? (
          <div className="spin-border pointer-events-none absolute inset-0" />
        ) : (
          <div className="pointer-events-none absolute inset-0 bg-[#2E2938] transition-colors duration-300 group-hover:bg-[#C9A227]/50" />
        )}

        <div className="relative flex h-full flex-col rounded-[21px] bg-[#1B1823] p-6">
          {/* Spotlight */}
          <div className="spotlight pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {featured && (
            <span className="absolute top-4 end-4 inline-flex items-center gap-1 rounded-full bg-[#C9A227]/15 px-2.5 py-1 text-[11px] font-semibold text-[#E0B93A]">
              <Sparkles size={11} className="sparkle-spin" />
              {t.pricingMostPopular}
            </span>
          )}

          {/* Title block */}
          <div className="relative flex items-center gap-3">
            <div
              className={
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
                (featured
                  ? "bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707]"
                  : "bg-[#2A2534] text-[#C9A227]")
              }
            >
              <Icon size={19} />
            </div>
            <h3
              className="text-xl font-semibold text-[#F0EAE2]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {plan.name}
            </h3>
          </div>

          {plan.description && (
            <p className="relative mt-3 min-h-[2.75rem] text-sm leading-relaxed text-[#9691A6]">
              {plan.description}
            </p>
          )}

          {/* Price */}
          <div className="relative mt-5 flex items-baseline gap-1">
            {hasPrice ? (
              <>
                <span className="text-2xl font-semibold text-[#C9A227]">$</span>
                <span
                  className="text-5xl font-bold tabular-nums tracking-tight text-[#F0EAE2]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {mounted ? (
                    <AnimatedPrice value={Number(plan.price_monthly)} />
                  ) : (
                    0
                  )}
                </span>
                <span className="text-sm font-medium text-[#6E687A]">/mo</span>
              </>
            ) : (
              <span
                className={
                  "text-4xl font-semibold text-[#F0EAE2] " +
                  (isRTL ? "not-italic" : "italic")
                }
                style={{ fontFamily: "var(--font-display)" }}
              >
                Custom
              </span>
            )}
          </div>

          <div className="relative mt-5">
            <PlanCTA plan={plan} featured={featured} t={t} />
          </div>

          {/* Capacity meters */}
          <div className="relative mt-6 space-y-4 rounded-xl bg-[#15121C] p-4">
            <Meter
              icon={Building2}
              label={branchLabel}
              value={plan.max_branches}
              max={maxes.branches}
              visible={mounted}
              delay={delay + 300}
            />
            <Meter
              icon={MonitorSmartphone}
              label={posLabel}
              value={plan.max_pos_devices}
              max={maxes.pos}
              visible={mounted}
              delay={delay + 380}
            />
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="relative mt-5 flex-1">
              <ul className="space-y-2.5">
                {shown.map((feature, i) => (
                  <li
                    key={`${feature}-${i}`}
                    className="flex items-start gap-2.5 text-sm text-[#B7B2C4]"
                  >
                    <Check
                      size={15}
                      strokeWidth={2.5}
                      className="mt-0.5 shrink-0 text-[#C9A227]"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {hidden > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  className="mt-3 inline-flex items-center gap-1 rounded text-xs font-semibold text-[#C9A227] hover:text-[#E0B93A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/60"
                >
                  {expanded
                    ? t.pricingShowLess || "Show less"
                    : `${t.pricingShowMore || "Show more"} (+${hidden})`}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

// Full class strings so Tailwind can see them. Rows with leftovers are
// centered, so 4, 5, 6, 7... plans all look balanced.
function widthFor(count) {
  const base = "w-full sm:w-[calc(50%-12px)]";
  if (count <= 3) return `${base} lg:w-[calc(33.333%-16px)]`;
  if (count === 4 || count >= 7)
    return `${base} lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)]`;
  return `${base} lg:w-[calc(33.333%-16px)]`;
}

export default function PricingPage() {
  const t = useTranslation();
  const isRTL = useIsRTL();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    let cancelled = false;
    async function loadPlans() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(PLANS_ENDPOINT);
        if (!res.ok) throw new Error(tRef.current.pricingErrorLoad);
        const data = await res.json();
        if (!cancelled) {
          const active = (data.plans || []).filter(
            (p) => p.is_active !== false,
          );
          // Cheapest first, "Custom" (no price) always last
          active.sort((a, b) => {
            if (isNil(a.price_monthly)) return isNil(b.price_monthly) ? 0 : 1;
            if (isNil(b.price_monthly)) return -1;
            return Number(a.price_monthly) - Number(b.price_monthly);
          });
          setPlans(active);
          requestAnimationFrame(() => setMounted(true));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || tRef.current.pricingErrorLoad);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredId = useMemo(() => {
    if (!plans.length) return null;
    const flagged = plans.find((p) => p.is_popular);
    if (flagged) return flagged.id;
    return plans[Math.floor((plans.length - 1) / 2)]?.id ?? null;
  }, [plans]);

  // Biggest finite limits, used to scale every meter
  const maxes = useMemo(() => {
    const max = (key) =>
      Math.max(
        1,
        ...plans
          .map((p) => p[key])
          .filter((v) => !isNil(v))
          .map(Number),
      );
    return { branches: max("max_branches"), pos: max("max_pos_devices") };
  }, [plans]);

  const widthClass = widthFor(loading ? 4 : plans.length);

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-hidden bg-[#15121C]`}
    >
      {/* Table-grid pattern */}
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

      <div className="blob-a pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#C9A227]/10 blur-3xl" />
      <div className="blob-b pointer-events-none absolute top-40 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
         
          <h1
            className="mt-5 text-xl font-medium tracking-tight text-[#F0EAE2] sm:text-2xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.pricingTitleBefore}{" "}
            <span
              className={"text-[#C9A227] " + (isRTL ? "not-italic" : "italic")}
            >
              {t.pricingTitleHighlight}
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base text-[#B7B2C4]">
            {t.pricingSubtitle}
          </p>
        </div>

        {error && (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-[#E5484D]/50 bg-[#E5484D]/10 px-4 py-3 text-center text-sm text-[#FF9B9E]">
            {error}. {t.pricingReload}
          </div>
        )}

        {/* Plans: wrapping flex so any count works and the last row stays centered */}
        <div className="mt-16 flex flex-wrap justify-center gap-6">
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <div key={i} className={widthClass}>
                <div className="h-[460px] animate-pulse rounded-[22px] border border-[#2E2938] bg-[#1B1823] p-6">
                  <div className="h-10 w-10 rounded-xl bg-[#2A2534]" />
                  <div className="mt-5 h-4 w-28 rounded bg-[#2A2534]" />
                  <div className="mt-8 h-12 w-32 rounded bg-[#2A2534]" />
                  <div className="mt-6 h-11 w-full rounded-xl bg-[#2A2534]" />
                </div>
              </div>
            ))
          ) : plans.length === 0 ? (
            <div className="w-full rounded-2xl border border-[#2E2938] bg-[#1B1823] py-16 text-center text-sm text-[#9691A6]">
              {t.pricingNoPlans}
            </div>
          ) : (
            plans.map((plan, idx) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={idx}
                featured={plan.id === featuredId}
                mounted={mounted}
                maxes={maxes}
                t={t}
                isRTL={isRTL}
                widthClass={widthClass}
              />
            ))
          )}
        </div>

        <p className="mx-auto mt-14 max-w-md text-center text-xs text-[#6E687A]">
          {t.pricingNote}
        </p>
      </div>

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
          animation: drift-a 9s ease-in-out infinite;
        }
        .blob-b {
          animation: drift-b 11s ease-in-out infinite;
        }

        @keyframes sparkle-turn {
          0%,
          100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(20deg);
          }
        }
        .sparkle-spin {
          animation: sparkle-turn 1.8s ease-in-out infinite;
        }

        @property --angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spin-border {
          to {
            --angle: 360deg;
          }
        }
        .spin-border {
          background: conic-gradient(
            from var(--angle),
            #2e2938 0deg,
            #2e2938 230deg,
            #e0b93a 300deg,
            #2e2938 360deg
          );
          animation: spin-border 6s linear infinite;
        }

        .plan-card .spotlight {
          background: radial-gradient(
            320px circle at var(--mx, 50%) var(--my, 0%),
            rgba(201, 162, 39, 0.13),
            transparent 65%
          );
        }

        .meter-unlimited {
          background: repeating-linear-gradient(
            -45deg,
            #e0b93a 0 6px,
            #a9821e 6px 12px
          );
        }

        @media (prefers-reduced-motion: reduce) {
          .blob-a,
          .blob-b,
          .sparkle-spin,
          .spin-border {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
