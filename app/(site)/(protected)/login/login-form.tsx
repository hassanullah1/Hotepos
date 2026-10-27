"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Loader2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  UtensilsCrossed,
  Clock,
  ShieldCheck,
  Star,
} from "lucide-react";
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
    heroTitle: "Great food from every restaurant",
    heroSubtitle: "Order from any restaurant on Melmah with a single account.",
    heroPerk1: "Hundreds of dishes",
    heroPerk2: "Fast, easy ordering",
    heroPerk3: "Secure & private",
    heroChip1: "Top rated",
    heroChip2: "Ready in 25 min",
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
    heroTitle: "د هر رستورانت ښه خواړه",
    heroSubtitle: "په یوه حساب د ملمه په هر رستورانت کې فرمایش وکړئ.",
    heroPerk1: "سلګونه خواړه",
    heroPerk2: "چټک او اسانه فرمایش",
    heroPerk3: "خوندي او محرم",
    heroChip1: "لوړ درجه شوی",
    heroChip2: "په ۲۵ دقیقو کې چمتو",
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
    heroTitle: "غذاهای عالی از هر رستورانت",
    heroSubtitle: "با یک حساب از هر رستورانت ملمه سفارش دهید.",
    heroPerk1: "صدها نوع غذا",
    heroPerk2: "سفارش آسان و سریع",
    heroPerk3: "امن و خصوصی",
    heroChip1: "برترین امتیاز",
    heroChip2: "آماده در ۲۵ دقیقه",
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
      className={`relative min-h-screen w-full overflow-hidden lg:grid lg:grid-cols-2 ${
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

      {/* Mobile / tablet: soft dish peeking from the bottom edge */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center lg:hidden"
        aria-hidden="true"
      >
        <div className="pl-float mb-6 w-[300px] opacity-40 sm:w-[420px]">
          <PlateArt />
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
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
                          {sendingOtp
                            ? t.sending
                            : otpSent
                              ? t.resend
                              : t.verify}
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
      </div>

      <HeroPanel isDark={isDark} t={t} />

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

        @keyframes pl-float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-7px) rotate(0.8deg);
          }
        }
        @keyframes pl-steam {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.8);
          }
          35% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
            transform: translateY(-26px) scale(1.25);
          }
        }
        .pl-float {
          animation: pl-float 7s ease-in-out infinite;
        }
        .pl-steam {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: pl-steam 5.5s ease-out infinite;
        }

        @keyframes pl-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pl-ripple {
          0% {
            opacity: 0.85;
            transform: scale(0.5);
          }
          100% {
            opacity: 0;
            transform: scale(3.2);
          }
        }
        @keyframes pl-twinkle {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.3) rotate(0deg);
          }
          50% {
            opacity: 0.95;
            transform: scale(1) rotate(45deg);
          }
        }
        @keyframes pl-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pl-bokeh {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(24px, -34px) scale(1.15);
          }
        }
        @keyframes pl-chip {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-9px);
          }
        }
        .pl-ring {
          transform-box: view-box;
          transform-origin: 260px 230px;
          animation: pl-spin 70s linear infinite;
        }
        .pl-ring-rev {
          animation-duration: 110s;
          animation-direction: reverse;
        }
        .pl-ripple {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: pl-ripple 3s ease-out infinite;
        }
        .pl-twinkle {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: pl-twinkle 5s ease-in-out infinite;
        }
        .pl-up {
          animation: pl-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .pl-bokeh {
          animation: pl-bokeh 14s ease-in-out infinite;
        }
        .pl-chip {
          animation: pl-chip 5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .blob-a,
          .blob-b,
          .pl-float,
          .pl-steam,
          .pl-ring,
          .pl-ripple,
          .pl-twinkle,
          .pl-up,
          .pl-bokeh,
          .pl-chip {
            animation: none !important;
          }
          .pl-up {
            opacity: 1;
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

/* Overhead photo-style dish: Kabuli pilaf, salad, tea and naan */
function PlateArt() {
  return (
    <svg
      viewBox="0 0 560 460"
      className="h-auto w-full"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="pl-plate" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D9D1BF" />
        </radialGradient>
        <radialGradient id="pl-well" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#F4EFE3" />
          <stop offset="1" stopColor="#D3CAB6" />
        </radialGradient>
        <radialGradient id="pl-rice" cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor="#FAE8A8" />
          <stop offset="0.7" stopColor="#E5B955" />
          <stop offset="1" stopColor="#C58A2B" />
        </radialGradient>
        <linearGradient id="pl-carrot" x1="0" x2="1">
          <stop offset="0" stopColor="#F9A744" />
          <stop offset="1" stopColor="#E5761C" />
        </linearGradient>
        <radialGradient id="pl-lamb" cx="35%" cy="30%" r="85%">
          <stop offset="0" stopColor="#D79A63" />
          <stop offset="0.55" stopColor="#9A5028" />
          <stop offset="1" stopColor="#5C2C14" />
        </radialGradient>
        <radialGradient id="pl-bowl" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#CFC6B2" />
        </radialGradient>
        <radialGradient id="pl-tea" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#E9A23A" />
          <stop offset="1" stopColor="#7A3F0A" />
        </radialGradient>
        <radialGradient id="pl-naan" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#F0D49A" />
          <stop offset="1" stopColor="#C08A45" />
        </radialGradient>
        <linearGradient id="pl-metal" x1="0" x2="1">
          <stop offset="0" stopColor="#9C97A8" />
          <stop offset="0.45" stopColor="#F6F4FA" />
          <stop offset="1" stopColor="#8A8496" />
        </linearGradient>
        <radialGradient id="pl-steam">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id="pl-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <circle
        className="pl-ring"
        cx="260"
        cy="230"
        r="206"
        stroke="#E0B93A"
        strokeOpacity="0.35"
        strokeWidth="1.4"
        strokeDasharray="3 10"
        strokeLinecap="round"
      />
      <circle
        className="pl-ring pl-ring-rev"
        cx="260"
        cy="230"
        r="222"
        stroke="#E0B93A"
        strokeOpacity="0.22"
        strokeWidth="1"
        strokeDasharray="14 18"
      />
      <ellipse
        cx="270"
        cy="250"
        rx="186"
        ry="180"
        fill="#000"
        opacity="0.38"
        filter="url(#pl-blur)"
      />
      <g transform="translate(46 0)">
        <ellipse
          cx="3"
          cy="250"
          rx="9"
          ry="92"
          fill="#000"
          opacity="0.22"
          filter="url(#pl-blur)"
        />
        <path
          d="M-6 150V120M0 150V116M6 150V120M-6 150Q0 168 6 150Z"
          stroke="url(#pl-metal)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M-8 150H8Q10 168 0 174Q-10 168 -8 150Z"
          fill="url(#pl-metal)"
        />
        <rect
          x="-3.5"
          y="172"
          width="7"
          height="150"
          rx="3.5"
          fill="url(#pl-metal)"
        />
      </g>

      <circle cx="260" cy="230" r="182" fill="url(#pl-plate)" />
      <circle
        cx="260"
        cy="230"
        r="174"
        fill="none"
        stroke="#E0B93A"
        strokeWidth="2.2"
        opacity="0.85"
      />
      <circle
        cx="260"
        cy="230"
        r="150"
        fill="url(#pl-well)"
        stroke="#CFC6B2"
        strokeWidth="1.2"
      />
      <circle
        cx="260"
        cy="230"
        r="182"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.6"
        strokeWidth="1.2"
      />
      <path
        d="M349.6 201.9Q355.3 224.0 353.5 248.0Q351.7 272.0 336.1 291.0Q320.5 309.9 298.2 319.5Q276.0 329.0 252.4 327.2Q228.9 325.4 205.5 318.5Q182.1 311.6 166.5 292.2Q150.8 272.7 147.3 248.4Q143.8 224.0 149.2 200.6Q154.6 177.1 170.8 159.8Q187.0 142.5 208.2 134.0Q229.5 125.5 252.6 123.0Q275.6 120.5 297.9 129.5Q320.1 138.6 332.0 159.2Q343.9 179.8 349.6 201.9Z"
        fill="#000"
        opacity="0.25"
        transform="translate(5 7)"
      />
      <path
        d="M349.6 201.9Q355.3 224.0 353.5 248.0Q351.7 272.0 336.1 291.0Q320.5 309.9 298.2 319.5Q276.0 329.0 252.4 327.2Q228.9 325.4 205.5 318.5Q182.1 311.6 166.5 292.2Q150.8 272.7 147.3 248.4Q143.8 224.0 149.2 200.6Q154.6 177.1 170.8 159.8Q187.0 142.5 208.2 134.0Q229.5 125.5 252.6 123.0Q275.6 120.5 297.9 129.5Q320.1 138.6 332.0 159.2Q343.9 179.8 349.6 201.9Z"
        fill="url(#pl-rice)"
      />
      <ellipse
        cx="312.5"
        cy="168.8"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(59 312.5 168.8)"
      />
      <ellipse
        cx="301.2"
        cy="301.3"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(157 301.2 301.3)"
      />
      <ellipse
        cx="156.0"
        cy="188.8"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(127 156.0 188.8)"
      />
      <ellipse
        cx="224.9"
        cy="152.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(22 224.9 152.9)"
      />
      <ellipse
        cx="182.2"
        cy="271.1"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(102 182.2 271.1)"
      />
      <ellipse
        cx="180.1"
        cy="258.0"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(120 180.1 258.0)"
      />
      <ellipse
        cx="287.8"
        cy="286.4"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(168 287.8 286.4)"
      />
      <ellipse
        cx="264.4"
        cy="236.1"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(99 264.4 236.1)"
      />
      <ellipse
        cx="219.3"
        cy="151.1"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(137 219.3 151.1)"
      />
      <ellipse
        cx="209.1"
        cy="317.6"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(128 209.1 317.6)"
      />
      <ellipse
        cx="214.5"
        cy="220.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(68 214.5 220.8)"
      />
      <ellipse
        cx="320.8"
        cy="153.7"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(126 320.8 153.7)"
      />
      <ellipse
        cx="250.3"
        cy="234.4"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(133 250.3 234.4)"
      />
      <ellipse
        cx="266.7"
        cy="186.6"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(159 266.7 186.6)"
      />
      <ellipse
        cx="186.2"
        cy="156.0"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(89 186.2 156.0)"
      />
      <ellipse
        cx="220.4"
        cy="244.0"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(78 220.4 244.0)"
      />
      <ellipse
        cx="316.6"
        cy="281.1"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(95 316.6 281.1)"
      />
      <ellipse
        cx="289.8"
        cy="260.2"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(168 289.8 260.2)"
      />
      <ellipse
        cx="232.8"
        cy="324.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(151 232.8 324.8)"
      />
      <ellipse
        cx="330.9"
        cy="222.1"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(96 330.9 222.1)"
      />
      <ellipse
        cx="199.9"
        cy="301.5"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(41 199.9 301.5)"
      />
      <ellipse
        cx="308.4"
        cy="220.5"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(73 308.4 220.5)"
      />
      <ellipse
        cx="324.8"
        cy="256.6"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(8 324.8 256.6)"
      />
      <ellipse
        cx="200.2"
        cy="202.3"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(86 200.2 202.3)"
      />
      <ellipse
        cx="302.6"
        cy="219.7"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(64 302.6 219.7)"
      />
      <ellipse
        cx="346.5"
        cy="229.3"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(122 346.5 229.3)"
      />
      <ellipse
        cx="224.3"
        cy="152.7"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(94 224.3 152.7)"
      />
      <ellipse
        cx="308.2"
        cy="220.8"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(122 308.2 220.8)"
      />
      <ellipse
        cx="177.6"
        cy="242.2"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(35 177.6 242.2)"
      />
      <ellipse
        cx="271.3"
        cy="253.6"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(149 271.3 253.6)"
      />
      <ellipse
        cx="202.0"
        cy="204.6"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(35 202.0 204.6)"
      />
      <ellipse
        cx="178.2"
        cy="202.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(47 178.2 202.8)"
      />
      <ellipse
        cx="281.2"
        cy="282.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(18 281.2 282.9)"
      />
      <ellipse
        cx="284.0"
        cy="147.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(137 284.0 147.1)"
      />
      <ellipse
        cx="230.6"
        cy="303.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(159 230.6 303.9)"
      />
      <ellipse
        cx="186.4"
        cy="297.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(51 186.4 297.6)"
      />
      <ellipse
        cx="302.3"
        cy="277.0"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(154 302.3 277.0)"
      />
      <ellipse
        cx="253.0"
        cy="274.6"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(14 253.0 274.6)"
      />
      <ellipse
        cx="228.9"
        cy="299.1"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(101 228.9 299.1)"
      />
      <ellipse
        cx="185.1"
        cy="267.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(64 185.1 267.6)"
      />
      <ellipse
        cx="273.7"
        cy="274.6"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(62 273.7 274.6)"
      />
      <ellipse
        cx="181.2"
        cy="270.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(75 181.2 270.6)"
      />
      <ellipse
        cx="314.4"
        cy="222.0"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(146 314.4 222.0)"
      />
      <ellipse
        cx="261.4"
        cy="133.4"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(152 261.4 133.4)"
      />
      <ellipse
        cx="215.7"
        cy="227.5"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(74 215.7 227.5)"
      />
      <ellipse
        cx="277.7"
        cy="277.1"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(48 277.7 277.1)"
      />
      <ellipse
        cx="276.0"
        cy="188.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(51 276.0 188.1)"
      />
      <ellipse
        cx="162.5"
        cy="256.5"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(107 162.5 256.5)"
      />
      <ellipse
        cx="327.8"
        cy="255.3"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(160 327.8 255.3)"
      />
      <ellipse
        cx="253.0"
        cy="316.1"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(174 253.0 316.1)"
      />
      <ellipse
        cx="294.4"
        cy="218.0"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(131 294.4 218.0)"
      />
      <ellipse
        cx="270.4"
        cy="204.3"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(109 270.4 204.3)"
      />
      <ellipse
        cx="313.3"
        cy="203.2"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(83 313.3 203.2)"
      />
      <ellipse
        cx="195.9"
        cy="309.4"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(167 195.9 309.4)"
      />
      <ellipse
        cx="225.8"
        cy="245.5"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(55 225.8 245.5)"
      />
      <ellipse
        cx="278.1"
        cy="277.3"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(171 278.1 277.3)"
      />
      <ellipse
        cx="325.9"
        cy="265.0"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(174 325.9 265.0)"
      />
      <ellipse
        cx="199.5"
        cy="309.8"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(98 199.5 309.8)"
      />
      <ellipse
        cx="275.6"
        cy="290.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(1 275.6 290.9)"
      />
      <ellipse
        cx="213.4"
        cy="185.2"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(100 213.4 185.2)"
      />
      <ellipse
        cx="179.0"
        cy="235.0"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(20 179.0 235.0)"
      />
      <ellipse
        cx="211.3"
        cy="315.4"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(118 211.3 315.4)"
      />
      <ellipse
        cx="238.3"
        cy="260.8"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(95 238.3 260.8)"
      />
      <ellipse
        cx="268.8"
        cy="159.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(20 268.8 159.9)"
      />
      <ellipse
        cx="215.4"
        cy="173.4"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(39 215.4 173.4)"
      />
      <ellipse
        cx="253.5"
        cy="170.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(176 253.5 170.1)"
      />
      <ellipse
        cx="296.5"
        cy="153.4"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(100 296.5 153.4)"
      />
      <ellipse
        cx="231.7"
        cy="215.9"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(170 231.7 215.9)"
      />
      <ellipse
        cx="286.9"
        cy="258.5"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(159 286.9 258.5)"
      />
      <ellipse
        cx="193.3"
        cy="193.2"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(161 193.3 193.2)"
      />
      <ellipse
        cx="224.7"
        cy="136.4"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(148 224.7 136.4)"
      />
      <ellipse
        cx="231.0"
        cy="211.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(115 231.0 211.9)"
      />
      <ellipse
        cx="188.2"
        cy="197.3"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(0 188.2 197.3)"
      />
      <ellipse
        cx="183.2"
        cy="238.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(110 183.2 238.6)"
      />
      <ellipse
        cx="322.2"
        cy="184.6"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(106 322.2 184.6)"
      />
      <ellipse
        cx="330.8"
        cy="171.3"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(147 330.8 171.3)"
      />
      <ellipse
        cx="152.6"
        cy="240.9"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(20 152.6 240.9)"
      />
      <ellipse
        cx="334.3"
        cy="274.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(168 334.3 274.9)"
      />
      <ellipse
        cx="180.3"
        cy="223.5"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(134 180.3 223.5)"
      />
      <ellipse
        cx="259.3"
        cy="222.2"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(173 259.3 222.2)"
      />
      <ellipse
        cx="218.6"
        cy="176.6"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(90 218.6 176.6)"
      />
      <ellipse
        cx="210.4"
        cy="250.2"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(18 210.4 250.2)"
      />
      <ellipse
        cx="162.9"
        cy="226.4"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(173 162.9 226.4)"
      />
      <ellipse
        cx="223.2"
        cy="193.6"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(41 223.2 193.6)"
      />
      <ellipse
        cx="269.6"
        cy="177.7"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(167 269.6 177.7)"
      />
      <ellipse
        cx="340.8"
        cy="231.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(104 340.8 231.9)"
      />
      <ellipse
        cx="291.3"
        cy="270.9"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(134 291.3 270.9)"
      />
      <ellipse
        cx="221.6"
        cy="230.7"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(160 221.6 230.7)"
      />
      <ellipse
        cx="184.9"
        cy="267.2"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(126 184.9 267.2)"
      />
      <ellipse
        cx="182.4"
        cy="296.3"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(4 182.4 296.3)"
      />
      <ellipse
        cx="289.0"
        cy="165.8"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(165 289.0 165.8)"
      />
      <ellipse
        cx="258.9"
        cy="308.1"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(79 258.9 308.1)"
      />
      <ellipse
        cx="192.3"
        cy="216.6"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(178 192.3 216.6)"
      />
      <ellipse
        cx="275.4"
        cy="246.1"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(96 275.4 246.1)"
      />
      <ellipse
        cx="303.2"
        cy="158.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(137 303.2 158.6)"
      />
      <ellipse
        cx="330.6"
        cy="163.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(131 330.6 163.6)"
      />
      <ellipse
        cx="207.9"
        cy="213.7"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(92 207.9 213.7)"
      />
      <ellipse
        cx="198.4"
        cy="244.5"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(90 198.4 244.5)"
      />
      <ellipse
        cx="287.4"
        cy="299.5"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(146 287.4 299.5)"
      />
      <ellipse
        cx="301.8"
        cy="164.8"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(136 301.8 164.8)"
      />
      <ellipse
        cx="210.0"
        cy="154.2"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(169 210.0 154.2)"
      />
      <ellipse
        cx="275.4"
        cy="216.7"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(126 275.4 216.7)"
      />
      <ellipse
        cx="283.1"
        cy="173.1"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(110 283.1 173.1)"
      />
      <ellipse
        cx="194.8"
        cy="219.3"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(10 194.8 219.3)"
      />
      <ellipse
        cx="325.9"
        cy="163.4"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(86 325.9 163.4)"
      />
      <ellipse
        cx="239.7"
        cy="183.2"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(35 239.7 183.2)"
      />
      <ellipse
        cx="194.1"
        cy="153.7"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(36 194.1 153.7)"
      />
      <ellipse
        cx="327.5"
        cy="182.1"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(117 327.5 182.1)"
      />
      <ellipse
        cx="249.1"
        cy="300.2"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(141 249.1 300.2)"
      />
      <ellipse
        cx="217.8"
        cy="194.0"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(144 217.8 194.0)"
      />
      <ellipse
        cx="241.3"
        cy="269.0"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(18 241.3 269.0)"
      />
      <ellipse
        cx="303.8"
        cy="198.2"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(64 303.8 198.2)"
      />
      <ellipse
        cx="310.1"
        cy="284.3"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(50 310.1 284.3)"
      />
      <ellipse
        cx="164.9"
        cy="184.4"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(162 164.9 184.4)"
      />
      <ellipse
        cx="179.1"
        cy="292.2"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(67 179.1 292.2)"
      />
      <ellipse
        cx="289.6"
        cy="181.9"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(55 289.6 181.9)"
      />
      <ellipse
        cx="191.6"
        cy="223.5"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(126 191.6 223.5)"
      />
      <ellipse
        cx="338.8"
        cy="228.7"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(2 338.8 228.7)"
      />
      <ellipse
        cx="322.6"
        cy="179.4"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(67 322.6 179.4)"
      />
      <ellipse
        cx="304.8"
        cy="245.0"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(130 304.8 245.0)"
      />
      <ellipse
        cx="294.1"
        cy="221.5"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(137 294.1 221.5)"
      />
      <ellipse
        cx="226.0"
        cy="252.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(162 226.0 252.1)"
      />
      <ellipse
        cx="178.4"
        cy="203.8"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(113 178.4 203.8)"
      />
      <ellipse
        cx="282.5"
        cy="269.1"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(150 282.5 269.1)"
      />
      <ellipse
        cx="239.5"
        cy="168.9"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(164 239.5 168.9)"
      />
      <ellipse
        cx="322.8"
        cy="280.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(149 322.8 280.6)"
      />
      <ellipse
        cx="166.9"
        cy="222.0"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(42 166.9 222.0)"
      />
      <ellipse
        cx="313.6"
        cy="188.3"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(84 313.6 188.3)"
      />
      <ellipse
        cx="187.5"
        cy="152.2"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(159 187.5 152.2)"
      />
      <ellipse
        cx="323.6"
        cy="166.5"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(28 323.6 166.5)"
      />
      <ellipse
        cx="259.1"
        cy="144.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(103 259.1 144.8)"
      />
      <ellipse
        cx="305.7"
        cy="162.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(179 305.7 162.9)"
      />
      <ellipse
        cx="260.0"
        cy="138.5"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(62 260.0 138.5)"
      />
      <ellipse
        cx="272.5"
        cy="140.8"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(52 272.5 140.8)"
      />
      <ellipse
        cx="267.8"
        cy="289.5"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(133 267.8 289.5)"
      />
      <ellipse
        cx="211.3"
        cy="186.5"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(175 211.3 186.5)"
      />
      <ellipse
        cx="331.2"
        cy="207.1"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(147 331.2 207.1)"
      />
      <ellipse
        cx="158.6"
        cy="204.2"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(148 158.6 204.2)"
      />
      <ellipse
        cx="308.9"
        cy="269.3"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(135 308.9 269.3)"
      />
      <ellipse
        cx="208.6"
        cy="197.4"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(125 208.6 197.4)"
      />
      <ellipse
        cx="203.4"
        cy="309.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(75 203.4 309.8)"
      />
      <ellipse
        cx="172.8"
        cy="241.5"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(124 172.8 241.5)"
      />
      <ellipse
        cx="318.0"
        cy="149.4"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(38 318.0 149.4)"
      />
      <ellipse
        cx="212.5"
        cy="144.1"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(169 212.5 144.1)"
      />
      <ellipse
        cx="240.2"
        cy="168.7"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(95 240.2 168.7)"
      />
      <ellipse
        cx="327.2"
        cy="208.6"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(176 327.2 208.6)"
      />
      <ellipse
        cx="278.3"
        cy="218.6"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(142 278.3 218.6)"
      />
      <ellipse
        cx="278.0"
        cy="246.3"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(111 278.0 246.3)"
      />
      <ellipse
        cx="252.6"
        cy="154.5"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(55 252.6 154.5)"
      />
      <ellipse
        cx="200.2"
        cy="194.1"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(96 200.2 194.1)"
      />
      <ellipse
        cx="206.7"
        cy="243.4"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(46 206.7 243.4)"
      />
      <ellipse
        cx="224.9"
        cy="150.5"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(94 224.9 150.5)"
      />
      <ellipse
        cx="179.0"
        cy="260.9"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(178 179.0 260.9)"
      />
      <ellipse
        cx="300.4"
        cy="137.2"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(14 300.4 137.2)"
      />
      <ellipse
        cx="297.1"
        cy="183.6"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(143 297.1 183.6)"
      />
      <ellipse
        cx="318.1"
        cy="282.2"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(101 318.1 282.2)"
      />
      <ellipse
        cx="277.9"
        cy="177.2"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(68 277.9 177.2)"
      />
      <ellipse
        cx="312.6"
        cy="247.2"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(59 312.6 247.2)"
      />
      <ellipse
        cx="251.9"
        cy="265.5"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(131 251.9 265.5)"
      />
      <ellipse
        cx="348.7"
        cy="255.9"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(110 348.7 255.9)"
      />
      <ellipse
        cx="285.8"
        cy="181.7"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(33 285.8 181.7)"
      />
      <ellipse
        cx="228.6"
        cy="149.2"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(1 228.6 149.2)"
      />
      <ellipse
        cx="246.5"
        cy="136.3"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(83 246.5 136.3)"
      />
      <ellipse
        cx="185.4"
        cy="241.1"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(167 185.4 241.1)"
      />
      <ellipse
        cx="328.7"
        cy="181.0"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(100 328.7 181.0)"
      />
      <ellipse
        cx="263.1"
        cy="178.5"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(1 263.1 178.5)"
      />
      <ellipse
        cx="233.3"
        cy="284.1"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(65 233.3 284.1)"
      />
      <ellipse
        cx="277.8"
        cy="185.4"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(179 277.8 185.4)"
      />
      <ellipse
        cx="220.1"
        cy="313.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(90 220.1 313.9)"
      />
      <ellipse
        cx="279.2"
        cy="289.6"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(71 279.2 289.6)"
      />
      <ellipse
        cx="183.4"
        cy="192.2"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(54 183.4 192.2)"
      />
      <ellipse
        cx="184.7"
        cy="239.1"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(141 184.7 239.1)"
      />
      <ellipse
        cx="324.0"
        cy="295.5"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(159 324.0 295.5)"
      />
      <ellipse
        cx="183.8"
        cy="277.7"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(24 183.8 277.7)"
      />
      <ellipse
        cx="340.3"
        cy="184.5"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(64 340.3 184.5)"
      />
      <ellipse
        cx="193.6"
        cy="202.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(75 193.6 202.6)"
      />
      <ellipse
        cx="210.6"
        cy="167.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(110 210.6 167.9)"
      />
      <ellipse
        cx="243.9"
        cy="263.7"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(46 243.9 263.7)"
      />
      <ellipse
        cx="297.2"
        cy="211.3"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(12 297.2 211.3)"
      />
      <ellipse
        cx="296.2"
        cy="221.2"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(42 296.2 221.2)"
      />
      <ellipse
        cx="336.3"
        cy="248.0"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(2 336.3 248.0)"
      />
      <ellipse
        cx="256.3"
        cy="269.7"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(0 256.3 269.7)"
      />
      <ellipse
        cx="167.5"
        cy="204.9"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(155 167.5 204.9)"
      />
      <ellipse
        cx="311.3"
        cy="221.6"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(67 311.3 221.6)"
      />
      <ellipse
        cx="265.5"
        cy="252.7"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(57 265.5 252.7)"
      />
      <ellipse
        cx="181.9"
        cy="205.7"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(80 181.9 205.7)"
      />
      <ellipse
        cx="202.9"
        cy="193.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(137 202.9 193.6)"
      />
      <ellipse
        cx="172.9"
        cy="230.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(13 172.9 230.8)"
      />
      <ellipse
        cx="281.1"
        cy="304.0"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(117 281.1 304.0)"
      />
      <ellipse
        cx="246.4"
        cy="227.2"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(61 246.4 227.2)"
      />
      <ellipse
        cx="262.6"
        cy="178.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(49 262.6 178.6)"
      />
      <ellipse
        cx="266.9"
        cy="186.2"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(150 266.9 186.2)"
      />
      <ellipse
        cx="248.6"
        cy="207.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(58 248.6 207.6)"
      />
      <ellipse
        cx="190.9"
        cy="158.0"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(138 190.9 158.0)"
      />
      <ellipse
        cx="320.5"
        cy="220.1"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(152 320.5 220.1)"
      />
      <ellipse
        cx="204.7"
        cy="224.4"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(22 204.7 224.4)"
      />
      <ellipse
        cx="281.5"
        cy="250.5"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(29 281.5 250.5)"
      />
      <ellipse
        cx="265.0"
        cy="133.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(137 265.0 133.9)"
      />
      <ellipse
        cx="292.5"
        cy="226.2"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(141 292.5 226.2)"
      />
      <ellipse
        cx="197.8"
        cy="209.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(107 197.8 209.6)"
      />
      <ellipse
        cx="323.6"
        cy="202.7"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(158 323.6 202.7)"
      />
      <ellipse
        cx="186.1"
        cy="160.6"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(74 186.1 160.6)"
      />
      <ellipse
        cx="235.1"
        cy="304.7"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(168 235.1 304.7)"
      />
      <ellipse
        cx="340.9"
        cy="250.7"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(101 340.9 250.7)"
      />
      <ellipse
        cx="207.3"
        cy="271.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(59 207.3 271.9)"
      />
      <ellipse
        cx="287.3"
        cy="172.9"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(87 287.3 172.9)"
      />
      <ellipse
        cx="237.1"
        cy="132.8"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(173 237.1 132.8)"
      />
      <ellipse
        cx="187.3"
        cy="189.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(57 187.3 189.9)"
      />
      <ellipse
        cx="307.8"
        cy="156.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(152 307.8 156.6)"
      />
      <ellipse
        cx="297.6"
        cy="259.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(21 297.6 259.8)"
      />
      <ellipse
        cx="248.1"
        cy="298.0"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(153 248.1 298.0)"
      />
      <ellipse
        cx="183.7"
        cy="202.8"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(77 183.7 202.8)"
      />
      <ellipse
        cx="227.3"
        cy="249.9"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(42 227.3 249.9)"
      />
      <ellipse
        cx="314.3"
        cy="199.9"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(30 314.3 199.9)"
      />
      <ellipse
        cx="287.0"
        cy="253.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(45 287.0 253.8)"
      />
      <ellipse
        cx="172.3"
        cy="190.4"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(29 172.3 190.4)"
      />
      <ellipse
        cx="313.9"
        cy="190.4"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(102 313.9 190.4)"
      />
      <ellipse
        cx="247.3"
        cy="138.3"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(102 247.3 138.3)"
      />
      <ellipse
        cx="257.0"
        cy="172.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(91 257.0 172.6)"
      />
      <ellipse
        cx="251.7"
        cy="186.7"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(25 251.7 186.7)"
      />
      <ellipse
        cx="231.1"
        cy="256.2"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(122 231.1 256.2)"
      />
      <ellipse
        cx="331.1"
        cy="286.1"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(105 331.1 286.1)"
      />
      <ellipse
        cx="281.7"
        cy="132.2"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(147 281.7 132.2)"
      />
      <ellipse
        cx="198.7"
        cy="175.3"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(146 198.7 175.3)"
      />
      <ellipse
        cx="236.9"
        cy="281.9"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(111 236.9 281.9)"
      />
      <ellipse
        cx="329.8"
        cy="287.3"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(80 329.8 287.3)"
      />
      <ellipse
        cx="322.3"
        cy="179.5"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(72 322.3 179.5)"
      />
      <ellipse
        cx="240.9"
        cy="319.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(23 240.9 319.1)"
      />
      <ellipse
        cx="251.6"
        cy="255.7"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(81 251.6 255.7)"
      />
      <ellipse
        cx="216.9"
        cy="167.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(66 216.9 167.9)"
      />
      <ellipse
        cx="310.2"
        cy="149.7"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(139 310.2 149.7)"
      />
      <ellipse
        cx="278.5"
        cy="230.2"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(131 278.5 230.2)"
      />
      <ellipse
        cx="250.1"
        cy="307.1"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(37 250.1 307.1)"
      />
      <ellipse
        cx="314.6"
        cy="203.2"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(126 314.6 203.2)"
      />
      <ellipse
        cx="234.7"
        cy="167.8"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(70 234.7 167.8)"
      />
      <ellipse
        cx="190.7"
        cy="189.8"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(101 190.7 189.8)"
      />
      <ellipse
        cx="292.4"
        cy="161.7"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(28 292.4 161.7)"
      />
      <ellipse
        cx="206.9"
        cy="140.2"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(149 206.9 140.2)"
      />
      <ellipse
        cx="329.7"
        cy="278.1"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(9 329.7 278.1)"
      />
      <ellipse
        cx="304.8"
        cy="296.2"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(124 304.8 296.2)"
      />
      <ellipse
        cx="236.1"
        cy="133.7"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(122 236.1 133.7)"
      />
      <ellipse
        cx="283.7"
        cy="126.2"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(138 283.7 126.2)"
      />
      <ellipse
        cx="155.8"
        cy="220.8"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(150 155.8 220.8)"
      />
      <ellipse
        cx="213.9"
        cy="266.4"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(20 213.9 266.4)"
      />
      <ellipse
        cx="324.5"
        cy="288.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(175 324.5 288.9)"
      />
      <ellipse
        cx="203.0"
        cy="186.4"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(47 203.0 186.4)"
      />
      <ellipse
        cx="333.5"
        cy="238.2"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(67 333.5 238.2)"
      />
      <ellipse
        cx="323.8"
        cy="201.1"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(133 323.8 201.1)"
      />
      <ellipse
        cx="202.4"
        cy="264.0"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(22 202.4 264.0)"
      />
      <ellipse
        cx="220.4"
        cy="218.7"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(64 220.4 218.7)"
      />
      <ellipse
        cx="249.1"
        cy="251.5"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(87 249.1 251.5)"
      />
      <ellipse
        cx="258.8"
        cy="190.4"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(0 258.8 190.4)"
      />
      <ellipse
        cx="313.3"
        cy="266.8"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(162 313.3 266.8)"
      />
      <ellipse
        cx="230.4"
        cy="240.5"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(0 230.4 240.5)"
      />
      <ellipse
        cx="186.2"
        cy="291.9"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(35 186.2 291.9)"
      />
      <ellipse
        cx="336.9"
        cy="239.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(122 336.9 239.6)"
      />
      <ellipse
        cx="279.8"
        cy="162.5"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(93 279.8 162.5)"
      />
      <ellipse
        cx="213.6"
        cy="299.2"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(33 213.6 299.2)"
      />
      <ellipse
        cx="220.7"
        cy="207.3"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(71 220.7 207.3)"
      />
      <ellipse
        cx="223.1"
        cy="197.3"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(153 223.1 197.3)"
      />
      <ellipse
        cx="310.6"
        cy="171.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(66 310.6 171.6)"
      />
      <ellipse
        cx="260.7"
        cy="293.8"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(56 260.7 293.8)"
      />
      <ellipse
        cx="272.3"
        cy="190.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(141 272.3 190.8)"
      />
      <ellipse
        cx="156.6"
        cy="215.9"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(126 156.6 215.9)"
      />
      <ellipse
        cx="236.3"
        cy="295.4"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(39 236.3 295.4)"
      />
      <ellipse
        cx="238.9"
        cy="262.0"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(58 238.9 262.0)"
      />
      <ellipse
        cx="258.2"
        cy="325.1"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(139 258.2 325.1)"
      />
      <ellipse
        cx="219.3"
        cy="145.5"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(142 219.3 145.5)"
      />
      <ellipse
        cx="236.8"
        cy="175.7"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(31 236.8 175.7)"
      />
      <ellipse
        cx="334.0"
        cy="174.9"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(78 334.0 174.9)"
      />
      <ellipse
        cx="318.5"
        cy="159.4"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(84 318.5 159.4)"
      />
      <ellipse
        cx="244.2"
        cy="251.4"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(113 244.2 251.4)"
      />
      <ellipse
        cx="222.7"
        cy="290.0"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(56 222.7 290.0)"
      />
      <ellipse
        cx="254.5"
        cy="321.9"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(62 254.5 321.9)"
      />
      <ellipse
        cx="275.3"
        cy="298.2"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(20 275.3 298.2)"
      />
      <ellipse
        cx="184.3"
        cy="193.8"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(38 184.3 193.8)"
      />
      <ellipse
        cx="307.0"
        cy="298.0"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(141 307.0 298.0)"
      />
      <ellipse
        cx="228.2"
        cy="186.0"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(50 228.2 186.0)"
      />
      <ellipse
        cx="212.9"
        cy="247.4"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(57 212.9 247.4)"
      />
      <ellipse
        cx="160.8"
        cy="187.7"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(76 160.8 187.7)"
      />
      <ellipse
        cx="259.6"
        cy="187.5"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(162 259.6 187.5)"
      />
      <ellipse
        cx="184.7"
        cy="277.0"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(99 184.7 277.0)"
      />
      <ellipse
        cx="241.0"
        cy="284.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(43 241.0 284.6)"
      />
      <ellipse
        cx="297.2"
        cy="135.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(52 297.2 135.9)"
      />
      <ellipse
        cx="292.2"
        cy="311.5"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(18 292.2 311.5)"
      />
      <ellipse
        cx="289.3"
        cy="153.7"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(52 289.3 153.7)"
      />
      <ellipse
        cx="240.3"
        cy="238.1"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(173 240.3 238.1)"
      />
      <ellipse
        cx="232.8"
        cy="128.2"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(123 232.8 128.2)"
      />
      <ellipse
        cx="237.7"
        cy="242.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(35 237.7 242.6)"
      />
      <ellipse
        cx="265.6"
        cy="253.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(88 265.6 253.9)"
      />
      <ellipse
        cx="309.9"
        cy="185.0"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(159 309.9 185.0)"
      />
      <ellipse
        cx="305.5"
        cy="298.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(131 305.5 298.9)"
      />
      <ellipse
        cx="210.3"
        cy="205.7"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(101 210.3 205.7)"
      />
      <ellipse
        cx="296.7"
        cy="174.5"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(143 296.7 174.5)"
      />
      <ellipse
        cx="242.1"
        cy="183.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(164 242.1 183.9)"
      />
      <ellipse
        cx="238.4"
        cy="322.8"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(33 238.4 322.8)"
      />
      <ellipse
        cx="334.2"
        cy="252.3"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(117 334.2 252.3)"
      />
      <ellipse
        cx="208.8"
        cy="269.0"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(137 208.8 269.0)"
      />
      <ellipse
        cx="228.1"
        cy="250.9"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(23 228.1 250.9)"
      />
      <ellipse
        cx="326.0"
        cy="185.2"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(122 326.0 185.2)"
      />
      <ellipse
        cx="305.9"
        cy="301.5"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(94 305.9 301.5)"
      />
      <ellipse
        cx="323.5"
        cy="152.5"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(141 323.5 152.5)"
      />
      <ellipse
        cx="291.9"
        cy="150.4"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(79 291.9 150.4)"
      />
      <ellipse
        cx="174.6"
        cy="201.9"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(36 174.6 201.9)"
      />
      <ellipse
        cx="187.0"
        cy="215.5"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(163 187.0 215.5)"
      />
      <ellipse
        cx="314.4"
        cy="225.9"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(66 314.4 225.9)"
      />
      <ellipse
        cx="265.3"
        cy="153.9"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(9 265.3 153.9)"
      />
      <ellipse
        cx="311.7"
        cy="253.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(18 311.7 253.9)"
      />
      <ellipse
        cx="224.1"
        cy="244.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(122 224.1 244.1)"
      />
      <ellipse
        cx="186.1"
        cy="179.5"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(78 186.1 179.5)"
      />
      <ellipse
        cx="238.6"
        cy="278.9"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(110 238.6 278.9)"
      />
      <ellipse
        cx="234.5"
        cy="255.7"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(70 234.5 255.7)"
      />
      <ellipse
        cx="204.3"
        cy="201.3"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(98 204.3 201.3)"
      />
      <ellipse
        cx="239.2"
        cy="153.7"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(161 239.2 153.7)"
      />
      <ellipse
        cx="241.8"
        cy="269.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(31 241.8 269.6)"
      />
      <ellipse
        cx="211.1"
        cy="145.5"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(52 211.1 145.5)"
      />
      <ellipse
        cx="287.5"
        cy="265.7"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(16 287.5 265.7)"
      />
      <ellipse
        cx="218.6"
        cy="129.6"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(119 218.6 129.6)"
      />
      <ellipse
        cx="262.5"
        cy="189.1"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(130 262.5 189.1)"
      />
      <ellipse
        cx="253.6"
        cy="325.8"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(55 253.6 325.8)"
      />
      <ellipse
        cx="311.1"
        cy="246.1"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(112 311.1 246.1)"
      />
      <ellipse
        cx="222.4"
        cy="248.6"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(116 222.4 248.6)"
      />
      <ellipse
        cx="239.0"
        cy="325.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(63 239.0 325.6)"
      />
      <ellipse
        cx="256.5"
        cy="217.5"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(50 256.5 217.5)"
      />
      <ellipse
        cx="313.7"
        cy="177.7"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(35 313.7 177.7)"
      />
      <ellipse
        cx="225.6"
        cy="270.8"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(144 225.6 270.8)"
      />
      <ellipse
        cx="325.8"
        cy="221.8"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(7 325.8 221.8)"
      />
      <ellipse
        cx="174.2"
        cy="171.5"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(145 174.2 171.5)"
      />
      <ellipse
        cx="241.0"
        cy="195.0"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(91 241.0 195.0)"
      />
      <ellipse
        cx="196.1"
        cy="224.1"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(151 196.1 224.1)"
      />
      <ellipse
        cx="307.1"
        cy="157.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(94 307.1 157.9)"
      />
      <ellipse
        cx="268.5"
        cy="200.1"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(2 268.5 200.1)"
      />
      <ellipse
        cx="208.6"
        cy="176.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(84 208.6 176.6)"
      />
      <ellipse
        cx="260.7"
        cy="322.9"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(37 260.7 322.9)"
      />
      <ellipse
        cx="199.5"
        cy="305.6"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(70 199.5 305.6)"
      />
      <ellipse
        cx="286.4"
        cy="269.7"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(0 286.4 269.7)"
      />
      <ellipse
        cx="338.2"
        cy="264.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(119 338.2 264.1)"
      />
      <ellipse
        cx="169.8"
        cy="229.6"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(28 169.8 229.6)"
      />
      <ellipse
        cx="215.7"
        cy="309.1"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(116 215.7 309.1)"
      />
      <ellipse
        cx="294.1"
        cy="203.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(20 294.1 203.8)"
      />
      <ellipse
        cx="248.8"
        cy="268.0"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(167 248.8 268.0)"
      />
      <ellipse
        cx="231.2"
        cy="206.8"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(110 231.2 206.8)"
      />
      <ellipse
        cx="329.1"
        cy="248.5"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(145 329.1 248.5)"
      />
      <ellipse
        cx="258.8"
        cy="242.7"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(23 258.8 242.7)"
      />
      <ellipse
        cx="200.3"
        cy="193.8"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(56 200.3 193.8)"
      />
      <ellipse
        cx="166.6"
        cy="267.8"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(107 166.6 267.8)"
      />
      <ellipse
        cx="301.7"
        cy="201.7"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(62 301.7 201.7)"
      />
      <ellipse
        cx="254.5"
        cy="208.1"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(33 254.5 208.1)"
      />
      <ellipse
        cx="261.5"
        cy="214.5"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(159 261.5 214.5)"
      />
      <ellipse
        cx="250.3"
        cy="313.6"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(23 250.3 313.6)"
      />
      <ellipse
        cx="272.7"
        cy="130.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(114 272.7 130.8)"
      />
      <ellipse
        cx="205.3"
        cy="156.2"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(29 205.3 156.2)"
      />
      <ellipse
        cx="273.2"
        cy="151.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(25 273.2 151.6)"
      />
      <ellipse
        cx="256.4"
        cy="182.4"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(168 256.4 182.4)"
      />
      <ellipse
        cx="257.5"
        cy="168.3"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(17 257.5 168.3)"
      />
      <ellipse
        cx="268.7"
        cy="210.9"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(125 268.7 210.9)"
      />
      <ellipse
        cx="274.1"
        cy="215.5"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(55 274.1 215.5)"
      />
      <ellipse
        cx="346.9"
        cy="242.5"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(170 346.9 242.5)"
      />
      <ellipse
        cx="204.4"
        cy="218.5"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(161 204.4 218.5)"
      />
      <ellipse
        cx="262.9"
        cy="299.6"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(37 262.9 299.6)"
      />
      <ellipse
        cx="271.3"
        cy="231.7"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(85 271.3 231.7)"
      />
      <ellipse
        cx="181.4"
        cy="182.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(139 181.4 182.8)"
      />
      <ellipse
        cx="167.4"
        cy="236.2"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(99 167.4 236.2)"
      />
      <ellipse
        cx="280.0"
        cy="222.9"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(95 280.0 222.9)"
      />
      <ellipse
        cx="315.4"
        cy="242.2"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(46 315.4 242.2)"
      />
      <ellipse
        cx="187.4"
        cy="199.1"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(99 187.4 199.1)"
      />
      <ellipse
        cx="166.2"
        cy="249.8"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(88 166.2 249.8)"
      />
      <ellipse
        cx="237.2"
        cy="239.2"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(106 237.2 239.2)"
      />
      <ellipse
        cx="243.8"
        cy="283.4"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(65 243.8 283.4)"
      />
      <ellipse
        cx="211.8"
        cy="300.4"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(101 211.8 300.4)"
      />
      <ellipse
        cx="219.8"
        cy="191.6"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(26 219.8 191.6)"
      />
      <ellipse
        cx="243.2"
        cy="326.1"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(18 243.2 326.1)"
      />
      <ellipse
        cx="200.9"
        cy="176.3"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(179 200.9 176.3)"
      />
      <ellipse
        cx="164.6"
        cy="217.2"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(42 164.6 217.2)"
      />
      <ellipse
        cx="162.0"
        cy="204.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(95 162.0 204.9)"
      />
      <ellipse
        cx="302.1"
        cy="218.0"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(15 302.1 218.0)"
      />
      <ellipse
        cx="242.1"
        cy="130.3"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(141 242.1 130.3)"
      />
      <ellipse
        cx="207.8"
        cy="274.3"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(127 207.8 274.3)"
      />
      <ellipse
        cx="170.2"
        cy="218.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(40 170.2 218.9)"
      />
      <ellipse
        cx="321.2"
        cy="248.8"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(169 321.2 248.8)"
      />
      <ellipse
        cx="304.7"
        cy="188.5"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(97 304.7 188.5)"
      />
      <ellipse
        cx="252.6"
        cy="123.6"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(111 252.6 123.6)"
      />
      <ellipse
        cx="244.3"
        cy="321.0"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(43 244.3 321.0)"
      />
      <ellipse
        cx="307.0"
        cy="247.4"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(3 307.0 247.4)"
      />
      <ellipse
        cx="186.5"
        cy="229.4"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(47 186.5 229.4)"
      />
      <ellipse
        cx="252.9"
        cy="216.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(162 252.9 216.9)"
      />
      <ellipse
        cx="179.0"
        cy="249.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(119 179.0 249.6)"
      />
      <ellipse
        cx="269.4"
        cy="260.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(28 269.4 260.9)"
      />
      <ellipse
        cx="318.4"
        cy="166.8"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(22 318.4 166.8)"
      />
      <ellipse
        cx="275.3"
        cy="148.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(15 275.3 148.6)"
      />
      <ellipse
        cx="263.4"
        cy="315.5"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(69 263.4 315.5)"
      />
      <ellipse
        cx="184.3"
        cy="158.3"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(82 184.3 158.3)"
      />
      <ellipse
        cx="268.5"
        cy="309.2"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(163 268.5 309.2)"
      />
      <ellipse
        cx="274.1"
        cy="124.5"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(175 274.1 124.5)"
      />
      <ellipse
        cx="226.2"
        cy="245.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(173 226.2 245.6)"
      />
      <ellipse
        cx="239.7"
        cy="227.1"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(64 239.7 227.1)"
      />
      <ellipse
        cx="189.4"
        cy="238.7"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(55 189.4 238.7)"
      />
      <ellipse
        cx="183.1"
        cy="188.6"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(48 183.1 188.6)"
      />
      <ellipse
        cx="339.4"
        cy="195.3"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(62 339.4 195.3)"
      />
      <ellipse
        cx="241.1"
        cy="199.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(33 241.1 199.6)"
      />
      <ellipse
        cx="232.6"
        cy="294.1"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(90 232.6 294.1)"
      />
      <ellipse
        cx="345.5"
        cy="194.7"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(121 345.5 194.7)"
      />
      <ellipse
        cx="236.0"
        cy="214.0"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(33 236.0 214.0)"
      />
      <ellipse
        cx="259.9"
        cy="289.7"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(48 259.9 289.7)"
      />
      <ellipse
        cx="214.0"
        cy="134.5"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(116 214.0 134.5)"
      />
      <ellipse
        cx="283.1"
        cy="166.7"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(51 283.1 166.7)"
      />
      <ellipse
        cx="239.2"
        cy="265.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(18 239.2 265.6)"
      />
      <ellipse
        cx="266.6"
        cy="249.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(6 266.6 249.9)"
      />
      <ellipse
        cx="327.7"
        cy="213.7"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(39 327.7 213.7)"
      />
      <ellipse
        cx="192.0"
        cy="294.4"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(63 192.0 294.4)"
      />
      <ellipse
        cx="230.7"
        cy="302.2"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(58 230.7 302.2)"
      />
      <ellipse
        cx="278.1"
        cy="273.9"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(169 278.1 273.9)"
      />
      <ellipse
        cx="203.4"
        cy="242.6"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(51 203.4 242.6)"
      />
      <ellipse
        cx="299.9"
        cy="262.7"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(38 299.9 262.7)"
      />
      <ellipse
        cx="240.7"
        cy="308.3"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(28 240.7 308.3)"
      />
      <ellipse
        cx="305.7"
        cy="205.3"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(18 305.7 205.3)"
      />
      <ellipse
        cx="265.7"
        cy="235.0"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(64 265.7 235.0)"
      />
      <ellipse
        cx="298.9"
        cy="220.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(147 298.9 220.1)"
      />
      <ellipse
        cx="299.6"
        cy="161.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(177 299.6 161.6)"
      />
      <ellipse
        cx="326.9"
        cy="239.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(137 326.9 239.6)"
      />
      <ellipse
        cx="314.5"
        cy="218.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(15 314.5 218.6)"
      />
      <ellipse
        cx="335.7"
        cy="281.0"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(116 335.7 281.0)"
      />
      <ellipse
        cx="260.7"
        cy="210.6"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(87 260.7 210.6)"
      />
      <ellipse
        cx="203.6"
        cy="267.3"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(172 203.6 267.3)"
      />
      <ellipse
        cx="262.1"
        cy="148.4"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(21 262.1 148.4)"
      />
      <ellipse
        cx="243.2"
        cy="293.4"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(114 243.2 293.4)"
      />
      <ellipse
        cx="312.0"
        cy="305.7"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(102 312.0 305.7)"
      />
      <ellipse
        cx="252.1"
        cy="130.5"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(43 252.1 130.5)"
      />
      <ellipse
        cx="206.3"
        cy="190.4"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(153 206.3 190.4)"
      />
      <ellipse
        cx="251.6"
        cy="180.4"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(42 251.6 180.4)"
      />
      <ellipse
        cx="226.6"
        cy="262.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(151 226.6 262.9)"
      />
      <ellipse
        cx="340.1"
        cy="185.2"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(22 340.1 185.2)"
      />
      <ellipse
        cx="348.4"
        cy="227.3"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(156 348.4 227.3)"
      />
      <ellipse
        cx="256.4"
        cy="298.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(38 256.4 298.1)"
      />
      <ellipse
        cx="266.6"
        cy="160.4"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(159 266.6 160.4)"
      />
      <ellipse
        cx="318.9"
        cy="212.8"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(79 318.9 212.8)"
      />
      <ellipse
        cx="347.0"
        cy="184.8"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(124 347.0 184.8)"
      />
      <ellipse
        cx="226.6"
        cy="150.3"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(139 226.6 150.3)"
      />
      <ellipse
        cx="208.2"
        cy="219.5"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(46 208.2 219.5)"
      />
      <ellipse
        cx="260.0"
        cy="150.4"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(78 260.0 150.4)"
      />
      <ellipse
        cx="152.5"
        cy="217.3"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(73 152.5 217.3)"
      />
      <ellipse
        cx="194.1"
        cy="252.2"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(116 194.1 252.2)"
      />
      <ellipse
        cx="341.0"
        cy="229.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(56 341.0 229.6)"
      />
      <ellipse
        cx="226.0"
        cy="273.2"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(162 226.0 273.2)"
      />
      <ellipse
        cx="233.5"
        cy="146.9"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(44 233.5 146.9)"
      />
      <ellipse
        cx="272.7"
        cy="222.8"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(138 272.7 222.8)"
      />
      <ellipse
        cx="302.0"
        cy="239.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(46 302.0 239.1)"
      />
      <ellipse
        cx="255.9"
        cy="195.2"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(129 255.9 195.2)"
      />
      <ellipse
        cx="200.4"
        cy="157.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(112 200.4 157.1)"
      />
      <ellipse
        cx="153.6"
        cy="201.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(82 153.6 201.9)"
      />
      <ellipse
        cx="292.3"
        cy="187.3"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(36 292.3 187.3)"
      />
      <ellipse
        cx="272.0"
        cy="167.5"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(163 272.0 167.5)"
      />
      <ellipse
        cx="204.5"
        cy="168.5"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(84 204.5 168.5)"
      />
      <ellipse
        cx="301.9"
        cy="143.9"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(174 301.9 143.9)"
      />
      <ellipse
        cx="306.9"
        cy="297.2"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(162 306.9 297.2)"
      />
      <ellipse
        cx="302.5"
        cy="177.7"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(150 302.5 177.7)"
      />
      <ellipse
        cx="164.5"
        cy="182.5"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(94 164.5 182.5)"
      />
      <ellipse
        cx="295.9"
        cy="242.9"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(80 295.9 242.9)"
      />
      <ellipse
        cx="332.8"
        cy="177.4"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(18 332.8 177.4)"
      />
      <ellipse
        cx="209.1"
        cy="164.5"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(139 209.1 164.5)"
      />
      <ellipse
        cx="271.4"
        cy="168.0"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(73 271.4 168.0)"
      />
      <ellipse
        cx="319.2"
        cy="160.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(122 319.2 160.1)"
      />
      <ellipse
        cx="333.8"
        cy="257.7"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(70 333.8 257.7)"
      />
      <ellipse
        cx="257.9"
        cy="195.7"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(70 257.9 195.7)"
      />
      <ellipse
        cx="302.6"
        cy="155.3"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(27 302.6 155.3)"
      />
      <ellipse
        cx="233.9"
        cy="319.4"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(47 233.9 319.4)"
      />
      <ellipse
        cx="218.8"
        cy="282.4"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(120 218.8 282.4)"
      />
      <ellipse
        cx="167.7"
        cy="205.7"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(82 167.7 205.7)"
      />
      <ellipse
        cx="294.8"
        cy="317.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(113 294.8 317.6)"
      />
      <ellipse
        cx="237.5"
        cy="149.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(9 237.5 149.6)"
      />
      <ellipse
        cx="194.0"
        cy="143.9"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(105 194.0 143.9)"
      />
      <ellipse
        cx="282.2"
        cy="144.7"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(164 282.2 144.7)"
      />
      <ellipse
        cx="319.5"
        cy="153.6"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(86 319.5 153.6)"
      />
      <ellipse
        cx="199.9"
        cy="197.2"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(153 199.9 197.2)"
      />
      <ellipse
        cx="203.5"
        cy="236.7"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(155 203.5 236.7)"
      />
      <ellipse
        cx="349.2"
        cy="213.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(30 349.2 213.6)"
      />
      <ellipse
        cx="247.1"
        cy="140.0"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(177 247.1 140.0)"
      />
      <ellipse
        cx="297.3"
        cy="216.3"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(161 297.3 216.3)"
      />
      <ellipse
        cx="268.7"
        cy="317.8"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(165 268.7 317.8)"
      />
      <ellipse
        cx="289.0"
        cy="174.9"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(21 289.0 174.9)"
      />
      <ellipse
        cx="278.7"
        cy="312.6"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(113 278.7 312.6)"
      />
      <ellipse
        cx="175.0"
        cy="159.0"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(119 175.0 159.0)"
      />
      <ellipse
        cx="172.0"
        cy="220.7"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(66 172.0 220.7)"
      />
      <ellipse
        cx="201.4"
        cy="289.1"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(19 201.4 289.1)"
      />
      <ellipse
        cx="337.6"
        cy="221.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(139 337.6 221.8)"
      />
      <ellipse
        cx="152.2"
        cy="248.6"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(73 152.2 248.6)"
      />
      <ellipse
        cx="228.3"
        cy="292.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(95 228.3 292.8)"
      />
      <ellipse
        cx="309.5"
        cy="244.6"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(151 309.5 244.6)"
      />
      <ellipse
        cx="236.9"
        cy="152.7"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(133 236.9 152.7)"
      />
      <ellipse
        cx="255.9"
        cy="210.0"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(3 255.9 210.0)"
      />
      <ellipse
        cx="269.7"
        cy="229.1"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(38 269.7 229.1)"
      />
      <ellipse
        cx="201.8"
        cy="177.0"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(126 201.8 177.0)"
      />
      <ellipse
        cx="247.8"
        cy="280.1"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(43 247.8 280.1)"
      />
      <ellipse
        cx="263.0"
        cy="239.6"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(47 263.0 239.6)"
      />
      <ellipse
        cx="228.3"
        cy="231.9"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(167 228.3 231.9)"
      />
      <ellipse
        cx="195.0"
        cy="286.4"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(140 195.0 286.4)"
      />
      <ellipse
        cx="208.8"
        cy="226.2"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(170 208.8 226.2)"
      />
      <ellipse
        cx="277.6"
        cy="136.6"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(175 277.6 136.6)"
      />
      <ellipse
        cx="157.7"
        cy="262.8"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(81 157.7 262.8)"
      />
      <ellipse
        cx="234.9"
        cy="215.7"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(12 234.9 215.7)"
      />
      <ellipse
        cx="278.6"
        cy="147.8"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(93 278.6 147.8)"
      />
      <ellipse
        cx="260.3"
        cy="315.7"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(92 260.3 315.7)"
      />
      <ellipse
        cx="316.4"
        cy="300.2"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(59 316.4 300.2)"
      />
      <ellipse
        cx="220.7"
        cy="172.3"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(74 220.7 172.3)"
      />
      <ellipse
        cx="281.4"
        cy="215.1"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(115 281.4 215.1)"
      />
      <ellipse
        cx="306.5"
        cy="196.3"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(20 306.5 196.3)"
      />
      <ellipse
        cx="229.4"
        cy="321.8"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(106 229.4 321.8)"
      />
      <ellipse
        cx="279.0"
        cy="291.7"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(38 279.0 291.7)"
      />
      <ellipse
        cx="308.0"
        cy="222.3"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(78 308.0 222.3)"
      />
      <ellipse
        cx="229.3"
        cy="253.4"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(51 229.3 253.4)"
      />
      <ellipse
        cx="199.6"
        cy="312.1"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(103 199.6 312.1)"
      />
      <ellipse
        cx="327.2"
        cy="287.1"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(157 327.2 287.1)"
      />
      <ellipse
        cx="313.6"
        cy="273.1"
        rx="4.4"
        ry="1.7"
        fill="#FBE9B0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(91 313.6 273.1)"
      />
      <ellipse
        cx="193.7"
        cy="256.5"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(160 193.7 256.5)"
      />
      <ellipse
        cx="214.8"
        cy="292.5"
        rx="4.4"
        ry="1.7"
        fill="#E9BE62"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(20 214.8 292.5)"
      />
      <ellipse
        cx="352.0"
        cy="220.4"
        rx="4.4"
        ry="1.7"
        fill="#F6DC93"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(168 352.0 220.4)"
      />
      <ellipse
        cx="231.3"
        cy="275.7"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(137 231.3 275.7)"
      />
      <ellipse
        cx="244.6"
        cy="200.1"
        rx="4.4"
        ry="1.7"
        fill="#FFF1C9"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(4 244.6 200.1)"
      />
      <ellipse
        cx="218.5"
        cy="196.8"
        rx="4.4"
        ry="1.7"
        fill="#F9E3A0"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(140 218.5 196.8)"
      />
      <ellipse
        cx="208.7"
        cy="214.9"
        rx="4.4"
        ry="1.7"
        fill="#EFC970"
        stroke="#B98425"
        strokeOpacity="0.25"
        strokeWidth="0.4"
        transform="rotate(70 208.7 214.9)"
      />
      <rect
        x="225.9"
        y="172.5"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(23 225.9 172.5)"
      />
      <rect
        x="209.2"
        y="275.3"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(177 209.2 275.3)"
      />
      <rect
        x="250.0"
        y="309.7"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(85 250.0 309.7)"
      />
      <rect
        x="263.7"
        y="304.6"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(27 263.7 304.6)"
      />
      <rect
        x="256.1"
        y="151.5"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(36 256.1 151.5)"
      />
      <rect
        x="292.5"
        y="216.4"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(81 292.5 216.4)"
      />
      <rect
        x="257.6"
        y="286.2"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(78 257.6 286.2)"
      />
      <rect
        x="246.7"
        y="162.3"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(171 246.7 162.3)"
      />
      <rect
        x="256.5"
        y="253.9"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(151 256.5 253.9)"
      />
      <rect
        x="220.5"
        y="240.5"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(129 220.5 240.5)"
      />
      <rect
        x="239.6"
        y="270.9"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(128 239.6 270.9)"
      />
      <rect
        x="211.7"
        y="184.0"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(127 211.7 184.0)"
      />
      <rect
        x="280.2"
        y="240.4"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(26 280.2 240.4)"
      />
      <rect
        x="288.9"
        y="200.4"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(18 288.9 200.4)"
      />
      <rect
        x="222.3"
        y="218.3"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(156 222.3 218.3)"
      />
      <rect
        x="262.2"
        y="142.6"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(77 262.2 142.6)"
      />
      <rect
        x="282.9"
        y="222.7"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(46 282.9 222.7)"
      />
      <rect
        x="286.4"
        y="299.5"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(10 286.4 299.5)"
      />
      <rect
        x="239.3"
        y="292.2"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(16 239.3 292.2)"
      />
      <rect
        x="218.4"
        y="196.9"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(25 218.4 196.9)"
      />
      <rect
        x="323.6"
        y="234.0"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(142 323.6 234.0)"
      />
      <rect
        x="195.1"
        y="279.2"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(134 195.1 279.2)"
      />
      <rect
        x="228.4"
        y="215.2"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(12 228.4 215.2)"
      />
      <rect
        x="323.6"
        y="262.9"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(39 323.6 262.9)"
      />
      <rect
        x="183.7"
        y="166.8"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(94 183.7 166.8)"
      />
      <rect
        x="286.2"
        y="272.3"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(69 286.2 272.3)"
      />
      <rect
        x="178.9"
        y="168.8"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(31 178.9 168.8)"
      />
      <rect
        x="185.9"
        y="247.3"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(149 185.9 247.3)"
      />
      <rect
        x="201.7"
        y="166.8"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(37 201.7 166.8)"
      />
      <rect
        x="185.1"
        y="265.0"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(170 185.1 265.0)"
      />
      <rect
        x="264.3"
        y="218.4"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(33 264.3 218.4)"
      />
      <rect
        x="245.7"
        y="310.1"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(77 245.7 310.1)"
      />
      <rect
        x="287.7"
        y="183.3"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(128 287.7 183.3)"
      />
      <rect
        x="275.2"
        y="140.1"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(87 275.2 140.1)"
      />
      <rect
        x="205.9"
        y="300.7"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(128 205.9 300.7)"
      />
      <rect
        x="281.6"
        y="203.5"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(146 281.6 203.5)"
      />
      <rect
        x="182.2"
        y="215.1"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(109 182.2 215.1)"
      />
      <rect
        x="193.7"
        y="186.1"
        width="16"
        height="3.4"
        rx="1.7"
        fill="url(#pl-carrot)"
        transform="rotate(27 193.7 186.1)"
      />
      <ellipse
        cx="251.0"
        cy="228.1"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(167 251.0 228.1)"
      />
      <circle cx="250.0" cy="227.1" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="227.9"
        cy="212.5"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(55 227.9 212.5)"
      />
      <circle cx="226.9" cy="211.5" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="330.7"
        cy="268.5"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(171 330.7 268.5)"
      />
      <circle cx="329.7" cy="267.5" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="162.4"
        cy="209.9"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(154 162.4 209.9)"
      />
      <circle cx="161.4" cy="208.9" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="189.4"
        cy="159.6"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(116 189.4 159.6)"
      />
      <circle cx="188.4" cy="158.6" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="281.4"
        cy="230.7"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(87 281.4 230.7)"
      />
      <circle cx="280.4" cy="229.7" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="264.8"
        cy="274.6"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(29 264.8 274.6)"
      />
      <circle cx="263.8" cy="273.6" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="259.9"
        cy="226.3"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(155 259.9 226.3)"
      />
      <circle cx="258.9" cy="225.3" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="257.7"
        cy="156.0"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(50 257.7 156.0)"
      />
      <circle cx="256.7" cy="155.0" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="277.9"
        cy="177.3"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(20 277.9 177.3)"
      />
      <circle cx="276.9" cy="176.3" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="173.2"
        cy="223.5"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(84 173.2 223.5)"
      />
      <circle cx="172.2" cy="222.5" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="234.1"
        cy="154.1"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(54 234.1 154.1)"
      />
      <circle cx="233.1" cy="153.1" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="287.3"
        cy="202.0"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(45 287.3 202.0)"
      />
      <circle cx="286.3" cy="201.0" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="314.2"
        cy="201.5"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(131 314.2 201.5)"
      />
      <circle cx="313.2" cy="200.5" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="288.1"
        cy="202.1"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(68 288.1 202.1)"
      />
      <circle cx="287.1" cy="201.1" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="253.5"
        cy="193.7"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(171 253.5 193.7)"
      />
      <circle cx="252.5" cy="192.7" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="182.7"
        cy="276.5"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(121 182.7 276.5)"
      />
      <circle cx="181.7" cy="275.5" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="292.3"
        cy="293.1"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(141 292.3 293.1)"
      />
      <circle cx="291.3" cy="292.1" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="257.8"
        cy="154.9"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(154 257.8 154.9)"
      />
      <circle cx="256.8" cy="153.9" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="169.5"
        cy="261.8"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(179 169.5 261.8)"
      />
      <circle cx="168.5" cy="260.8" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="197.2"
        cy="241.4"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(134 197.2 241.4)"
      />
      <circle cx="196.2" cy="240.4" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="258.2"
        cy="244.2"
        rx="4"
        ry="3.2"
        fill="#4B2236"
        transform="rotate(142 258.2 244.2)"
      />
      <circle cx="257.2" cy="243.2" r="0.9" fill="#fff" opacity="0.45" />
      <ellipse
        cx="304.0"
        cy="250.0"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(1 304.0 250.0)"
      />
      <ellipse
        cx="226.4"
        cy="243.2"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(10 226.4 243.2)"
      />
      <ellipse
        cx="171.0"
        cy="232.8"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(118 171.0 232.8)"
      />
      <ellipse
        cx="247.0"
        cy="304.6"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(106 247.0 304.6)"
      />
      <ellipse
        cx="263.2"
        cy="183.9"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(60 263.2 183.9)"
      />
      <ellipse
        cx="200.3"
        cy="145.5"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(166 200.3 145.5)"
      />
      <ellipse
        cx="263.7"
        cy="314.9"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(90 263.7 314.9)"
      />
      <ellipse
        cx="186.2"
        cy="251.4"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(162 186.2 251.4)"
      />
      <ellipse
        cx="271.4"
        cy="267.9"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(110 271.4 267.9)"
      />
      <ellipse
        cx="307.3"
        cy="287.1"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(142 307.3 287.1)"
      />
      <ellipse
        cx="341.9"
        cy="237.9"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(176 341.9 237.9)"
      />
      <ellipse
        cx="304.2"
        cy="261.7"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(139 304.2 261.7)"
      />
      <ellipse
        cx="219.9"
        cy="216.0"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(55 219.9 216.0)"
      />
      <ellipse
        cx="209.3"
        cy="166.4"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(122 209.3 166.4)"
      />
      <ellipse
        cx="207.5"
        cy="292.4"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(4 207.5 292.4)"
      />
      <ellipse
        cx="202.2"
        cy="255.6"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(5 202.2 255.6)"
      />
      <ellipse
        cx="284.0"
        cy="166.6"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(33 284.0 166.6)"
      />
      <ellipse
        cx="234.3"
        cy="169.9"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(155 234.3 169.9)"
      />
      <ellipse
        cx="300.3"
        cy="144.2"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(123 300.3 144.2)"
      />
      <ellipse
        cx="240.0"
        cy="230.1"
        rx="4.4"
        ry="1.5"
        fill="#7DB65A"
        transform="rotate(6 240.0 230.1)"
      />
      <ellipse
        cx="194.9"
        cy="300.6"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(152 194.9 300.6)"
      />
      <ellipse
        cx="279.9"
        cy="180.0"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(96 279.9 180.0)"
      />
      <ellipse
        cx="315.1"
        cy="246.0"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(111 315.1 246.0)"
      />
      <ellipse
        cx="272.2"
        cy="202.6"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(105 272.2 202.6)"
      />
      <ellipse
        cx="301.5"
        cy="218.8"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(117 301.5 218.8)"
      />
      <ellipse
        cx="230.9"
        cy="226.4"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(162 230.9 226.4)"
      />
      <ellipse
        cx="314.6"
        cy="157.6"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(106 314.6 157.6)"
      />
      <ellipse
        cx="255.4"
        cy="255.1"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(122 255.4 255.1)"
      />
      <ellipse
        cx="205.3"
        cy="248.8"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(73 205.3 248.8)"
      />
      <ellipse
        cx="207.7"
        cy="215.6"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(14 207.7 215.6)"
      />
      <ellipse
        cx="257.4"
        cy="237.2"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(149 257.4 237.2)"
      />
      <ellipse
        cx="189.1"
        cy="294.3"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(150 189.1 294.3)"
      />
      <ellipse
        cx="242.9"
        cy="184.5"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(120 242.9 184.5)"
      />
      <ellipse
        cx="218.4"
        cy="139.0"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(144 218.4 139.0)"
      />
      <ellipse
        cx="228.6"
        cy="271.7"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(35 228.6 271.7)"
      />
      <ellipse
        cx="284.6"
        cy="160.1"
        rx="5"
        ry="1.8"
        fill="#F1DDAE"
        stroke="#C9A765"
        strokeWidth="0.4"
        transform="rotate(111 284.6 160.1)"
      />
      <path
        d="M349.6 201.9Q355.3 224.0 353.5 248.0Q351.7 272.0 336.1 291.0Q320.5 309.9 298.2 319.5Q276.0 329.0 252.4 327.2Q228.9 325.4 205.5 318.5Q182.1 311.6 166.5 292.2Q150.8 272.7 147.3 248.4Q143.8 224.0 149.2 200.6Q154.6 177.1 170.8 159.8Q187.0 142.5 208.2 134.0Q229.5 125.5 252.6 123.0Q275.6 120.5 297.9 129.5Q320.1 138.6 332.0 159.2Q343.9 179.8 349.6 201.9Z"
        fill="none"
        stroke="#9F6E1C"
        strokeOpacity="0.35"
        strokeWidth="3"
      />
      <g transform="rotate(-14 230 196)">
        <ellipse cx="234" cy="202" rx="40" ry="29" fill="#000" opacity="0.28" />
        <path
          d="M190 196Q194 167 230 165Q268 170 270 198Q264 225 230 225Q196 223 190 196Z"
          fill="url(#pl-lamb)"
        />
        <path
          d="M206.0 185.85Q230 168.45 252.0 187.3"
          stroke="#F4CFA0"
          strokeWidth="3"
          fill="none"
          opacity="0.65"
          strokeLinecap="round"
        />
        <path
          d="M214.0 201.8Q230 210.5 246.0 200.35"
          stroke="#4A220F"
          strokeWidth="2"
          fill="none"
          opacity="0.45"
          strokeLinecap="round"
        />
        <circle cx="240.0" cy="190.2" r="2" fill="#F4CFA0" opacity="0.6" />
      </g>
      <g transform="rotate(18 292 252)">
        <ellipse cx="296" cy="258" rx="32" ry="23" fill="#000" opacity="0.28" />
        <path
          d="M260 252Q264 229 292 227Q322 232 324 254Q318 275 292 275Q266 273 260 252Z"
          fill="url(#pl-lamb)"
        />
        <path
          d="M272.8 243.95Q292 230.15 309.6 245.1"
          stroke="#F4CFA0"
          strokeWidth="3"
          fill="none"
          opacity="0.65"
          strokeLinecap="round"
        />
        <path
          d="M279.2 256.6Q292 263.5 304.8 255.45"
          stroke="#4A220F"
          strokeWidth="2"
          fill="none"
          opacity="0.45"
          strokeLinecap="round"
        />
        <circle cx="300.0" cy="247.4" r="2" fill="#F4CFA0" opacity="0.6" />
      </g>
      <ellipse
        cx="88"
        cy="96"
        rx="56"
        ry="54"
        fill="#000"
        opacity="0.28"
        filter="url(#pl-blur)"
      />
      <circle cx="82" cy="88" r="52" fill="url(#pl-bowl)" />
      <circle cx="82" cy="88" r="45" fill="#EDE7D8" stroke="#CFC6B2" />
      <circle cx="82" cy="88" r="38" fill="#4C9234" opacity="0.35" />
      <ellipse
        cx="86.0"
        cy="97.3"
        rx="9"
        ry="4.2"
        fill="#78BD52"
        transform="rotate(93 86.0 97.3)"
      />
      <ellipse
        cx="65.7"
        cy="91.1"
        rx="9"
        ry="4.2"
        fill="#4C9234"
        transform="rotate(20 65.7 91.1)"
      />
      <ellipse
        cx="90.4"
        cy="98.2"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(158 90.4 98.2)"
      />
      <ellipse
        cx="104.8"
        cy="100.2"
        rx="9"
        ry="4.2"
        fill="#4C9234"
        transform="rotate(8 104.8 100.2)"
      />
      <ellipse
        cx="101.7"
        cy="62.9"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(138 101.7 62.9)"
      />
      <ellipse
        cx="73.5"
        cy="106.9"
        rx="9"
        ry="4.2"
        fill="#4C9234"
        transform="rotate(55 73.5 106.9)"
      />
      <ellipse
        cx="76.3"
        cy="60.8"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(9 76.3 60.8)"
      />
      <ellipse
        cx="99.4"
        cy="100.7"
        rx="9"
        ry="4.2"
        fill="#4C9234"
        transform="rotate(75 99.4 100.7)"
      />
      <ellipse
        cx="103.1"
        cy="113.6"
        rx="9"
        ry="4.2"
        fill="#4C9234"
        transform="rotate(87 103.1 113.6)"
      />
      <ellipse
        cx="67.1"
        cy="67.2"
        rx="9"
        ry="4.2"
        fill="#78BD52"
        transform="rotate(129 67.1 67.2)"
      />
      <ellipse
        cx="109.9"
        cy="91.2"
        rx="9"
        ry="4.2"
        fill="#78BD52"
        transform="rotate(122 109.9 91.2)"
      />
      <ellipse
        cx="54.0"
        cy="104.3"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(62 54.0 104.3)"
      />
      <ellipse
        cx="81.8"
        cy="70.7"
        rx="9"
        ry="4.2"
        fill="#78BD52"
        transform="rotate(174 81.8 70.7)"
      />
      <ellipse
        cx="89.6"
        cy="86.5"
        rx="9"
        ry="4.2"
        fill="#78BD52"
        transform="rotate(63 89.6 86.5)"
      />
      <ellipse
        cx="67.1"
        cy="107.3"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(52 67.1 107.3)"
      />
      <ellipse
        cx="99.0"
        cy="59.0"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(101 99.0 59.0)"
      />
      <ellipse
        cx="91.5"
        cy="111.1"
        rx="9"
        ry="4.2"
        fill="#78BD52"
        transform="rotate(118 91.5 111.1)"
      />
      <ellipse
        cx="84.5"
        cy="93.1"
        rx="9"
        ry="4.2"
        fill="#78BD52"
        transform="rotate(18 84.5 93.1)"
      />
      <ellipse
        cx="62.8"
        cy="74.6"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(149 62.8 74.6)"
      />
      <ellipse
        cx="79.1"
        cy="112.8"
        rx="9"
        ry="4.2"
        fill="#78BD52"
        transform="rotate(124 79.1 112.8)"
      />
      <ellipse
        cx="79.7"
        cy="117.6"
        rx="9"
        ry="4.2"
        fill="#4C9234"
        transform="rotate(127 79.7 117.6)"
      />
      <ellipse
        cx="65.4"
        cy="68.8"
        rx="9"
        ry="4.2"
        fill="#4C9234"
        transform="rotate(12 65.4 68.8)"
      />
      <ellipse
        cx="104.4"
        cy="103.9"
        rx="9"
        ry="4.2"
        fill="#4C9234"
        transform="rotate(2 104.4 103.9)"
      />
      <ellipse
        cx="111.4"
        cy="73.1"
        rx="9"
        ry="4.2"
        fill="#78BD52"
        transform="rotate(117 111.4 73.1)"
      />
      <ellipse
        cx="82.2"
        cy="66.6"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(119 82.2 66.6)"
      />
      <ellipse
        cx="66.0"
        cy="91.1"
        rx="9"
        ry="4.2"
        fill="#78BD52"
        transform="rotate(112 66.0 91.1)"
      />
      <ellipse
        cx="67.1"
        cy="95.7"
        rx="9"
        ry="4.2"
        fill="#4C9234"
        transform="rotate(52 67.1 95.7)"
      />
      <ellipse
        cx="62.2"
        cy="67.8"
        rx="9"
        ry="4.2"
        fill="#78BD52"
        transform="rotate(56 62.2 67.8)"
      />
      <ellipse
        cx="82.6"
        cy="97.9"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(63 82.6 97.9)"
      />
      <ellipse
        cx="109.8"
        cy="79.7"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(48 109.8 79.7)"
      />
      <ellipse
        cx="108.3"
        cy="82.1"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(96 108.3 82.1)"
      />
      <ellipse
        cx="75.7"
        cy="82.7"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(123 75.7 82.7)"
      />
      <ellipse
        cx="89.5"
        cy="81.4"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(88 89.5 81.4)"
      />
      <ellipse
        cx="106.6"
        cy="95.9"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(62 106.6 95.9)"
      />
      <ellipse
        cx="89.2"
        cy="77.8"
        rx="9"
        ry="4.2"
        fill="#78BD52"
        transform="rotate(178 89.2 77.8)"
      />
      <ellipse
        cx="63.9"
        cy="77.8"
        rx="9"
        ry="4.2"
        fill="#4C9234"
        transform="rotate(51 63.9 77.8)"
      />
      <ellipse
        cx="55.4"
        cy="95.2"
        rx="9"
        ry="4.2"
        fill="#4C9234"
        transform="rotate(131 55.4 95.2)"
      />
      <ellipse
        cx="98.3"
        cy="104.8"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(112 98.3 104.8)"
      />
      <ellipse
        cx="105.3"
        cy="104.0"
        rx="9"
        ry="4.2"
        fill="#4C9234"
        transform="rotate(2 105.3 104.0)"
      />
      <ellipse
        cx="76.2"
        cy="102.2"
        rx="9"
        ry="4.2"
        fill="#5FA640"
        transform="rotate(155 76.2 102.2)"
      />
      <circle
        cx="81.1"
        cy="105.1"
        r="5"
        fill="#CFE6B0"
        stroke="#7FB05A"
        strokeWidth="1.2"
      />
      <circle cx="81.1" cy="105.1" r="2" fill="#E8F3D6" />
      <circle
        cx="70.2"
        cy="88.2"
        r="5"
        fill="#CFE6B0"
        stroke="#7FB05A"
        strokeWidth="1.2"
      />
      <circle cx="70.2" cy="88.2" r="2" fill="#E8F3D6" />
      <circle
        cx="105.8"
        cy="84.1"
        r="5"
        fill="#CFE6B0"
        stroke="#7FB05A"
        strokeWidth="1.2"
      />
      <circle cx="105.8" cy="84.1" r="2" fill="#E8F3D6" />
      <circle
        cx="78.8"
        cy="72.9"
        r="5"
        fill="#CFE6B0"
        stroke="#7FB05A"
        strokeWidth="1.2"
      />
      <circle cx="78.8" cy="72.9" r="2" fill="#E8F3D6" />
      <circle
        cx="83.7"
        cy="95.5"
        r="5"
        fill="#CFE6B0"
        stroke="#7FB05A"
        strokeWidth="1.2"
      />
      <circle cx="83.7" cy="95.5" r="2" fill="#E8F3D6" />
      <circle
        cx="105.5"
        cy="95.7"
        r="5"
        fill="#CFE6B0"
        stroke="#7FB05A"
        strokeWidth="1.2"
      />
      <circle cx="105.5" cy="95.7" r="2" fill="#E8F3D6" />
      <circle
        cx="77.5"
        cy="91.9"
        r="5"
        fill="#CFE6B0"
        stroke="#7FB05A"
        strokeWidth="1.2"
      />
      <circle cx="77.5" cy="91.9" r="2" fill="#E8F3D6" />
      <circle cx="66.1" cy="70.9" r="5.4" fill="#D93A2B" />
      <circle cx="64.5" cy="69.3" r="1.4" fill="#fff" opacity="0.45" />
      <circle cx="80.5" cy="112.0" r="5.4" fill="#D93A2B" />
      <circle cx="78.9" cy="110.4" r="1.4" fill="#fff" opacity="0.45" />
      <circle cx="87.6" cy="113.0" r="5.4" fill="#D93A2B" />
      <circle cx="86.0" cy="111.4" r="1.4" fill="#fff" opacity="0.45" />
      <circle cx="96.2" cy="79.6" r="5.4" fill="#D93A2B" />
      <circle cx="94.6" cy="78.0" r="1.4" fill="#fff" opacity="0.45" />
      <circle cx="59.2" cy="91.9" r="5.4" fill="#D93A2B" />
      <circle cx="57.6" cy="90.3" r="1.4" fill="#fff" opacity="0.45" />
      <circle cx="80.3" cy="105.3" r="5.4" fill="#D93A2B" />
      <circle cx="78.7" cy="103.7" r="1.4" fill="#fff" opacity="0.45" />
      <circle cx="70.4" cy="99.5" r="5.4" fill="#D93A2B" />
      <circle cx="68.8" cy="97.9" r="1.4" fill="#fff" opacity="0.45" />
      <path
        d="M67.5 102.8Q72.5 96.8 77.5 102.8"
        stroke="#A04C8C"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M73.9 113.1Q78.9 107.1 83.9 113.1"
        stroke="#A04C8C"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M76.1 83.3Q81.1 77.3 86.1 83.3"
        stroke="#A04C8C"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M53.4 80.1Q58.4 74.1 63.4 80.1"
        stroke="#A04C8C"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M97.7 93.9Q102.7 87.9 107.7 93.9"
        stroke="#A04C8C"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M50.9 87.1Q55.9 81.1 60.9 87.1"
        stroke="#A04C8C"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M74.1 68.8Q79.1 62.8 84.1 68.8"
        stroke="#A04C8C"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M87.9 90.8Q92.9 84.8 97.9 90.8"
        stroke="#A04C8C"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M54.0 87.8Q59.0 81.8 64.0 87.8"
        stroke="#A04C8C"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx="486"
        cy="108"
        rx="48"
        ry="46"
        fill="#000"
        opacity="0.28"
        filter="url(#pl-blur)"
      />
      <circle cx="480" cy="100" r="44" fill="url(#pl-bowl)" />
      <circle
        cx="480"
        cy="100"
        r="33"
        fill="#fff"
        fillOpacity="0.35"
        stroke="#CFDDEE"
        strokeWidth="1.5"
      />
      <circle cx="480" cy="100" r="27" fill="url(#pl-tea)" />
      <ellipse
        cx="472"
        cy="92"
        rx="10"
        ry="6"
        fill="#fff"
        opacity="0.4"
        transform="rotate(-30 472 92)"
      />
      <ellipse
        cx="496"
        cy="372"
        rx="74"
        ry="54"
        fill="#000"
        opacity="0.3"
        filter="url(#pl-blur)"
      />
      <ellipse
        cx="490"
        cy="364"
        rx="70"
        ry="52"
        fill="url(#pl-naan)"
        transform="rotate(-14 490 364)"
      />
      <ellipse
        cx="455.6"
        cy="355.7"
        rx="5.5"
        ry="2.6"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="515.8"
        cy="351.2"
        rx="3.4"
        ry="2.4"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="520.9"
        cy="325.8"
        rx="3.2"
        ry="2.3"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="465.5"
        cy="358.1"
        rx="3.5"
        ry="3.2"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="479.1"
        cy="388.0"
        rx="3.0"
        ry="3.5"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="516.3"
        cy="397.5"
        rx="3.3"
        ry="3.4"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="462.1"
        cy="355.9"
        rx="3.9"
        ry="2.4"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="489.0"
        cy="335.1"
        rx="3.8"
        ry="2.0"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="521.6"
        cy="391.9"
        rx="4.8"
        ry="2.2"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="508.8"
        cy="394.5"
        rx="5.6"
        ry="3.3"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="496.2"
        cy="362.2"
        rx="4.8"
        ry="3.7"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="473.1"
        cy="394.8"
        rx="5.9"
        ry="3.2"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="512.7"
        cy="347.7"
        rx="4.4"
        ry="2.7"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="491.3"
        cy="404.7"
        rx="5.1"
        ry="3.7"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="523.6"
        cy="377.5"
        rx="3.4"
        ry="3.1"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="499.0"
        cy="361.0"
        rx="5.2"
        ry="2.9"
        fill="#6B3A17"
        opacity="0.65"
      />
      <ellipse
        cx="489.7"
        cy="304.6"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(164 489.7 304.6)"
      />
      <ellipse
        cx="508.9"
        cy="355.1"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(0 508.9 355.1)"
      />
      <ellipse
        cx="451.0"
        cy="326.1"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(180 451.0 326.1)"
      />
      <ellipse
        cx="467.7"
        cy="374.3"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(141 467.7 374.3)"
      />
      <ellipse
        cx="436.8"
        cy="372.6"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(57 436.8 372.6)"
      />
      <ellipse
        cx="518.4"
        cy="328.8"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(46 518.4 328.8)"
      />
      <ellipse
        cx="506.2"
        cy="308.1"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(51 506.2 308.1)"
      />
      <ellipse
        cx="505.9"
        cy="386.6"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(177 505.9 386.6)"
      />
      <ellipse
        cx="464.3"
        cy="371.6"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(170 464.3 371.6)"
      />
      <ellipse
        cx="475.2"
        cy="369.6"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(10 475.2 369.6)"
      />
      <ellipse
        cx="516.4"
        cy="344.8"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(0 516.4 344.8)"
      />
      <ellipse
        cx="526.9"
        cy="393.5"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(98 526.9 393.5)"
      />
      <ellipse
        cx="543.9"
        cy="346.6"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(36 543.9 346.6)"
      />
      <ellipse
        cx="518.3"
        cy="377.2"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(12 518.3 377.2)"
      />
      <ellipse
        cx="495.9"
        cy="364.6"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(157 495.9 364.6)"
      />
      <ellipse
        cx="513.5"
        cy="383.4"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(123 513.5 383.4)"
      />
      <ellipse
        cx="499.9"
        cy="324.0"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(150 499.9 324.0)"
      />
      <ellipse
        cx="460.5"
        cy="318.6"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(45 460.5 318.6)"
      />
      <ellipse
        cx="446.4"
        cy="370.7"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(142 446.4 370.7)"
      />
      <ellipse
        cx="439.3"
        cy="363.4"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(166 439.3 363.4)"
      />
      <ellipse
        cx="468.7"
        cy="403.4"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(28 468.7 403.4)"
      />
      <ellipse
        cx="478.0"
        cy="387.7"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(16 478.0 387.7)"
      />
      <ellipse
        cx="501.5"
        cy="332.8"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(9 501.5 332.8)"
      />
      <ellipse
        cx="513.7"
        cy="315.7"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(53 513.7 315.7)"
      />
      <ellipse
        cx="475.0"
        cy="326.4"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(49 475.0 326.4)"
      />
      <ellipse
        cx="469.7"
        cy="330.7"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(30 469.7 330.7)"
      />
      <ellipse
        cx="455.5"
        cy="378.0"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(95 455.5 378.0)"
      />
      <ellipse
        cx="506.8"
        cy="369.3"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(98 506.8 369.3)"
      />
      <ellipse
        cx="477.4"
        cy="323.3"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(31 477.4 323.3)"
      />
      <ellipse
        cx="506.3"
        cy="324.4"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(32 506.3 324.4)"
      />
      <ellipse
        cx="482.8"
        cy="412.1"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(75 482.8 412.1)"
      />
      <ellipse
        cx="531.2"
        cy="393.3"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(38 531.2 393.3)"
      />
      <ellipse
        cx="456.9"
        cy="400.3"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(179 456.9 400.3)"
      />
      <ellipse
        cx="487.0"
        cy="343.7"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(72 487.0 343.7)"
      />
      <ellipse
        cx="521.7"
        cy="330.3"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(11 521.7 330.3)"
      />
      <ellipse
        cx="512.4"
        cy="332.1"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(30 512.4 332.1)"
      />
      <ellipse
        cx="469.2"
        cy="376.5"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(122 469.2 376.5)"
      />
      <ellipse
        cx="487.9"
        cy="394.2"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(23 487.9 394.2)"
      />
      <ellipse
        cx="522.8"
        cy="391.8"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(27 522.8 391.8)"
      />
      <ellipse
        cx="518.4"
        cy="394.7"
        rx="1.6"
        ry="0.8"
        fill="#FFF4D6"
        transform="rotate(79 518.4 394.7)"
      />
      <g>
        <circle
          className="pl-steam"
          cx="230"
          cy="210"
          r="46"
          fill="url(#pl-steam)"
        />
        <circle
          className="pl-steam"
          style={{ animationDelay: "1.8s" }}
          cx="286"
          cy="234"
          r="54"
          fill="url(#pl-steam)"
        />
        <circle
          className="pl-steam"
          style={{ animationDelay: "3.4s" }}
          cx="260"
          cy="186"
          r="40"
          fill="url(#pl-steam)"
        />
      </g>
      <circle
        className="pl-ripple"
        cx="480"
        cy="100"
        r="9"
        stroke="#FFE2A8"
        strokeWidth="1.6"
      />
      <circle
        className="pl-ripple"
        style={{ animationDelay: "1.5s" }}
        cx="480"
        cy="100"
        r="9"
        stroke="#FFE2A8"
        strokeWidth="1.6"
      />
      <circle
        className="pl-steam"
        style={{ animationDelay: "0.8s" }}
        cx="480"
        cy="92"
        r="26"
        fill="url(#pl-steam)"
      />
      {[
        [300, 170, 0],
        [208, 252, 0.9],
        [334, 262, 1.7],
        [252, 176, 2.4],
        [196, 200, 3.1],
        [342, 214, 3.8],
        [270, 286, 4.5],
      ].map(([x, y, d], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path
            className="pl-twinkle"
            style={{ animationDelay: `${d}s` }}
            d="M0 -7L1.8 -1.8L7 0L1.8 1.8L0 7L-1.8 1.8L-7 0L-1.8 -1.8Z"
            fill="#fff"
          />
        </g>
      ))}
    </svg>
  );
}

/* Standard split-screen brand panel (desktop only) */
function HeroPanel({
  isDark,
  t,
}: {
  isDark: boolean;
  t: (typeof loginText)["en"];
}) {
  const perks = [
    { Icon: UtensilsCrossed, text: t.heroPerk1 },
    { Icon: Clock, text: t.heroPerk2 },
    { Icon: ShieldCheck, text: t.heroPerk3 },
  ];
  const bokeh = [
    { top: "8%", left: "10%", size: 120, delay: "0s" },
    { top: "62%", left: "78%", size: 170, delay: "3s" },
    { top: "30%", left: "86%", size: 90, delay: "6s" },
    { top: "78%", left: "6%", size: 110, delay: "9s" },
  ];
  const chip = isDark
    ? "border-[#332C3E] bg-[#1E1B26]/85 text-[#F0EAE2]"
    : "border-[#E6E1D6] bg-white/85 text-[#1D1A22]";
  return (
    <aside
      className={`relative hidden flex-col justify-between overflow-hidden border-s p-12 lg:flex xl:p-16 ${
        isDark ? "border-[#2E2938]" : "border-[#E6E1D6]"
      }`}
      style={{
        background: isDark
          ? "radial-gradient(ellipse at 50% 42%, rgba(224,185,58,0.16), transparent 62%), linear-gradient(135deg, #1E1B26, #15121C)"
          : "radial-gradient(ellipse at 50% 42%, rgba(201,162,39,0.28), transparent 62%), linear-gradient(135deg, #F6EDD6, #EBDEB8)",
      }}
    >
      {bokeh.map((b, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="pl-bokeh pointer-events-none absolute rounded-full bg-[#C9A227]/10 blur-2xl"
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
          }}
        />
      ))}

      <div
        className={`pl-up relative text-2xl font-semibold tracking-tight ${
          isDark ? "text-[#F0EAE2]" : "text-[#1D1A22]"
        }`}
      >
        Melmah<span className="text-[#C9A227]">.</span>
      </div>

      <div className="relative mx-auto w-full max-w-[560px]">
        <div className="pl-float">
          <PlateArt />
        </div>

        <div
          className={`pl-chip absolute -top-2 end-2 flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur ${chip}`}
        >
          <Star size={14} className="fill-[#E0B93A] text-[#E0B93A]" />
          <span className="text-sm font-bold">4.9</span>
          <span className="opacity-70">{t.heroChip1}</span>
        </div>

        <div
          className={`pl-chip absolute -bottom-2 start-2 flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur ${chip}`}
          style={{ animationDelay: "-2.5s" }}
        >
          <Clock size={14} className="text-[#C9A227]" />
          {t.heroChip2}
        </div>
      </div>

      <div
        className={`relative ${isDark ? "text-[#F0EAE2]" : "text-[#1D1A22]"}`}
      >
        <h2
          className="pl-up text-3xl font-semibold leading-tight tracking-tight xl:text-4xl"
          style={{ animationDelay: "0.15s" }}
        >
          {t.heroTitle}
        </h2>
        <p
          className={`pl-up mt-3 max-w-md text-base ${
            isDark ? "text-[#B7B2C4]" : "text-[#5F5968]"
          }`}
          style={{ animationDelay: "0.3s" }}
        >
          {t.heroSubtitle}
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
          {perks.map(({ Icon, text }, i) => (
            <li
              key={i}
              className="pl-up flex items-center gap-2"
              style={{ animationDelay: `${0.45 + i * 0.12}s` }}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  isDark
                    ? "bg-[#C9A227]/15 text-[#E0B93A]"
                    : "bg-[#C9A227]/20 text-[#8A6E1A]"
                }`}
              >
                <Icon size={14} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
