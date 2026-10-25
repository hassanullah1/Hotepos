"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

// Long enough for the mascot, confetti and all 3 chips to play, then go.
const AUTO_DISMISS_MS = 4500;

const CONFETTI_COLORS = [
  "#14b8a6", // teal
  "#34d399", // mint
  "#fbbf24", // sunny
  "#fb7185", // rose
  "#a78bfa", // lilac
  "#38bdf8", // sky
];

type Piece = {
  style: CSSProperties;
  shape: "dot" | "bar" | "star";
};

export default function AdminSetupSuccess({ onDone }: { onDone: () => void }) {
  const { t, dir } = useAdminPreferences();
  const s = t?.setup?.successModal || {};

  const [exiting, setExiting] = useState(false);

  // Only use steps that the active language actually defines.
  // Missing → render nothing (no English leaking into a localized screen).
  const steps: string[] = useMemo(
    () => (Array.isArray(s.steps) ? s.steps.filter(Boolean) : []),
    [s.steps],
  );

  // Deterministic confetti burst: no Math.random, so server and client
  // always render the same markup (no hydration warnings).
  const confetti = useMemo<Piece[]>(
    () =>
      Array.from({ length: 38 }, (_, i) => {
        const angle = (i * 137.5 * Math.PI) / 180; // golden angle spread
        const dist = 130 + ((i * 37) % 170);
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist * 0.8 - 90;
        const shape: Piece["shape"] =
          i % 5 === 0 ? "star" : i % 3 === 0 ? "bar" : "dot";
        const size = shape === "star" ? 14 + (i % 3) * 4 : 6 + (i % 4) * 2;
        return {
          shape,
          style: {
            "--dx": `${dx.toFixed(1)}px`,
            "--dy": `${dy.toFixed(1)}px`,
            "--rot": `${(i * 83) % 720}deg`,
            width: shape === "bar" ? size * 0.55 : size,
            height: shape === "bar" ? size * 1.6 : size,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(0.25 + ((i * 0.031) % 0.35)).toFixed(2)}s`,
            animationDuration: `${(2.4 + ((i * 0.23) % 1.4)).toFixed(2)}s`,
          } as CSSProperties,
        };
      }),
    [],
  );

  function dismiss() {
    if (exiting) return;
    setExiting(true);
    setTimeout(onDone, 320);
  }

  // Close with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exiting]);

  return (
    <div
      dir={dir}
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      onClick={dismiss}
      className={`fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-[#06222b]/70 p-4 backdrop-blur-md transition-opacity duration-300 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* ── Confetti burst from the middle of the screen ── */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-20">
        {confetti.map((c, i) => (
          <span
            key={i}
            className={`piece piece-${c.shape} absolute`}
            style={c.style}
          />
        ))}
      </div>

      {/* ── Card ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`card-enter relative z-10 w-full max-w-sm rounded-[2rem] border-4 border-white bg-gradient-to-b from-[#ecfdf5] via-white to-[#f0fdfa] px-7 pb-7 pt-16 text-center shadow-[0_24px_0_-8px_rgba(13,148,136,0.25),0_30px_60px_-12px_rgba(6,34,43,0.55)] transition-transform duration-300 dark:border-teal-800 dark:from-teal-950 dark:via-teal-950 dark:to-teal-900 ${
          exiting ? "scale-95" : "scale-100"
        }`}
      >
        {/* Mascot pops out of the top of the card */}
        <div className="mascot absolute -top-14 left-1/2 h-28 w-28 -translate-x-1/2">
          <svg viewBox="0 0 120 120" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5eead4" />
                <stop offset="1" stopColor="#0d9488" />
              </linearGradient>
              <linearGradient id="hat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fcd34d" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* ground shadow */}
            <ellipse
              cx="60"
              cy="112"
              rx="30"
              ry="4"
              fill="#0f766e"
              opacity="0.18"
            />

            {/* body */}
            <circle
              cx="60"
              cy="66"
              r="42"
              fill="url(#body)"
              stroke="#fff"
              strokeWidth="4"
            />
            <ellipse
              cx="44"
              cy="46"
              rx="12"
              ry="7"
              fill="#fff"
              opacity="0.28"
              transform="rotate(-25 44 46)"
            />

            {/* party hat */}
            <g className="hat">
              <path
                d="M44 32 L60 2 L76 32 Z"
                fill="url(#hat)"
                stroke="#fff"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path
                d="M51 20 L69 20"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.8"
              />
              <circle
                cx="60"
                cy="3"
                r="5"
                fill="#fb7185"
                stroke="#fff"
                strokeWidth="2"
              />
            </g>

            {/* eyes */}
            <g className="eyes">
              <ellipse cx="45" cy="64" rx="5" ry="6.5" fill="#06222b" />
              <ellipse cx="75" cy="64" rx="5" ry="6.5" fill="#06222b" />
              <circle cx="46.8" cy="61.5" r="1.8" fill="#fff" />
              <circle cx="76.8" cy="61.5" r="1.8" fill="#fff" />
            </g>

            {/* cheeks + smile */}
            <ellipse
              cx="34"
              cy="76"
              rx="7"
              ry="4.5"
              fill="#fb7185"
              opacity="0.55"
            />
            <ellipse
              cx="86"
              cy="76"
              rx="7"
              ry="4.5"
              fill="#fb7185"
              opacity="0.55"
            />
            <path
              d="M50 76 Q60 90 70 76 Q60 80 50 76 Z"
              fill="#06222b"
              stroke="#06222b"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M54 82 Q60 87 66 82"
              fill="none"
              stroke="#fb7185"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          {/* success tick badge */}
          <span className="badge absolute -bottom-1 -end-1 grid h-9 w-9 place-items-center rounded-full border-[3px] border-white bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 dark:border-teal-950">
            <Check size={18} strokeWidth={3.5} />
          </span>

          {/* tiny floating sparkles */}
          <span className="spark spark-a" aria-hidden>
            ✦
          </span>
          <span className="spark spark-b" aria-hidden>
            ✦
          </span>
          <span className="spark spark-c" aria-hidden>
            ✦
          </span>
        </div>

        <h2
          className="text-[1.65rem] font-extrabold leading-tight text-teal-950 dark:text-teal-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {s.title || "Yay, you did it! 🎉"}
        </h2>
        <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-relaxed text-teal-800/80 dark:text-teal-200/80">
          {s.body ||
            "Your setup is complete. Time to work digitally and grow with Melmah."}
        </p>

        {/* Checklist chips — rendered only when the language defines them */}
        {steps.length > 0 && (
          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {steps.slice(0, 3).map((label, i) => (
              <li
                key={`${label}-${i}`}
                className="chip inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 shadow-sm ring-1 ring-teal-100 dark:bg-teal-900 dark:text-teal-100 dark:ring-teal-800"
                style={{ animationDelay: `${0.7 + i * 0.35}s` }}
              >
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white">
                  <Check size={10} strokeWidth={4} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        )}

        {/* Progress: when it fills, we go to the dashboard automatically */}
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-teal-100 dark:bg-teal-900/60">
          <div
            className="progress h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-400"
            style={{
              animationDuration: `${AUTO_DISMISS_MS}ms`,
            }}
            onAnimationEnd={dismiss}
          />
        </div>
        <p className="mt-2 text-[11px] text-teal-700/60 dark:text-teal-300/60">
          {s.opening || "Opening your dashboard…"}
        </p>
      </div>

      <style jsx>{`
        /* ── Confetti ── */
        .piece {
          left: 0;
          top: 0;
          opacity: 0;
          animation-name: burst;
          animation-timing-function: cubic-bezier(0.2, 0.8, 0.3, 1);
          animation-fill-mode: both;
        }
        .piece-dot {
          border-radius: 50%;
        }
        .piece-bar {
          border-radius: 2px;
        }
        .piece-star {
          clip-path: polygon(
            50% 0%,
            61% 35%,
            98% 35%,
            68% 57%,
            79% 91%,
            50% 70%,
            21% 91%,
            32% 57%,
            2% 35%,
            39% 35%
          );
        }
        @keyframes burst {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0) rotate(0deg);
          }
          12% {
            opacity: 1;
          }
          45% {
            transform: translate(var(--dx), var(--dy)) scale(1)
              rotate(var(--rot));
          }
          100% {
            opacity: 0;
            transform: translate(
                calc(var(--dx) * 1.15),
                calc(var(--dy) + 340px)
              )
              scale(0.9) rotate(calc(var(--rot) * 2));
          }
        }

        /* ── Card entrance ── */
        .card-enter {
          animation: card-enter 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes card-enter {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(24px);
          }
          60% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* ── Mascot ── */
        .mascot {
          animation: hop 2.2s ease-in-out 0.6s infinite;
        }
        @keyframes hop {
          0%,
          100% {
            transform: translate(-50%, 0) rotate(0deg);
          }
          12% {
            transform: translate(-50%, -14px) rotate(-4deg);
          }
          24% {
            transform: translate(-50%, 0) rotate(0deg) scale(1.04, 0.96);
          }
          36% {
            transform: translate(-50%, -7px) rotate(3deg);
          }
          48% {
            transform: translate(-50%, 0) rotate(0deg);
          }
        }
        .hat {
          transform-origin: 60px 34px;
          animation: hat-wobble 2.2s ease-in-out 0.6s infinite;
        }
        @keyframes hat-wobble {
          0%,
          100% {
            transform: rotate(0deg);
          }
          20% {
            transform: rotate(-8deg);
          }
          40% {
            transform: rotate(6deg);
          }
          60% {
            transform: rotate(0deg);
          }
        }
        .eyes {
          transform-origin: 60px 64px;
          animation: blink 3.6s infinite;
        }
        @keyframes blink {
          0%,
          92%,
          100% {
            transform: scaleY(1);
          }
          96% {
            transform: scaleY(0.1);
          }
        }
        .badge {
          animation: pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
        }
        @keyframes pop {
          from {
            transform: scale(0) rotate(-90deg);
          }
          to {
            transform: scale(1) rotate(0deg);
          }
        }
        .spark {
          position: absolute;
          color: #fbbf24;
          animation: twinkle 1.6s ease-in-out infinite;
        }
        .spark-a {
          top: -4px;
          inset-inline-end: -12px;
          font-size: 18px;
        }
        .spark-b {
          top: 26px;
          inset-inline-start: -18px;
          font-size: 12px;
          animation-delay: 0.5s;
          color: #fb7185;
        }
        .spark-c {
          bottom: 8px;
          inset-inline-start: -8px;
          font-size: 10px;
          animation-delay: 1s;
          color: #a78bfa;
        }
        @keyframes twinkle {
          0%,
          100% {
            transform: scale(0.4) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2) rotate(25deg);
            opacity: 1;
          }
        }

        /* ── Chips ── */
        .chip {
          opacity: 0;
          animation: chip-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes chip-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ── Progress ── */
        .progress {
          width: 0%;
          animation-name: progress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        /* ── Respect reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .piece {
            display: none;
          }
          .card-enter,
          .mascot,
          .hat,
          .eyes,
          .badge,
          .spark {
            animation: none !important;
          }
          .chip {
            animation: none !important;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
