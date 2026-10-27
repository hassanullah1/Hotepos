"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { fraunces as displayFont } from "@/app/fonts/fraunces";
import {
  Loader2,
  Utensils,
  UtensilsCrossed,
  Soup,
  Pizza,
  Cookie,
  Coffee,
  ChefHat,
  Sparkles,
  Star,
  Mail,
  Phone,
  Lock,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
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
    forgotPassword: "Forgot password?",
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
    forgotPassword: "پټنوم مو هیر شو؟",
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
    forgotPassword: "رمز عبور را فراموش کرده‌اید؟",
  },
};

/* ------------------------------------------------------------------ */
/* Background decoration data                                          */
/* ------------------------------------------------------------------ */

// Floating food / utensil icons: position (%), size, drift duration, delay
const floaters = [
  { Icon: UtensilsCrossed, top: "8%", left: "7%", size: 30, dur: 7, delay: 0 },
  { Icon: Pizza, top: "16%", left: "86%", size: 34, dur: 9, delay: 1.2 },
  { Icon: Soup, top: "38%", left: "4%", size: 28, dur: 8, delay: 0.6 },
  { Icon: Cookie, top: "52%", left: "90%", size: 26, dur: 6.5, delay: 2 },
  { Icon: Coffee, top: "74%", left: "9%", size: 30, dur: 8.5, delay: 1.5 },
  { Icon: ChefHat, top: "86%", left: "80%", size: 32, dur: 7.5, delay: 0.3 },
  { Icon: Utensils, top: "92%", left: "44%", size: 24, dur: 9, delay: 2.4 },
];

// Twinkling stars / sparkles
const twinkles = [
  { top: "5%", left: "30%", size: 12, delay: 0 },
  { top: "11%", left: "68%", size: 16, delay: 0.8 },
  { top: "27%", left: "15%", size: 10, delay: 1.6 },
  { top: "31%", left: "92%", size: 12, delay: 0.4 },
  { top: "46%", left: "22%", size: 9, delay: 2.2 },
  { top: "60%", left: "78%", size: 14, delay: 1.1 },
  { top: "68%", left: "30%", size: 10, delay: 1.9 },
  { top: "80%", left: "62%", size: 12, delay: 0.2 },
  { top: "95%", left: "18%", size: 14, delay: 1.4 },
  { top: "22%", left: "50%", size: 8, delay: 2.6 },
];

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

  const ArrowBack = isRTL ? ArrowRight : ArrowLeft;

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15121C]">
        <Loader2 className="h-7 w-7 animate-spin text-[#C9A227]" />
      </div>
    );
  }

  const muted = isDark ? "text-[#B7B2C4]" : "text-[#6E687A]";
  const gold = isDark ? "text-[#E0B93A]" : "text-[#8A6E1A]";
  const decoColor = isDark ? "text-[#E0B93A]" : "text-[#A9821E]";

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen w-full overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#15121C] text-[#F0EAE2]" : "bg-[#F7F4EE] text-[#1D1A22]"
      }`}
      dir={t.dir}
    >
      {/* ─────────── Animated background ─────────── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Grid texture (slowly drifting) */}
        <svg
          className={`lf-grid absolute inset-0 h-full w-full ${
            isDark ? "opacity-[0.05]" : "opacity-[0.06]"
          }`}
          viewBox="0 0 300 300"
          preserveAspectRatio="xMidYMid slice"
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

        {/* Big top circle with ripple rings */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div
            className={`lf-glow h-[460px] w-[460px] rounded-full blur-3xl ${
              isDark ? "bg-[#C9A227]/20" : "bg-[#C9A227]/25"
            }`}
          />
          <div className="lf-ring absolute inset-0 m-auto h-[300px] w-[300px] rounded-full border border-[#C9A227]/30" />
          <div
            className="lf-ring absolute inset-0 m-auto h-[300px] w-[300px] rounded-full border border-[#C9A227]/20"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="lf-ring absolute inset-0 m-auto h-[300px] w-[300px] rounded-full border border-[#C9A227]/10"
            style={{ animationDelay: "4s" }}
          />
        </div>

        {/* Corner blobs */}
        <div
          className={`lf-glow absolute -start-32 top-1/3 h-96 w-96 rounded-full blur-3xl ${
            isDark ? "bg-[#C9A227]/10" : "bg-[#C9A227]/15"
          }`}
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className={`lf-glow absolute -end-32 bottom-0 h-96 w-96 rounded-full blur-3xl ${
            isDark ? "bg-[#C9A227]/10" : "bg-[#C9A227]/12"
          }`}
          style={{ animationDelay: "3s" }}
        />

        {/* Floating food icons */}
        {floaters.map(({ Icon, top, left, size, dur, delay }, i) => (
          <span
            key={i}
            className={`lf-float absolute ${decoColor} ${
              isDark ? "opacity-[0.18]" : "opacity-[0.22]"
            }`}
            style={{
              top,
              left,
              animationDuration: `${dur}s`,
              animationDelay: `${delay}s`,
            }}
          >
            <Icon size={size} strokeWidth={1.5} />
          </span>
        ))}

        {/* Twinkling stars */}
        {twinkles.map((s, i) => (
          <span
            key={i}
            className={`lf-twinkle absolute ${decoColor}`}
            style={{ top: s.top, left: s.left, animationDelay: `${s.delay}s` }}
          >
            {i % 2 === 0 ? (
              <Sparkles size={s.size} />
            ) : (
              <Star size={s.size} fill="currentColor" />
            )}
          </span>
        ))}
      </div>

      {/* ─────────── Content ─────────── */}
      <main className="relative mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-4 py-8">
        {/* Logo + heading */}
        <header className="lf-rise mb-6 text-center">
          <div className="relative mx-auto h-[72px] w-[72px]">
            {/* spinning dashed ring */}
            <span className="lf-spin absolute -inset-2 rounded-full border-2 border-dashed border-[#C9A227]/50" />
            <div className="lf-bob relative flex h-full w-full items-center justify-center rounded-[24px] bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-lg shadow-[#C9A227]/40">
              <Utensils size={28} />
              <Sparkles
                size={14}
                className="lf-twinkle absolute -end-2 -top-2 text-[#E0B93A]"
              />
            </div>
          </div>
          <p className={`mt-5 text-sm font-medium ${gold}`}>{t.badge}</p>
          <h1
            className="mt-1 text-[28px] font-medium leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {mode === "login" ? t.loginTitle : t.signupTitle}
          </h1>
          <p
            className={`mx-auto mt-2 max-w-[320px] text-sm leading-relaxed ${muted}`}
          >
            {mode === "login" ? t.loginSubtitle : t.signupSubtitle}
          </p>
        </header>

        {/* Card */}
        <div
          className={`lf-rise rounded-3xl border p-5 backdrop-blur-md sm:p-6 ${
            isDark
              ? "border-[#2E2938] bg-[#1E1B26]/90 shadow-2xl shadow-black/30"
              : "border-[#E4DFD4] bg-white/90 shadow-xl shadow-[#C9A227]/10"
          }`}
          style={{ animationDelay: "0.12s" }}
        >
          {/* Mode switch */}
          <div
            role="tablist"
            className={`mb-5 grid grid-cols-2 rounded-2xl p-1 ${
              isDark ? "bg-[#15121C]" : "bg-[#F3EFE6]"
            }`}
          >
            {(["login", "signup"] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeMode(m)}
                  className={`min-h-[44px] rounded-xl px-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/50 ${
                    active
                      ? "bg-gradient-to-r from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-md shadow-[#C9A227]/25"
                      : muted
                  }`}
                >
                  {m === "login" ? t.loginButton : t.signupButton}
                </button>
              );
            })}
          </div>

          {/* key={mode} re-plays the soft entrance when switching tabs */}
          <form key={mode} onSubmit={submit} className="lf-swap space-y-4">
            {mode === "signup" && (
              <Field
                icon={<UserIcon size={18} />}
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
                icon={<Mail size={18} />}
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
                  icon={<Mail size={18} />}
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
                        className={`lf-pop me-2 flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                          isDark
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        <Check size={13} strokeWidth={3} />
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

                {/* OTP panel — 6 equal columns, button on its own row (no overflow on mobile) */}
                {otpSent && !emailVerified && (
                  <div
                    className={`lf-pop w-full min-w-0 rounded-2xl border p-4 ${
                      isDark
                        ? "border-[#C9A227]/25 bg-[#15121C]"
                        : "border-[#A9821E]/25 bg-[#F7F4EE]"
                    }`}
                  >
                    <p className={`text-sm leading-relaxed ${muted}`}>
                      {t.codeSentTo}{" "}
                      <strong className={`break-all font-semibold ${gold}`}>
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
                          className={`h-12 w-full min-w-0 rounded-xl border text-center text-lg font-semibold tabular-nums outline-none transition-all focus:-translate-y-0.5 focus:ring-2 focus:ring-[#C9A227]/30 ${
                            isDark
                              ? "border-[#332C3E] bg-[#1E1B26] text-[#F0EAE2] focus:border-[#C9A227]"
                              : "border-[#E4DFD4] bg-white text-[#1D1A22] focus:border-[#A9821E]"
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
                      className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 text-sm font-semibold text-[#1D1707] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
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
                        className={`font-semibold underline-offset-2 hover:underline disabled:opacity-50 ${gold}`}
                      >
                        {sendingOtp ? t.sendingResend : t.resendAction}
                      </button>
                    </p>
                  </div>
                )}

                <Field
                  icon={<Phone size={18} />}
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
                  className={`text-sm font-medium ${
                    isDark ? "text-[#D8D3E2]" : "text-[#3A3542]"
                  }`}
                >
                  {t.passwordLabel}
                </label>
                {mode === "login" && (
                  <Link
                    href="/forgot-password"
                    className={`text-sm font-medium hover:underline ${gold}`}
                  >
                    {t.forgotPassword}
                  </Link>
                )}
              </div>
              <div
                className={`flex items-center gap-2 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-[#C9A227]/30 ${
                  isDark
                    ? "border-[#332C3E] bg-[#161320] focus-within:border-[#C9A227]"
                    : "border-[#E4DFD4] bg-[#FAF8F4] focus-within:border-[#A9821E]"
                }`}
              >
                <Lock
                  size={18}
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
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  className={`min-h-[48px] min-w-0 flex-1 bg-transparent text-base outline-none ${
                    isDark
                      ? "text-[#F0EAE2] placeholder:text-[#5E5670]"
                      : "text-[#1D1A22] placeholder:text-[#A39D8F]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`me-1.5 flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    isDark
                      ? "text-[#8A8496] hover:bg-[#2A2534] hover:text-[#E0B93A]"
                      : "text-[#8A8496] hover:bg-[#EDE8DE] hover:text-[#8A6E1A]"
                  }`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* One message area: error first, otherwise the verify hint */}
            {error ? (
              <div
                role="alert"
                className={`lf-shake flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${
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
                <p className={`text-xs leading-relaxed ${muted}`}>
                  {t.emailVerifyFirst}
                </p>
              )
            )}

            {/* Primary action */}
            <button
              type="submit"
              disabled={loading || (mode === "signup" && !emailVerified)}
              className="group relative inline-flex min-h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 text-base font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {/* shine sweep */}
              <span className="lf-shine pointer-events-none absolute inset-y-0 -start-1/3 w-1/3 skew-x-[-20deg] bg-white/30" />
              {loading && <Loader2 className="relative h-5 w-5 animate-spin" />}
              <span className="relative">
                {loading
                  ? mode === "login"
                    ? t.loginLoading
                    : t.signupLoading
                  : mode === "login"
                    ? t.loginButton
                    : t.signupButton}
              </span>
            </button>
          </form>
        </div>

        {/* Secondary actions */}
        <div
          className="lf-rise mt-5 flex flex-col items-center gap-3 text-sm"
          style={{ animationDelay: "0.24s" }}
        >
          <button
            type="button"
            onClick={() => changeMode(mode === "login" ? "signup" : "login")}
            className={`min-h-[44px] px-3 font-semibold hover:underline ${gold}`}
          >
            {mode === "login" ? t.switchToSignup : t.switchToLogin}
          </button>

          <Link
            href="/"
            className={`group inline-flex min-h-[44px] items-center gap-1.5 px-3 transition-colors ${muted} hover:text-[#E0B93A]`}
          >
            <ArrowBack
              size={15}
              className="transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
            />
            {t.continueBrowsing}
          </Link>
        </div>
      </main>

      <style jsx global>{`
        /* entrance */
        @keyframes lf-rise {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .lf-rise {
          animation: lf-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes lf-swap {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .lf-swap {
          animation: lf-swap 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes lf-pop {
          0% {
            opacity: 0;
            transform: scale(0.94);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .lf-pop {
          animation: lf-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes lf-shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
        .lf-shake {
          animation: lf-shake 0.35s ease-in-out;
        }

        /* background */
        @keyframes lf-float {
          0%,
          100% {
            transform: translateY(0) rotate(-6deg);
          }
          50% {
            transform: translateY(-18px) rotate(8deg);
          }
        }
        .lf-float {
          animation: lf-float 8s ease-in-out infinite;
        }

        @keyframes lf-twinkle {
          0%,
          100% {
            opacity: 0.1;
            transform: scale(0.7);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.15);
          }
        }
        .lf-twinkle {
          animation: lf-twinkle 3.2s ease-in-out infinite;
        }

        @keyframes lf-glow {
          0%,
          100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }
        .lf-glow {
          animation: lf-glow 7s ease-in-out infinite;
        }

        @keyframes lf-ring {
          0% {
            opacity: 0.9;
            transform: scale(0.6);
          }
          100% {
            opacity: 0;
            transform: scale(1.9);
          }
        }
        .lf-ring {
          animation: lf-ring 6s ease-out infinite;
        }

        @keyframes lf-grid {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-14px);
          }
        }
        .lf-grid {
          animation: lf-grid 12s ease-in-out infinite alternate;
        }

        /* logo */
        @keyframes lf-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .lf-spin {
          animation: lf-spin 18s linear infinite;
        }

        @keyframes lf-bob {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-4px) rotate(-3deg);
          }
        }
        .lf-bob {
          animation: lf-bob 4s ease-in-out infinite;
        }

        /* button shine */
        @keyframes lf-shine {
          0%,
          60% {
            transform: translateX(-120%) skewX(-20deg);
          }
          100% {
            transform: translateX(520%) skewX(-20deg);
          }
        }
        .lf-shine {
          animation: lf-shine 4.5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .lf-rise,
          .lf-swap,
          .lf-pop,
          .lf-shake,
          .lf-float,
          .lf-twinkle,
          .lf-glow,
          .lf-ring,
          .lf-grid,
          .lf-spin,
          .lf-bob,
          .lf-shine {
            animation: none !important;
          }
          .lf-twinkle {
            opacity: 0.4;
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
  autoComplete,
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
        className={`flex items-center gap-2 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-[#C9A227]/30 ${
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
          autoComplete={autoComplete}
          className={`min-h-[48px] min-w-0 flex-1 bg-transparent pe-3 text-base outline-none ${
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
