"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MessageCircle,
  ShieldCheck,
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  Check,
  BadgeCheck,
  MonitorSmartphone,
  ArrowLeft,
} from "lucide-react";
import { Fraunces } from "next/font/google";
import { useTranslation } from "@/hooks/useTranslation";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

const FIELD_ICONS = {
  hotel_name: Building2,
  owner_name: User,
  email: Mail,
  phone: Phone,
};

const isNil = (v) => v === null || v === undefined;

/* ---------- payment method icons ---------- */

function HesabPayIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 32 20" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="19" rx="3.5" fill="#0B3B6F" />
      <path
        d="M6 6h2v3h3V6h2v8h-2v-3H8v3H6V6Zm10 0h5a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-3v-2h2.5a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5H18v6h-2V6Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function AfPayIcon({ className = "" }) {
  return (
    <img src="/afpay.png" alt="AfPay" className={className} loading="lazy" />
  );
}

function VisaIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 32 20" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="19" rx="3.5" fill="#1A1F71" />
      <text
        x="16"
        y="14"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontWeight="700"
        fontStyle="italic"
        fontSize="9"
        fill="#FFFFFF"
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 32 20" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="19" rx="3.5" fill="#1A1A1A" />
      <circle cx="13" cy="10" r="4.5" fill="#EB001B" />
      <circle cx="19" cy="10" r="4.5" fill="#F79E1B" fillOpacity="0.9" />
      <path
        d="M16 6.7a4.5 4.5 0 0 0 0 6.6 4.5 4.5 0 0 0 0-6.6Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

/* ---------- progress ring ---------- */

function ProgressRing({ pct, done, total }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const complete = done === total;
  return (
    <div className="relative h-10 w-10 shrink-0">
      <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#2A2534"
          strokeWidth="3"
        />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#C9A227"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums text-[#F0EAE2]">
        {complete ? (
          <Check
            size={16}
            strokeWidth={3}
            className="anim-pop text-[#E0B93A]"
          />
        ) : (
          `${done}/${total}`
        )}
      </div>
    </div>
  );
}

/* ---------- plan "ticket" ---------- */

function PlanTicket({ plan, loading, error, t, onChange }) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-[#2E2938] bg-[#1B1823] p-6">
        <div className="h-3 w-20 rounded bg-[#2A2534]" />
        <div className="mt-4 h-12 w-36 rounded bg-[#2A2534]" />
        <div className="mt-8 h-3 w-full rounded bg-[#2A2534]" />
        <div className="mt-3 h-3 w-2/3 rounded bg-[#2A2534]" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-[#E5484D]/50 bg-[#E5484D]/10 p-5 text-sm text-[#FF9B9E]">
        <p>{error}</p>
        <button
          type="button"
          onClick={onChange}
          className="mt-3 inline-flex items-center gap-1.5 font-semibold text-[#F0EAE2] underline-offset-2 hover:underline"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" />
          {t.signupChangePlan}
        </button>
      </div>
    );
  }
  if (!plan) return null;

  const hasPrice = !isNil(plan.price_monthly);
  const features = Array.isArray(plan.features)
    ? plan.features.slice(0, 3)
    : [];

  const branchLabel = isNil(plan.max_branches)
    ? t.pricingBranchesUnlimited
    : plan.max_branches === 1
      ? t.pricingBranchesSingular
      : t.pricingBranchesPlural?.replace("{count}", plan.max_branches);
  const posLabel = isNil(plan.max_pos_devices)
    ? t.pricingPosUnlimited
    : plan.max_pos_devices === 1
      ? t.pricingPosSingular
      : t.pricingPosPlural?.replace("{count}", plan.max_pos_devices);

  return (
    <div className="relative rounded-2xl border border-[#2E2938] bg-[#1B1823] shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_85%_0%,rgba(201,162,39,0.16),transparent_55%)]" />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[#9691A6]">{t.signupPlanLabel}</p>
            <h2
              className="mt-1 text-lg font-semibold text-[#F0EAE2]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {plan.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onChange}
            className="rounded-full border border-[#3A3347] px-3 py-1 text-xs text-[#B7B2C4] transition-colors hover:border-[#C9A227] hover:text-[#E0B93A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/60"
          >
            {t.signupChangePlan}
          </button>
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          {hasPrice ? (
            <>
              <span className="text-xl font-semibold text-[#C9A227]">$</span>
              <span
                className="text-4xl font-bold tabular-nums tracking-tight text-[#F0EAE2]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {Number(plan.price_monthly).toLocaleString()}
              </span>
              <span className="text-sm text-[#6E687A]">
                {t.signupPriceSuffix}
              </span>
            </>
          ) : (
            <span
              className="text-3xl font-semibold text-[#F0EAE2]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.signupCustomPricing}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex items-center">
        <span className="absolute -start-3 h-6 w-6 rounded-full border border-[#2E2938] bg-[#15121C]" />
        <span className="absolute -end-3 h-6 w-6 rounded-full border border-[#2E2938] bg-[#15121C]" />
        <div className="mx-6 w-full border-t border-dashed border-[#3A3347]" />
      </div>

      <div className="relative space-y-2 p-5 text-[13px] text-[#CFCADB]">
        <div className="flex items-center gap-2.5">
          <Building2 size={14} className="text-[#C9A227]" />
          {branchLabel}
        </div>
        <div className="flex items-center gap-2.5">
          <MonitorSmartphone size={14} className="text-[#C9A227]" />
          {posLabel}
        </div>
        {features.map((f, i) => (
          <div
            key={`${f}-${i}`}
            className="flex items-start gap-2.5 text-[#9691A6]"
          >
            <Check
              size={14}
              strokeWidth={2.5}
              className="mt-0.5 shrink-0 text-[#C9A227]"
            />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function SignupPage() {
  const t = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("plan");

  const tRef = useRef(t);
  tRef.current = t;

  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState("");

  const [form, setForm] = useState({
    hotel_name: "",
    owner_name: "",
    email: "",
    phone: "",
  });
  const [focusedField, setFocusedField] = useState("");
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [formError, setFormError] = useState("");
  const [errorKey, setErrorKey] = useState(0);

  // ---- email verification state ----
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationId, setEmailVerificationId] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (!planId) {
      setPlanError(tRef.current.signupErrorNoPlan || "No plan selected.");
      setPlanLoading(false);
      return undefined;
    }
    let cancelled = false;
    async function loadPlan() {
      setPlanLoading(true);
      try {
        const res = await fetch("/api/public/subscription-plans");
        if (!res.ok)
          throw new Error(
            tRef.current.signupErrorLoadPlan || "Couldn't load plan",
          );
        const data = await res.json();
        const match = (data.plans || []).find((p) => p.id === planId);
        if (!cancelled) {
          if (!match)
            setPlanError(
              tRef.current.signupErrorPlanNotFound ||
                "This plan isn't available anymore.",
            );
          else setPlan(match);
        }
      } catch (err) {
        if (!cancelled)
          setPlanError(
            err.message ||
              tRef.current.signupErrorLoadPlan ||
              "Couldn't load plan details",
          );
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    }
    loadPlan();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  // Changing email invalidates any prior verification
  function updateField(field, value) {
    if (field === "email" && value !== form.email) {
      setEmailVerified(false);
      setEmailVerificationId("");
      setOtpSent(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
    }
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    if (!form.hotel_name.trim()) return t.signupErrorHotelName;
    if (!form.owner_name.trim()) return t.signupErrorOwnerName;
    if (!form.email.trim() || !form.email.includes("@"))
      return t.signupErrorEmail;
    return "";
  }

  function showError(msg) {
    setFormError(msg);
    setErrorKey((k) => k + 1);
  }

  const fieldValidity = useMemo(
    () => ({
      hotel_name: form.hotel_name.trim().length > 0,
      owner_name: form.owner_name.trim().length > 0,
      email: form.email.trim().length > 0 && form.email.includes("@"),
      phone: true,
    }),
    [form],
  );
  const requiredFields = ["hotel_name", "owner_name", "email"];
  const completedCount = requiredFields.filter((f) => fieldValidity[f]).length;
  const progressPct = Math.round(
    (completedCount / requiredFields.length) * 100,
  );

  // ---- OTP send ----
  async function sendOtp() {
    if (!form.email.trim() || !form.email.includes("@")) {
      showError(t.signupErrorEmail);
      return;
    }
    setOtpError("");
    setSendingOtp(true);
    try {
      const res = await fetch("/api/email-verifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          ownerName: form.owner_name.trim(),
          hotelName: form.hotel_name.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send code");
      setEmailVerificationId(data.verification_id);
      setOtpSent(true);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setSendingOtp(false);
    }
  }

  // ---- OTP verify ----
  async function verifyOtp() {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setOtpError("Enter all 6 digits.");
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
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setEmailVerified(true);
      setOtpSent(false);
    } catch (err) {
      setOtpError(err.message);
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpSubmitting(false);
    }
  }

  function setOtpDigit(i, val) {
    const clean = val.replace(/\D/g, "").slice(-1);
    setOtpDigits((d) => {
      const next = [...d];
      next[i] = clean;
      return next;
    });
    if (clean && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function otpKeyDown(i, e) {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0)
      otpRefs.current[i - 1]?.focus();
  }

  function otpPaste(e) {
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

  // ---- signup (both channels) ----
  async function createSignup(channel) {
    if (!emailVerified) {
      showError("Please verify your email first.");
      return;
    }
    const validationError = validate();
    if (validationError) {
      showError(validationError);
      setTouched({ hotel_name: true, owner_name: true, email: true });
      return;
    }
    setFormError("");
    setSubmitting(channel);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          ...form,
          channel,
          verification_id: emailVerificationId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.signupErrorGeneric);

      if (channel === "hesabpay") {
        // New: /api/signup returned { hotel_id }, not { id }
        const pres = await fetch("/api/payments/hesabpay/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hotel_id: data.hotel_id }),
        });
        const pdata = await pres.json();
        if (!pres.ok || !pdata.payment_url) {
          throw new Error(pdata.error || t.signupErrorPaymentStart);
        }
        window.location.href = pdata.payment_url;
      } else {
        // WhatsApp: /api/signup returned { signup_id }
        const priceLine = plan?.price_monthly
          ? `$${Number(plan.price_monthly).toLocaleString()}${t.signupPriceSuffix || "/mo"}`
          : t.signupCustomPricing || "custom pricing";

        const messageLines = [
          t.signupWhatsAppIntro
            .replace("{planName}", plan?.name || "")
            .replace("{price}", priceLine),
          "",
          `${t.signupWhatsAppBusinessName}: ${form.hotel_name}`,
          `${t.signupWhatsAppContactName}: ${form.owner_name}`,
          `${t.signupWhatsAppEmail}: ${form.email}`,
          form.phone ? `${t.signupWhatsAppPhone}: ${form.phone}` : null,
        ]
          .filter(Boolean)
          .join("\n");

        const url = WHATSAPP_NUMBER
          ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageLines)}`
          : `https://wa.me/?text=${encodeURIComponent(messageLines)}`;

        window.open(url, "_blank", "noopener,noreferrer");
        setSubmitting(null);
      }
    } catch (err) {
      showError(err.message || t.signupErrorGeneric);
      setSubmitting(null);
    }
  }

  const fields = [
    {
      field: "hotel_name",
      label: t.signupHotelNameLabel,
      placeholder: t.signupHotelNamePlaceholder,
      type: "text",
      optional: false,
      span: "sm:col-span-2",
    },
    {
      field: "owner_name",
      label: t.signupOwnerNameLabel,
      placeholder: t.signupOwnerNamePlaceholder,
      type: "text",
      optional: false,
      span: "sm:col-span-2",
    },
    {
      field: "email",
      label: t.signupEmailLabel,
      placeholder: t.signupEmailPlaceholder,
      type: "email",
      optional: false,
      span: "sm:col-span-2", // ← was "" — now full-width row
    },
    {
      field: "phone",
      label: t.signupPhoneLabel,
      placeholder: t.signupPhonePlaceholder,
      type: "tel",
      optional: true,
      span: "sm:col-span-2", // ← was "" — now full-width row
    },
  ];

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-hidden bg-[#15121C] font-sans`}
    >
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
      <div className="pointer-events-none absolute -top-24 -start-24 h-96 w-96 rounded-full bg-[#C9A227]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -end-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-4xl gap-8 px-5 py-8 lg:grid-cols-[340px_1fr] lg:gap-10 lg:py-10">
        <aside className="anim-in lg:sticky lg:top-6 lg:self-start">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-3 py-1 text-xs font-semibold text-[#E0B93A]">
            <BadgeCheck size={12} />
            {t.signupTrustBadge || "Verified booking partner"}
          </span>
          <h1
            className="mt-3 text-2xl font-medium leading-tight tracking-tight text-[#F0EAE2] sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.signupTitle}
          </h1>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[#B7B2C4]">
            {t.signupSubtitle}
          </p>

          <div className="mt-5">
            <PlanTicket
              plan={plan}
              loading={planLoading}
              error={planError}
              t={t}
              onChange={() => router.push("/pricing")}
            />
          </div>
        </aside>

        <main className="anim-in anim-delay">
          {plan && (
            <div className="rounded-3xl border border-[#2E2938] bg-[#1B1823]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-6">
              <div className="flex items-center gap-4 border-b border-[#2E2938] pb-4">
                <ProgressRing
                  pct={progressPct}
                  done={completedCount}
                  total={requiredFields.length}
                />
                <p className="text-base font-medium text-[#F0EAE2]">
                  {t.signupProgressLabel || "Your details"}
                </p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {fields.map(
                  ({ field, label, placeholder, type, optional, span }) => {
                    const Icon = FIELD_ICONS[field];
                    const isFocused = focusedField === field;
                    const isValid =
                      fieldValidity[field] && form[field].length > 0;
                    const showInvalid = touched[field] && !isValid && !optional;
                    const id = `signup-${field}`;

                    return (
                      <div key={field} className={span}>
                        <label
                          htmlFor={id}
                          className={`mb-1.5 flex items-center gap-1.5 text-[13px] transition-colors duration-200 ${
                            isFocused ? "text-[#E0B93A]" : "text-[#B7B2C4]"
                          }`}
                        >
                          {label}
                          {optional && (
                            <span className="text-[#6E687A]">
                              ({t.signupOptional || "optional"})
                            </span>
                          )}
                        </label>
                        <div
                          className={`flex items-center gap-2.5 rounded-xl border bg-[#15121C] px-3.5 transition-all duration-200 ${
                            showInvalid
                              ? "border-[#E5484D]/70"
                              : isFocused
                                ? "border-[#C9A227] ring-4 ring-[#C9A227]/10"
                                : emailVerified && field === "email"
                                  ? "border-[#4B8A6F]/50"
                                  : "border-[#2E2938] hover:border-[#3A3347]"
                          }`}
                        >
                          <Icon
                            size={15}
                            strokeWidth={1.75}
                            className={`shrink-0 transition-colors duration-200 ${
                              isFocused ? "text-[#C9A227]" : "text-[#6E687A]"
                            }`}
                          />
                          <input
                            id={id}
                            type={type}
                            value={form[field]}
                            onChange={(e) => updateField(field, e.target.value)}
                            onFocus={() => setFocusedField(field)}
                            onBlur={() => {
                              setFocusedField("");
                              setTouched((tt) => ({ ...tt, [field]: true }));
                            }}
                            placeholder={placeholder}
                            className="w-full min-w-0 bg-transparent py-2.5 text-sm text-[#F0EAE2] placeholder:text-[#4F4A5C] focus:outline-none"
                          />

                          {field === "email" ? (
                            emailVerified ? (
                              <span className="flex shrink-0 items-center gap-1 rounded-md bg-[#4B8A6F]/15 px-2 py-1 text-xs font-semibold text-[#7FC7A6]">
                                <Check size={12} strokeWidth={3} />
                                Verified
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={sendOtp}
                                disabled={sendingOtp || !isValid}
                                className="shrink-0 rounded-md bg-[#C9A227]/15 px-2.5 py-1 text-xs font-semibold text-[#E0B93A] transition-colors hover:bg-[#C9A227]/25 disabled:pointer-events-none disabled:opacity-40"
                              >
                                {sendingOtp
                                  ? "Sending…"
                                  : otpSent
                                    ? "Resend"
                                    : "Verify"}
                              </button>
                            )
                          ) : (
                            isValid &&
                            !optional && (
                              <Check
                                size={15}
                                strokeWidth={2.5}
                                className="anim-pop shrink-0 text-[#4B8A6F]"
                              />
                            )
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              {/* OTP panel */}
              {otpSent && !emailVerified && (
                <div className="anim-in mt-4 rounded-2xl border border-[#C9A227]/30 bg-[#15121C] p-4">
                  <p className="text-sm text-[#B7B2C4]">
                    Enter the 6-digit code sent to{" "}
                    <strong className="text-[#E0B93A]">{form.email}</strong>
                  </p>

                  <div
                    className="mt-3 flex items-center gap-2"
                    onPaste={otpPaste}
                  >
                    {otpDigits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={d}
                        onChange={(e) => setOtpDigit(i, e.target.value)}
                        onKeyDown={(e) => otpKeyDown(i, e)}
                        className="h-12 w-10 rounded-lg border border-[#2E2938] bg-[#0F0D14] text-center text-lg font-semibold tabular-nums text-[#F0EAE2] outline-none transition-colors focus:border-[#C9A227] focus:ring-4 focus:ring-[#C9A227]/15"
                      />
                    ))}

                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={
                        otpSubmitting || otpDigits.join("").length !== 6
                      }
                      className="ml-auto flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#E0B93A] to-[#C9A227] px-3 py-2.5 text-sm font-semibold text-[#1D1707] shadow-lg shadow-[#C9A227]/20 transition-all hover:shadow-[#C9A227]/35 disabled:opacity-40"
                    >
                      {otpSubmitting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} strokeWidth={3} />
                      )}
                      Verify
                    </button>
                  </div>

                  {otpError && (
                    <p
                      role="alert"
                      className="anim-error mt-2 text-xs text-[#FF9B9E]"
                    >
                      {otpError}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-[#6E687A]">
                    Didn't get it? Check spam, or{" "}
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={sendingOtp}
                      className="text-[#C9A227] underline-offset-2 hover:underline disabled:opacity-50"
                    >
                      {sendingOtp ? "sending…" : "resend code"}
                    </button>
                    .
                  </p>
                </div>
              )}

              {formError && (
                <p
                  key={errorKey}
                  role="alert"
                  className="anim-error mt-5 rounded-lg border border-[#E5484D]/40 bg-[#E5484D]/10 px-3.5 py-2.5 text-sm text-[#FF9B9E]"
                >
                  {formError}
                </p>
              )}

              <div className="mt-5 space-y-2.5">
                {!emailVerified && (
                  <p className="flex items-center gap-1.5 rounded-lg border border-[#C9A227]/25 bg-[#C9A227]/5 px-3 py-2 text-xs text-[#E0B93A]">
                    <ShieldCheck size={13} />
                    Verify your email above to unlock signup
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => createSignup("hesabpay")}
                  disabled={!emailVerified || submitting !== null}
                  className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#E0B93A] to-[#C9A227] px-4 py-3 text-sm font-semibold text-[#1D1707] shadow-lg shadow-[#C9A227]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[#C9A227]/35 active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0B93A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B1823] disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
                >
                  {submitting === "hesabpay" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ShieldCheck
                      size={16}
                      className="transition-transform duration-200 group-hover:scale-110"
                    />
                  )}
                  <span>{t.signupHesabPayButton}</span>
                  <span className="flex items-center gap-1.5">
                    <AfPayIcon className="h-5 w-8" />
                    <VisaIcon className="h-5 w-8" />
                    <MastercardIcon className="h-5 w-8" />
                  </span>
                </button>

                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-[#2E2938]" />
                  <span className="text-xs text-[#6E687A]">
                    {t.signupOrDivider || "or"}
                  </span>
                  <span className="h-px flex-1 bg-[#2E2938]" />
                </div>

                <button
                  type="button"
                  onClick={() => createSignup("whatsapp")}
                  disabled={!emailVerified || submitting !== null}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border border-[#3A3347] px-4 py-3 text-sm font-semibold text-[#F0EAE2] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A227] hover:bg-[#C9A227]/5 hover:text-[#E0B93A] active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B1823] disabled:pointer-events-none disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-[#3A3347] disabled:hover:bg-transparent disabled:hover:text-[#F0EAE2]"
                >
                  {submitting === "whatsapp" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <MessageCircle
                      size={16}
                      className="transition-transform duration-200 group-hover:scale-110"
                    />
                  )}
                  {t.signupWhatsAppButton}
                </button>
              </div>

              <p className="mt-5 text-center text-xs text-[#6E687A]">
                {t.signupWhatsAppNote}
              </p>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        @keyframes anim-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes anim-pop {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          70% {
            transform: scale(1.15);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes anim-shake {
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
        .anim-in {
          animation: anim-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .anim-delay {
          animation-delay: 0.12s;
        }
        .anim-pop {
          animation: anim-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .anim-error {
          animation: anim-shake 0.32s ease-in-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-in,
          .anim-pop,
          .anim-error {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
