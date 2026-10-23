"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { fraunces as displayFont } from "@/app/fonts/fraunces";
import {
  Loader2,
  Utensils,
  Mail,
  Phone,
  Lock,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useBuyerAuth } from "@/providers/BuyerAuthProvider";
import { useLanguage } from "@/context/LanguageContext";

const loginText = {
  en: {
    dir: "ltr",
    badge: "Buyer account",
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
  },
  ps: {
    dir: "rtl",
    badge: "د پیرودونکي حساب",
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
  },
  prs: {
    dir: "rtl",
    badge: "حساب خریدار",
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
  },
};

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/order";
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
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  function updateField(field: keyof typeof form, value: string) {
    // Any change to email resets the verification
    if (field === "email" && value !== form.email) {
      setEmailVerified(false);
      setEmailVerificationId("");
      setOtpSent(false);
      setOtpDigits(["", "", "", "", "", ""]);
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
      setOtpDigits(["", "", "", "", "", ""]);
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
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpSubmitting(false);
    }
  }

  function setOtpDigit(i: number, val: string) {
    const clean = val.replace(/\D/g, "").slice(-1);
    setOtpDigits((d) => {
      const next = [...d];
      next[i] = clean;
      return next;
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
    const next = text.split("");
    while (next.length < 6) next.push("");
    setOtpDigits(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  }

  // ─────────── submit ───────────
  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Require email verification on signup
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

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setOtpError("");
  }

  const ArrowBack = isRTL ? ArrowRight : ArrowLeft;

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15121C]">
        <Loader2 className="h-7 w-7 animate-spin text-[#C9A227]" />
      </div>
    );
  }

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
      }`}
      dir={t.dir}
    >
      {/* Grid texture */}
      <svg
        className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300 ${
          isDark ? "opacity-[0.04]" : "opacity-[0.05]"
        }`}
        viewBox="0 0 300 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {Array.from({ length: 16 }).map((_, row) =>
          Array.from({ length: 16 }).map((_, col) => (
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

      {/* Blobs */}
      <div
        className={`pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl ${
          isDark ? "bg-[#C9A227]/10" : "bg-[#C9A227]/15"
        }`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute bottom-0 -right-32 h-96 w-96 rounded-full blur-3xl ${
          isDark ? "bg-[#C9A227]/8" : "bg-[#C9A227]/12"
        }`}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-8 sm:px-6">
        {/* Back link */}
        <Link
          href="/order"
          className={`group mb-6 inline-flex items-center gap-1.5 text-xs font-semibold transition ${
            isDark
              ? "text-[#B7B2C4] hover:text-[#E0B93A]"
              : "text-[#6E687A] hover:text-[#8A6E1A]"
          }`}
        >
          <ArrowBack
            size={13}
            className="transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
          />
          {t.continueBrowsing}
        </Link>

        {/* Card */}
        <div
          className={`overflow-hidden rounded-3xl border backdrop-blur-sm transition-colors ${
            isDark
              ? "border-[#2E2938] bg-[#1E1B26]/90"
              : "border-[#E4DFD4] bg-white/90"
          }`}
        >
          {/* Header */}
          <div className="relative p-6 sm:p-7">
            <div
              className="pointer-events-none absolute -top-16 -end-16 h-40 w-40 rounded-full bg-[#C9A227]/15 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-sm shadow-[#C9A227]/25">
                <Utensils size={20} />
              </div>
              <div className="min-w-0">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] ${
                    isDark
                      ? "border-[#C9A227]/40 bg-[#C9A227]/10 text-[#E0B93A]"
                      : "border-[#A9821E]/40 bg-[#C9A227]/15 text-[#8A6E1A]"
                  }`}
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  <Sparkles size={9} />
                  {t.badge}
                </span>
                <h1
                  className="mt-1 text-2xl font-medium leading-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {mode === "login" ? t.loginTitle : t.signupTitle}
                </h1>
              </div>
            </div>

            <p
              className={`relative mt-3 text-sm leading-relaxed ${
                isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
              }`}
            >
              {mode === "login" ? t.loginSubtitle : t.signupSubtitle}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={submit}
            className={`space-y-3 border-t p-6 sm:p-7 ${
              isDark ? "border-[#2E2938]" : "border-[#E4DFD4]"
            }`}
          >
            {mode === "signup" && (
              <Field
                icon={<UserIcon size={15} />}
                label={t.nameLabel}
                value={form.full_name}
                onChange={(v) => updateField("full_name", v)}
                placeholder={t.namePlaceholder}
                isDark={isDark}
                required
              />
            )}

            {mode === "login" ? (
              <Field
                icon={<Mail size={15} />}
                label={t.identifierLabel}
                value={form.identifier}
                onChange={(v) => updateField("identifier", v)}
                placeholder={t.identifierPlaceholder}
                isDark={isDark}
                required
              />
            ) : (
              <>
                {/* EMAIL — with inline verify button / verified badge */}
                <Field
                  icon={<Mail size={15} />}
                  label={t.emailLabel}
                  type="email"
                  value={form.email}
                  onChange={(v) => updateField("email", v)}
                  placeholder={t.emailPlaceholder}
                  isDark={isDark}
                  required
                  action={
                    emailVerified ? (
                      <span
                        className={`me-2 flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${
                          isDark
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        <Check size={11} strokeWidth={3} />
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
                        className={`me-2 shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
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

                {/* OTP PANEL — only when code was sent and not yet verified */}
                {otpSent && !emailVerified && (
                  <div
                    className={`anim-in rounded-xl border p-3 ${
                      isDark
                        ? "border-[#C9A227]/30 bg-[#15121C]"
                        : "border-[#A9821E]/30 bg-[#FAF8F4]"
                    }`}
                  >
                    <p
                      className={`flex items-center gap-1.5 text-[11px] ${
                        isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
                      }`}
                    >
                      <ShieldCheck
                        size={12}
                        className={isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"}
                      />
                      {t.codeSentTo}{" "}
                      <strong
                        className={isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"}
                      >
                        {form.email}
                      </strong>
                    </p>

                    <div
                      className="mt-2.5 flex items-center gap-1.5"
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
                          className={`h-10 w-9 rounded-lg border text-center text-sm font-semibold tabular-nums outline-none transition-colors focus:ring-2 focus:ring-[#C9A227]/25 ${
                            isDark
                              ? "border-[#332C3E] bg-[#0F0D14] text-[#F0EAE2] focus:border-[#C9A227]"
                              : "border-[#E4DFD4] bg-white text-[#1D1A22] focus:border-[#A9821E]"
                          }`}
                        />
                      ))}

                      <button
                        type="button"
                        onClick={verifyOtp}
                        disabled={
                          otpSubmitting || otpDigits.join("").length !== 6
                        }
                        className="ms-auto flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-3 py-2 text-[11px] font-bold text-[#1D1707] shadow-sm shadow-[#C9A227]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                      >
                        {otpSubmitting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} strokeWidth={3} />
                        )}
                        {t.verifyButton}
                      </button>
                    </div>

                    {otpError && (
                      <p className="mt-1.5 text-[11px] text-red-500">
                        {otpError}
                      </p>
                    )}

                    <p
                      className={`mt-2 text-[10px] ${
                        isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                      }`}
                    >
                      {t.resendPrompt}{" "}
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={sendingOtp}
                        className={`font-semibold underline-offset-2 hover:underline disabled:opacity-50 ${
                          isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]"
                        }`}
                      >
                        {sendingOtp ? t.sendingResend : t.resendAction}
                      </button>
                      .
                    </p>
                  </div>
                )}

                <Field
                  icon={<Phone size={15} />}
                  label={t.phoneLabel}
                  sublabel={t.phoneOptional}
                  value={form.phone}
                  onChange={(v) => updateField("phone", v)}
                  placeholder={t.phonePlaceholder}
                  isDark={isDark}
                  dir="ltr"
                />
              </>
            )}

            {/* Password with eye toggle */}
            <div>
              <label
                className={`mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] ${
                  isDark ? "text-[#9691A6]" : "text-[#8A8496]"
                }`}
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {t.passwordLabel}
              </label>
              <div
                className={`relative flex items-center gap-2 rounded-xl border transition-colors focus-within:ring-2 focus-within:ring-[#C9A227]/30 ${
                  isDark
                    ? "border-[#332C3E] bg-[#161320] focus-within:border-[#C9A227]"
                    : "border-[#E4DFD4] bg-[#FAF8F4] focus-within:border-[#A9821E]"
                }`}
              >
                <Lock
                  size={15}
                  className={`ms-3 shrink-0 ${
                    isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
                  }`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder={t.passwordPlaceholder}
                  required
                  className={`min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none ${
                    isDark
                      ? "text-[#F0EAE2] placeholder:text-[#5E5670]"
                      : "text-[#1D1A22] placeholder:text-[#A39D8F]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`me-2 rounded-md p-1.5 transition-colors ${
                    isDark
                      ? "text-[#6E687A] hover:bg-[#2A2534] hover:text-[#E0B93A]"
                      : "text-[#A39D8F] hover:bg-[#EDE8DE] hover:text-[#8A6E1A]"
                  }`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className={`rounded-xl border px-3 py-2 text-xs ${
                  isDark
                    ? "border-red-500/40 bg-red-500/10 text-red-300"
                    : "border-red-300 bg-red-50 text-red-700"
                }`}
              >
                {error}
              </div>
            )}

            {/* Signup hint when email not verified */}
            {mode === "signup" && !emailVerified && (
              <div
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] ${
                  isDark
                    ? "border-[#C9A227]/30 bg-[#C9A227]/5 text-[#E0B93A]"
                    : "border-[#A9821E]/30 bg-[#C9A227]/10 text-[#8A6E1A]"
                }`}
              >
                <ShieldCheck size={12} className="shrink-0" />
                {t.emailVerifyFirst}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (mode === "signup" && !emailVerified)}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 py-3 text-sm font-bold text-[#1D1707] shadow-md shadow-[#C9A227]/25 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading
                ? mode === "login"
                  ? t.loginLoading
                  : t.signupLoading
                : mode === "login"
                  ? t.loginButton
                  : t.signupButton}
            </button>

            {/* Switch mode */}
            <button
              type="button"
              onClick={switchMode}
              className={`w-full text-center text-xs font-semibold transition-colors ${
                isDark
                  ? "text-[#E0B93A] hover:text-[#F0C94A]"
                  : "text-[#8A6E1A] hover:text-[#A9821E]"
              }`}
            >
              {mode === "login" ? t.switchToSignup : t.switchToLogin}
            </button>
          </form>
        </div>

        {/* Bottom hint */}
        <div className="mt-6 flex items-center justify-center">
          <Link
            href="/order"
            className={`inline-flex items-center gap-1.5 text-xs transition ${
              isDark
                ? "text-[#6E687A] hover:text-[#E0B93A]"
                : "text-[#A39D8F] hover:text-[#8A6E1A]"
            }`}
          >
            <ShoppingBag size={12} />
            {t.continueBrowsing}
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes anim-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .anim-in {
          animation: anim-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-in {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field helper                                                        */
/* ------------------------------------------------------------------ */

function Field({
  icon,
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
}: {
  icon: React.ReactNode;
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
}) {
  return (
    <div>
      <label
        className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
          isDark ? "text-[#9691A6]" : "text-[#8A8496]"
        }`}
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {label}
        {sublabel && (
          <span
            className={`text-[9px] font-normal normal-case tracking-normal ${
              isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
            }`}
            style={{ fontFamily: "inherit" }}
          >
            · {sublabel}
          </span>
        )}
      </label>
      <div
        className={`flex items-center gap-2 rounded-xl border transition-colors focus-within:ring-2 focus-within:ring-[#C9A227]/30 ${
          isDark
            ? "border-[#332C3E] bg-[#161320] focus-within:border-[#C9A227]"
            : "border-[#E4DFD4] bg-[#FAF8F4] focus-within:border-[#A9821E]"
        }`}
      >
        <span
          className={`ms-3 shrink-0 ${
            isDark ? "text-[#6E687A]" : "text-[#A39D8F]"
          }`}
        >
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dir}
          required={required}
          className={`min-w-0 flex-1 bg-transparent py-2.5 pe-3 text-sm outline-none ${
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
