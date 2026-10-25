"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const AUTO_DISMISS_MS = 4500;

const CONFETTI_COLORS = [
  "#0d9488", // teal-600
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#fbbf24", // amber-400
  "#14b8a6", // teal-500
  "#34d399", // emerald-400
];

export default function AdminSetupSuccess({ onDone }: { onDone: () => void }) {
  const { t, dir } = useAdminPreferences();
  const s = t?.setup?.successModal || {};

  const [exiting, setExiting] = useState(false);

  // Deterministic confetti — no Math.random, so it renders identically
  // on every mount and never triggers a hydration warning.
  const confetti = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        left: `${(i * 47 + 13) % 100}%`,
        delay: `${((i * 0.17) % 3).toFixed(2)}s`,
        duration: `${(2.8 + ((i * 0.29) % 1.6)).toFixed(2)}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        width: 5 + (i % 4) * 2,
        height: 8 + (i % 3) * 3,
        borderRadius: i % 3 === 0 ? "50%" : "1px",
      })),
    [],
  );

  function dismiss() {
    if (exiting) return;
    setExiting(true);
    setTimeout(onDone, 320);
  }

  useEffect(() => {
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      dir={dir}
      onClick={dismiss}
      className={`fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-[#0a1f2e]/70 backdrop-blur-md p-4 transition-opacity duration-300 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* ── Confetti layer ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c, i) => (
          <span
            key={i}
            className="confetti-piece absolute top-0"
            style={{
              left: c.left,
              width: c.width,
              height: c.height,
              backgroundColor: c.color,
              borderRadius: c.borderRadius,
              animationDelay: c.delay,
              animationDuration: c.duration,
            }}
          />
        ))}
      </div>

      {/* ── Card ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`card-enter relative w-full max-w-md rounded-3xl border border-white/20 bg-gradient-to-br from-white to-teal-50 p-7 text-center shadow-2xl shadow-teal-900/40 transition-transform duration-300 dark:from-teal-950 dark:to-teal-900 ${
          exiting ? "scale-95" : "scale-100"
        }`}
      >
        {/* Icon with pulsing rings + sparkles */}
        <div className="relative mx-auto mb-5 h-24 w-24">
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30 [animation-duration:1.8s]" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-emerald-400/20" />
          <div className="relative grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/50">
            <Check size={44} strokeWidth={3} />
          </div>
          <Sparkles
            size={20}
            className="absolute -end-1 -top-1 animate-pulse text-amber-400"
          />
          <Sparkles
            size={14}
            className="absolute -bottom-1 -start-1 animate-pulse text-amber-400 [animation-delay:400ms]"
          />
        </div>

        <h2
          className="text-2xl font-bold text-teal-950 dark:text-teal-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {s.title || "Congratulations! 🎉"}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-teal-700/80 dark:text-teal-300/80">
          {s.body ||
            "You're all set. Now you can work digitally and grow with the Melmah app."}
        </p>

        {/* Auto-dismiss progress bar */}
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-teal-100 dark:bg-teal-900/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
            style={{
              animation: `progress ${AUTO_DISMISS_MS}ms linear forwards`,
            }}
          />
        </div>
        <p className="mt-2 text-[11px] text-teal-700/60 dark:text-teal-300/60">
          {s.opening || "Opening your dashboard…"}
        </p>

        <button
          type="button"
          onClick={dismiss}
          className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
        >
          {s.goNow || "Go now"}
          <ArrowRight size={15} className="rtl:-scale-x-100" />
        </button>
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .confetti-piece {
          animation-name: confetti-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        @keyframes card-enter {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(8px);
          }
          60% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .card-enter {
          animation: card-enter 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .confetti-piece {
            animation: none !important;
            display: none;
          }
          .card-enter {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
