"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import LocationPicker from "@/components/admin/LocationPicker";
import {
  Pencil,
  Trash2,
  Plus,
  MapPin,
  Phone,
  Coins,
  Percent,
  Clock,
  Building2,
  DollarSign,
  X,
  Loader2,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-white/10 dark:bg-[#0B1826] dark:text-slate-100 dark:focus:border-teal-500";
const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400";
const cardClass =
  "space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]";
const thClass =
  "px-4 py-3 text-left text-xs  uppercase tracking-wide text-slate-500 dark:text-slate-400";
const tdClass = "px-4 py-3 align-middle text-sm";

const emptyBranchForm = {
  name: "",
  code: "",
  address: "",
  city: "",
  phone: "",
  latitude: null,
  longitude: null,
  currency: "AFN",
  timezone: "Asia/Kabul",
  tax_rate: 0,
  service_charge_rate: 0,
  status: "active",
};

export default function OwnerBranchesPage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyBranchForm });
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ ...emptyBranchForm });
  const [editSaving, setEditSaving] = useState(false);

  async function load(hotelId) {
    setLoading(true);
    setError("");
    try {
      const url = hotelId
        ? `/api/owners/hotel?hotelId=${hotelId}`
        : "/api/owners/hotel";
      const res = await fetchWithAuth(url);

      if (!res.ok) {
        if (res.status === 401) return router.push("/owner/login");
        throw new Error(t.branches.loadError);
      }
      const data = await res.json();

      setHotels(data.hotels || []);
      setSelectedHotelId(data.selectedHotelId);
      setHotel(data.hotel);
      setBranches(data.branches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleHotelChange(e) {
    const newHotelId = e.target.value;
    if (newHotelId !== selectedHotelId) {
      load(newHotelId);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth("/api/branches", {
        method: "POST",
        body: JSON.stringify({ hotel_id: selectedHotelId, ...addForm }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.branches.addError);
      }
      setAddForm({ ...emptyBranchForm });
      setShowAdd(false);
      load(selectedHotelId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(branch) {
    setEditingId(branch.id);
    setEditForm({
      name: branch.name || "",
      code: branch.code || "",
      address: branch.address || "",
      city: branch.city || "",
      phone: branch.phone || "",
      latitude: branch.latitude ?? null,
      longitude: branch.longitude ?? null,
      currency: branch.currency || "AFN",
      timezone: branch.timezone || "Asia/Kabul",
      tax_rate: branch.tax_rate ?? 0,
      service_charge_rate: branch.service_charge_rate ?? 0,
      status: branch.status || "active",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ ...emptyBranchForm });
  }

  async function handleUpdate(e, branchId) {
    e.preventDefault();
    setEditSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/branches/${branchId}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.branches.updateError);
      }
      cancelEdit();
      load(selectedHotelId);
    } catch (err) {
      setError(err.message);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(branchId, name) {
    if (!confirm(t.branches.deleteConfirm.replace("{name}", name))) return;
    try {
      const res = await fetchWithAuth(`/api/branches/${branchId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.branches.deleteError);
      }
      load(selectedHotelId);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading)
    return (
      <div
        className="flex items-center gap-2 p-6 text-sm text-slate-500 dark:text-slate-400"
        dir={dir}
      >
        <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
        {t.branches.loading}
      </div>
    );
  if (!hotel)
    return (
      <div className="p-6 text-sm text-red-600" dir={dir}>
        {error || t.branches.couldNotLoadHotel}
      </div>
    );

  const selectedHotelName =
    hotels.find((h) => h.id === selectedHotelId)?.name || hotel.name;

  const branchCountText =
    branches.length === 1
      ? t.branches.branchCountSingular.replace("{count}", branches.length)
      : t.branches.branchCountPlural.replace("{count}", branches.length);

  return (
    <div className="p-6" dir={dir}>
      {/* ---------- header ---------- */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          {hotels.length > 1 ? (
            <div className="flex items-center gap-3">
              <label className={labelClass} htmlFor="hotel-select">
                {t.branches.selectHotelLabel}
              </label>
              <select
                id="hotel-select"
                value={selectedHotelId || ""}
                onChange={handleHotelChange}
                className={`${inputClass} max-w-[200px]`}
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {t.branches.pageTitleWithHotel.replace(
                "{hotel}",
                selectedHotelName,
              )}
            </h1>
          )}
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {branchCountText}
          </p>
        </div>

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
          {showAdd ? t.common.cancel : t.branches.addBranch}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}

      {showAdd && (
        <BranchForm
          t={t}
          form={addForm}
          setForm={setAddForm}
          onSubmit={handleAdd}
          saving={saving}
          submitLabel={t.branches.submit.addBranch}
          savingLabel={t.branches.submit.adding}
        />
      )}

      {/* ---------- branch table ---------- */}
      {branches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-white/15">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/20">
            <Building2 size={20} className="text-teal-700 dark:text-teal-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.branches.noBranches}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                  <th className={thClass}>{f_(t).name}</th>
                  <th className={thClass}>{t.branches.fields.city}</th>
                  <th className={thClass}>{t.branches.fields.phone}</th>
                  <th className={thClass}>{t.branches.fields.currency}</th>
                  <th className={thClass}>{t.branches.fields.taxRate}</th>
                  <th className={thClass}>
                    {t.branches.fields.serviceChargeRate}
                  </th>
                  <th className={thClass}>{t.branches.fields.timezone}</th>
                  <th className={thClass}>{t.branches.fields.status}</th>
                  <th className={thClass}>Location</th>
                  <th className={`${thClass} text-right`}>
                    {t.common.actions ?? ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) =>
                  editingId === b.id ? (
                    <tr
                      key={b.id}
                      className="border-b border-slate-100 last:border-0 dark:border-white/10"
                    >
                      <td
                        colSpan={10}
                        className="bg-teal-50/40 p-5 dark:bg-teal-900/10"
                      >
                        <div className="mb-3 text-sm font-medium text-slate-900 dark:text-white">
                          {t.branches.editingLabel.replace("{name}", b.name)}
                        </div>
                        <BranchForm
                          t={t}
                          form={editForm}
                          setForm={setEditForm}
                          onSubmit={(e) => handleUpdate(e, b.id)}
                          saving={editSaving}
                          submitLabel={t.branches.submit.saveChanges}
                          savingLabel={t.branches.submit.saving}
                          onCancel={cancelEdit}
                          bare
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={b.id}
                      className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.03]"
                    >
                      <td className={tdClass}>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {b.name}
                          </span>
                          {b.code && (
                            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400">
                              {b.code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={tdClass}>
                        {b.city ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <MapPin
                              size={13}
                              className="shrink-0 text-teal-700 dark:text-teal-500"
                            />
                            {b.city}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className={tdClass}>
                        {b.phone ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Phone
                              size={13}
                              className="shrink-0 text-teal-700 dark:text-teal-500"
                            />
                            {b.phone}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className={tdClass}>
                        {b.currency ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600 dark:bg-white/10 dark:text-slate-300">
                            <Coins size={11} /> {b.currency}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className={tdClass}>
                        {(b.tax_rate ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <Percent size={12} /> {b.tax_rate}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className={tdClass}>
                        {(b.service_charge_rate ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <Percent size={12} /> {b.service_charge_rate}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className={tdClass}>
                        {b.timezone ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Clock size={12} /> {b.timezone}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className={tdClass}>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            b.status === "active"
                              ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                              : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                          }`}
                        >
                          {b.status === "active"
                            ? t.branches.statusOptions.active
                            : t.branches.statusOptions.inactive}
                        </span>
                      </td>
                      <td className={tdClass}>
                        {typeof b.latitude === "number" &&
                        typeof b.longitude === "number" ? (
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${b.latitude}&mlon=${b.longitude}#map=16/${b.latitude}/${b.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:underline dark:text-teal-400"
                          >
                            <MapPin size={12} />
                            <span dir="ltr">
                              {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)}
                            </span>
                          </a>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            Not set
                          </span>
                        )}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(b)}
                            title={t.common.edit}
                            aria-label={t.common.edit}
                            className="rounded-lg p-1.5 text-teal-700 transition-colors hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id, b.name)}
                            title={t.common.delete}
                            aria-label={t.common.delete}
                            className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={15} />
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/admin/owners/branches/${b.id}/payroll`,
                              )
                            }
                            title={t.branches.view}
                            aria-label={t.branches.view}
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                          >
                            <DollarSign size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function f_(t) {
  return t.branches.fields;
}

function BranchForm({
  t,
  form,
  setForm,
  onSubmit,
  saving,
  submitLabel,
  savingLabel,
  onCancel,
  bare = false,
}) {
  const f = t.branches.fields;
  const content = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{f.name}</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{f.code}</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm((v) => ({ ...v, code: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{f.city}</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((v) => ({ ...v, city: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{f.phone}</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>{f.address}</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) =>
              setForm((v) => ({ ...v, address: e.target.value }))
            }
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>
            {f.location || "Location (latitude / longitude)"}
          </label>
          <LocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            addressHint={form.address || "Search this branch's address…"}
            autoDetectOnMount={!form.latitude && !form.longitude}
            onChange={(lat, lng) =>
              setForm((v) => ({ ...v, latitude: lat, longitude: lng }))
            }
          />
        </div>

        <div>
          <label className={labelClass}>{f.currency}</label>
          <input
            type="text"
            value={form.currency}
            onChange={(e) =>
              setForm((v) => ({ ...v, currency: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{f.timezone}</label>
          <input
            type="text"
            value={form.timezone}
            onChange={(e) =>
              setForm((v) => ({ ...v, timezone: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{f.taxRate}</label>
          <input
            type="number"
            step="0.01"
            value={form.tax_rate}
            onChange={(e) =>
              setForm((v) => ({ ...v, tax_rate: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{f.serviceChargeRate}</label>
          <input
            type="number"
            step="0.01"
            value={form.service_charge_rate}
            onChange={(e) =>
              setForm((v) => ({
                ...v,
                service_charge_rate: e.target.value,
              }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{f.status}</label>
          <select
            value={form.status}
            onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}
            className={inputClass}
          >
            <option value="active">{t.branches.statusOptions.active}</option>
            <option value="inactive">
              {t.branches.statusOptions.inactive}
            </option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? savingLabel : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {t.common.cancel}
          </button>
        )}
      </div>
    </>
  );

  if (bare) {
    return (
      <form onSubmit={onSubmit} className="space-y-5">
        {content}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`mb-4 ${cardClass}`}>
      {content}
    </form>
  );
}
