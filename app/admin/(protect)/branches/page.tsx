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
const thClass =
  "px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400";
const tdClass = "px-4 py-3 align-middle text-sm";

const emptyBranchForm = {
  name: "",
  code: "",
  province_id: "",
  address: "",
  city: "",
  phone: "",
  latitude: null as number | null,
  longitude: null as number | null,
  currency: "AFN",
  timezone: "Asia/Kabul",
  tax_rate: 0,
  service_charge_rate: 0,
  status: "active",
};

type Province = { id: string; name: string };

export default function OwnerBranchesPage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [hotel, setHotel] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---- modal state ----
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<any>({ ...emptyBranchForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadProvinces() {
    try {
      const res = await fetchWithAuth("/api/provinces");
      if (!res.ok) return;
      const data = await res.json();
      setProvinces(data.provinces || []);
    } catch {
      /* non-fatal */
    }
  }

  async function load(hotelId?: string | null) {
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProvinces();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleHotelChange(e: any) {
    const newHotelId = e.target.value;
    if (newHotelId !== selectedHotelId) load(newHotelId);
  }

  function provinceName(id?: string | null) {
    if (!id) return "";
    return provinces.find((p) => p.id === id)?.name || "";
  }

  function openAdd() {
    setModalMode("add");
    setEditingId(null);
    setForm({ ...emptyBranchForm });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(branch: any) {
    setModalMode("edit");
    setEditingId(branch.id);
    setForm({
      name: branch.name || "",
      code: branch.code || "",
      province_id: branch.province_id || "",
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
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...emptyBranchForm });
    setFormError("");
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!form.province_id) {
      setFormError(
        (t.branches.fields as any).provinceRequired ||
          "Please select a province.",
      );
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const isEdit = modalMode === "edit" && editingId;
      const url = isEdit ? `/api/branches/${editingId}` : "/api/branches";
      const body = isEdit ? form : { hotel_id: selectedHotelId, ...form };

      const res = await fetchWithAuth(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || (isEdit ? t.branches.updateError : t.branches.addError),
        );
      }

      setModalOpen(false);
      setEditingId(null);
      setForm({ ...emptyBranchForm });
      load(selectedHotelId);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(branchId: string, name: string) {
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
    } catch (err: any) {
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
                {hotels.map((h: any) => (
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
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-800"
        >
          <Plus size={15} />
          {t.branches.addBranch}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}

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
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                  <th className={thClass}>{t.branches.fields.name}</th>
                  <th className={thClass}>
                    {(t.branches.fields as any).province || "Province"}
                  </th>
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
                {branches.map((b: any) => {
                  const pName =
                    b.provinces?.name || provinceName(b.province_id);
                  return (
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
                        {pName ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                            <MapPin size={11} /> {pName}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            —
                          </span>
                        )}
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
                            onClick={() => openEdit(b)}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <BranchModal
          t={t}
          mode={modalMode}
          form={form}
          setForm={setForm}
          provinces={provinces}
          onSubmit={handleSubmit}
          onClose={closeModal}
          saving={saving}
          error={formError}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */
function BranchModal({
  t,
  mode,
  form,
  setForm,
  provinces,
  onSubmit,
  onClose,
  saving,
  error,
}: {
  t: any;
  mode: "add" | "edit";
  form: any;
  setForm: any;
  provinces: Province[];
  onSubmit: (e: any) => void;
  onClose: () => void;
  saving: boolean;
  error: string;
}) {
  const f = t.branches.fields;
  const isEdit = mode === "edit";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [saving, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0F1C2E]">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur dark:border-white/10 dark:bg-[#0F1C2E]/95">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {isEdit
              ? t.branches.editingLabel.replace("{name}", form.name || "")
              : t.branches.addBranch}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label={t.common.cancel}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{f.name}</label>
              <input
                required
                autoFocus
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((v: any) => ({ ...v, name: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{f.code}</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) =>
                  setForm((v: any) => ({ ...v, code: e.target.value }))
                }
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>
                {(f as any).province || "Province"}
                <span className="ml-1 text-red-500">*</span>
              </label>
              <select
                required
                value={form.province_id}
                onChange={(e) =>
                  setForm((v: any) => ({ ...v, province_id: e.target.value }))
                }
                className={inputClass}
              >
                <option value="">
                  {(f as any).provincePlaceholder || "Select a province…"}
                </option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>{f.city}</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) =>
                  setForm((v: any) => ({ ...v, city: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{f.phone}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((v: any) => ({ ...v, phone: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{f.address}</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) =>
                  setForm((v: any) => ({ ...v, address: e.target.value }))
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
                onChange={(lat: number, lng: number) =>
                  setForm((v: any) => ({ ...v, latitude: lat, longitude: lng }))
                }
              />
            </div>

            <div>
              <label className={labelClass}>{f.currency}</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) =>
                  setForm((v: any) => ({ ...v, currency: e.target.value }))
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
                  setForm((v: any) => ({ ...v, timezone: e.target.value }))
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
                  setForm((v: any) => ({ ...v, tax_rate: e.target.value }))
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
                  setForm((v: any) => ({
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
                onChange={(e) =>
                  setForm((v: any) => ({ ...v, status: e.target.value }))
                }
                className={inputClass}
              >
                <option value="active">
                  {t.branches.statusOptions.active}
                </option>
                <option value="inactive">
                  {t.branches.statusOptions.inactive}
                </option>
              </select>
            </div>
          </div>
        </form>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur dark:border-white/10 dark:bg-[#0F1C2E]/95">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            onClick={onSubmit}
            disabled={saving || !form.province_id}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving
              ? isEdit
                ? t.branches.submit.saving
                : t.branches.submit.adding
              : isEdit
                ? t.branches.submit.saveChanges
                : t.branches.submit.addBranch}
          </button>
        </div>
      </div>
    </div>
  );
}
