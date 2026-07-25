// components/LoadingScreen.jsx
"use client";

/**
 * Minimal loading spinner — a soft gradient ring with a gentle glow and a
 * playful bounce, plus an optional caption. No logo, no progress math.
 *
 * @param {Object} props
 * @param {string}  [props.text="Loading..."]  Caption under the spinner. Pass "" to hide it.
 * @param {boolean} [props.fullScreen=true]     If true, fills the viewport and centers itself.
 * @param {string}  [props.className=""]        Extra classes for the outer wrapper.
 */
export default function LoadingScreen({
  text = "Loading...",
  fullScreen = true,
  className = "",
}) {
  return (
    <div
      className={`${
        fullScreen ? "min-h-[100dvh] w-full" : "w-full"
      } flex items-center justify-center bg-gradient-to-br from-white via-violet-50 to-pink-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-indigo-950 px-4 ${className}`}
    >
      <div className="kls-tuck flex flex-col items-center gap-4">
        <div className="kls-spin-wrap relative h-14 w-14">
          {/* Soft pulsing glow behind the ring */}
          <div className="kls-glow absolute inset-0 rounded-full bg-gradient-to-tr from-violet-400 via-fuchsia-400 to-amber-300 blur-lg opacity-60 dark:opacity-40" />

          {/* Gradient ring */}
          <svg viewBox="0 0 56 56" className="kls-ring relative h-14 w-14">
            <defs>
              <linearGradient id="kls-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="55%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              strokeWidth="5"
              className="stroke-violet-100 dark:stroke-zinc-800"
            />
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="url(#kls-grad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="90 138"
            />
          </svg>
        </div>

        {text && (
          <p className="kls-caption text-sm font-medium tracking-wide text-violet-400 dark:text-violet-300">
            {text}
          </p>
        )}
      </div>

      <style jsx>{`
        .kls-tuck {
          opacity: 0;
          transform: translateY(10px) scale(0.8);
          animation: kls-tuck-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)
            forwards;
        }
        .kls-spin-wrap {
          animation: kls-bounce 1.4s ease-in-out infinite;
        }
        .kls-ring {
          animation: kls-spin 1.1s cubic-bezier(0.65, 0.05, 0.36, 1) infinite;
          transform-origin: center;
        }
        .kls-glow {
          animation: kls-pulse 1.4s ease-in-out infinite;
        }
        .kls-caption {
          animation: kls-fade 1.4s ease-in-out infinite;
        }

        @keyframes kls-tuck-in {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes kls-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes kls-bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        @keyframes kls-pulse {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.75;
          }
        }
        @keyframes kls-fade {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .kls-tuck {
            animation: none !important;
            opacity: 1;
            transform: none;
          }
          .kls-spin-wrap,
          .kls-glow,
          .kls-caption {
            animation: none !important;
          }
          .kls-ring {
            animation-duration: 2.2s;
          }
        }
      `}</style>
    </div>
  );
}
