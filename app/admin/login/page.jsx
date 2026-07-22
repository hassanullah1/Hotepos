"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Barlow_Condensed } from "next/font/google";

const displayFont = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

// Same keys as providers/AdminPreferencesProvider.jsx so a preference picked
// here carries straight through to the dashboard after login (no re-picking).
const LOCALE_KEY = "kohistan-admin-locale";
const THEME_KEY = "kohistan-admin-theme";

const LANGS = [
  { code: "en", native: "English" },
  { code: "ps", native: "پښتو" },
  { code: "fa", native: "دری" },
];

const COPY = {
  en: {
    dir: "ltr",
    brand: "Rawan",
    brandSub: "LOGISTIC",
    tagline:
      "Fleet and dispatch operations, from the valley floor to the pass.",
    routeLabel: "ROUTE 07 · KOHISTAN ⇌ HUB",
    statusLabel: "SYSTEMS ONLINE",
    heading: "Admin access",
    subheading: "Sign in to manage fleet, drivers and dispatch.",
    emailLabel: "Email",
    emailPlaceholder: "admin@kohistanlogistic.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    submit: "Sign in",
    submitting: "Signing in…",
    genericError: "Something went wrong. Please try again.",
    footer: "Authorized personnel only.",
    themeToLight: "Switch to light mode",
    themeToDark: "Switch to dark mode",
  },
  ps: {
    dir: "rtl",
    brand: "روان",
    brandSub: "لوژستیک",
    tagline: "د بېړيو او لېږد چارې، د درې څخه تر غره پورې.",
    routeLabel: "لاره ۰۷ · روان ⇌ مرکز",
    statusLabel: "سیسټمونه فعال دي",
    heading: "د اډمین ننوتل",
    subheading: "د بېړۍ، موټرچلوونکو او لېږد اداره کولو لپاره ننوځئ.",
    emailLabel: "بریښنالیک",
    emailPlaceholder: "admin@kohistanlogistic.com",
    passwordLabel: "پټنوم",
    passwordPlaceholder: "••••••••",
    submit: "ننوتل",
    submitting: "ننوتل روان دي…",
    genericError: "یو څه غلط شول. مهرباني وکړئ بیا هڅه وکړئ.",
    footer: "یوازې مجاز کارکوونکي.",
    themeToLight: "روښانه بڼې ته لاړ شئ",
    themeToDark: "توره بڼې ته لاړ شئ",
  },
  fa: {
    dir: "rtl",
    brand: "روان",
    brandSub: "لوژیستیک",
    tagline: "عملیات ناوگان و ارسال، از دشت تا گردنه.",
    routeLabel: "مسیر ۰۷ · روان ⇌ مرکز",
    statusLabel: "سیستم‌ها فعال است",
    heading: "دسترسی ادمین",
    subheading: "برای مدیریت ناوگان، رانندگان و ارسال وارد شوید.",
    emailLabel: "ایمیل",
    emailPlaceholder: "admin@kohistanlogistic.com",
    passwordLabel: "رمز عبور",
    passwordPlaceholder: "••••••••",
    submit: "ورود",
    submitting: "در حال ورود…",
    genericError: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
    footer: "فقط کارمندان مجاز.",
    themeToLight: "رفتن به حالت روشن",
    themeToDark: "رفتن به حالت تاریک",
  },
};

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

function GlobeIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        d="M3 12h18M12 3c2.6 2.5 4 5.7 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.7-4-9s1.4-6.5 4-9Z"
      />
    </svg>
  );
}

function TopoRoutePanel({ t }) {
  return (
    <div className="relative hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between overflow-hidden bg-[#0B0F14] px-10 py-10 text-[#EDEDE7]">
      {/* contour lines, drifting slowly */}
      <svg
        className="topo-drift pointer-events-none absolute inset-0 h-[130%] w-full opacity-40"
        viewBox="0 0 600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[90, 200, 310, 420, 530, 640, 750].map((y, i) => (
          <path
            key={y}
            d={`M-50 ${y} C 90 ${y - 40 - i * 4}, 190 ${y + 50}, 330 ${y - 10} S 520 ${y - 55}, 660 ${y + 10}`}
            fill="none"
            stroke="#3C4A5E"
            strokeWidth="1"
            opacity={0.5 - i * 0.05}
          />
        ))}
      </svg>

      {/* animated route line + marker */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          id="route-path"
          className="route-draw"
          d="M70 800 C 170 760, 130 640, 230 590 S 350 520, 300 430 C 260 350, 390 300, 340 210 S 470 130, 500 70"
          fill="none"
          stroke="#F5A623"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength="1"
        />
        <circle r="5.5" fill="#F5A623" className="route-marker">
          <animateMotion dur="7s" repeatCount="indefinite" rotate="auto">
            <mpath href="#route-path" />
          </animateMotion>
        </circle>
      </svg>

      {/* top: status */}
      <div
        className="relative z-10 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8B98AC]"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        <span className="status-dot inline-block h-1.5 w-1.5 rounded-full bg-[#F5A623]" />
        {t.statusLabel}
      </div>

      {/* middle: brand */}
      <div className="relative z-10">
        <div
          className="leading-[0.85] text-[#EDEDE7]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="block text-6xl font-extrabold tracking-tight xl:text-7xl">
            {t.brand}
          </span>
          <span className="mt-1 block text-2xl font-semibold tracking-[0.35em] text-[#F5A623] xl:text-3xl">
            {t.brandSub}
          </span>
        </div>
        <p className="mt-6 max-w-xs text-sm leading-relaxed text-[#A9B4C4]">
          {t.tagline}
        </p>
      </div>

      {/* bottom: route caption */}
      <div
        className="relative z-10 text-[11px] uppercase tracking-[0.2em] text-[#5A6779]"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {t.routeLabel}
      </div>

      <style jsx>{`
        .topo-drift {
          animation: topoDrift 40s linear infinite;
        }
        @keyframes topoDrift {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-6%);
          }
        }
        .route-draw {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: drawRoute 2.4s 0.3s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
        @keyframes drawRoute {
          to {
            stroke-dashoffset: 0;
          }
        }
        .route-marker {
          filter: drop-shadow(0 0 5px rgba(245, 166, 35, 0.9));
        }
        .status-dot {
          animation: statusPulse 2.4s ease-in-out infinite;
        }
        @keyframes statusPulse {
          0%,
          100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(245, 166, 35, 0.55);
          }
          50% {
            opacity: 0.6;
            box-shadow: 0 0 0 4px rgba(245, 166, 35, 0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .topo-drift,
          .route-draw,
          .status-dot,
          :global(.route-marker animateMotion) {
            animation: none !important;
          }
          .route-draw {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState("en");
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const t = COPY[lang];
  const isDark = theme === "dark";

  // Load whatever was saved last — either from a previous visit to this
  // login page, or from the admin dashboard itself (shared keys).
  useEffect(() => {
    const savedLang = window.localStorage.getItem(LOCALE_KEY);
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    if (savedLang === "en" || savedLang === "ps" || savedLang === "fa") {
      setLang(savedLang);
    }
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
    setMounted(true);
  }, []);

  // Keep <html lang/dir/class> in sync too, so anything rendered outside
  // this component (toasts, browser UI) matches immediately — and so the
  // choice is already correct the moment the dashboard mounts after login.
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", t.dir);
    document.documentElement.classList.toggle("dark", isDark);
  }, [lang, theme, mounted, t.dir, isDark]);

  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
  }

  function selectLang(code) {
    setLang(code);
    window.localStorage.setItem(LOCALE_KEY, code);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.genericError);
        setLoading(false);
        return;
      }

      const redirectTo = searchParams.get("from") || "/admin";
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(t.genericError);
      setLoading(false);
    }
  }

  const pageBg = isDark ? "bg-[#0B0F14]" : "bg-[#EEEDE8]";
  const cardBg = isDark
    ? "bg-[#141B24]/90 border-[#243040]"
    : "bg-white/90 border-[#DEDBD1]";
  const textPrimary = isDark ? "text-[#EDEDE7]" : "text-[#171A1E]";
  const textMuted = isDark ? "text-[#8B98AC]" : "text-[#6B7280]";
  const inputBase = isDark
    ? "bg-[#0F151D] border-[#2A3646] text-[#EDEDE7] placeholder:text-[#586479] focus:border-[#F5A623]"
    : "bg-[#FAF9F6] border-[#DEDBD1] text-[#171A1E] placeholder:text-[#9CA3AF] focus:border-[#D98C10]";
  const iconBtn = isDark
    ? "border-[#2A3646] text-[#A9B4C4] hover:border-[#F5A623] hover:text-[#F5A623]"
    : "border-[#DEDBD1] text-[#6B7280] hover:border-[#D98C10] hover:text-[#D98C10]";

  return (
    <div
      dir={t.dir}
      className={`flex min-h-screen ${pageBg} transition-colors duration-300`}
      style={{ opacity: mounted ? 1 : 0.001 }}
    >
      <TopoRoutePanel t={t} />

      <div className="relative flex flex-1 items-center justify-center px-5 py-10">
        {/* faint contour texture on form side too, very quiet */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
          viewBox="0 0 600 600"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {[80, 220, 360, 500].map((y, i) => (
            <path
              key={y}
              d={`M-50 ${y} C 100 ${y - 50}, 200 ${y + 40}, 350 ${y - 10} S 550 ${y - 40}, 650 ${y + 20}`}
              fill="none"
              stroke={isDark ? "#EDEDE7" : "#171A1E"}
              strokeWidth="1"
            />
          ))}
        </svg>

        <div className="relative z-10 w-full max-w-sm">
          {/* top controls */}
          <div className="mb-6 flex items-center justify-between">
            <div
              className={`lg:hidden ${textPrimary}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="text-xl font-extrabold tracking-tight">
                {t.brand}
              </span>
              <span className="ml-1.5 text-xs font-semibold tracking-[0.3em] text-[#F5A623]">
                {t.brandSub}
              </span>
            </div>

            <div className="ms-auto flex items-center gap-2">
              <div
                role="radiogroup"
                aria-label="Language"
                className={`flex items-center gap-0.5 rounded-lg border px-1 py-1 ${iconBtn}`}
              >
                <GlobeIcon className="mx-1 h-3.5 w-3.5 opacity-60" />
                {LANGS.map(({ code, native }) => {
                  const active = lang === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => selectLang(code)}
                      className={[
                        "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                        active
                          ? "bg-[#F5A623] text-[#171205]"
                          : isDark
                            ? "text-[#A9B4C4] hover:text-[#F5A623]"
                            : "text-[#6B7280] hover:text-[#D98C10]",
                      ].join(" ")}
                    >
                      {native}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? t.themeToLight : t.themeToDark}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${iconBtn}`}
              >
                {isDark ? (
                  <SunIcon className="h-4 w-4" />
                ) : (
                  <MoonIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div
            className={`rounded-2xl border shadow-xl backdrop-blur-sm ${cardBg} p-7 sm:p-8`}
          >
            <h1
              className={`text-3xl font-bold ${textPrimary}`}
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
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#F5A623]/30 ${inputBase}`}
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
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#F5A623]/30 ${inputBase}`}
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
                className="w-full rounded-lg bg-gradient-to-r from-[#F5A623] to-[#D98C10] py-2.5 text-sm font-semibold text-[#171205] shadow-md shadow-[#F5A623]/20 transition-all hover:shadow-lg hover:shadow-[#F5A623]/30 disabled:opacity-60 disabled:hover:shadow-md"
              >
                {loading ? t.submitting : t.submit}
              </button>
            </form>
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

export default function AdminLoginPage() {
  return (
    <div className={displayFont.variable}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
