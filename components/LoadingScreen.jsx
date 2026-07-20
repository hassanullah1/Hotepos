// components/LoadingScreen.jsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Basic/Arabic Presentation Unicode ranges — covers Pashto, Dari/Farsi and Arabic.
// Used to auto-detect right-to-left script so we don't apply Latin-style
// letter-spacing/uppercase to joined scripts (that breaks the letterforms).
const RTL_SCRIPT_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Minimal branded loading indicator: a circular logo mark (with a single
 * quiet spinning ring fitted snugly around it), the wordmark, and a static
 * "Please wait" caption with a live percentage underneath. No road scene,
 * no background animation, no moving/fading caption text.
 *
 * Automatically detects Arabic-script text (Pashto/Dari/Arabic) in `text`,
 * `brandName`, or `subtitle` and switches to a script-appropriate font with
 * no letter-spacing or forced uppercase, so joined letterforms render
 * correctly instead of looking broken.
 *
 * @param {Object} props
 * @param {string}  [props.text="Please wait"]    Static caption shown under the logo.
 * @param {number}  [props.progress]               0-100. If provided, the percentage is driven by you
 *                                                  (e.g. real upload/fetch progress). If omitted, a
 *                                                  simulated progress value eases up toward 90% on its
 *                                                  own, for when there's no real progress to report.
 * @param {boolean} [props.showPercentage=true]    Toggle the "NN%" readout off if you only want the caption.
 * @param {string}  [props.brandName="KOHISTAN"]   Main wordmark line.
 * @param {string}  [props.subtitle="Logistic Services"] Small wordmark subtitle line.
 * @param {"sm"|"md"|"lg"} [props.size="md"]       Overall scale of the component.
 * @param {boolean} [props.fullScreen=true]        If true, fills the viewport and centers itself.
 * @param {boolean} [props.showLogo=true]          Toggle the wordmark logo on/off.
 * @param {string}  [props.className=""]           Extra classes for the outer wrapper.
 */
export default function LoadingScreen({
  text = "Please wait",
  progress,
  showPercentage = true,
  brandName = "KOHISTAN",
  subtitle = "Logistic Services",
  size = "md",
  fullScreen = true,
  showLogo = true,
  className = "",
}) {
  const isRTL = RTL_SCRIPT_RE.test(`${text}${brandName}${subtitle}`);

  // If the caller doesn't pass a real `progress` value, ease a simulated
  // number up toward 90% (classic "still working on it" behavior) so the
  // percentage always feels alive without ever falsely claiming "100%".
  const [simulated, setSimulated] = useState(0);
  useEffect(() => {
    if (progress != null) return;
    const id = setInterval(() => {
      setSimulated((p) => (p >= 90 ? p : p + (90 - p) * 0.08 + 0.3));
    }, 200);
    return () => clearInterval(id);
  }, [progress]);

  const displayProgress = Math.round(
    Math.max(0, Math.min(100, progress != null ? progress : simulated)),
  );

  const sizes = {
    sm: {
      wrapper: "gap-3",
      ring: "w-14 h-14",
      logoBox: "w-11 h-11",
      logoPad: "p-1",
      logoIcon: 36,
      brand: "text-lg sm:text-xl",
      subtitleText: isRTL ? "text-xs sm:text-sm" : "text-[9px] sm:text-[10px]",
      caption: "text-xs sm:text-sm",
    },
    md: {
      wrapper: "gap-4",
      ring: "w-20 h-20",
      logoBox: "w-16 h-16",
      logoPad: "p-1.5",
      logoIcon: 56,
      brand: "text-2xl sm:text-3xl",
      subtitleText: isRTL ? "text-sm sm:text-base" : "text-[10px] sm:text-xs",
      caption: "text-sm sm:text-base",
    },
    lg: {
      wrapper: "gap-5",
      ring: "w-28 h-28",
      logoBox: "w-[5.5rem] h-[5.5rem]",
      logoPad: "p-2",
      logoIcon: 80,
      brand: "text-3xl sm:text-4xl",
      subtitleText: isRTL ? "text-base sm:text-lg" : "text-xs sm:text-sm",
      caption: "text-base sm:text-lg",
    },
  }[size];

  const brandFontClass = isRTL ? "font-normal" : "font-extrabold tracking-wide";
  const subtitleClass = isRTL
    ? "font-semibold"
    : "font-semibold tracking-[0.25em] uppercase";
  const scriptFontStyle = isRTL
    ? { fontFamily: "'Noto Sans Arabic', 'Noto Nastaliq Urdu', sans-serif" }
    : undefined;

  return (
    <div
      className={`kls-loader ${
        fullScreen
          ? "min-h-screen w-full bg-gradient-to-br from-zinc-50 to-gray-100 dark:from-black dark:to-zinc-900"
          : "w-full"
      } flex items-center justify-center px-4 ${className}`}
    >
      <div className={`flex flex-col items-center ${sizes.wrapper}`}>
        {showLogo && (
          <div
            className={`relative ${sizes.ring} flex items-center justify-center`}
          >
            {/* Ring is fitted snugly around the circular logo, not floating loose */}
            <span className="kls-ring absolute inset-0 rounded-full" />
            <div
              className={`relative ${sizes.logoBox} ${sizes.logoPad} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center overflow-hidden`}
            >
              <div className="relative h-full w-full rounded-full overflow-hidden">
                <Image
                  src="/kohistan.png"
                  alt="Kohistan Logistic Logo"
                  fill
                  sizes={`${sizes.logoIcon}px`}
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        )}

        {showLogo && (
          <div
            dir={isRTL ? "rtl" : "ltr"}
            className={isRTL ? "text-right" : "text-center"}
            style={scriptFontStyle}
          >
            <p
              className={`kls-shimmer ${sizes.brand} ${brandFontClass} leading-tight bg-clip-text text-transparent`}
            >
              {brandName}
            </p>
            <p
              className={`${sizes.subtitleText} ${subtitleClass} leading-snug text-gray-400 dark:text-gray-500`}
            >
              {subtitle}
            </p>
          </div>
        )}

        {(text || showPercentage) && (
          <p
            dir={isRTL ? "rtl" : "ltr"}
            style={scriptFontStyle}
            className={`${sizes.caption} font-medium text-gray-400 dark:text-gray-500 text-center`}
          >
            {text}
            {text && showPercentage ? " · " : ""}
            {showPercentage && (
              <span className="tabular-nums">{displayProgress}%</span>
            )}
          </p>
        )}
      </div>

      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap");

        /* One quiet spinning ring around the logo — nothing else animates */
        .kls-ring {
          background: conic-gradient(from 0deg, #3b82f6, #9333ea, #3b82f6 100%);
          -webkit-mask: radial-gradient(
            farthest-side,
            transparent calc(100% - 2.5px),
            #000 calc(100% - 2.5px)
          );
          mask: radial-gradient(
            farthest-side,
            transparent calc(100% - 2.5px),
            #000 calc(100% - 2.5px)
          );
          animation: kls-spin 4s linear infinite;
          opacity: 0.85;
        }
        @keyframes kls-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .kls-shimmer {
          background-image: linear-gradient(
            100deg,
            rgb(107 114 128) 40%,
            rgb(59 130 246) 48%,
            rgb(147 51 234) 52%,
            rgb(107 114 128) 60%
          );
          background-size: 250% 100%;
          animation: kls-shimmer 4.5s ease-in-out infinite;
        }
        :global(.dark) .kls-shimmer {
          background-image: linear-gradient(
            100deg,
            rgb(229 231 235) 40%,
            rgb(96 165 250) 48%,
            rgb(192 132 252) 52%,
            rgb(229 231 235) 60%
          );
        }
        @keyframes kls-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -50% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .kls-loader :global(*) {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
