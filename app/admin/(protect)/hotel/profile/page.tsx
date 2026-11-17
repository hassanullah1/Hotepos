"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Save,
  MapPin,
  CreditCard,
  RefreshCw,
  ImageOff,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Truck,
  Ban,
  Gift,
  Banknote,
  Check,
  CheckCircle2,
  Circle,
  Link2,
  Eye,
  Store,
  CalendarClock,
  GitBranch,
  Wallet,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

/* ------------------------------------------------------------------ */
/*  HesabPay validation                                                */
/* ------------------------------------------------------------------ */
const HESABPAY_PATTERN = /^07\d{8}$/;

function validateHesabpay(value: string, t: any): string {
  const v = (value || "").trim();
  if (!v) return "";
  if (!/^\d+$/.test(v)) {
    return (
      t.hotel?.hesabpayDigitsOnly || "HesabPay number must contain digits only."
    );
  }
  if (v.length !== 10) {
    return (
      t.hotel?.hesabpayLength || "HesabPay number must be exactly 10 digits."
    );
  }
  if (!v.startsWith("07")) {
    return t.hotel?.hesabpayPrefix || "HesabPay number must start with 07.";
  }
  if (!HESABPAY_PATTERN.test(v)) {
    return (
      t.hotel?.hesabpayInvalid ||
      "Invalid HesabPay number. Expected format: 07XXXXXXXX."
    );
  }
  return "";
}

/* ------------------------------------------------------------------ */
/*  Delivery helpers                                                   */
/* ------------------------------------------------------------------ */
function deliveryLabel(value: string | null | undefined, t: any): string {
  switch (value) {
    case "paid":
      return t.hotel?.deliveryPaid || "Paid delivery";
    case "free":
      return t.hotel?.deliveryFree || "Free delivery";
    case "none":
    default:
      return t.hotel?.deliveryNone || "No delivery";
  }
}

/* shared input styling */
const inputBase =
  "w-full text-sm rounded-xl px-3.5 py-2.5 bg-white dark:bg-teal-950/50 text-teal-950 dark:text-teal-50 placeholder:text-teal-400/70 border transition focus:outline-none focus:ring-4";
const inputOk =
  "border-teal-200 dark:border-teal-800 focus:ring-teal-500/20 focus:border-teal-500";
const inputBad =
  "border-red-400 dark:border-red-700 focus:ring-red-500/20 focus:border-red-500";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function HotelProfilePage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hotel, setHotel] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    logo_url: "",
    address: "",
    hesabpay_account_number: "",
    delivery_type: "none",
  });

  const hesabpayError = useMemo(
    () => validateHesabpay(form.hesabpay_account_number, t),
    [form.hesabpay_account_number, t],
  );
  const hesabpayValid =
    form.hesabpay_account_number.length === 0 || hesabpayError === "";

  /* has the owner changed anything since the last save? */
  const dirty = useMemo(() => {
    if (!hotel) return false;
    return (
      form.name !== (hotel.name || "") ||
      form.logo_url !== (hotel.logo_url || "") ||
      form.address !== (hotel.address || "") ||
      form.hesabpay_account_number !== (hotel.hesabpay_account_number || "") ||
      form.delivery_type !== (hotel.delivery_type || "none")
    );
  }, [form, hotel]);

  /* profile completeness: a gentle nudge to finish setup */
  const checklist = useMemo(
    () => [
      {
        key: "name",
        done: form.name.trim().length > 0,
        label: t.hotel?.checkName || "Add your hotel name",
      },
      {
        key: "logo",
        done: form.logo_url.trim().length > 0,
        label: t.hotel?.checkLogo || "Upload your logo",
      },
      {
        key: "address",
        done: form.address.trim().length > 0,
        label: t.hotel?.checkAddress || "Add your address",
      },
      {
        key: "hesabpay",
        done: form.hesabpay_account_number.length > 0 && hesabpayError === "",
        label: t.hotel?.checkHesabpay || "Connect HesabPay to get paid",
      },
    ],
    [form, hesabpayError, t],
  );
  const doneCount = checklist.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checklist.length) * 100);

  function handle401(res: Response) {
    if (res.status === 401) {
      router.push("/hotel/login");
      return true;
    }
    return false;
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const listRes = await fetchWithAuth("/api/owners/hotel");
      if (handle401(listRes)) return;
      const listData = await listRes.json();
      const first = (listData.hotels || [])[0] || null;
      if (!first) {
        setError(t.hotel?.noHotel || "No hotel found for your account.");
        setHotel(null);
        return;
      }

      const res = await fetchWithAuth(`/api/owners/hotel/${first.id}`);
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load hotel");
        return;
      }
      const h = data.hotel || null;
      setHotel(h);
      if (h) {
        setForm({
          name: h.name || "",
          logo_url: h.logo_url || "",
          address: h.address || "",
          hesabpay_account_number: h.hesabpay_account_number || "",
          delivery_type: h.delivery_type || "none",
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!hotel) return;

    const hpErr = validateHesabpay(form.hesabpay_account_number, t);
    if (hpErr) {
      setError(hpErr);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetchWithAuth(`/api/owners/hotel/${hotel.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setHotel(data.hotel);
      setSuccess(t.hotel?.saved || "Saved. Your profile is up to date.");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------- states ---------------------------- */
  if (loading) {
    return (
      <div
        className="min-h-screen p-6 flex items-center justify-center"
        dir={dir}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30 motion-safe:animate-pulse">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
            {t.common?.loading || "Loading…"}
          </p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div
        className="min-h-screen p-6 flex items-center justify-center"
        dir={dir}
      >
        <div className="max-w-sm text-center rounded-3xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/30 p-6">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">
            {error || t.hotel?.noHotel || "No hotel found for your account."}
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------- render ---------------------------- */
  return (
    <div className="min-h-screen pb-10" dir={dir}>
      <div className="max-w-5xl mx-auto px-4 pt-4">
        {/* ---------- hero ---------- */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 text-white shadow-xl shadow-teal-900/20">
          <div
            aria-hidden
            className="absolute -top-16 -end-16 h-56 w-56 rounded-full bg-white/10"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 start-1/3 h-48 w-48 rounded-full bg-teal-400/20"
          />

          <div className="relative p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl overflow-hidden bg-white/15 backdrop-blur flex items-center justify-center shrink-0 ring-4 ring-white/30">
                  {form.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.logo_url}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageOff className="h-7 w-7 text-white/70" />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold leading-tight truncate">
                    {hotel.name}
                  </h1>
                  <p
                    dir="ltr"
                    className="mt-1 inline-flex items-center gap-1.5 text-xs text-teal-50/90 bg-white/10 rounded-full px-2.5 py-1 max-w-full"
                  >
                    <Link2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">/{hotel.slug}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={load}
                title={t.hotel?.refresh || "Refresh"}
                aria-label={t.hotel?.refresh || "Refresh"}
                className="h-9 w-9 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Pill icon={<ShieldCheck className="h-3.5 w-3.5" />}>
                {hotel.verification_status || "pending"}
              </Pill>
              <Pill icon={<CreditCard className="h-3.5 w-3.5" />}>
                {hotel.subscription_status || "trial"}
              </Pill>
              <Pill icon={<Truck className="h-3.5 w-3.5" />}>
                {deliveryLabel(hotel.delivery_type, t)}
              </Pill>
            </div>
          </div>
        </section>

        {/* ---------- toasts ---------- */}
        <div aria-live="polite" className="mt-3 space-y-2 empty:hidden">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-4 py-2.5 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2 motion-safe:animate-bounce [animation-iteration-count:1]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
          {/* ================= main column ================= */}
          <div className="space-y-4 min-w-0">
            <PlanCard hotel={hotel} router={router} t={t} />

            <form
              onSubmit={save}
              className="rounded-3xl border border-teal-200 dark:border-teal-800 bg-white/70 dark:bg-teal-950/30 shadow-sm overflow-hidden"
            >
              <div className="p-5 space-y-5">
                <SectionTitle
                  icon={<Store className="h-4 w-4" />}
                  title={t.hotel?.basicsTitle || "Your hotel"}
                  subtitle={
                    t.hotel?.profileSubtitle ||
                    "View and update your hotel's info."
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t.hotel?.name || "Hotel name"}>
                    <input
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className={`${inputBase} ${inputOk}`}
                    />
                  </Field>

                  <Field
                    label={t.hotel?.logoUrl || "Logo URL"}
                    hint={t.hotel?.logoHint || "Paste a public image URL."}
                  >
                    <input
                      value={form.logo_url}
                      onChange={(e) =>
                        setForm({ ...form, logo_url: e.target.value })
                      }
                      placeholder="https://…"
                      dir="ltr"
                      className={`${inputBase} ${inputOk}`}
                    />
                  </Field>
                </div>

                <Field
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {t.hotel?.address || "Address"}
                    </span>
                  }
                >
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    className={`${inputBase} ${inputOk} resize-none`}
                  />
                </Field>

                <div className="border-t border-teal-100 dark:border-teal-800/60 pt-5 space-y-5">
                  <SectionTitle
                    icon={<Wallet className="h-4 w-4" />}
                    title={t.hotel?.payoutTitle || "Get paid"}
                    subtitle={
                      t.hotel?.payoutSubtitle ||
                      "Your share of online orders goes straight to HesabPay."
                    }
                  />

                  <Field
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        {t.hotel?.hesabpay || "HesabPay account number"}
                      </span>
                    }
                    hint={
                      t.hotel?.hesabpayHint ||
                      "Where the owner's share of online orders gets paid. Format: 07XXXXXXXX."
                    }
                    error={hesabpayError}
                  >
                    <div className="relative">
                      <input
                        value={form.hesabpay_account_number}
                        onChange={(e) => {
                          const digits = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10);
                          setForm({
                            ...form,
                            hesabpay_account_number: digits,
                          });
                        }}
                        inputMode="numeric"
                        pattern="07[0-9]{8}"
                        maxLength={10}
                        placeholder="07XXXXXXXX"
                        dir="ltr"
                        aria-invalid={!!hesabpayError}
                        className={`${inputBase} pe-10 tracking-wider ${
                          hesabpayError ? inputBad : inputOk
                        }`}
                      />
                      <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none">
                        {form.hesabpay_account_number.length > 0 &&
                          (hesabpayValid ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ))}
                      </span>
                    </div>
                  </Field>
                </div>

                <div className="border-t border-teal-100 dark:border-teal-800/60 pt-5 space-y-5">
                  <SectionTitle
                    icon={<Truck className="h-4 w-4" />}
                    title={t.hotel?.deliveryType || "Delivery"}
                    subtitle={
                      t.hotel?.deliveryHint ||
                      "How customers can receive orders from this hotel."
                    }
                  />

                  <div
                    role="radiogroup"
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {(
                      [
                        {
                          value: "none",
                          icon: Ban,
                          label: t.hotel?.deliveryNone || "No delivery",
                          desc:
                            t.hotel?.deliveryNoneDesc ||
                            "Guests pick up or dine in.",
                        },
                        {
                          value: "free",
                          icon: Gift,
                          label: t.hotel?.deliveryFree || "Free delivery",
                          desc:
                            t.hotel?.deliveryFreeDesc ||
                            "You cover the delivery cost.",
                        },
                        {
                          value: "paid",
                          icon: Banknote,
                          label: t.hotel?.deliveryPaid || "Paid delivery",
                          desc:
                            t.hotel?.deliveryPaidDesc ||
                            "Customers pay a delivery fee.",
                        },
                      ] as const
                    ).map((opt) => {
                      const active = form.delivery_type === opt.value;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() =>
                            setForm({ ...form, delivery_type: opt.value })
                          }
                          className={`relative text-start rounded-2xl border p-3.5 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 ${
                            active
                              ? "border-teal-600 bg-teal-50 dark:bg-teal-900/50 ring-2 ring-teal-600/30 shadow-sm"
                              : "border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950/40 hover:border-teal-400 hover:bg-teal-50/60 dark:hover:bg-teal-900/30"
                          }`}
                        >
                          <span
                            className={`h-9 w-9 rounded-xl flex items-center justify-center mb-2 ${
                              active
                                ? "bg-teal-600 text-white"
                                : "bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-200"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="block text-sm font-semibold text-teal-950 dark:text-teal-50">
                            {opt.label}
                          </span>
                          <span className="block text-[11px] mt-0.5 text-teal-700/70 dark:text-teal-300/70">
                            {opt.desc}
                          </span>
                          {active && (
                            <span className="absolute top-2.5 end-2.5 h-5 w-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* save bar */}
              <div className="sticky bottom-0 flex items-center justify-between gap-3 px-5 py-3 border-t border-teal-100 dark:border-teal-800/60 bg-teal-50/90 dark:bg-teal-950/90 backdrop-blur">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs ${
                    dirty
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-teal-700/70 dark:text-teal-300/70"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      dirty ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
                  {dirty
                    ? t.hotel?.unsaved || "You have unsaved changes"
                    : t.hotel?.allSaved || "All changes saved"}
                </span>

                <button
                  type="submit"
                  disabled={saving || !hesabpayValid || !dirty}
                  title={
                    !hesabpayValid
                      ? hesabpayError ||
                        "Please enter a valid HesabPay number (07XXXXXXXX)."
                      : undefined
                  }
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/25 transition disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 motion-safe:animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving
                    ? t.common?.saving || "Saving…"
                    : t.common?.save || "Save changes"}
                </button>
              </div>
            </form>
          </div>

          {/* ================= side column ================= */}
          <aside className="space-y-4 lg:sticky lg:top-4">
            {/* completeness */}
            <div className="rounded-3xl border border-teal-200 dark:border-teal-800 bg-white/70 dark:bg-teal-950/30 shadow-sm p-5">
              <div className="flex items-center gap-4">
                <ProgressRing percent={percent} />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-teal-950 dark:text-teal-50">
                    {percent === 100
                      ? t.hotel?.profileComplete || "Your profile is complete!"
                      : t.hotel?.profileGrowing || "Let's finish your profile"}
                  </h2>
                  <p className="text-xs mt-0.5 text-teal-700/70 dark:text-teal-300/70">
                    {percent === 100
                      ? t.hotel?.profileCompleteHint ||
                        "Guests see a trusted, ready-to-order hotel."
                      : t.hotel?.profileGrowingHint ||
                        "Complete profiles earn more guest trust and orders."}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {checklist.map((c) => (
                  <li
                    key={c.key}
                    className={`flex items-center gap-2 text-xs ${
                      c.done
                        ? "text-teal-900 dark:text-teal-100"
                        : "text-teal-700/70 dark:text-teal-300/70"
                    }`}
                  >
                    {c.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-teal-300 dark:text-teal-700 shrink-0" />
                    )}
                    <span className={c.done ? "line-through opacity-70" : ""}>
                      {c.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* live preview */}
            <div className="rounded-3xl border border-teal-200 dark:border-teal-800 bg-white/70 dark:bg-teal-950/30 shadow-sm p-5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-teal-800 dark:text-teal-200 mb-3">
                <Eye className="h-3.5 w-3.5" />
                {t.hotel?.preview || "How guests see you"}
              </div>

              <div className="rounded-2xl overflow-hidden border border-teal-100 dark:border-teal-800 bg-white dark:bg-teal-950/60 shadow-sm">
                <div className="h-14 bg-gradient-to-r from-teal-500 to-teal-700" />
                <div className="px-4 pb-4 -mt-7">
                  <div className="h-14 w-14 rounded-2xl overflow-hidden bg-teal-50 dark:bg-teal-900 ring-4 ring-white dark:ring-teal-950 flex items-center justify-center">
                    {form.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.logo_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-teal-400" />
                    )}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-teal-950 dark:text-teal-50 truncate">
                    {form.name || "—"}
                  </div>
                  <div className="mt-1 flex items-start gap-1 text-[11px] text-teal-700/70 dark:text-teal-300/70">
                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{form.address || "—"}</span>
                  </div>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 ring-1 ring-amber-100 dark:ring-amber-800">
                    <Truck className="h-3 w-3" />
                    {deliveryLabel(form.delivery_type, t)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero pill                                                          */
/* ------------------------------------------------------------------ */
function Pill({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/25">
      {icon}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress ring                                                      */
/* ------------------------------------------------------------------ */
function ProgressRing({ percent }: { percent: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          className="stroke-teal-100 dark:stroke-teal-900"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="stroke-teal-600 dark:stroke-teal-400 motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-teal-950 dark:text-teal-50 tabular-nums">
        {percent}%
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section title                                                      */
/* ------------------------------------------------------------------ */
function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-9 w-9 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-200 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-teal-950 dark:text-teal-50 leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-teal-700/70 dark:text-teal-300/70">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Plan card                                                          */
/* ------------------------------------------------------------------ */
function PlanCard({ hotel, router, t }: { hotel: any; router: any; t: any }) {
  const plan = hotel?.plan || null;
  const expires = hotel?.subscription_expires_at
    ? new Date(hotel.subscription_expires_at)
    : null;
  const now = new Date();
  const msLeft = expires ? expires.getTime() - now.getTime() : 0;
  const daysLeft = expires ? Math.ceil(msLeft / (1000 * 60 * 60 * 24)) : null;

  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isExpiringSoon = !isExpired && daysLeft !== null && daysLeft <= 7;

  const ring = isExpired
    ? "border-red-200 dark:border-red-900"
    : isExpiringSoon
      ? "border-amber-200 dark:border-amber-900"
      : "border-teal-200 dark:border-teal-800";

  const statusColor = isExpired
    ? "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40"
    : isExpiringSoon
      ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40"
      : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40";

  const barColor = isExpired
    ? "bg-red-500"
    : isExpiringSoon
      ? "bg-amber-500"
      : "bg-teal-500";

  const statusLabel = isExpired
    ? t.hotel?.planExpired || "Expired"
    : isExpiringSoon
      ? t.hotel?.planExpiringSoon || "Expiring soon"
      : t.hotel?.planActive || "Active";

  const expiresText = expires
    ? expires.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  /* time bar: full at 30+ days left */
  const timePct =
    daysLeft === null ? 0 : Math.max(0, Math.min(100, (daysLeft / 30) * 100));

  const branchUsed = Number(hotel?.branch_count ?? hotel?.branches_count ?? 0);
  const branchMax = plan ? Number(plan.max_branches) : 0;
  const branchPct =
    branchMax > 0 ? Math.min(100, (branchUsed / branchMax) * 100) : 0;

  return (
    <div
      className={`rounded-3xl border ${ring} bg-white/70 dark:bg-teal-950/30 shadow-sm p-5`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-teal-950 dark:text-teal-50 truncate">
              {plan?.name || "—"}
            </div>
            <span
              className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColor}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/renew")}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm shrink-0 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {isExpired
            ? t.hotel?.renewNow || "Renew"
            : t.hotel?.changePlan || "Change plan"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <LabeledStat
          icon={<Banknote className="h-3.5 w-3.5" />}
          label={t.hotel?.planPrice || "Price"}
          value={
            plan
              ? `${Number(plan.price_monthly).toFixed(2)} ${t.common?.currency || "AFN"}`
              : "—"
          }
          sub={t.hotel?.perMonth || "per month"}
        />

        <LabeledStat
          icon={<CalendarClock className="h-3.5 w-3.5" />}
          label={t.hotel?.expiresAt || "Expires"}
          value={expiresText}
          sub={
            daysLeft !== null
              ? daysLeft > 0
                ? `${daysLeft}${t.hotel?.daysShort || "d"} ${t.hotel?.left || "left"}`
                : `${Math.abs(daysLeft)}${t.hotel?.daysAgoShort || "d ago"}`
              : undefined
          }
          subColor={
            isExpired
              ? "text-red-600 dark:text-red-400"
              : isExpiringSoon
                ? "text-amber-600 dark:text-amber-400"
                : undefined
          }
          barPct={daysLeft !== null ? timePct : undefined}
          barColor={barColor}
        />

        <LabeledStat
          icon={<GitBranch className="h-3.5 w-3.5" />}
          label={t.hotel?.branchesLimit || "Branches"}
          value={plan ? `${branchUsed} / ${branchMax}` : "—"}
          barPct={plan ? branchPct : undefined}
          barColor="bg-teal-500"
        />
      </div>

      {isExpired && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {t.hotel?.expiredHint ||
              "Your plan has expired. Renew to restore full access."}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Labeled stat cell                                                  */
/* ------------------------------------------------------------------ */
function LabeledStat({
  icon,
  label,
  value,
  sub,
  subColor,
  barPct,
  barColor,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  subColor?: string;
  barPct?: number;
  barColor?: string;
}) {
  return (
    <div className="rounded-2xl bg-teal-50/70 dark:bg-teal-900/20 ring-1 ring-teal-100 dark:ring-teal-800/60 px-3.5 py-3 min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-teal-700/80 dark:text-teal-300/80 truncate">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-teal-950 dark:text-teal-50 tabular-nums truncate">
        {value}
      </div>
      {barPct !== undefined && (
        <div className="mt-2 h-1.5 rounded-full bg-teal-100 dark:bg-teal-900 overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor || "bg-teal-500"} motion-safe:transition-[width] motion-safe:duration-700`}
            style={{ width: `${barPct}%` }}
          />
        </div>
      )}
      {sub && (
        <div
          className={`mt-1 text-[11px] truncate ${subColor || "text-teal-700/60 dark:text-teal-300/60"}`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Field helper                                                       */
/* ------------------------------------------------------------------ */
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-teal-800 dark:text-teal-200 mb-1.5">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400 inline-flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p className="mt-1.5 text-[11px] text-teal-700/60 dark:text-teal-300/60">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
