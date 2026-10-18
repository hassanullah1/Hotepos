"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

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
  });

  function handle401(res: Response) {
    if (res.status === 401) {
      router.push("/login");
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
      setSuccess(t.hotel?.saved || "Saved.");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen p-6 flex items-center justify-center"
        dir={dir}
      >
        <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
          {t.common?.loading || "Loading…"}
        </p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div
        className="min-h-screen p-6 flex items-center justify-center"
        dir={dir}
      >
        <p className="text-sm text-red-600 dark:text-red-400">
          {error || t.hotel?.noHotel || "No hotel found for your account."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" dir={dir}>
      <div className="max-w-4xl mx-auto">
        {/* header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-teal-950 dark:text-teal-50 leading-tight">
                {t.hotel?.profileTitle || "Hotel profile"}
              </h1>
              <p className="text-xs text-teal-700/70 dark:text-teal-300/70">
                {t.hotel?.profileSubtitle ||
                  "View and update your hotel's info."}
              </p>
            </div>
          </div>
          <button
            onClick={load}
            title={t.hotel?.refresh || "Refresh"}
            className="h-9 w-9 rounded-full flex items-center justify-center border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950/60 text-teal-700 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {success}
          </div>
        )}

        {/* status card */}
        <div className="rounded-2xl border border-teal-200 dark:border-teal-800  shadow-sm p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl overflow-hidden bg-teal-50 dark:bg-teal-900/40 flex items-center justify-center shrink-0 ring-1 ring-teal-100 dark:ring-teal-800">
              {hotel.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hotel.logo_url}
                  alt={hotel.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageOff className="h-6 w-6 text-teal-400/70 dark:text-teal-600/70" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-teal-950 dark:text-teal-50 truncate">
                {hotel.name}
              </div>
              <div className="text-xs text-teal-700/70 dark:text-teal-300/70 truncate">
                /{hotel.slug}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 items-end shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 ring-1 ring-teal-100 dark:ring-teal-800">
                <ShieldCheck className="h-3 w-3" />
                {hotel.verification_status || "pending"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-100 dark:ring-emerald-800">
                <CreditCard className="h-3 w-3" />
                {hotel.subscription_status || "trial"}
              </span>
            </div>
          </div>
        </div>

        {/* plan card */}
        <PlanCard hotel={hotel} router={router} t={t} />

        {/* form */}
        <form
          onSubmit={save}
          className="rounded-2xl border border-teal-200 dark:border-teal-800shadow-sm p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.hotel?.name || "Hotel name"}>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 bg-white dark:bg-teal-900/40 text-teal-900 dark:text-teal-100 placeholder:text-teal-400/70 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </Field>

            <Field
              label={t.hotel?.logoUrl || "Logo URL"}
              hint={t.hotel?.logoHint || "Paste a public image URL."}
            >
              <input
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://…"
                dir="ltr"
                className="w-full text-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 bg-white dark:bg-teal-900/40 text-teal-900 dark:text-teal-100 placeholder:text-teal-400/70 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {t.hotel?.address || "Address"}
                </span>
              }
            >
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full text-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 bg-white dark:bg-teal-900/40 text-teal-900 dark:text-teal-100 placeholder:text-teal-400/70 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </Field>

            <Field
              label={
                <span className="inline-flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  {t.hotel?.hesabpay || "HesabPay account number"}
                </span>
              }
              hint={
                t.hotel?.hesabpayHint ||
                "Where the owner's share of online orders gets paid."
              }
            >
              <input
                value={form.hesabpay_account_number}
                onChange={(e) =>
                  setForm({ ...form, hesabpay_account_number: e.target.value })
                }
                dir="ltr"
                className="w-full text-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 bg-white dark:bg-teal-900/40 text-teal-900 dark:text-teal-100 placeholder:text-teal-400/70 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </Field>
          </div>

          <div className="flex justify-end pt-3 border-t border-teal-100 dark:border-teal-800/60">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-3.5 w-3.5" />
              {saving
                ? t.common?.saving || "Saving…"
                : t.common?.save || "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Plan card — compact layout with labeled stats                      */
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

  const statusDot = isExpired
    ? "bg-red-500"
    : isExpiringSoon
      ? "bg-amber-500"
      : "bg-emerald-500";

  const statusColor = isExpired
    ? "text-red-700 dark:text-red-300"
    : isExpiringSoon
      ? "text-amber-700 dark:text-amber-300"
      : "text-emerald-700 dark:text-emerald-300";

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

  const hasRooms = plan?.is_rooms === true;

  return (
    <div
      className={`rounded-2xl border ${ring}  shadow-sm p-3 mb-4`}
    >
      {/* top row: plan name + status + action button */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-300 shrink-0" />
          <span className="text-sm font-semibold text-teal-950 dark:text-teal-50 truncate">
            {plan?.name || "—"}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${statusColor} shrink-0`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
            {statusLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/renew")}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm shrink-0"
        >
          <RefreshCw className="h-3 w-3" />
          {isExpired
            ? t.hotel?.renewNow || "Renew"
            : t.hotel?.changePlan || "Change"}
        </button>
      </div>

      {/* labeled stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Price */}
        <LabeledStat
          label={t.hotel?.planPrice || "Price"}
          value={
            plan
              ? `${plan.price_monthly.toFixed(2)} ${t.common?.currency || "AFN"}`
              : "—"
          }
          sub={t.hotel?.perMonth || "/mo"}
        />

        {/* Expires */}
        <LabeledStat
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
                : "text-teal-700/60 dark:text-teal-300/60"
          }
        />

        {/* Branches */}
        <LabeledStat
          label={t.hotel?.branchesLimit || "Branches"}
          value={
            plan
              ? `${hotel?.branch_count ?? hotel?.branches_count ?? "—"} / ${plan.max_branches}`
              : "—"
          }
        />

        {/* Rooms */}
        <LabeledStat
          label={t.hotel?.rooms || "Rooms"}
          value={
            plan ? (
              hasRooms ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                  ✓ {t.hotel?.included || "Included"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  ✕ {t.hotel?.notIncluded || "Not included"}
                </span>
              )
            ) : (
              "—"
            )
          }
          sub={
            plan && plan.max_pos_devices != null
              ? `${t.hotel?.posLabel || "POS"}: ${t.hotel?.maxLabel || "max"} ${plan.max_pos_devices}`
              : undefined
          }
        />
      </div>

      {/* expired hint */}
      {isExpired && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" />
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
  label,
  value,
  sub,
  subColor,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div className="rounded-lg bg-teal-50/60 dark:bg-teal-900/20 ring-1 ring-teal-100 dark:ring-teal-800/60 px-2.5 py-2 min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-wide text-teal-700/70 dark:text-teal-300/70 truncate">
        {label}
      </div>
      <div className="mt-0.5 text-[13px] font-semibold text-teal-950 dark:text-teal-50 tabular-nums truncate">
        {value}
      </div>
      {sub && (
        <div
          className={`text-[10px] ${subColor || "text-teal-700/60 dark:text-teal-300/60"} truncate`}
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
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-teal-800 dark:text-teal-200 mb-1.5">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-[11px] text-teal-700/60 dark:text-teal-300/60">
          {hint}
        </p>
      )}
    </div>
  );
}
