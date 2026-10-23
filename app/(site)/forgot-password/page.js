// app/forgot-password/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import LoadingScreen from "@/components/LoadingScreen";
import { fraunces as displayFont } from "@/app/fonts/fraunces";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle,
  UserX,
  UserMinus,
} from "lucide-react";



const forgotText = {
  en: {
    loading: "Loading…",
    titleForm: "Forgot password",
    titleSent: "Check your email",
    subtitleForm:
      "Enter your email and we'll send you a link to reset your password.",
    subtitleSent: "We've sent a reset link to {email}. It expires in 1 hour.",
    emailLabel: "Email",
    emailPlaceholder: "you@yourhotel.com",
    submit: "Send reset link",
    submitting: "Sending…",
    errorGeneric: "Something went wrong. Please try again.",
    errorNoAccount: "No account found with this email address.",
    errorInactive:
      "This account is not active. Please contact your administrator.",
    backToLogin: "Back to sign in",
  },
  ps: {
    loading: "بارول…",
    titleForm: "پټنوم هیر شو",
    titleSent: "خپل بریښنالیک وګورئ",
    subtitleForm:
      "خپل بریښنالیک ولیکئ او موږ به تاسو ته د پټنوم بیا تنظیمولو لینک ولېږو.",
    subtitleSent:
      "موږ {email} ته د بیا تنظیم لینک لېږلی دی. دا په ۱ ساعت کې پای ته رسي.",
    emailLabel: "بریښنالیک",
    emailPlaceholder: "you@yourhotel.com",
    submit: "د بیا تنظیم لینک ولېږئ",
    submitting: "لېږل کیږي…",
    errorGeneric: "یو څه غلط شول. مهرباني وکړئ بیا هڅه وکړئ.",
    errorNoAccount: "د دې بریښنالیک سره کوم حساب ونه موندل شو.",
    errorInactive:
      "دا حساب فعال نه دی. مهرباني وکړئ د خپل مدیر سره اړیکه ونیسئ.",
    backToLogin: "ننوتلو ته بیرته",
  },
  prs: {
    loading: "در حال بارگذاری…",
    titleForm: "فراموشی رمز عبور",
    titleSent: "ایمیل خود را بررسی کنید",
    subtitleForm:
      "ایمیل خود را وارد کنید و ما لینکی برای بازنشانی رمز عبور برایتان ارسال می‌کنیم.",
    subtitleSent:
      "ما لینک بازنشانی را به {email} ارسال کردیم. این لینک در ۱ ساعت منقضی می‌شود.",
    emailLabel: "ایمیل",
    emailPlaceholder: "you@yourhotel.com",
    submit: "ارسال لینک بازنشانی",
    submitting: "در حال ارسال…",
    errorGeneric: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
    errorNoAccount: "هیچ حسابی با این ایمیل یافت نشد.",
    errorInactive: "این حساب فعال نیست. لطفاً با مدیر خود تماس بگیرید.",
    backToLogin: "بازگشت به ورود",
  },
};

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [error, setError] = useState("");
  const [errorKind, setErrorKind] = useState(""); // "no_account" | "inactive" | "generic" | ""

  const lang = forgotText[language] ? language : "en";
  const t = forgotText[lang];
  const isRTL = lang === "ps" || lang === "prs";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  }, [lang, mounted, isRTL]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setErrorKind("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 404) {
        setError(t.errorNoAccount);
        setErrorKind("no_account");
        setLoading(false);
        return;
      }

      if (res.status === 403) {
        setError(t.errorInactive);
        setErrorKind("inactive");
        setLoading(false);
        return;
      }

      if (!res.ok || data.ok !== true) {
        setError(data.error || t.errorGeneric);
        setErrorKind("generic");
        setLoading(false);
        return;
      }

      setSentEmail(data.email || email);
      setSent(true);
    } catch (err) {
      setError(err.message || t.errorGeneric);
      setErrorKind("generic");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return <LoadingScreen text={forgotText.en.loading} fullScreen />;
  }

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-x-hidden bg-[#15121C] text-[#F0EAE2]`}
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

      {/* Drifting gold blobs */}
      <div
        className="blob-a pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#C9A227]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="blob-b pointer-events-none absolute top-40 -right-32 h-96 w-96 rounded-full bg-[#C9A227]/8 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen max-w-md items-center justify-center px-6 py-16">
        <div className="w-full rounded-2xl border border-[#2E2938] bg-[#1E1B26]/90 p-7 shadow-xl backdrop-blur-sm sm:p-8">
          {sent ? (
            /* ---------- SENT ---------- */
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </span>
              <h1
                className="mt-4 text-2xl font-medium text-[#F0EAE2]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t.titleSent}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#B7B2C4]">
                {t.subtitleSent.replace("{email}", sentEmail)}
              </p>

              <Link
                href="/login"
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A227] to-[#A9821E] px-4 py-2.5 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/30 active:translate-y-0 active:scale-[0.98]"
              >
                <BackArrow
                  size={15}
                  className="transition-transform duration-200 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
                />
                {t.backToLogin}
              </Link>
            </div>
          ) : (
            /* ---------- FORM ---------- */
            <>
              <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#C9A227]/10">
                  <Mail size={26} className="text-[#C9A227]" />
                </span>
                <h1
                  className="mt-4 text-2xl font-medium text-[#F0EAE2]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {t.titleForm}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-[#B7B2C4]">
                  {t.subtitleForm}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#F0EAE2]">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) {
                        setError("");
                        setErrorKind("");
                      }
                    }}
                    placeholder={t.emailPlaceholder}
                    className={`w-full rounded-lg border bg-[#161320] px-3 py-2.5 text-sm text-[#F0EAE2] placeholder:text-[#5E5670] outline-none transition-colors focus:ring-2 ${
                      errorKind === "no_account" || errorKind === "inactive"
                        ? "border-[#E5484D] focus:border-[#E5484D] focus:ring-[#E5484D]/20"
                        : "border-[#332C3E] focus:border-[#C9A227] focus:ring-[#C9A227]/30"
                    }`}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg border-s-4 border-[#E5484D] bg-[#E5484D]/10 px-3 py-2 text-sm text-[#FF9B9E]">
                    {errorKind === "no_account" ? (
                      <UserX size={15} className="mt-0.5 shrink-0" />
                    ) : errorKind === "inactive" ? (
                      <UserMinus size={15} className="mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    )}
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A227] to-[#A9821E] py-2.5 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/30 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <Send
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                  />
                  {loading ? t.submitting : t.submit}
                </button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 text-xs text-[#9691A6] underline-offset-2 transition-colors hover:text-[#C9A227] hover:underline"
                >
                  <BackArrow size={12} />
                  {t.backToLogin}
                </Link>
              </form>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
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
          animation: drift-a 11s ease-in-out infinite;
        }
        .blob-b {
          animation: drift-b 13s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .blob-a,
          .blob-b {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
