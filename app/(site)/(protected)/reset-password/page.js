// app/reset-password/page.js
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import LoadingScreen from "@/components/LoadingScreen";
import { fraunces as displayFont } from "@/app/fonts/fraunces";
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Link2Off,
} from "lucide-react";

const resetText = {
  en: {
    loading: "Loading…",
    titleForm: "Set a new password",
    subtitleForm: "Choose a strong password for your account.",
    newPasswordLabel: "New password",
    newPasswordPlaceholder: "••••••••",
    confirmLabel: "Confirm password",
    confirmPlaceholder: "••••••••",
    submit: "Update password",
    submitting: "Updating…",
    errorTooShort: "Password must be at least 8 characters",
    errorMismatch: "Passwords do not match",
    errorGeneric: "Something went wrong. Please try again.",
    backToLogin: "Back to sign in",
    invalidTitle: "Invalid link",
    invalidBody: "This password reset link is missing or malformed.",
    requestNew: "Request a new link",
    doneTitle: "Password updated",
    doneBody: "Taking you to the sign-in page…",
  },
  ps: {
    loading: "بارول…",
    titleForm: "نوی پټنوم وټاکئ",
    subtitleForm: "د خپل حساب لپاره یو پیاوړی پټنوم وټاکئ.",
    newPasswordLabel: "نوی پټنوم",
    newPasswordPlaceholder: "••••••••",
    confirmLabel: "پټنوم تایید کړئ",
    confirmPlaceholder: "••••••••",
    submit: "پټنوم نوي کړئ",
    submitting: "نوي کیږي…",
    errorTooShort: "پټنوم باید لږترلږه ۸ توري وي",
    errorMismatch: "پټنومونه سره سمون نه لري",
    errorGeneric: "یو څه غلط شول. مهرباني وکړئ بیا هڅه وکړئ.",
    backToLogin: "ننوتلو ته بیرته",
    invalidTitle: "ناسم لینک",
    invalidBody: "د پټنوم بیا تنظیم لینک نسته یا ناسم دی.",
    requestNew: "نوی لینک وغواړئ",
    doneTitle: "پټنوم نوی شو",
    doneBody: "د ننوتلو پاڼې ته بوځو…",
  },
  prs: {
    loading: "در حال بارگذاری…",
    titleForm: "تعیین رمز عبور جدید",
    subtitleForm: "یک رمز عبور قوی برای حساب خود انتخاب کنید.",
    newPasswordLabel: "رمز عبور جدید",
    newPasswordPlaceholder: "••••••••",
    confirmLabel: "تأیید رمز عبور",
    confirmPlaceholder: "••••••••",
    submit: "به‌روزرسانی رمز عبور",
    submitting: "در حال به‌روزرسانی…",
    errorTooShort: "رمز عبور باید حداقل ۸ کاراکتر باشد",
    errorMismatch: "رمزهای عبور مطابقت ندارند",
    errorGeneric: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
    backToLogin: "بازگشت به ورود",
    invalidTitle: "لینک نامعتبر",
    invalidBody: "این لینک بازنشانی رمز عبور موجود نیست یا نامعتبر است.",
    requestNew: "درخواست لینک جدید",
    doneTitle: "رمز عبور به‌روزرسانی شد",
    doneBody: "در حال انتقال به صفحه ورود…",
  },
};

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const token = searchParams.get("token") || "";

  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const lang = resetText[language] ? language : "en";
  const t = resetText[lang];
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
    if (password.length < 8) {
      return setError(t.errorTooShort);
    }
    if (password !== confirm) {
      return setError(t.errorMismatch);
    }
    setLoading(true);
    try {
      // ⬇️ BUYER endpoint
      const res = await fetch("/api/buyer/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errorGeneric);
      setDone(true);
      // ⬇️ Buyer login
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      setError(err.message || t.errorGeneric);
      setLoading(false);
    }
  }

  if (!mounted) {
    return <LoadingScreen text={resetText.en.loading} fullScreen />;
  }

  /* ---------- INVALID LINK ---------- */
  if (!token) {
    return (
      <div className="w-full rounded-2xl border border-[#2E2938] bg-[#1E1B26]/90 p-7 text-center shadow-xl backdrop-blur-sm sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E5484D]/10">
          <Link2Off size={26} className="text-[#E5484D]" />
        </span>
        <h1
          className="mt-4 text-2xl font-medium text-[#F0EAE2]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t.invalidTitle}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#B7B2C4]">
          {t.invalidBody}
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A227] to-[#A9821E] px-4 py-2.5 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/30 active:translate-y-0 active:scale-[0.98]"
        >
          {t.requestNew}
        </Link>
      </div>
    );
  }

  /* ---------- DONE ---------- */
  if (done) {
    return (
      <div className="w-full rounded-2xl border border-[#2E2938] bg-[#1E1B26]/90 p-7 text-center shadow-xl backdrop-blur-sm sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </span>
        <h1
          className="mt-4 text-2xl font-medium text-[#F0EAE2]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t.doneTitle}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#B7B2C4]">
          {t.doneBody}
        </p>
        <div className="mt-5 flex items-center justify-center">
          <Loader2 size={16} className="animate-spin text-[#C9A227]" />
        </div>
      </div>
    );
  }

  /* ---------- FORM ---------- */
  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-[#2E2938] bg-[#1E1B26]/90 p-7 shadow-xl backdrop-blur-sm sm:p-8"
    >
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#C9A227]/10">
          <KeyRound size={26} className="text-[#C9A227]" />
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

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#F0EAE2]">
            {t.newPasswordLabel}
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.newPasswordPlaceholder}
            className="w-full rounded-lg border border-[#332C3E] bg-[#161320] px-3 py-2.5 text-sm text-[#F0EAE2] placeholder:text-[#5E5670] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#F0EAE2]">
            {t.confirmLabel}
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t.confirmPlaceholder}
            className="w-full rounded-lg border border-[#332C3E] bg-[#161320] px-3 py-2.5 text-sm text-[#F0EAE2] placeholder:text-[#5E5670] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/30"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border-s-4 border-[#E5484D] bg-[#E5484D]/10 px-3 py-2 text-sm text-[#FF9B9E]">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A227] to-[#A9821E] py-2.5 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/30 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? t.submitting : t.submit}
        </button>

        {/* ⬇️ Buyer login */}
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-xs text-[#9691A6] underline-offset-2 transition-colors hover:text-[#C9A227] hover:underline"
        >
          <BackArrow size={12} />
          {t.backToLogin}
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<LoadingScreen text="…" fullScreen />}>
          <ResetForm />
        </Suspense>
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
