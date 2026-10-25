"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Store,
  CreditCard,
  Loader2,
  AlertCircle,
  Check,
  LogOut,
  Info,
  PartyPopper,
  ArrowRight,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import type { SetupStep } from "./AdminSetupGate";
export type { SetupStep };

const HESABPAY_PATTERN = /^07\d{8}$/;
const STEPS: SetupStep[] = ["hotel", "branch", "hesabpay"];

const STEP_ICON: Record<
  SetupStep,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  hotel: Building2,
  branch: Store,
  hesabpay: CreditCard,
};

const inputClass =
  "w-full text-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 bg-white dark:bg-teal-900/40 text-teal-900 dark:text-teal-100 placeholder:text-teal-400/70 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500";

const labelClass =
  "block text-xs font-medium text-teal-800 dark:text-teal-200 mb-1.5";

function hesabpaySkipKey(hotelId: string) {
  return `hesabpay_setup_skipped_${hotelId}`;
}

type Province = { id: string; name: string };

/* ── Modal ──────────────────────────────────────────────────────── */

export default function AdminSetupModal({
  initialStep,
  initialHotelId,
  allowSkip = true,
  onAllComplete,
}: {
  initialStep: SetupStep;
  initialHotelId: string;
  allowSkip?: boolean;
  onAllComplete: () => void;
}) {
  const { t, dir } = useAdminPreferences();
  const s = t?.setup || {};

  const startIndex = Math.max(0, STEPS.indexOf(initialStep));

  const [stepIndex, setStepIndex] = useState(startIndex);
  const [hotelId, setHotelId] = useState(initialHotelId || "");
  const [done, setDone] = useState<Set<SetupStep>>(
    new Set(STEPS.slice(0, startIndex)),
  );
  const [success, setSuccess] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = STEPS[stepIndex];
  const total = STEPS.length;
  const stepMeta = s.steps?.[currentStep] || {};
  const Icon = STEP_ICON[currentStep];
  const isHesabpayStep = currentStep === "hesabpay";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  function handleStepDone() {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(currentStep);
      return next;
    });

    if (stepIndex < total - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }

    // Last step — show success screen, then let the gate re-check.
    setSuccess(true);
    successTimer.current = setTimeout(() => {
      onAllComplete();
    }, 2000);
  }

  function handleContinueNow() {
    if (successTimer.current) {
      clearTimeout(successTimer.current);
      successTimer.current = null;
    }
    onAllComplete();
  }

  function handleHesabpaySaved() {
    try {
      localStorage.removeItem(hesabpaySkipKey(hotelId));
    } catch {
      /* ignore */
    }
    handleStepDone();
  }

  function handleHesabpaySkip() {
    try {
      localStorage.setItem(hesabpaySkipKey(hotelId), "1");
    } catch {
      /* ignore */
    }
    handleStepDone();
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    window.location.href = "/hotel/login";
  }

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
    >
      <div className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-2xl dark:border-teal-800 dark:bg-teal-950">
        {/* ── Header (hidden on success screen) ── */}
        {!success && (
          <div className="border-b border-teal-100 px-5 py-4 dark:border-teal-800/60">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-teal-950 dark:text-teal-50">
                {s.title || "Finish setting up your account"}
              </h2>
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-teal-700/70 dark:text-teal-300/70">
                {(s.stepCounter || "Step {current} of {total}")
                  .replace("{current}", String(stepIndex + 1))
                  .replace("{total}", String(total))}
              </span>
            </div>

            <div className="flex items-center">
              {STEPS.map((step, i) => {
                const isDone = done.has(step) || i < stepIndex;
                const isActive = i === stepIndex;
                return (
                  <div
                    key={step}
                    className="flex flex-1 items-center last:flex-none"
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                        isDone
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? "bg-teal-600 text-white ring-4 ring-teal-500/20"
                            : "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                      }`}
                    >
                      {isDone ? <Check size={13} /> : i + 1}
                    </div>
                    {i < total - 1 && (
                      <div
                        className={`mx-1 h-0.5 flex-1 rounded-full transition ${
                          isDone
                            ? "bg-emerald-500"
                            : "bg-teal-200 dark:bg-teal-800"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {success ? (
            <SuccessState
              title={s.success?.title || "You're all set! 🎉"}
              body={
                s.success?.body ||
                "Setup is complete. Your dashboard is ready to use."
              }
              continueLabel={s.success?.continue || "Continue to dashboard"}
              onContinue={handleContinueNow}
            />
          ) : (
            <>
              <div className="mb-4 flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                    isHesabpayStep && !allowSkip
                      ? "bg-gradient-to-br from-teal-500 to-emerald-500"
                      : isHesabpayStep && allowSkip
                        ? "bg-gradient-to-br from-amber-500 to-yellow-500"
                        : "bg-gradient-to-br from-teal-500 to-emerald-500"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-50">
                    {stepMeta.title || ""}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-teal-700/70 dark:text-teal-300/70">
                    {stepMeta.subtitle || ""}
                  </p>
                </div>
              </div>

              {currentStep === "hotel" && (
                <HotelStep
                  onSuccess={(id) => {
                    setHotelId(id);
                    handleStepDone();
                  }}
                />
              )}
              {currentStep === "branch" && (
                <BranchStep
                  hotelId={hotelId}
                  onSuccess={() => handleStepDone()}
                />
              )}
              {currentStep === "hesabpay" && (
                <HesabpayStep
                  hotelId={hotelId}
                  allowSkip={allowSkip}
                  onSuccess={handleHesabpaySaved}
                  onSkip={handleHesabpaySkip}
                />
              )}
            </>
          )}
        </div>

        {/* ── Footer (hidden on success screen) ── */}
        {!success && (
          <div className="flex items-center justify-between gap-3 border-t border-teal-100 px-5 py-3 dark:border-teal-800/60">
            <p className="text-[11px] text-teal-700/60 dark:text-teal-300/60">
              {s.footer?.requiredNote ||
                "These steps are required before using the dashboard."}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-teal-700/70 hover:text-red-600 dark:text-teal-300/70 dark:hover:text-red-400"
            >
              <LogOut size={12} className="rtl:-scale-x-100" />
              {s.footer?.logout || "Log out"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Success screen ─────────────────────────────────────────────── */

function SuccessState({
  title,
  body,
  continueLabel,
  onContinue,
}: {
  title: string;
  body: string;
  continueLabel: string;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="relative">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
          <PartyPopper size={36} />
        </div>
        <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">
          <Check size={15} strokeWidth={3} />
        </span>
      </div>

      <h2 className="text-xl font-bold text-teal-950 dark:text-teal-50">
        {title}
      </h2>
      <p className="max-w-sm text-sm leading-relaxed text-teal-700/80 dark:text-teal-300/80">
        {body}
      </p>

      <button
        type="button"
        onClick={onContinue}
        className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
      >
        {continueLabel}
        <ArrowRight size={15} className="rtl:-scale-x-100" />
      </button>
    </div>
  );
}

/* ── Step 1: Create hotel ───────────────────────────────────────── */

function HotelStep({ onSuccess }: { onSuccess: (id: string) => void }) {
  const { t } = useAdminPreferences();
  const s = t?.setup || {};
  const h = s.hotel || {};

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth("/api/owners/hotel", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          logo_url: logoUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error || s.errors?.createHotel || "Failed to create hotel.",
        );
        return;
      }
      const id = data.hotel?.id;
      if (!id) {
        setError(
          s.errors?.noHotelId || "Hotel created but no ID was returned.",
        );
        return;
      }
      onSuccess(id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <ErrorBanner msg={error} />}

      <div>
        <label className={labelClass}>{h.nameLabel || "Hotel name *"}</label>
        <input
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={h.namePlaceholder || "e.g. Kabul Grand Hotel"}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>{h.addressLabel || "Address"}</label>
        <textarea
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={h.addressPlaceholder || "Street, city"}
          className={inputClass + " resize-none"}
        />
      </div>

      <div>
        <label className={labelClass}>{h.logoLabel || "Logo URL"}</label>
        <input
          dir="ltr"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder={h.logoPlaceholder || "https://…"}
          className={inputClass}
        />
        <p className="mt-1.5 text-[11px] text-teal-700/60 dark:text-teal-300/60">
          {h.logoHint || "Optional. Paste a public image URL."}
        </p>
      </div>

      <PrimaryButton
        saving={saving}
        savingLabel={s.saving || "Saving…"}
        label={h.submit || "Create hotel & continue"}
      />
    </form>
  );
}

/* ── Step 2: Create main branch ─────────────────────────────────── */

function BranchStep({
  hotelId,
  onSuccess,
}: {
  hotelId: string;
  onSuccess: () => void;
}) {
  const { t } = useAdminPreferences();
  const s = t?.setup || {};
  const b = s.branch || {};

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/provinces");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setProvinces(data.provinces || []);
        }
      } catch {
        /* non-fatal */
      }
      if (!cancelled) setLoadingProvinces(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hotelId) {
      setError(
        s.errors?.missingHotelId ||
          "Missing hotel id. Please reload and try again.",
      );
      return;
    }
    if (!provinceId) {
      setError(b.provinceRequired || "Please select a province.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth("/api/branches", {
        method: "POST",
        body: JSON.stringify({
          hotel_id: hotelId,
          name: name.trim(),
          address: address.trim(),
          province_id: provinceId,
          is_main: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data.error === "PROVINCE_REQUIRED"
            ? b.provinceRequired || "Please select a province."
            : data.error ||
              s.errors?.createBranch ||
              "Failed to create branch.";
        setError(msg);
        return;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <ErrorBanner msg={error} />}

      <div>
        <label className={labelClass}>{b.nameLabel || "Branch name *"}</label>
        <input
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={b.namePlaceholder || "e.g. Main Branch"}
          className={inputClass}
        />
        <p className="mt-1.5 text-[11px] text-teal-700/60 dark:text-teal-300/60">
          {b.nameHint || 'Use something like "Main" or the area name.'}
        </p>
      </div>

      <div>
        <label className={labelClass}>{b.provinceLabel || "Province"} *</label>
        <select
          required
          value={provinceId}
          onChange={(e) => setProvinceId(e.target.value)}
          disabled={loadingProvinces}
          className={inputClass}
        >
          <option value="">
            {loadingProvinces
              ? b.provinceLoading || "Loading…"
              : b.provincePlaceholder || "Select a province…"}
          </option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>{b.addressLabel || "Address"}</label>
        <textarea
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={b.addressPlaceholder || "Street, city"}
          className={inputClass + " resize-none"}
        />
      </div>

      <PrimaryButton
        saving={saving}
        savingLabel={s.saving || "Saving…"}
        label={b.submit || "Add branch & continue"}
        disabled={!provinceId || loadingProvinces}
      />
    </form>
  );
}

/* ── Step 3: HesabPay ───────────────────────────────────────────── */

function HesabpayStep({
  hotelId,
  allowSkip,
  onSuccess,
  onSkip,
}: {
  hotelId: string;
  allowSkip: boolean;
  onSuccess: () => void;
  onSkip: () => void;
}) {
  const { t } = useAdminPreferences();
  const s = t?.setup || {};
  const hp = s.hesabpay || {};

  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const trimmed = value.trim();
  const valid = HESABPAY_PATTERN.test(trimmed);
  const showHint = trimmed.length > 0 && !valid;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError(
        hp.invalid || "Please enter a valid HesabPay number (07XXXXXXXX).",
      );
      return;
    }
    if (!hotelId) {
      setError(
        s.errors?.missingHotelId ||
          "Missing hotel id. Please reload and try again.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/owners/hotel/${hotelId}`, {
        method: "PATCH",
        body: JSON.stringify({ hesabpay_account_number: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ||
            s.errors?.saveHesabpay ||
            "Failed to save HesabPay number.",
        );
        return;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Banner — optional vs required */}
      {allowSkip ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {hp.optionalWarning ||
              "Your hotel is not yet online, so this step is optional. Set it now to enable online ordering, or skip and add it later from your hotel profile."}
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs leading-relaxed text-teal-800 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-200">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {hp.requiredNotice ||
              "Your hotel is online, so a HesabPay account number is required to receive payouts. Please add it below."}
          </span>
        </div>
      )}

      {error && <ErrorBanner msg={error} />}

      <div>
        <label className={labelClass}>
          {allowSkip
            ? hp.label || "HesabPay account number"
            : `${hp.label || "HesabPay account number"} *`}
        </label>
        <div className="relative" dir="ltr">
          <input
            autoFocus
            inputMode="numeric"
            maxLength={10}
            value={value}
            onChange={(e) =>
              setValue(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="07XXXXXXXX"
            dir="ltr"
            className={`${inputClass} pe-9 ${
              showHint
                ? "!border-red-400 dark:!border-red-700 focus:!ring-red-500/30 focus:!border-red-500"
                : ""
            }`}
          />
          <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center">
            {trimmed.length > 0 &&
              (valid ? (
                <span className="text-sm text-emerald-600 dark:text-emerald-400">
                  ✓
                </span>
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ))}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-teal-700/60 dark:text-teal-300/60">
          {hp.hint || "Must be 10 digits and start with 07."}
        </p>
      </div>

      <div className="space-y-2.5">
        <PrimaryButton
          saving={saving}
          savingLabel={s.saving || "Saving…"}
          disabled={!valid}
          label={hp.submit || "Save & finish setup"}
        />

        {/* Skip is rendered ONLY when the hotel is NOT online */}
        {allowSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={saving}
            className="w-full rounded-full border border-teal-200 px-5 py-2.5 text-sm font-medium text-teal-800 transition-colors hover:bg-teal-50 disabled:opacity-50 dark:border-teal-800 dark:text-teal-200 dark:hover:bg-teal-900/50"
          >
            {hp.skip || "Skip for now"}
          </button>
        )}
      </div>
    </form>
  );
}

/* ── Shared bits ────────────────────────────────────────────────── */

function PrimaryButton({
  saving,
  savingLabel,
  label,
  disabled,
}: {
  saving: boolean;
  savingLabel: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={saving || disabled}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
      {saving ? savingLabel : label}
    </button>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{msg}</span>
    </div>
  );
}
