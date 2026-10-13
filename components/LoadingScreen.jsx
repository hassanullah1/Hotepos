// components/LoadingScreen.jsx
"use client";

/**
 * Minimal loading screen — a gold ring spinner on the same dark surface
 * as the header and footer, with an optional caption.
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
      } relative flex items-center justify-center overflow-hidden bg-[#15121C] px-4 ${className}`}
    >
      {/* Ambient gold glow — matches the header/footer blobs */}
      <div
        className="kls-glow pointer-events-none absolute h-64 w-64 rounded-full bg-[#C9A227]/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="kls-tuck relative flex flex-col items-center gap-5">
        <div className="kls-spin-wrap relative h-14 w-14">
          {/* Soft gold halo behind the ring */}
          <div className="kls-halo absolute inset-0 rounded-full bg-gradient-to-br from-[#E0B93A] to-[#8A6E1A] opacity-40 blur-md" />

          {/* Gradient ring — same gold as the header logo ring */}
          <svg viewBox="0 0 56 56" className="kls-ring relative h-14 w-14">
            <defs>
              <linearGradient id="kls-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E0B93A" />
                <stop offset="100%" stopColor="#A9821E" />
              </linearGradient>
            </defs>
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              strokeWidth="4"
              className="stroke-[#2E2938]"
            />
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="url(#kls-grad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="90 138"
            />
          </svg>
        </div>

        {text && (
          <p className="kls-caption text-xs font-medium uppercase tracking-[0.25em] text-[#C9A227]">
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
        .kls-halo {
          animation: kls-pulse 1.6s ease-in-out infinite;
        }
        .kls-glow {
          animation: kls-ambient 3.5s ease-in-out infinite;
        }
        .kls-caption {
          animation: kls-fade 1.6s ease-in-out infinite;
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
            transform: translateY(-3px);
          }
        }
        @keyframes kls-pulse {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.55;
          }
        }
        @keyframes kls-ambient {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.35;
          }
          50% {
            transform: translate(15px, -10px) scale(1.1);
            opacity: 0.55;
          }
        }
        @keyframes kls-fade {
          0%,
          100% {
            opacity: 0.65;
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
          .kls-halo,
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
