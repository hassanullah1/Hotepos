"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Check } from "lucide-react";

const AUTO_CLOSE_MS = 7000;

const FOOD = ["🍔", "🍕", "🍟", "🥤", "🍩", "🍗", "🌮", "🍰"];
const DOT_COLORS = ["#E0B93A", "#34D399", "#F472B6", "#60A5FA", "#FBBF24"];

type Props = {
  isDark: boolean;
  onClose: () => void;
  texts: {
    congratsTitle: string;
    congratsSub: string;
    congratsBody: string;
    congratsEnjoy?: string;
  };
};

export default function PaymentSuccessPopup({ isDark, onClose, texts }: Props) {
  const [exiting, setExiting] = useState(false);

  function close() {
    if (exiting) return;
    setExiting(true);
    setTimeout(onClose, 300);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exiting]);

  // Deterministic burst of food emojis + colored dots (no Math.random).
  const pieces = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const angle = (i * 137.5 * Math.PI) / 180;
        const dist = 120 + ((i * 41) % 170);
        const isFood = i % 2 === 0;
        return {
          food: isFood ? FOOD[((i / 2) % FOOD.length) | 0] : null,
          style: {
            "--dx": `${(Math.cos(angle) * dist).toFixed(1)}px`,
            "--dy": `${(Math.sin(angle) * dist * 0.75 - 100).toFixed(1)}px`,
            "--rot": `${(i * 67) % 540}deg`,
            fontSize: isFood ? 20 + (i % 3) * 5 : undefined,
            width: isFood ? undefined : 7 + (i % 3) * 2,
            height: isFood ? undefined : 7 + (i % 3) * 2,
            borderRadius: isFood ? undefined : "50%",
            backgroundColor: isFood ? undefined : DOT_COLORS[i % 5],
            animationDelay: `${(0.3 + ((i * 0.029) % 0.35)).toFixed(2)}s`,
            animationDuration: `${(2.5 + ((i * 0.21) % 1.3)).toFixed(2)}s`,
          } as CSSProperties,
        };
      }),
    [],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={close}
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/60 p-5 backdrop-blur-sm transition-opacity duration-300 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Food confetti burst */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-20"
        aria-hidden="true"
      >
        {pieces.map((p, i) => (
          <span key={i} className="piece absolute leading-none" style={p.style}>
            {p.food}
          </span>
        ))}
      </div>

      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`card-enter relative z-10 w-full max-w-sm rounded-[2rem] border-4 px-7 pb-6 pt-20 text-center ${
          isDark
            ? "border-[#2E2938] bg-gradient-to-b from-[#26212F] to-[#1E1B26] text-[#F0EAE2] shadow-[0_20px_0_-8px_rgba(201,162,39,0.18),0_30px_60px_-12px_rgba(0,0,0,0.7)]"
            : "border-white bg-gradient-to-b from-[#FFF8E6] to-white text-[#1D1A22] shadow-[0_20px_0_-8px_rgba(201,162,39,0.28),0_30px_60px_-12px_rgba(60,40,0,0.35)]"
        } ${exiting ? "scale-95" : "scale-100"} transition-transform duration-300`}
      >
        {/* Happy burger mascot */}
        <div className="absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2">
          <div className="mascot h-full w-full">
            <svg
              viewBox="0 0 120 120"
              className="h-full w-full overflow-visible"
            >
              <ellipse
                cx="60"
                cy="114"
                rx="34"
                ry="4"
                fill="#000"
                opacity="0.18"
              />

              <g className="burger">
                {/* bottom bun */}
                <path
                  d="M20 92 H100 Q100 110 82 110 H38 Q20 110 20 92 Z"
                  fill="#E8A33D"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                {/* patty */}
                <rect
                  x="16"
                  y="78"
                  width="88"
                  height="17"
                  rx="8.5"
                  fill="#7A4A2B"
                  stroke="#fff"
                  strokeWidth="3"
                />
                {/* melted cheese */}
                <path
                  d="M18 76 H102 V80 H92 L86 91 L80 80 H46 L40 87 L34 80 H18 Z"
                  fill="#FBBF24"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* lettuce */}
                <path
                  d="M14 70 Q22 80 30 71 Q38 80 46 71 Q54 80 62 71 Q70 80 78 71 Q86 80 94 71 Q100 78 106 70 V76 H14 Z"
                  fill="#4ADE80"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* top bun */}
                <path
                  d="M14 72 Q14 16 60 16 Q106 16 106 72 Z"
                  fill="#F2B24A"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <ellipse
                  cx="38"
                  cy="32"
                  rx="14"
                  ry="7"
                  fill="#fff"
                  opacity="0.3"
                  transform="rotate(-25 38 32)"
                />
                {/* sesame */}
                {[
                  [44, 26, -20],
                  [62, 22, 10],
                  [78, 29, 30],
                  [90, 42, 50],
                  [30, 42, -40],
                ].map(([x, y, r], i) => (
                  <ellipse
                    key={i}
                    cx={x}
                    cy={y}
                    rx="3.2"
                    ry="1.7"
                    fill="#FFF3D1"
                    transform={`rotate(${r} ${x} ${y})`}
                  />
                ))}

                {/* face: happy closed eyes */}
                <path
                  d="M36 52 Q42 43 48 52"
                  fill="none"
                  stroke="#4A2A12"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M72 52 Q78 43 84 52"
                  fill="none"
                  stroke="#4A2A12"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* cheeks */}
                <ellipse
                  cx="30"
                  cy="60"
                  rx="7"
                  ry="4.5"
                  fill="#F472B6"
                  opacity="0.6"
                />
                <ellipse
                  cx="90"
                  cy="60"
                  rx="7"
                  ry="4.5"
                  fill="#F472B6"
                  opacity="0.6"
                />
                {/* chewing mouth */}
                <g className="mouth">
                  <ellipse
                    cx="60"
                    cy="60"
                    rx="8"
                    ry="7"
                    fill="#7F1D1D"
                    stroke="#4A2A12"
                    strokeWidth="2"
                  />
                  <ellipse cx="60" cy="64" rx="4.5" ry="3" fill="#FB7185" />
                </g>
              </g>
            </svg>
          </div>

          {/* floating hearts */}
          <span className="heart h-a" aria-hidden>
            ❤
          </span>
          <span className="heart h-b" aria-hidden>
            ❤
          </span>
          <span className="heart h-c" aria-hidden>
            ❤
          </span>

          {/* success badge */}
          <span
            className={`badge absolute -bottom-1 -end-1 grid h-9 w-9 place-items-center rounded-full border-[3px] bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ${
              isDark ? "border-[#26212F]" : "border-white"
            }`}
          >
            <Check size={18} strokeWidth={3.5} />
          </span>
        </div>

        <h2
          className="text-[1.7rem] font-extrabold leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {texts.congratsTitle}
        </h2>

        <p
          className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            isDark
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          <Check size={13} strokeWidth={3.5} />
          {texts.congratsSub}
        </p>

        <p
          className={`mx-auto mt-3 max-w-[19rem] text-[13px] leading-relaxed ${
            isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
          }`}
        >
          {texts.congratsBody}
        </p>

        {/* Bon appétit chip */}
        <div className="chip mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 py-2 text-sm font-bold text-[#1D1707] shadow-md shadow-[#C9A227]/30">
          <span className="text-base">😋</span>
          {texts.congratsEnjoy || "Bon appétit!"}
        </div>

        {/* Auto-close progress */}
        <div
          className={`mt-5 h-1.5 w-full overflow-hidden rounded-full ${
            isDark ? "bg-[#2E2938]" : "bg-[#EDE8DE]"
          }`}
        >
          <div
            className="progress h-full rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E]"
            style={{ animationDuration: `${AUTO_CLOSE_MS}ms` }}
            onAnimationEnd={close}
          />
        </div>
      </div>

      <style jsx>{`
        /* Confetti burst */
        .piece {
          left: 0;
          top: 0;
          opacity: 0;
          animation-name: burst;
          animation-timing-function: cubic-bezier(0.2, 0.8, 0.3, 1);
          animation-fill-mode: both;
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
            transform: translate(calc(var(--dx) * 1.1), calc(var(--dy) + 340px))
              scale(0.9) rotate(calc(var(--rot) * 2));
          }
        }

        /* Card entrance */
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

        /* Mascot: bounces and chews */
        .mascot {
          animation: hop 1.8s ease-in-out 0.6s infinite;
        }
        @keyframes hop {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          15% {
            transform: translateY(-12px) rotate(-3deg);
          }
          30% {
            transform: translateY(0) rotate(0deg);
          }
          45% {
            transform: translateY(-6px) rotate(3deg);
          }
          60% {
            transform: translateY(0) rotate(0deg);
          }
        }
        .burger {
          transform-origin: 60px 110px;
          animation: chew 0.6s ease-in-out infinite;
        }
        @keyframes chew {
          0%,
          100% {
            transform: scale(1, 1);
          }
          50% {
            transform: scale(1.03, 0.95);
          }
        }
        .mouth {
          transform-origin: 60px 60px;
          animation: munch 0.6s ease-in-out infinite;
        }
        @keyframes munch {
          0%,
          100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.35);
          }
        }

        /* Hearts */
        .heart {
          position: absolute;
          opacity: 0;
          color: #fb7185;
          animation: float-up 2.4s ease-out infinite;
        }
        .h-a {
          top: 6px;
          inset-inline-end: -8px;
          font-size: 16px;
        }
        .h-b {
          top: 18px;
          inset-inline-start: -10px;
          font-size: 12px;
          animation-delay: 0.8s;
          color: #f472b6;
        }
        .h-c {
          top: 0;
          inset-inline-start: 18px;
          font-size: 10px;
          animation-delay: 1.6s;
          color: #fbbf24;
        }
        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.5);
          }
          25% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-34px) scale(1.15);
          }
        }

        .badge {
          animation: pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
        }
        .chip {
          animation: pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s both;
        }
        @keyframes pop {
          from {
            opacity: 0;
            transform: scale(0.4);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Progress */
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

        @media (prefers-reduced-motion: reduce) {
          .piece {
            display: none;
          }
          .card-enter,
          .mascot,
          .burger,
          .mouth,
          .heart,
          .badge,
          .chip {
            animation: none !important;
          }
          .chip,
          .badge {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
