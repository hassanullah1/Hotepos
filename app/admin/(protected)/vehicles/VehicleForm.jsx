"use client";
import { upload } from "@vercel/blob/client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { Banner } from "@/components/admin/ListControls";
import { VEHICLE_TYPES, SUBTYPE_CONFIG } from "@/lib/vehicleSubtypes";
import OwnerPicker from "./OwnerPicker";

const STATUSES = ["AVAILABLE", "RENTED", "MAINTENANCE", "OUT_OF_SERVICE"];
const FUEL_TYPES = ["DIESEL", "GASOLINE", "ELECTRIC", "HYBRID"];

function emptyDetails(type) {
  const config = SUBTYPE_CONFIG[type];
  const out = {};
  for (const [key, kind] of Object.entries(config.fields))
    out[key] = kind === "boolean" ? false : "";
  return out;
}

export default function VehicleForm({ vehicle }) {
  const { t } = useAdminPreferences();
  const router = useRouter();
  const isEdit = Boolean(vehicle);
  const fileInputRef = useRef(null);

  const [provinces, setProvinces] = useState([]);
  const [form, setForm] = useState({
    type: vehicle?.type || VEHICLE_TYPES[0],
    brand: vehicle?.brand || "",
    model: vehicle?.model || "",
    year: vehicle?.year || "",
    plateNumber: vehicle?.plateNumber || "",
    vin: vehicle?.vin || "",
    fuelType: vehicle?.fuelType || "",
    transmission: vehicle?.transmission || "",
    status: vehicle?.status || "AVAILABLE",
    pricePerDay: vehicle?.pricePerDay ?? "",
    pricePerHour: vehicle?.pricePerHour ?? "",
    provinceId: vehicle?.provinceId || "",
    description: vehicle?.description || "",
  });
  const [owner, setOwner] = useState(vehicle?.owner || null);
  const [images, setImages] = useState(vehicle?.images || []); // array of URL strings, already uploaded
  const [uploading, setUploading] = useState(false);
  const [details, setDetails] = useState({
    ...emptyDetails(vehicle?.type || VEHICLE_TYPES[0]),
    ...(vehicle?.details || {}),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/provinces")
      .then((r) => r.json())
      .then(setProvinces)
      .catch(() => setProvinces([]));
  }, []);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleTypeChange(type) {
    setForm((f) => ({ ...f, type }));
    setDetails(emptyDetails(type));
  }

  function setDetail(key, value) {
    setDetails((d) => ({ ...d, [key]: value }));
  }

  async function handleFilesChosen(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setError(null);
    setUploading(true);

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        uploadedUrls.push(blob.url);
      }
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      setError(err.message || t.common.error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeImage(url) {
    // Optimistically remove from UI first
    setImages((prev) => prev.filter((u) => u !== url));

    try {
      const res = await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t.common.error);
      }
    } catch {
      setError(t.common.error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      provinceId: form.provinceId || null,
      ownerId: owner?.id || null,
      images,
      details,
    };

    const res = await fetch(
      isEdit ? `/api/admin/vehicles/${vehicle.id}` : "/api/admin//vehicles",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    setSaving(false);

    if (res.ok) {
      router.push("/admin/vehicles");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || t.common.error);
    }
  }

  const detailFields = Object.entries(SUBTYPE_CONFIG[form.type].fields);

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]";
  const labelClass = "mb-1 block text-sm font-medium";

  return (
    <div className="max-w-5xl">
      <h1 className="mb-4 text-2xl font-semibold">
        {isEdit ? t.vehicle.editTitle : t.vehicle.addTitle}
      </h1>
      <Banner kind="error" message={error} />

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0F1E30]"
      >
        <div>
          <label className={labelClass}>{t.owner?.title || "Owner"}</label>
          <OwnerPicker value={owner} onChange={setOwner} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div>
            <label className={labelClass}>{t.vehicle.type}</label>
            <select
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className={inputClass}
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t.vehicle.types[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t.vehicle.status}</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.vehicle.statuses[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t.vehicle.brand}</label>
            <input
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t.vehicle.model}</label>
            <input
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t.vehicle.year}</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t.vehicle.plateNumber}</label>
            <input
              value={form.plateNumber}
              onChange={(e) => set("plateNumber", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t.vehicle.vin}</label>
            <input
              value={form.vin}
              onChange={(e) => set("vin", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t.vehicle.fuelType}</label>
            <select
              value={form.fuelType}
              onChange={(e) => set("fuelType", e.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {t.vehicle.fuelTypes[f]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t.vehicle.transmission}</label>
            <input
              value={form.transmission}
              onChange={(e) => set("transmission", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t.vehicle.province}</label>
            <select
              value={form.provinceId}
              onChange={(e) => set("provinceId", e.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t.vehicle.pricePerDay}</label>
            <input
              type="number"
              step="0.01"
              value={form.pricePerDay}
              onChange={(e) => set("pricePerDay", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t.vehicle.pricePerHour}</label>
            <input
              type="number"
              step="0.01"
              value={form.pricePerHour}
              onChange={(e) => set("pricePerHour", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t.vehicle.description}</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>{t.vehicle.images}</label>

          <div className="flex flex-wrap gap-3">
            {images.map((url) => (
              <div
                key={url}
                className="group relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200 dark:border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />

                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  aria-label={t.common.delete}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 disabled:opacity-60 dark:border-white/15 dark:text-slate-400 dark:hover:border-white/30"
            >
              <span className="text-xl leading-none">＋</span>
              <span>{uploading ? t.common.loading : t.common.chooseImage}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChosen}
              className="hidden"
            />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold">
            {t.vehicle.detailsSection}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {detailFields.map(([key, kind]) => (
              <div
                key={key}
                className={
                  kind === "boolean" ? "flex items-center gap-2 pt-6" : ""
                }
              >
                {kind === "boolean" ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(details[key])}
                      onChange={(e) => setDetail(key, e.target.checked)}
                    />
                    {t.vehicle.fields[key] ?? key}
                  </label>
                ) : (
                  <>
                    <label className={labelClass}>
                      {t.vehicle.fields[key] ?? key}
                    </label>
                    <input
                      type={
                        kind === "int" || kind === "float" ? "number" : "text"
                      }
                      step={kind === "float" ? "0.01" : undefined}
                      value={details[key] ?? ""}
                      onChange={(e) => setDetail(key, e.target.value)}
                      className={inputClass}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-lg bg-[#10243A] px-4 py-2 text-sm font-medium text-white hover:bg-[#16324f] disabled:opacity-60 dark:bg-[#2F6690]"
          >
            {t.common.save}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/vehicles")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-white/10"
          >
            {t.common.cancel}
          </button>
        </div>
      </form>
    </div>
  );
}
