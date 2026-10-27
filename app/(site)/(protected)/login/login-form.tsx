"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Loader2, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { useBuyerAuth } from "@/providers/BuyerAuthProvider";
import { useLanguage } from "@/context/LanguageContext";

const loginText = {
  en: {
    dir: "ltr",
    loginTitle: "Welcome back",
    signupTitle: "Create your account",
    loginSubtitle: "Sign in to order from any restaurant on the platform.",
    signupSubtitle: "One account. Order at any restaurant, anywhere.",
    identifierLabel: "Email or phone",
    identifierPlaceholder: "you@example.com",
    nameLabel: "Full name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    phoneLabel: "Phone",
    phonePlaceholder: "07XX XXX XXX",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    loginButton: "Sign in",
    signupButton: "Create account",
    loginLoading: "Signing in…",
    signupLoading: "Creating account…",
    switchToSignup: "New here? Create an account",
    switchToLogin: "Already have an account? Sign in",
    continueBrowsing: "Browse dishes without signing in",
    emailOrPhoneRequired: "Enter an email or phone to continue",
    genericError: "Something went wrong. Please try again.",
    emailOptional: "optional if phone given",
    phoneOptional: "optional",
    emailRequired: "Email is required",
    emailVerifyFirst: "Please verify your email first.",
    verify: "Verify",
    verified: "Verified",
    sending: "Sending…",
    resend: "Resend",
    sendingCode: "Sending…",
    enter6Digits: "Enter all 6 digits.",
    codeSentTo: "Enter the 6-digit code sent to",
    verifyButton: "Verify",
    resendPrompt: "Didn't get it? Check spam, or",
    resendAction: "resend code",
    sendingResend: "sending…",
    verificationFailed: "Verification failed",
    couldNotSend: "Could not send code",
    forgotPassword: "Forgot password?",
  },
  ps: {
    dir: "rtl",
    loginTitle: "بیرته ښه راغلاست",
    signupTitle: "خپل حساب جوړ کړئ",
    loginSubtitle: "د پلیټ فارم په هر رستورانت کې د فرمایش لپاره ننوځئ.",
    signupSubtitle: "یو حساب. په هر رستورانت کې فرمایش وکړئ.",
    identifierLabel: "بریښنالیک یا تلیفون",
    identifierPlaceholder: "you@example.com",
    nameLabel: "بشپړ نوم",
    namePlaceholder: "ستاسو نوم",
    emailLabel: "بریښنالیک",
    emailPlaceholder: "you@example.com",
    phoneLabel: "تلیفون",
    phonePlaceholder: "07XX XXX XXX",
    passwordLabel: "پټنوم",
    passwordPlaceholder: "••••••••",
    loginButton: "ننوتل",
    signupButton: "حساب جوړول",
    loginLoading: "ننوتل روان دي…",
    signupLoading: "حساب جوړیږي…",
    switchToSignup: "نوی یاست؟ حساب جوړ کړئ",
    switchToLogin: "لا دمخه حساب لرئ؟ ننوځئ",
    continueBrowsing: "د ننوتلو پرته خواړه وګورئ",
    emailOrPhoneRequired: "د دوام لپاره بریښنالیک یا تلیفون ولیکئ",
    genericError: "یو څه غلط شول. بیا هڅه وکړئ.",
    emailOptional: "که تلیفون ورکړل شي اختیاري",
    phoneOptional: "اختیاري",
    emailRequired: "بریښنالیک اړین دی",
    emailVerifyFirst: "مهرباني وکړئ لومړی خپل بریښنالیک تصدیق کړئ.",
    verify: "تصدیق",
    verified: "تصدیق شو",
    sending: "لېږل کیږي…",
    resend: "بیا واستوئ",
    sendingCode: "لېږل کیږي…",
    enter6Digits: "ټول ۶ عددونه ولیکئ.",
    codeSentTo: "۶ عددي کوډ چې ولېږل شو دلته ولیکئ",
    verifyButton: "تصدیق",
    resendPrompt: "نه یې ترلاسه کړ؟ سپیم وګورئ، یا",
    resendAction: "کوډ بیا واستوئ",
    sendingResend: "لېږل کیږي…",
    verificationFailed: "تصدیق ناکام شو",
    couldNotSend: "کوډ نه شي لېږل شوی",
    forgotPassword: "پټنوم مو هیر شو؟",
  },
  prs: {
    dir: "rtl",
    loginTitle: "خوش آمدید",
    signupTitle: "حساب خود را بسازید",
    loginSubtitle: "برای سفارش از هر رستورانت وارد شوید.",
    signupSubtitle: "یک حساب. از هر رستورانت سفارش دهید.",
    identifierLabel: "ایمیل یا تلیفون",
    identifierPlaceholder: "you@example.com",
    nameLabel: "نام کامل",
    namePlaceholder: "نام شما",
    emailLabel: "ایمیل",
    emailPlaceholder: "you@example.com",
    phoneLabel: "تلیفون",
    phonePlaceholder: "07XX XXX XXX",
    passwordLabel: "رمز عبور",
    passwordPlaceholder: "••••••••",
    loginButton: "ورود",
    signupButton: "ایجاد حساب",
    loginLoading: "در حال ورود…",
    signupLoading: "در حال ایجاد…",
    switchToSignup: "جدید هستید؟ حساب بسازید",
    switchToLogin: "حساب دارید؟ وارد شوید",
    continueBrowsing: "بدون ورود غذاها را مرور کنید",
    emailOrPhoneRequired: "برای ادامه ایمیل یا تلیفون وارد کنید",
    genericError: "مشکلی پیش آمد. دوباره تلاش کنید.",
    emailOptional: "در صورت داشتن تلیفون اختیاری",
    phoneOptional: "اختیاری",
    emailRequired: "ایمیل الزامی است",
    emailVerifyFirst: "لطفاً ابتدا ایمیل خود را تأیید کنید.",
    verify: "تأیید",
    verified: "تأیید شده",
    sending: "در حال ارسال…",
    resend: "ارسال دوباره",
    sendingCode: "در حال ارسال…",
    enter6Digits: "همه ۶ رقم را وارد کنید.",
    codeSentTo: "کد ۶ رقمی ارسال‌شده را وارد کنید به",
    verifyButton: "تأیید",
    resendPrompt: "دریافت نکردید؟ اسپم را بررسی کنید، یا",
    resendAction: "ارسال دوباره کد",
    sendingResend: "در حال ارسال…",
    verificationFailed: "تأیید ناموفق بود",
    couldNotSend: "کد ارسال نشد",
    forgotPassword: "رمز عبور را فراموش کرده‌اید؟",
  },
};

const EMPTY_OTP = ["", "", "", "", "", ""];

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { refresh } = useBuyerAuth();
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lang = loginText[language] ? language : "en";
  const t = loginText[lang];
  const isRTL = t.dir === "rtl";
  const isDark = mounted ? resolvedTheme !== "light" : true;

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", t.dir);
  }, [lang, mounted, t.dir]);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({
    identifier: "",
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ─────────── email verification ───────────
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationId, setEmailVerificationId] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(EMPTY_OTP);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  function updateField(field: keyof typeof form, value: string) {
    if (field === "email" && value !== form.email) {
      setEmailVerified(false);
      setEmailVerificationId("");
      setOtpSent(false);
      setOtpDigits(EMPTY_OTP);
      setOtpError("");
    }
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function sendOtp() {
    const email = form.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError(t.emailRequired);
      return;
    }
    setOtpError("");
    setError("");
    setSendingOtp(true);
    try {
      const res = await fetch("/api/email-verifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ownerName: form.full_name.trim(),
          hotelName: "Buyer Account",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.couldNotSend);
      setEmailVerificationId(data.verification_id);
      setOtpSent(true);
      setOtpDigits(EMPTY_OTP);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtp() {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setOtpError(t.enter6Digits);
      return;
    }
    setOtpError("");
    setOtpSubmitting(true);
    try {
      const res = await fetch("/api/email-verifications/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification_id: emailVerificationId,
          otp: code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.verificationFailed);
      setEmailVerified(true);
      setOtpSent(false);
    } catch (err: any) {
      setOtpError(err.message);
      setOtpDigits(EMPTY_OTP);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpSubmitting(false);
    }
  }

  function setOtpDigit(i: number, val: string) {
    const clean = val.replace(/\D/g, "").slice(-1);
    setOtpDigits((d) => {
      const n = [...d];
      n[i] = clean;
      return n;
    });
    if (clean && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function otpKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }

  function otpPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = (e.clipboardData.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!text) return;
    const n = text.split("");
    while (n.length < 6) n.push("");
    setOtpDigits(n);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  }

  // ─────────── submit ───────────
  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "signup") {
      if (!form.email.trim() || !form.email.includes("@")) {
        setError(t.emailRequired);
        return;
      }
      if (!emailVerified || !emailVerificationId) {
        setError(t.emailVerifyFirst);
        return;
      }
    }

    setLoading(true);
    setError("");
    try {
      const url =
        mode === "login" ? "/api/buyer/auth/login" : "/api/buyer/auth/signup";

      const body =
        mode === "login"
          ? { identifier: form.identifier, password: form.password }
          : {
              full_name: form.full_name,
              email: form.email.trim().toLowerCase(),
              phone: form.phone || undefined,
              password: form.password,
              verification_id: emailVerificationId,
            };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.genericError);

      await refresh();
      router.push(next);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function changeMode(m: "login" | "signup") {
    if (m === mode) return;
    setMode(m);
    setError("");
    setOtpError("");
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15121C]">
        <Loader2 className="h-6 w-6 animate-spin text-[#C9A227]" />
      </div>
    );
  }

  // One accent, a few neutrals.
  const muted = isDark ? "text-[#A8A3B5]" : "text-[#6B6676]";
  const accent = isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]";

  return (
    <div
      dir={t.dir}
      className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 ${
        isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F5F0] text-[#1D1A22]"
      }`}
    >
      {/* Table-grid texture + drifting gold blobs (same as About page) */}
      <svg
        className={`pointer-events-none absolute inset-0 h-full w-full ${
          isDark ? "opacity-[0.04]" : "opacity-[0.06]"
        }`}
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
              stroke={isDark ? "#F0EAE2" : "#1D1A22"}
              strokeWidth="1"
            />
          )),
        )}
      </svg>
      <div
        className="blob-a pointer-events-none absolute -top-24 -start-24 h-96 w-96 rounded-full bg-[#C9A227]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="blob-b pointer-events-none absolute top-40 -end-32 h-96 w-96 rounded-full bg-[#C9A227]/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Skyline + eating scene (no vehicles, stays in place) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        aria-hidden="true"
      >
        <Skyline />
        <div className="absolute bottom-3 mx-auto w-[220px] opacity-60 start-0 end-0 md:end-8 md:start-auto md:mx-0 md:w-[340px] md:opacity-100">
          <Diner />
        </div>
      </div>

      <main className="relative w-full max-w-[400px]">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? t.loginTitle : t.signupTitle}
          </h1>
          <p className={`mt-2 text-sm ${muted}`}>
            {mode === "login" ? t.loginSubtitle : t.signupSubtitle}
          </p>
        </header>

        <div
          className={`rounded-2xl border p-6 ${
            isDark
              ? "border-[#2E2938] bg-[#1E1B26]/90 backdrop-blur-sm"
              : "border-[#E6E1D6] bg-white/90 shadow-sm backdrop-blur-sm"
          }`}
        >
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <Field
                label={t.nameLabel}
                value={form.full_name}
                onChange={(v) => updateField("full_name", v)}
                placeholder={t.namePlaceholder}
                autoComplete="name"
                isDark={isDark}
                required
              />
            )}

            {mode === "login" ? (
              <Field
                label={t.identifierLabel}
                value={form.identifier}
                onChange={(v) => updateField("identifier", v)}
                placeholder={t.identifierPlaceholder}
                autoComplete="username"
                isDark={isDark}
                required
              />
            ) : (
              <>
                <Field
                  label={t.emailLabel}
                  type="email"
                  value={form.email}
                  onChange={(v) => updateField("email", v)}
                  placeholder={t.emailPlaceholder}
                  autoComplete="email"
                  isDark={isDark}
                  required
                  action={
                    emailVerified ? (
                      <span
                        className={`me-2 flex shrink-0 items-center gap-1 text-xs font-medium ${
                          isDark ? "text-emerald-300" : "text-emerald-700"
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                        {t.verified}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={
                          sendingOtp ||
                          !form.email.includes("@") ||
                          form.email.trim().length < 5
                        }
                        className={`me-2 shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          isDark
                            ? "bg-[#C9A227]/15 text-[#E0B93A] hover:bg-[#C9A227]/25"
                            : "bg-[#C9A227]/15 text-[#8A6E1A] hover:bg-[#C9A227]/25"
                        }`}
                      >
                        {sendingOtp ? t.sending : otpSent ? t.resend : t.verify}
                      </button>
                    )
                  }
                />

                {otpSent && !emailVerified && (
                  <div
                    className={`rounded-xl border p-4 ${
                      isDark
                        ? "border-[#332C3E] bg-[#15121C]"
                        : "border-[#E6E1D6] bg-[#FAF8F4]"
                    }`}
                  >
                    <p className={`text-sm ${muted}`}>
                      {t.codeSentTo}{" "}
                      <strong className={`break-all font-semibold ${accent}`}>
                        {form.email}
                      </strong>
                    </p>

                    <div
                      dir="ltr"
                      className="mt-3 grid grid-cols-6 gap-2"
                      onPaste={otpPaste}
                    >
                      {otpDigits.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            otpRefs.current[i] = el;
                          }}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={d}
                          onChange={(e) => setOtpDigit(i, e.target.value)}
                          onKeyDown={(e) => otpKeyDown(i, e)}
                          aria-label={`Digit ${i + 1}`}
                          className={`h-12 w-full min-w-0 rounded-lg border text-center text-lg font-semibold tabular-nums outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/30 ${
                            isDark
                              ? "border-[#332C3E] bg-[#1E1B26] text-[#F0EAE2]"
                              : "border-[#DDD7C9] bg-white text-[#1D1A22]"
                          }`}
                        />
                      ))}
                    </div>

                    {otpError && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-red-500">
                        <AlertCircle size={14} className="shrink-0" />
                        {otpError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={
                        otpSubmitting || otpDigits.join("").length !== 6
                      }
                      className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#C9A227] px-4 text-sm font-semibold text-[#1D1707] transition hover:bg-[#D4AC2E] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {otpSubmitting && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      {t.verifyButton}
                    </button>

                    <p className={`mt-3 text-center text-xs ${muted}`}>
                      {t.resendPrompt}{" "}
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={sendingOtp}
                        className={`font-semibold hover:underline disabled:opacity-50 ${accent}`}
                      >
                        {sendingOtp ? t.sendingResend : t.resendAction}
                      </button>
                    </p>
                  </div>
                )}

                <Field
                  label={t.phoneLabel}
                  sublabel={t.phoneOptional}
                  type="tel"
                  value={form.phone}
                  onChange={(v) => updateField("phone", v)}
                  placeholder={t.phonePlaceholder}
                  autoComplete="tel"
                  isDark={isDark}
                  dir="ltr"
                />
              </>
            )}

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="password"
                  className={`text-sm font-medium ${
                    isDark ? "text-[#D8D3E2]" : "text-[#3A3542]"
                  }`}
                >
                  {t.passwordLabel}
                </label>
                {mode === "login" && (
                  <Link
                    href="/forgot-password"
                    className={`text-sm font-medium hover:underline ${accent}`}
                  >
                    {t.forgotPassword}
                  </Link>
                )}
              </div>
              <div
                className={`flex items-center rounded-lg border focus-within:border-[#C9A227] focus-within:ring-2 focus-within:ring-[#C9A227]/30 ${
                  isDark
                    ? "border-[#332C3E] bg-[#161320]"
                    : "border-[#DDD7C9] bg-white"
                }`}
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder={t.passwordPlaceholder}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  className={`h-11 min-w-0 flex-1 bg-transparent px-3 text-base outline-none ${
                    isDark
                      ? "text-[#F0EAE2] placeholder:text-[#5E5670]"
                      : "text-[#1D1A22] placeholder:text-[#A39D8F]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`me-1.5 flex h-8 w-8 items-center justify-center rounded-md ${muted} hover:opacity-80`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
                  isDark
                    ? "bg-red-500/10 text-red-300"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            ) : (
              mode === "signup" &&
              !emailVerified && (
                <p className={`text-xs ${muted}`}>{t.emailVerifyFirst}</p>
              )
            )}

            <button
              type="submit"
              disabled={loading || (mode === "signup" && !emailVerified)}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#C9A227] px-4 text-base font-semibold text-[#1D1707] transition hover:bg-[#D4AC2E] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading
                ? mode === "login"
                  ? t.loginLoading
                  : t.signupLoading
                : mode === "login"
                  ? t.loginButton
                  : t.signupButton}
            </button>
          </form>
        </div>

        <div className="mt-5 flex flex-col items-center gap-1 text-sm">
          <button
            type="button"
            onClick={() => changeMode(mode === "login" ? "signup" : "login")}
            className={`min-h-[44px] px-3 font-semibold hover:underline ${accent}`}
          >
            {mode === "login" ? t.switchToSignup : t.switchToLogin}
          </button>
          <Link
            href="/"
            className={`min-h-[44px] px-3 leading-[44px] hover:underline ${muted}`}
          >
            {t.continueBrowsing}
          </Link>
        </div>
      </main>

      <style jsx global>{`
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

        /* 9s loop: lid lifts, steam, two bites, lid closes */
        @keyframes dl-lid {
          0%,
          8% {
            transform: translate(0, 0) rotate(0deg);
          }
          20%,
          84% {
            transform: translate(-8px, -42px) rotate(-8deg);
          }
          94%,
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
        }
        @keyframes dl-arm {
          0%,
          28% {
            transform: rotate(-16deg) scale(1, 1);
          }
          42%,
          47% {
            transform: rotate(104deg) scale(0.55, 1);
          }
          56%,
          60% {
            transform: rotate(-16deg) scale(1, 1);
          }
          72%,
          77% {
            transform: rotate(104deg) scale(0.55, 1);
          }
          86%,
          100% {
            transform: rotate(-16deg) scale(1, 1);
          }
        }
        @keyframes dl-bite {
          0%,
          24% {
            opacity: 0;
          }
          28%,
          42% {
            opacity: 1;
          }
          43%,
          56% {
            opacity: 0;
          }
          58%,
          72% {
            opacity: 1;
          }
          73%,
          100% {
            opacity: 0;
          }
        }
        @keyframes dl-mouth {
          0%,
          39% {
            opacity: 0;
          }
          42%,
          46% {
            opacity: 1;
          }
          48%,
          69% {
            opacity: 0;
          }
          72%,
          76% {
            opacity: 1;
          }
          78%,
          100% {
            opacity: 0;
          }
        }
        @keyframes dl-head {
          0%,
          46% {
            transform: translateY(0);
          }
          48%,
          52% {
            transform: translateY(-1.6px);
          }
          50%,
          54% {
            transform: translateY(0);
          }
          76% {
            transform: translateY(0);
          }
          78%,
          82% {
            transform: translateY(-1.6px);
          }
          80%,
          84%,
          100% {
            transform: translateY(0);
          }
        }
        @keyframes dl-steam {
          0%,
          16% {
            opacity: 0;
            transform: translateY(6px);
          }
          26% {
            opacity: 0.85;
            transform: translateY(0);
          }
          50% {
            opacity: 0.45;
            transform: translateY(-3px);
          }
          70% {
            opacity: 0.8;
            transform: translateY(-1px);
          }
          86%,
          100% {
            opacity: 0;
            transform: translateY(-6px);
          }
        }
        @keyframes dl-yum {
          0%,
          48% {
            opacity: 0;
            transform: translateY(4px) scale(0.6);
          }
          54% {
            opacity: 1;
            transform: translateY(-4px) scale(1);
          }
          62%,
          78% {
            opacity: 0;
            transform: translateY(-10px) scale(1);
          }
          84% {
            opacity: 1;
            transform: translateY(-4px) scale(1);
          }
          92%,
          100% {
            opacity: 0;
            transform: translateY(-10px) scale(1);
          }
        }
        .dl-lid,
        .dl-arm,
        .dl-bite,
        .dl-mouth,
        .dl-head,
        .dl-steam,
        .dl-yum {
          animation-duration: 9s;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        .dl-lid {
          animation-name: dl-lid;
          transform-box: view-box;
          transform-origin: 70px 98px;
        }
        .dl-arm {
          animation-name: dl-arm;
          transform-box: view-box;
          transform-origin: 124px 84px;
        }
        .dl-bite {
          animation-name: dl-bite;
        }
        .dl-mouth {
          animation-name: dl-mouth;
          opacity: 0;
        }
        .dl-head {
          animation-name: dl-head;
        }
        .dl-steam {
          animation-name: dl-steam;
          opacity: 0;
        }
        .dl-yum {
          animation-name: dl-yum;
          opacity: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .blob-a,
          .blob-b,
          .dl-lid,
          .dl-arm,
          .dl-bite,
          .dl-mouth,
          .dl-head,
          .dl-steam,
          .dl-yum {
            animation: none !important;
          }
          .dl-lid {
            transform: translate(-8px, -42px) rotate(-8deg);
          }
          .dl-steam {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  sublabel,
  value,
  onChange,
  placeholder,
  type = "text",
  isDark,
  dir,
  required,
  action,
  autoComplete,
}: {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  isDark: boolean;
  dir?: "ltr" | "rtl";
  required?: boolean;
  action?: React.ReactNode;
  autoComplete?: string;
}) {
  return (
    <div className="min-w-0">
      <label
        className={`mb-1.5 flex items-baseline gap-1.5 text-sm font-medium ${
          isDark ? "text-[#D8D3E2]" : "text-[#3A3542]"
        }`}
      >
        {label}
        {sublabel && (
          <span className="text-xs font-normal text-[#8A8496]">
            ({sublabel})
          </span>
        )}
      </label>
      <div
        className={`flex items-center rounded-lg border focus-within:border-[#C9A227] focus-within:ring-2 focus-within:ring-[#C9A227]/30 ${
          isDark ? "border-[#332C3E] bg-[#161320]" : "border-[#DDD7C9] bg-white"
        }`}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dir}
          required={required}
          autoComplete={autoComplete}
          className={`h-11 min-w-0 flex-1 bg-transparent px-3 text-base outline-none ${
            isDark
              ? "text-[#F0EAE2] placeholder:text-[#5E5670]"
              : "text-[#1D1A22] placeholder:text-[#A39D8F]"
          }`}
        />
        {action}
      </div>
    </div>
  );
}

/* Faint city silhouette behind the road */
function Skyline() {
  const b = [
    [0, 40, 30],
    [46, 30, 48],
    [82, 44, 36],
    [132, 28, 56],
    [166, 50, 26],
    [222, 34, 44],
    [262, 46, 58],
    [314, 32, 32],
    [352, 40, 50],
    [398, 30, 38],
    [434, 48, 28],
    [488, 34, 52],
    [528, 40, 34],
    [574, 26, 44],
  ];
  return (
    <svg
      className="absolute inset-x-0 bottom-2 h-14 w-full text-[#C9A227] opacity-[0.10]"
      viewBox="0 0 600 60"
      preserveAspectRatio="none"
    >
      {b.map(([x, w, h], i) => (
        <g key={i}>
          <rect
            x={x}
            y={60 - h}
            width={w}
            height={h}
            rx="2"
            fill="currentColor"
          />
          {[0, 1, 2].map((r) => (
            <rect
              key={r}
              x={x + 6}
              y={60 - h + 8 + r * 12}
              width="5"
              height="5"
              rx="1"
              fill="#15121C"
              opacity="0.6"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/* Cute diner: lifts the dish cover, then eats (loops, stays in place) */
function Diner() {
  return (
    <svg viewBox="0 0 200 150" className="h-auto w-full" fill="none">
      <ellipse cx="100" cy="143" rx="88" ry="4" fill="#000" opacity="0.22" />

      <rect x="22" y="106" width="8" height="36" rx="2" fill="#6B4430" />
      <rect x="170" y="106" width="8" height="36" rx="2" fill="#6B4430" />

      <path d="M114 104Q112 76 138 72Q164 76 162 104Z" fill="#2F9E8F" />
      <path
        d="M126 71L148 71L137 87Z"
        fill="#FFF4E0"
        stroke="#E0B93A"
        strokeWidth="1"
      />

      <g className="dl-head">
        <circle cx="138" cy="50" r="17" fill="#F6C7A0" />
        <path
          d="M121 48Q121 30 139 30Q156 31 155 47Q150 38 138 38Q127 38 121 48Z"
          fill="#3A2A22"
        />
        <circle cx="131" cy="52" r="2.1" fill="#2A2330" />
        <circle cx="131.7" cy="51.3" r="0.7" fill="#fff" />
        <circle cx="144" cy="52" r="2.1" fill="#2A2330" />
        <circle cx="144.7" cy="51.3" r="0.7" fill="#fff" />
        <ellipse
          cx="125.5"
          cy="58"
          rx="3.2"
          ry="2"
          fill="#F28B82"
          opacity="0.7"
        />
        <ellipse
          cx="150"
          cy="58"
          rx="3.2"
          ry="2"
          fill="#F28B82"
          opacity="0.7"
        />
        <path
          d="M133 59Q137.5 64 142 59"
          stroke="#2A2330"
          strokeWidth="1.7"
          fill="none"
          strokeLinecap="round"
        />
        <g className="dl-mouth">
          <ellipse cx="137.5" cy="61.5" rx="4" ry="4.2" fill="#7A2E2E" />
          <ellipse cx="137.5" cy="63.5" rx="2.3" ry="1.5" fill="#F28B82" />
        </g>
      </g>

      <rect x="10" y="100" width="180" height="9" rx="4" fill="#8A5A3C" />
      <rect x="10" y="100" width="180" height="3" rx="1.5" fill="#A87450" />

      <ellipse
        cx="70"
        cy="99"
        rx="33"
        ry="5.5"
        fill="#FFF4E0"
        stroke="#E0B93A"
        strokeWidth="1.3"
      />
      <g>
        <path d="M46 98Q49 78 70 76Q91 78 94 98Z" fill="#E8C26A" />
        <path
          d="M54 88Q70 80 86 88"
          stroke="#F6DB93"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="70" cy="79" r="6" fill="#8B4A2B" />
        <circle cx="68" cy="77" r="1.8" fill="#B06A44" />
        <rect
          x="55"
          y="86"
          width="10"
          height="2.8"
          rx="1.4"
          fill="#F28C28"
          transform="rotate(-20 60 87)"
        />
        <rect
          x="76"
          y="85"
          width="10"
          height="2.8"
          rx="1.4"
          fill="#F28C28"
          transform="rotate(18 81 86)"
        />
        <rect x="64" y="92" width="9" height="2.6" rx="1.3" fill="#F28C28" />
        <circle cx="58" cy="93" r="1.5" fill="#5B2A3C" />
        <circle cx="82" cy="92" r="1.5" fill="#5B2A3C" />
        <circle cx="88" cy="94" r="1.4" fill="#5B2A3C" />
        <circle cx="52" cy="94" r="1.3" fill="#6BAA4A" />
        <circle cx="73" cy="88" r="1.3" fill="#6BAA4A" />
        <circle cx="62" cy="83" r="1.3" fill="#6BAA4A" />
      </g>

      <g stroke="#F0EAE2" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path className="dl-steam" d="M58 72Q53 66 58 60Q63 54 58 48" />
        <path
          className="dl-steam"
          style={{ animationDelay: "0.6s" }}
          d="M70 70Q65 64 70 58Q75 52 70 46"
        />
        <path
          className="dl-steam"
          style={{ animationDelay: "1.2s" }}
          d="M82 72Q77 66 82 60Q87 54 82 48"
        />
      </g>

      <g className="dl-lid">
        <path
          d="M38 98Q40 62 70 60Q100 62 102 98Z"
          fill="#D8D3E2"
          stroke="#8A8496"
          strokeWidth="1.6"
        />
        <path
          d="M46 86Q48 70 62 66"
          stroke="#fff"
          strokeWidth="2.5"
          opacity="0.6"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="70" cy="58" r="4" fill="#8A8496" />
        <text
          x="72"
          y="90"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="800"
          fill="#C9431F"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.3"
        >
          Melmah
        </text>
        <rect x="36" y="96" width="68" height="4" rx="2" fill="#8A8496" />
      </g>

      <g className="dl-arm">
        <path
          d="M124 84H96"
          stroke="#2F9E8F"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <circle cx="95" cy="84" r="4.6" fill="#F6C7A0" />
        <path
          d="M92 84H80"
          stroke="#B7B2C4"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <ellipse
          cx="77"
          cy="84"
          rx="5.5"
          ry="3.4"
          fill="#D8D3E2"
          stroke="#8A8496"
          strokeWidth="1"
        />
        <g className="dl-bite">
          <ellipse cx="77" cy="82" rx="4" ry="2.6" fill="#E8C26A" />
          <circle cx="76" cy="80.8" r="1" fill="#F28C28" />
        </g>
      </g>

      <g className="dl-yum" fill="#F25C7A">
        <path d="M150 28c-3-5-9-1-5 4l5 5l5-5c4-5-2-9-5-4z" />
      </g>
    </svg>
  );
}
