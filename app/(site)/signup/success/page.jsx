// app/signup/success/page.js
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import LoadingScreen from "@/components/LoadingScreen";

import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  LogIn,
  ShieldAlert,
  Mail,
  KeyRound,
  RefreshCw,
} from "lucide-react";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Extract the payment payload.
 *
 * Current flow (HesabPay redirect):
 *   /signup/success?ref=<uuid>&data=<url-encoded-json>
 *   → data is a SEPARATE query param.
 *
 * Legacy flow (older provider):
 *   /signup/success?ref=<uuid>?data=<url-encoded-json>
 *   → data was embedded inside ref.
 *
 * We try the current form first, then fall back to the legacy form.
 */
function parseHesabData(rawRef, rawData) {
  if (rawData) {
    try {
      const parsed = JSON.parse(rawData);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      /* fall through */
    }
  }
  if (rawRef && rawRef.indexOf("?data=") !== -1) {
    try {
      const idx = rawRef.indexOf("?data=");
      return JSON.parse(decodeURIComponent(rawRef.slice(idx + 6)));
    } catch {
      /* fall through */
    }
  }
  return {};
}

const successText = {
  en: {
    loading: "Loading…",
    checkingTitle: "Payment received",
    checkingBody: "Setting up your workspace — one moment…",
    waitingTitle: "Still confirming…",
    waitingBody:
      "The payment is taking longer than usual. We'll email you the moment your account is ready.",
    errorTitle: "Something went wrong",
    errorMissingRef: "Missing reference.",
    errorConfirm: "Couldn't confirm payment. Please contact support.",
    errorConfirmShort: "Couldn't confirm payment.",
    errorExpired:
      "This signup has expired because the payment window closed. No hotel was created. Please start a new signup.",
    warningTitle: "Don't close this screen yet",
    warningBody:
      "Your login details will appear here in a moment. Keep this page open so you can copy them.",
    warningBodyWhenReady:
      "Copy the details below before leaving this page — the password is shown only once.",
    readyTitle: "{hotelName} is ready 🎉",
    readySubtitle: "Copy your login details — the password is shown only once.",
    readySubtitleNoPassword:
      "Your account is already set up. Use the email below with the password from your welcome email.",
    labelEmail: "Login email",
    labelPassword: "Temporary password",
    copyEmail: "Copy email",
    copyPassword: "Copy password",
    copyBoth: "Copy both",
    copied: "Copied!",
    changeLater: "You can change this password after logging in.",
    forgotHint: "Forgot your password, or want to change it?",
    forgotLink: "Reset it here",
    goToLogin: "Go to login",
    backToHome: "Back to home",
  },

  ps: {
    loading: "بارول…",
    checkingTitle: "تادیه ترلاسه شوه",
    checkingBody: "ستاسو کاري ځای چمتو کوو — یوه شیبه…",
    waitingTitle: "لا هم تصدیق کوو…",
    waitingBody:
      "تادیه له معمول څخه ډېره وخت نیسي. کله چې ستاسو حساب چمتو شي، موږ به بریښنالیک درولېږو.",
    errorTitle: "یو څه غلط شول",
    errorMissingRef: "حواله نشته.",
    errorConfirm: "تادیه تصدیق نشوه. مهرباني وکړئ د ملاتړ سره اړیکه ونیسئ.",
    errorConfirmShort: "تادیه تصدیق نشوه.",
    errorExpired:
      "دا نوم لیکنه له مودې ووتلې ځکه چې د تادیې وخت پای ته رسیدلی. هیڅ هوټل نه دی جوړ شوی. مهرباني وکړئ نوی نوم لیکنه پیل کړئ.",
    warningTitle: "دا پرده لا تر اوسه مه بندوئ",
    warningBody:
      "ستاسو د ننوتلو توضیحات به دلته ژر ښکاره شي. دا پاڼه پرانیستې وساتئ ترڅو یې کاپي کړئ.",
    warningBodyWhenReady:
      "له دې پاڼې وتلو دمخه لاندې توضیحات کاپي کړئ — پټنوم یوازې یو ځل ښودل کیږي.",
    readyTitle: "{hotelName} چمتو دی 🎉",
    readySubtitle: "د ننوتلو توضیحات کاپي کړئ — پټنوم یوازې یو ځل ښودل کیږي.",
    readySubtitleNoPassword:
      "ستاسو حساب لا دمخه چمتو دی. لاندې بریښنالیک د خپل ښه راغلاست بریښنالیک پټنوم سره وکاروئ.",
    labelEmail: "د ننوتلو بریښنالیک",
    labelPassword: "لنډمهاله پټنوم",
    copyEmail: "بریښنالیک کاپي کړئ",
    copyPassword: "پټنوم کاپي کړئ",
    copyBoth: "دواړه کاپي کړئ",
    copied: "کاپي شو!",
    changeLater: "تاسو کولی شئ دا پټنوم د ننوتلو وروسته بدل کړئ.",
    forgotHint: "پټنوم مو هیر شو، یا یې بدلول غواړئ؟",
    forgotLink: "دلته یې بیا تنظیم کړئ",
    goToLogin: "ننوتلو ته لاړ شئ",
    backToHome: "کور ته بیرته",
  },

  prs: {
    loading: "در حال بارگذاری…",
    checkingTitle: "پرداخت دریافت شد",
    checkingBody: "در حال آماده‌سازی فضای کاری شما — یک لحظه…",
    waitingTitle: "هنوز در حال تأیید…",
    waitingBody:
      "پرداخت بیشتر از حد معمول طول می‌کشد. به محض آماده شدن حساب شما، ایمیل می‌فرستیم.",
    errorTitle: "مشکلی پیش آمد",
    errorMissingRef: "مرجع موجود نیست.",
    errorConfirm: "تأیید پرداخت ممکن نشد. لطفاً با پشتیبانی تماس بگیرید.",
    errorConfirmShort: "تأیید پرداخت ممکن نشد.",
    errorExpired:
      "این ثبت‌نام منقضی شده است زیرا پنجره پرداخت بسته شد. هیچ هتلی ساخته نشد. لطفاً ثبت‌نام جدیدی شروع کنید.",
    warningTitle: "این صفحه را هنوز نبندید",
    warningBody:
      "اطلاعات ورود شما به‌زودی اینجا نمایش داده می‌شود. این صفحه را باز نگه دارید تا بتوانید آن‌ها را کپی کنید.",
    warningBodyWhenReady:
      "قبل از ترک این صفحه، اطلاعات زیر را کپی کنید — رمز عبور فقط یک بار نمایش داده می‌شود.",
    readyTitle: "{hotelName} آماده است 🎉",
    readySubtitle:
      "اطلاعات ورود خود را کپی کنید — رمز عبور فقط یک بار نمایش داده می‌شود.",
    readySubtitleNoPassword:
      "حساب شما قبلاً آماده شده است. از ایمیل زیر با رمز عبور ایمیل خوش‌آمدگویی استفاده کنید.",
    labelEmail: "ایمیل ورود",
    labelPassword: "رمز عبور موقت",
    copyEmail: "کپی ایمیل",
    copyPassword: "کپی رمز عبور",
    copyBoth: "کپی هر دو",
    copied: "کپی شد!",
    changeLater: "می‌توانید این رمز عبور را بعد از ورود تغییر دهید.",
    forgotHint:
      "رمز عبور خود را فراموش کرده‌اید یا می‌خواهید آن را تغییر دهید؟",
    forgotLink: "اینجا آن را بازنشانی کنید",
    goToLogin: "رفتن به ورود",
    backToHome: "بازگشت به خانه",
  },
};

/* ─────────────────────────────────────────────────────────────────
   Inner component — uses useSearchParams, MUST be inside <Suspense>.
   ───────────────────────────────────────────────────────────────── */

function SignupSuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useLanguage();

  const [mounted, setMounted] = useState(false);

  const rawRef = searchParams.get("ref") || "";
  const refMatch = rawRef.match(UUID_RE);
  const ref = refMatch ? refMatch[0] : "";

  // `data` is its own query param in the current flow.
  const rawData = searchParams.get("data") || "";
  const hesabData = parseHesabData(rawRef, rawData);
  const transaction_id = hesabData.transaction_id;

  const [state, setState] = useState("checking"); // checking | waiting | ready | error
  const [message, setMessage] = useState("");
  const [creds, setCreds] = useState(null);
  const [copied, setCopied] = useState("");

  const lang = successText[language] ? language : "en";
  const t = successText[lang];
  const isRTL = lang === "ps" || lang === "prs";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  }, [lang, mounted, isRTL]);

  useEffect(() => {
    if (!mounted) return;
    if (!ref) {
      setState("error");
      setMessage(t.errorMissingRef);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const MAX = 15; // 30 s total (15 × 2 s)
    let firedConfirm = false;

    async function poll() {
      attempts++;
      try {
        const res = await fetch(`/api/signup/status?ref=${ref}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setState("error");
          setMessage(data.error || t.errorConfirmShort);
          return;
        }

        if (data.status === "expired" || data.status === "failed") {
          setState("error");
          setMessage(t.errorExpired);
          return;
        }

        if (data.status === "paid") {
          setCreds({
            email: data.email,
            password: data.reveal_password || null,
            hotel_name: data.hotel_name,
          });
          setState("ready");
          return;
        }

        if (!firedConfirm) {
          firedConfirm = true;
          try {
            await fetch("/api/signup/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ref,
                success: true,
                transaction_id: transaction_id || null,
              }),
            });
          } catch {
            firedConfirm = false;
          }
        }

        if (attempts < MAX) {
          setTimeout(poll, 2000);
        } else {
          setState("waiting");
        }
      } catch {
        if (!cancelled) {
          setState("error");
          setMessage(t.errorConfirm);
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, mounted]);

  async function copy(label, value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  if (!mounted) {
    return <LoadingScreen text={successText.en.loading} fullScreen />;
  }

  const showWarning =
    state === "checking" ||
    state === "waiting" ||
    (state === "ready" && creds?.password);

  const warningText =
    state === "ready" && creds?.password
      ? t.warningBodyWhenReady
      : t.warningBody;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#15121C] text-[#F0EAE2]">
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
          {/* ---------- ERROR ---------- */}
          {state === "error" && (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E5484D]/10">
                <AlertCircle size={28} className="text-[#E5484D]" />
              </span>
              <h1
                className="mt-4 text-2xl font-medium text-[#F0EAE2]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t.errorTitle}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#B7B2C4]">
                {message}
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-lg bg-gradient-to-r from-[#C9A227] to-[#A9821E] px-5 py-2.5 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/30"
              >
                {t.backToHome}
              </Link>
            </div>
          )}

          {/* ---------- WAITING ---------- */}
          {state === "waiting" && (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#C9A227]/10">
                <Loader2 size={26} className="animate-spin text-[#C9A227]" />
              </span>
              <h1
                className="mt-4 text-2xl font-medium text-[#F0EAE2]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t.waitingTitle}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#B7B2C4]">
                {t.waitingBody}
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-lg border border-[#332C3E] px-5 py-2.5 text-sm font-semibold text-[#F0EAE2] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A227] hover:text-[#C9A227]"
              >
                {t.backToHome}
              </Link>
            </div>
          )}

          {/* ---------- CHECKING ---------- */}
          {state === "checking" && (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </span>
              <h1
                className="mt-4 text-2xl font-medium text-[#F0EAE2]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t.checkingTitle}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#B7B2C4]">
                {t.checkingBody}
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C9A227]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C9A227]/60 [animation-delay:200ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C9A227]/30 [animation-delay:400ms]" />
              </div>
            </div>
          )}

          {/* ---------- READY ---------- */}
          {state === "ready" && creds && (
            <div>
              <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 size={28} className="text-emerald-500" />
                </span>
                <h1
                  className="mt-4 text-2xl font-medium text-[#F0EAE2]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {t.readyTitle.replace("{hotelName}", creds.hotel_name || "")}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-[#B7B2C4]">
                  {creds.password ? t.readySubtitle : t.readySubtitleNoPassword}
                </p>
              </div>

              {creds.password && (
                <div className="mt-5 space-y-3">
                  {/* Email */}
                  <div className="rounded-xl border border-[#2E2938] bg-[#161320] p-3.5">
                    <div
                      className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6E687A]"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      <Mail size={11} className="text-[#C9A227]" />
                      {t.labelEmail}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <code className="truncate text-sm text-[#F0EAE2]">
                        {creds.email}
                      </code>
                      <button
                        type="button"
                        onClick={() => copy("email", creds.email)}
                        aria-label={t.copyEmail}
                        className="shrink-0 rounded-md p-1.5 text-[#6E687A] transition-colors hover:bg-[#C9A227]/10 hover:text-[#C9A227]"
                      >
                        {copied === "email" ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="rounded-xl border border-[#C9A227]/40 bg-[#C9A227]/5 p-3.5">
                    <div
                      className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A227]"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      <KeyRound size={11} />
                      {t.labelPassword}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <code className="truncate text-base font-semibold tracking-wider text-[#F0EAE2]">
                        {creds.password}
                      </code>
                      <button
                        type="button"
                        onClick={() => copy("password", creds.password)}
                        aria-label={t.copyPassword}
                        className="shrink-0 rounded-md p-1.5 text-[#C9A227] transition-colors hover:bg-[#C9A227]/15"
                      >
                        {copied === "password" ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Copy both */}
                  <button
                    type="button"
                    onClick={() =>
                      copy("both", `${creds.email} / ${creds.password}`)
                    }
                    className="w-full rounded-lg border border-[#332C3E] px-4 py-2 text-xs font-medium text-[#B7B2C4] transition-colors hover:border-[#C9A227]/50 hover:bg-[#C9A227]/5 hover:text-[#C9A227]"
                  >
                    {copied === "both" ? t.copied : t.copyBoth}
                  </button>

                  <p className="text-center text-xs text-[#6E687A]">
                    {t.changeLater}
                  </p>
                </div>
              )}

              {/* Forgot / change password hint */}
              <div className="mt-5 flex flex-col items-center gap-1 rounded-xl border border-[#2E2938] bg-[#161320]/60 px-3.5 py-3 text-center">
                <p className="text-xs text-[#B7B2C4]">{t.forgotHint}</p>
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C9A227] underline-offset-2 transition-colors hover:text-[#E0B93A] hover:underline"
                >
                  <RefreshCw size={11} />
                  {t.forgotLink}
                </Link>
              </div>

              <button
                type="button"
                onClick={() => router.push("/hotel/login")}
                className="group mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A227] to-[#A9821E] px-4 py-3 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/30 active:translate-y-0 active:scale-[0.98]"
              >
                <LogIn size={15} />
                {t.goToLogin}
              </button>
            </div>
          )}

          {/* ---------- PERSISTENT WARNING ---------- */}
          {showWarning && (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/5 px-3.5 py-3">
              <ShieldAlert
                size={16}
                className="mt-0.5 shrink-0 text-[#C9A227]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#E0B93A]">
                  {t.warningTitle}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#B7B2C4]">
                  {warningText}
                </p>
              </div>
            </div>
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

/* ─────────────────────────────────────────────────────────────────
   Default export wraps the inner component in <Suspense> so that
   useSearchParams() works under Next.js 15.
   ───────────────────────────────────────────────────────────────── */

export default function SignupSuccessPage() {
  return (
    <Suspense
      fallback={<LoadingScreen text={successText.en.loading} fullScreen />}
    >
      <SignupSuccessInner />
    </Suspense>
  );
}
