"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const inputClass =
  "w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10";
const labelClass =
  "mb-1 block text-sm font-medium text-[#5B6472] dark:text-[#C7CDD6]";
const cardClass =
  "space-y-4 rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]";

export default function OwnerDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOwner() {
    try {
      const res = await fetchWithAuth(`/api/owners/${id}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        if (res.status === 404) return router.push("/admin/owners");
        throw new Error("Failed to load owner");
      }
      const data = await res.json();
      setOwner(data.owner);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOwner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading)
    return <div className="p-6 text-sm text-[#8FA0B3]">Loading…</div>;
  if (!owner)
    return (
      <div className="p-6 text-sm text-red-600">
        {error || "Owner not found"}
      </div>
    );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/owners"
          className="text-sm font-medium text-[#2F6690] hover:underline"
        >
          ← Back
        </Link>
      </div>

      <h1 className="mb-1 text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
        {owner.full_name}
      </h1>
      <p className="mb-6 text-sm text-[#8FA0B3]">
        {owner.email || owner.phone || "No contact info"}
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Hotels" value={owner.hotel_count} />
        <SummaryCard label="Total Branches" value={owner.total_branches} />
        <SummaryCard label="Total Workers" value={owner.total_workers} />
        <SummaryCard
          label="Total Monthly Due"
          value={owner.total_monthly_due.toLocaleString()}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <EditOwnerForm owner={owner} onSaved={loadOwner} />
        <HotelsOwned owner={owner} onSaved={loadOwner} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]">
      <div className="text-xs uppercase tracking-wide text-[#8FA0B3]">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[#10243A] dark:text-[#EDEBE3]">
        {value}
      </div>
    </div>
  );
}

function EditOwnerForm({ owner, onSaved }) {
  const [form, setForm] = useState({
    full_name: owner.full_name || "",
    email: owner.email || "",
    phone: owner.phone || "",
    username: owner.username || "",
    is_active: owner.is_active ?? true,
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const res = await fetchWithAuth(`/api/owners/${owner.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save owner");
      }
      setForm((f) => ({ ...f, password: "" }));
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className={cardClass}>
      <h2 className="text-base font-semibold text-[#10243A] dark:text-[#EDEBE3]">
        Owner information
      </h2>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {saved && <div className="text-sm text-green-600">Saved.</div>}

      <p className="text-xs text-[#8FA0B3]">
        Shared across all {owner.hotel_count} hotel(s) this owner manages.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Full name</label>
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
          <label className={labelClass}>Username</label>
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
          <label className={labelClass}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            New password (leave blank to keep current)
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
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-[#10243A] dark:text-[#EDEBE3]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-black/20 dark:border-white/20"
            />
            Owner account active
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] hover:bg-[#0B1826] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function HotelsOwned({ owner, onSaved }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#10243A] dark:text-[#EDEBE3]">
          Hotels owned ({owner.hotel_count})
        </h2>
        <Link
          href="/admin/hotels/create"
          className="text-xs font-medium text-[#2F6690] hover:underline"
        >
          + Attach new hotel
        </Link>
      </div>

      {owner.hotels.length === 0 ? (
        <p className="text-sm text-[#8FA0B3]">
          This owner has no hotels yet. Create one and select "Existing owner"
          to attach it.
        </p>
      ) : (
        <div className="space-y-3">
          {owner.hotels.map((h) => (
            <HotelRow key={h.id} hotel={h} onSaved={onSaved} />
          ))}
        </div>
      )}
    </div>
  );
}

function HotelRow({ hotel, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState(hotel.address || "");
  const [hesabpay, setHesabpay] = useState(hotel.hesabpay_account_number || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setAddress(hotel.address || "");
    setHesabpay(hotel.hesabpay_account_number || "");
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/hotels/${hotel.id}/owner`, {
        method: "PATCH",
        body: JSON.stringify({
          address,
          hesabpay_account_number: hesabpay,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      setEditing(false);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/admin/hotels/${hotel.id}`}
            className="font-medium text-[#2F6690] hover:underline"
          >
            {hotel.name}
          </Link>
          <div className="text-xs text-[#8FA0B3]">{hotel.slug}</div>
        </div>
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs capitalize dark:bg-white/10">
          {hotel.subscription_status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#8FA0B3] sm:grid-cols-4">
        <div>
          Plan:{" "}
          <span className="text-[#10243A] dark:text-[#EDEBE3]">
            {hotel.plan?.name || "—"}
          </span>
        </div>
        <div>
          Due:{" "}
          <span className="text-[#10243A] dark:text-[#EDEBE3]">
            {hotel.monthly_due != null
              ? Number(hotel.monthly_due).toLocaleString()
              : "—"}
            /mo
          </span>
        </div>
        <div>
          Branches:{" "}
          <span className="text-[#10243A] dark:text-[#EDEBE3]">
            {hotel.branch_count}
          </span>
        </div>
        <div>
          Workers:{" "}
          <span className="text-[#10243A] dark:text-[#EDEBE3]">
            {hotel.worker_count}
          </span>
        </div>
      </div>

      <div className="mt-3">
        {editing ? (
          <div className="space-y-3">
            {error && <div className="text-xs text-red-600">{error}</div>}

            <div>
              <label className={labelClass}>HesabPay account number</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 0700000000"
                value={hesabpay}
                onChange={(e) => setHesabpay(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
                placeholder="Address"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="rounded-lg bg-[#10243A] px-3 py-1.5 text-xs font-medium text-[#EDEBE3] hover:bg-[#0B1826] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  reset();
                  setEditing(false);
                }}
                className="text-xs font-medium text-[#5B6472] hover:underline dark:text-[#C7CDD6]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-xs">
            <div className="text-[#8FA0B3]">
              HesabPay:{" "}
              <span className="text-[#10243A] dark:text-[#EDEBE3]">
                {hotel.hesabpay_account_number || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8FA0B3]">
                Address: {hotel.address || "—"}
              </span>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="font-medium text-[#2F6690] hover:underline"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
