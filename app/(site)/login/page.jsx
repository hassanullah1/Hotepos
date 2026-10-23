// app/login/page.js
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { fraunces as displayFont } from "@/app/fonts/fraunces";
import LoadingScreen from "@/components/LoadingScreen";


/* ------------------------------------------------------------------ */
/* Translations — same shape as `pageText` in @/lib/pageText.          */
/* Move this into `lib/pageText.js` if you want it centralized.        */
/* ------------------------------------------------------------------ */
const loginText = {
  en: {
    dir: "ltr",
    tagline: "Manage rooms, tables and service across every branch.",
    panelLabel: "FLOOR STATUS · LIVE",
    statusLabel: "SERVICE ONLINE",
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
    themeToLight: "Switch to light mode",
    themeToDark: "Switch to dark mode",
    brandName: "Hotel",
    brandSub: "ADMIN",
    loading: "Loading…",
  },
  ps: {
    dir: "rtl",
    tagline: "د خونو، مېزونو او خدماتو اداره، په هرې څانګه کې.",
    panelLabel: "د مېزونو حالت · ژوندی",
    statusLabel: "خدمت فعال دی",
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
    themeToLight: "روښانه بڼې ته لاړ شئ",
    themeToDark: "توره بڼې ته لاړ شئ",
    brandName: "هوټل",
    brandSub: "ادمین",
    loading: "بارول…",
  },
  prs: {
    dir: "rtl",
    tagline: "مدیریت اتاق‌ها، میزها و خدمات در همه شعبه‌ها.",
    panelLabel: "وضعیت میزها · زنده",
    statusLabel: "خدمات فعال است",
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
    themeToLight: "رفتن به حالت روشن",
    themeToDark: "رفتن به حالت تاریک",
    brandName: "هتل",
    brandSub: "ادمین",
    loading: "در حال بارگذاری…",
  },
};

const THEME_KEY = "kohistan-admin-theme";

/* ------------------------------------------------------------------ */
/* Small inline icons                                                  */
/* ------------------------------------------------------------------ */
function SunIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <circle cx="12" cy="12" r="4.2" />
      <path
        strokeLinecap="round"
        d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"
      />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2Z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Floor status panel (decorative left side)                           */
/* ------------------------------------------------------------------ */
function FloorStatusPanel({ t }) {
  const cols = 6;
  const rows = 7;
  const occupied = new Set([2, 5, 8, 14, 19, 23, 27, 31, 36, 40]);
  const justSeated = 22;

  const cells = [];
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 40 + col * 42;
    const y = 40 + row * 42;
    const isOccupied = occupied.has(i);
    const isPulse = i === justSeated;
    cells.push(
      <rect
        key={i}
        x={x}
        y={y}
        width="22"
        height="22"
        rx="5"
        className={isPulse ? "table-pulse" : undefined}
        fill={isOccupied || isPulse ? "#C9A227" : "transparent"}
        fillOpacity={isOccupied ? 0.9 : 1}
        stroke={isOccupied || isPulse ? "none" : "#3A3346"}
        strokeWidth="1.2"
      />,
    );
  }

  return (
    <div className="relative hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between overflow-hidden bg-[#15121C] px-10 py-10 text-[#F0EAE2]">
      <svg
        className="floor-drift pointer-events-none absolute inset-0 h-[115%] w-full opacity-[0.9]"
        viewBox="0 0 300 350"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {cells}
      </svg>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 15%, rgba(21,18,28,0.35) 0%, rgba(21,18,28,0.88) 55%, rgba(21,18,28,0.98) 100%)",
        }}
      />

      <div
        className="relative z-10 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#9691A6]"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        <span className="status-dot inline-block h-1.5 w-1.5 rounded-full bg-[#C9A227]" />
        {t.statusLabel}
      </div>

      <div className="relative z-10">
        <div
          className="leading-[0.9] text-[#F0EAE2]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="block text-6xl font-medium italic tracking-tight xl:text-7xl">
            {t.brandName}
          </span>
          <span className="mt-1 block text-xl font-semibold tracking-[0.4em] text-[#C9A227] not-italic xl:text-2xl">
            {t.brandSub}
          </span>
        </div>
        <p className="mt-6 max-w-xs text-sm leading-relaxed text-[#B7B2C4]">
          {t.tagline}
        </p>
      </div>

      <div
        className="relative z-10 text-[11px] uppercase tracking-[0.2em] text-[#655E75]"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {t.panelLabel}
      </div>

      <style jsx>{`
        .floor-drift {
          animation: floorDrift 50s linear infinite;
        }
        @keyframes floorDrift {
          0% {
            transform: translateY(0) scale(1.02);
          }
          100% {
            transform: translateY(-3%) scale(1.02);
          }
        }
        .table-pulse {
          animation: tablePulse 2.2s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes tablePulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.45;
          }
        }
        .status-dot {
          animation: statusPulse 2.4s ease-in-out infinite;
        }
        @keyframes statusPulse {
          0%,
          100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(201, 162, 39, 0.55);
          }
          50% {
            opacity: 0.6;
            box-shadow: 0 0 0 4px rgba(201, 162, 39, 0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .floor-drift,
          .table-pulse,
          .status-dot {
            animation: none !important;
          }
        }
      `}</style>
    </div>
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Same pattern as app/page.js — safe fallback while hydration settles.
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

  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
  }

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

  const pageBg = isDark ? "bg-[#15121C]" : "bg-[#F3F0EC]";
  const cardBg = isDark
    ? "bg-[#1E1B26]/90 border-[#2E2938]"
    : "bg-white/90 border-[#E4DFD4]";
  const textPrimary = isDark ? "text-[#F0EAE2]" : "text-[#1D1A22]";
  const textMuted = isDark ? "text-[#9691A6]" : "text-[#6E687A]";
  const inputBase = isDark
    ? "bg-[#161320] border-[#332C3E] text-[#F0EAE2] placeholder:text-[#5E5670] focus:border-[#C9A227]"
    : "bg-[#FAF8F4] border-[#E4DFD4] text-[#1D1A22] placeholder:text-[#A39D8F] focus:border-[#A9821E]";
  const iconBtn = isDark
    ? "border-[#332C3E] text-[#B7B2C4] hover:border-[#C9A227] hover:text-[#C9A227]"
    : "border-[#E4DFD4] text-[#6E687A] hover:border-[#A9821E] hover:text-[#A9821E]";

  return (
    <div
      dir={t.dir}
      className={`flex min-h-screen ${pageBg} transition-colors duration-300`}
    >
      <FloorStatusPanel t={t} />

      <div className="relative flex flex-1 items-center justify-center px-5 py-10">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035]"
          viewBox="0 0 300 300"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {Array.from({ length: 8 }).map((_, row) =>
            Array.from({ length: 8 }).map((_, col) => (
              <rect
                key={`${row}-${col}`}
                x={20 + col * 36}
                y={20 + row * 36}
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

        <div className="relative z-10 w-full max-w-sm">
          <div className="mb-6 flex items-center justify-between">
            <div
              className={`lg:hidden ${textPrimary}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="text-xl font-medium italic tracking-tight">
                {t.brandName}
              </span>
              <span className="ml-1.5 text-xs font-semibold tracking-[0.3em] text-[#C9A227] not-italic">
                {t.brandSub}
              </span>
            </div>

          </div>

          <div
            className={`rounded-2xl border shadow-xl backdrop-blur-sm ${cardBg} p-7 sm:p-8`}
          >
            <h1
              className={`text-3xl font-medium ${textPrimary}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.heading}
            </h1>
            <p className={`mt-1.5 text-sm ${textMuted}`}>{t.subheading}</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label
                  className={`mb-1.5 block text-sm font-medium ${textPrimary}`}
                >
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#C9A227]/30 ${inputBase}`}
                  placeholder={t.emailPlaceholder}
                />
              </div>

              <div>
                <label
                  className={`mb-1.5 block text-sm font-medium ${textPrimary}`}
                >
                  {t.passwordLabel}
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#C9A227]/30 ${inputBase}`}
                  placeholder={t.passwordPlaceholder}
                />
              </div>

              {error && (
                <div
                  className={`rounded-lg border-s-4 px-3 py-2 text-sm ${
                    isDark
                      ? "border-[#E5484D] bg-[#E5484D]/10 text-[#FF9B9E]"
                      : "border-[#DC2626] bg-[#DC2626]/5 text-[#B91C1C]"
                  }`}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-[#C9A227] to-[#A9821E] py-2.5 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition-all hover:shadow-lg hover:shadow-[#C9A227]/30 disabled:opacity-60 disabled:hover:shadow-md"
              >
                {loading ? t.submitting : t.submit}
              </button>
            </form>

            <div className="mt-3 text-right">
              <Link
                href="/forgot-password"
                className={`text-xs underline-offset-2 hover:underline ${
                  isDark
                    ? "text-[#9691A6] hover:text-[#C9A227]"
                    : "text-[#6E687A] hover:text-[#A9821E]"
                }`}
              >
                {t.forgot}
              </Link>
            </div>
          </div>

          <p
            className={`mt-5 text-center text-[11px] uppercase tracking-[0.2em] ${textMuted}`}
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {t.footer}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page wrapper                                                        */
/* ------------------------------------------------------------------ */
export default function LoginPage() {
  return (
    <div className={displayFont.variable}>
      <Suspense fallback={<LoadingScreen text="…" fullScreen />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
