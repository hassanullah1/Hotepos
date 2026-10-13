"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { usePermissions } from "@/lib/usePermissions";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { LOCALES } from "@/lib/i18n/translations";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Users,
  LayoutGrid,
  UserCog,
  GitBranch,
  Plus,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Wallet,
  Loader2,
  MapPin,
  Phone,
  Hash,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-white/10 dark:bg-[#0B1826] dark:text-slate-100 dark:focus:border-teal-500";
const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400";
const cardClass =
  "space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]";
const primaryBtn =
  "inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60";

const tabBtn = (active) =>
  [
    "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-teal-700 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10",
  ].join(" ");

const emptyBranchForm = {
  name: "",
  code: "",
  address: "",
  city: "",
  phone: "",
  currency: "AFN",
  timezone: "Asia/Kabul",
  tax_rate: 0,
  service_charge_rate: 0,
  status: "active",
};

export default function HotelDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, dir, locale, setLocale } = useAdminPreferences();

  const [hotel, setHotel] = useState(null);
  const [otherHotels, setOtherHotels] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const { hasPermission, hasRole, role, permissions } = usePermissions();

  useEffect(() => {
    if (loading || !role) return;

    if (hasRole("hotel_owner")) {
      setTab("branches");
    } else {
      setTab("overview");
    }
  }, [role, loading, hasRole]);

  async function loadHotel() {
    try {
      const res = await fetchWithAuth(`/api/hotels/${id}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        if (res.status === 404) return router.push("/admin/hotels");
        throw new Error(t.hotelDetail.error || "Failed to load hotel");
      }
      const data = await res.json();
      setHotel(data.hotel);
      setOtherHotels(data.other_hotels || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHotel();
    fetchWithAuth("/api/subscription-plans")
      .then((res) => (res.ok ? res.json() : { plans: [] }))
      .then((data) => setPlans(data.plans || []))
      .catch(() => setPlans([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading)
    return (
      <div
        className="flex items-center gap-2 p-6 text-sm text-slate-500 dark:text-slate-400"
        dir={dir}
      >
        <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
        {t.hotelDetail.loading}
      </div>
    );
  if (!hotel)
    return (
      <div className="p-6 text-sm text-red-600" dir={dir}>
        {error || t.hotelDetail.hotelNotFound}
      </div>
    );

  const statusStyles = {
    active: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    trial:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    past_due:
      "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    cancelled: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="p-6" dir={dir}>
      <div className="mb-5">
        <Link
          href="/admin/hotels"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800 hover:underline dark:text-teal-400"
        >
          <ArrowLeft size={15} />
          {t.hotelDetail.back}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/20">
            <Building2 size={22} className="text-teal-700 dark:text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {hotel.name}
              </h1>
              {hotel.subscription_status && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    statusStyles[hotel.subscription_status] ||
                    "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                  }`}
                >
                  {hotel.subscription_status}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {hotel.slug}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}

      {/* quick summary strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={CreditCard}
          label={t.hotelDetail.summary.plan}
          value={hotel.subscription_plan?.name || "—"}
        />
        <SummaryCard
          icon={Wallet}
          label={t.hotelDetail.summary.monthlyDue}
          value={
            hotel.monthly_due != null
              ? Number(hotel.monthly_due).toLocaleString()
              : "—"
          }
        />
        <SummaryCard
          icon={GitBranch}
          label={t.hotelDetail.summary.branches}
          value={hotel.branches.length}
        />
        <SummaryCard
          icon={Users}
          label={t.hotelDetail.summary.workers}
          value={hotel.worker_count ?? 0}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]">
        {hasRole("super_admin") && (
          <>
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={tabBtn(tab === "overview")}
            >
              <LayoutGrid size={14} />
              {t.hotelDetail.tabs.overview}
            </button>

            <button
              type="button"
              onClick={() => setTab("owner")}
              className={tabBtn(tab === "owner")}
            >
              <UserCog size={14} />
              {t.hotelDetail.tabs.owner}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setTab("branches")}
          className={tabBtn(tab === "branches")}
        >
          <GitBranch size={14} />
          {t.hotelDetail.tabs.branches.replace(
            "{count}",
            hotel.branches.length,
          )}
        </button>
      </div>

      {tab === "overview" && hasRole("super_admin") && (
        <OverviewTab hotel={hotel} plans={plans} onSaved={loadHotel} t={t} />
      )}

      {tab === "owner" && hasRole("super_admin") && (
        <OwnerTab
          hotel={hotel}
          otherHotels={otherHotels}
          onSaved={loadHotel}
          t={t}
        />
      )}

      {(tab === "branches" && hasRole("super_admin")) ||
        (hasRole("hotel_owner") && (
          <BranchesTab hotel={hotel} onSaved={loadHotel} t={t} />
        ))}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#0F1C2E]">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/20">
        <Icon size={15} className="text-teal-700 dark:text-teal-400" />
      </div>
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-0.5 truncate text-lg font-semibold text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function OverviewTab({ hotel, plans, onSaved, t }) {
  const [form, setForm] = useState({
    name: hotel.name,
    slug: hotel.slug,
    logo_url: hotel.logo_url || "",
    subscription_plan_id: hotel.subscription_plan_id || "",
    subscription_status: hotel.subscription_status || "trial",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/hotels/${hotel.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.hotelDetail.overviewTab.error);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className={`max-w-2xl ${cardClass}`}>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            {t.hotelDetail.overviewTab.fields.hotelName}
          </label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            {t.hotelDetail.overviewTab.fields.slug}
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>
            {t.hotelDetail.overviewTab.fields.logoUrl}
          </label>
          <input
            type="url"
            value={form.logo_url}
            onChange={(e) =>
              setForm((f) => ({ ...f, logo_url: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            {t.hotelDetail.overviewTab.fields.subscriptionPlan}
          </label>
          <select
            value={form.subscription_plan_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, subscription_plan_id: e.target.value }))
            }
            className={inputClass}
          >
            <option value="">{t.hotelDetail.overviewTab.fields.noPlan}</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.price_monthly}/mo
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>
            {t.hotelDetail.overviewTab.fields.subscriptionStatus}
          </label>
          <select
            value={form.subscription_status}
            onChange={(e) =>
              setForm((f) => ({ ...f, subscription_status: e.target.value }))
            }
            className={inputClass}
          >
            <option value="trial">
              {t.hotelDetail.overviewTab.fields.statusOptions.trial}
            </option>
            <option value="active">
              {t.hotelDetail.overviewTab.fields.statusOptions.active}
            </option>
            <option value="past_due">
              {t.hotelDetail.overviewTab.fields.statusOptions.pastDue}
            </option>
            <option value="cancelled">
              {t.hotelDetail.overviewTab.fields.statusOptions.cancelled}
            </option>
          </select>
        </div>
      </div>
      <button type="submit" disabled={saving} className={primaryBtn}>
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {saving
          ? t.hotelDetail.overviewTab.saving
          : t.hotelDetail.overviewTab.save}
      </button>
    </form>
  );
}

function OwnerTab({ hotel, otherHotels = [], onSaved, t }) {
  const owner = hotel.owner || {};
  const [form, setForm] = useState({
    full_name: owner.full_name || "",
    email: owner.email || "",
    phone: owner.phone || "",
    username: owner.username || "",
    address: owner.address || "",
    is_active: owner.is_active ?? true,
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!hotel.owner) {
    return (
      <div className={`max-w-2xl ${cardClass}`}>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <UserCog size={16} className="text-slate-400" />
          {t.hotelDetail.ownerTab.noOwner}
        </div>
      </div>
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const res = await fetchWithAuth(`/api/hotels/${hotel.id}/owner`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.hotelDetail.ownerTab.error);
      }
      setForm((f) => ({ ...f, password: "" }));
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {otherHotels.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm dark:border-teal-900/40 dark:bg-teal-950/30">
          <Building2
            size={15}
            className="mt-0.5 shrink-0 text-teal-700 dark:text-teal-400"
          />
          <div>
            <span className="text-slate-700 dark:text-slate-200">
              {t.hotelDetail.ownerTab.otherHotelsPrefix}{" "}
            </span>
            <strong className="text-slate-900 dark:text-white">
              {otherHotels.map((h) => h.name).join(", ")}
            </strong>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t.hotelDetail.ownerTab.sharedInfoNote}
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSave} className={`max-w-2xl ${cardClass}`}>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              {t.hotelDetail.ownerTab.fields.fullName}
            </label>
            <input
              required
              type="text"
              value={form.full_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, full_name: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              {t.hotelDetail.ownerTab.fields.username}
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              {t.hotelDetail.ownerTab.fields.email}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              {t.hotelDetail.ownerTab.fields.phone}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>
              {t.hotelDetail.ownerTab.fields.address}
            </label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              {t.hotelDetail.ownerTab.fields.newPassword}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 self-end rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 dark:border-white/20"
            />
            {t.hotelDetail.ownerTab.fields.active}
          </label>
        </div>
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? t.hotelDetail.ownerTab.saving : t.hotelDetail.ownerTab.save}
        </button>
      </form>
    </div>
  );
}

function BranchesTab({ hotel, onSaved, t }) {
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyBranchForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth("/api/branches", {
        method: "POST",
        body: JSON.stringify({ hotel_id: hotel.id, ...addForm }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.hotelDetail.branchesTab.addError);
      }
      setAddForm({ ...emptyBranchForm });
      setShowAdd(false);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(branchId, name) {
    if (
      !confirm(t.hotelDetail.branchesTab.deleteConfirm.replace("{name}", name))
    )
      return;
    try {
      const res = await fetchWithAuth(`/api/branches/${branchId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.hotelDetail.branchesTab.deleteError);
      }
      onSaved();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className={[
            "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-colors",
            showAdd
              ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5"
              : "bg-teal-700 text-white hover:bg-teal-800",
          ].join(" ")}
        >
          {showAdd ? <X size={15} /> : <Plus size={15} />}
          {showAdd
            ? t.hotelDetail.branchesTab.cancel
            : t.hotelDetail.branchesTab.addBranch}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className={cardClass}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                {t.hotelDetail.branchesTab.fields.name}
              </label>
              <input
                required
                type="text"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t.hotelDetail.branchesTab.fields.code}
              </label>
              <input
                type="text"
                value={addForm.code}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, code: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t.hotelDetail.branchesTab.fields.city}
              </label>
              <input
                type="text"
                value={addForm.city}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, city: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t.hotelDetail.branchesTab.fields.phone}
              </label>
              <input
                type="tel"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, phone: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>
                {t.hotelDetail.branchesTab.fields.address}
              </label>
              <input
                type="text"
                value={addForm.address}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, address: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving
              ? t.hotelDetail.branchesTab.adding
              : t.hotelDetail.branchesTab.addButton}
          </button>
        </form>
      )}

      {hotel.branches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-white/15">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/20">
            <GitBranch size={20} className="text-teal-700 dark:text-teal-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.hotelDetail.branchesTab.noBranches}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hotel.branches.map((b) => {
            const expanded = expandedId === b.id;
            return (
              <div
                key={b.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#0F1C2E]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/20">
                      <GitBranch
                        size={16}
                        className="text-teal-700 dark:text-teal-400"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {b.name}
                        </span>
                        {b.code && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400">
                            <Hash size={9} />
                            {b.code}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {b.city && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={11} />
                            {b.city}
                          </span>
                        )}
                        <span>
                          {t.hotelDetail.branchesTab.stats
                            .replace("{staffCount}", b.staff_count || 0)
                            .replace("{tableCount}", b.table_count || 0)
                            .replace("{menuItemCount}", b.menu_item_count || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : b.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
                    >
                      <CreditCard size={13} />
                      {expanded
                        ? t.hotelDetail.branchesTab.paymentMethods.hide
                        : t.hotelDetail.branchesTab.paymentMethods.show}
                      {expanded ? (
                        <ChevronUp size={13} />
                      ) : (
                        <ChevronDown size={13} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id, b.name)}
                      className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label={t.hotelDetail.branchesTab.delete}
                      title={t.hotelDetail.branchesTab.delete}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {expanded && <PaymentMethodsManager branchId={b.id} t={t} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PaymentMethodsManager({ branchId, t }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", type: "cash" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `/api/branches/${branchId}/payment-methods`,
      );
      const data = res.ok ? await res.json() : { payment_methods: [] };
      setMethods(data.payment_methods || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth(
        `/api/branches/${branchId}/payment-methods`,
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || t.hotelDetail.branchesTab.paymentMethods.addError,
        );
      }
      setForm({ name: "", type: "cash" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(pm) {
    await fetchWithAuth(`/api/payment-methods/${pm.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !pm.is_active }),
    });
    load();
  }

  async function remove(pm) {
    if (
      !confirm(
        t.hotelDetail.branchesTab.paymentMethods.removeConfirm.replace(
          "{name}",
          pm.name,
        ),
      )
    )
      return;
    await fetchWithAuth(`/api/payment-methods/${pm.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.02]">
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-700" />
          {t.hotelDetail.loading}
        </div>
      ) : methods.length === 0 ? (
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          {t.hotelDetail.branchesTab.paymentMethods.noMethods}
        </p>
      ) : (
        <ul className="mb-3 space-y-1.5">
          {methods.map((pm) => (
            <li
              key={pm.id}
              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm dark:bg-[#0F1C2E]"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    pm.is_active
                      ? "bg-teal-600"
                      : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {pm.name}
                </span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-white/10 dark:text-slate-400">
                  {t.hotelDetail.branchesTab.paymentMethods.types[pm.type] ||
                    pm.type}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleActive(pm)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
                >
                  {pm.is_active
                    ? t.hotelDetail.branchesTab.paymentMethods.deactivate
                    : t.hotelDetail.branchesTab.paymentMethods.activate}
                </button>
                <button
                  type="button"
                  onClick={() => remove(pm)}
                  className="rounded-md p-1 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label={t.hotelDetail.branchesTab.paymentMethods.remove}
                >
                  <Trash2 size={13} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <div>
          <label className={labelClass}>
            {t.hotelDetail.branchesTab.paymentMethods.fields.name}
          </label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={`${inputClass} w-40`}
          />
        </div>
        <div>
          <label className={labelClass}>
            {t.hotelDetail.branchesTab.paymentMethods.fields.type}
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className={`${inputClass} w-36`}
          >
            {Object.keys(t.hotelDetail.branchesTab.paymentMethods.types).map(
              (key) => (
                <option key={key} value={key}>
                  {t.hotelDetail.branchesTab.paymentMethods.types[key]}
                </option>
              ),
            )}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus size={13} />
          )}
          {saving
            ? t.hotelDetail.branchesTab.paymentMethods.adding
            : t.hotelDetail.branchesTab.paymentMethods.add}
        </button>
      </form>
    </div>
  );
}
