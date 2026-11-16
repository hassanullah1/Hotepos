"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  Plus,
  BedDouble,
  Users,
  Layers,
  ConciergeBell,
  Tag,
  X,
  DoorOpen,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const EMPTY_ROOM_TYPE = {
  id: null,
  name: "",
  base_price: "",
  capacity: 2,
  is_active: true,
};
const EMPTY_ROOM = {
  id: null,
  room_number: "",
  floor: "",
  room_type_id: "",
  status: "available",
  notes: "",
  is_active: true,
};

const ROOM_STATUSES = ["available", "occupied", "cleaning", "maintenance"];

const STATUS = {
  available: {
    bar: "bg-teal-500",
    pill: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200",
  },
  occupied: {
    bar: "bg-amber-500",
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  },
  cleaning: {
    bar: "bg-sky-500",
    pill: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
  },
  maintenance: {
    bar: "bg-red-500",
    pill: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  },
};

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-gray-700 dark:bg-gray-900";

/* ---------- building blocks ---------- */

function Modal({
  title,
  icon: Icon,
  onClose,
  onSubmit,
  error,
  footer,
  children,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-gray-800 sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-700">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/30">
            <Icon size={20} />
          </div>
          <h2 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}
          {children}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/70 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/80">
          {footer}
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-medium dark:border-gray-700">
      {label}
      <span
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-teal-600" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "start-[22px]" : "start-0.5"}`}
        />
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
      </span>
    </label>
  );
}

function Footer({ onCancel, saving, t }) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        {t.common.cancel}
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 disabled:opacity-50 disabled:shadow-none"
      >
        {saving ? t.common.saving : t.common.save}
      </button>
    </>
  );
}

/* ---------- page ---------- */

export default function RoomsPage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  const [me, setMe] = useState(null);
  const isOwner = me?.role === "hotel_owner";
  const isBranchManager = me?.role === "branch_manager";

  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchesHotelId, setBranchesHotelId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchId, setBranchId] = useState("");

  const [roomTypes, setRoomTypes] = useState([]);
  const [activeRoomType, setActiveRoomType] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomTypeForm, setRoomTypeForm] = useState(null);
  const [roomForm, setRoomForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const branchesReady = !loadingBranches && branchesHotelId === selectedHotelId;

  function handle401(res) {
    if (res.status === 401) {
      router.push("/hotel/login");
      return true;
    }
    return false;
  }

  // ---------- data loading ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");
        if (!res.ok) {
          if (res.status === 401) return router.push("/hotel/login");
          throw new Error(t.common.loadUserError || "Failed to load user");
        }
        setMe((await res.json()).user);
      } catch (err) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadHotels() {
    try {
      const res = await fetchWithAuth("/api/owners/hotel");
      if (handle401(res)) return;
      const data = await res.json();
      setHotels(data.hotels || []);
      setSelectedHotelId(data.selectedHotelId || data.hotels?.[0]?.id || "");
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadBranches(hotelId) {
    if (!hotelId) return;
    setLoadingBranches(true);
    setBranches([]);
    setBranchesHotelId("");
    try {
      const res = await fetchWithAuth(`/api/branches?hotel_id=${hotelId}`);
      if (handle401(res)) return;
      const data = await res.json();
      setSelectedHotelId((current) => {
        if (current === hotelId) {
          setBranches(data.branches || []);
          setBranchesHotelId(hotelId);
          setError("");
        }
        return current;
      });
    } catch (err) {
      setError(err.message);
      setBranches([]);
      setBranchesHotelId("");
    } finally {
      setLoadingBranches(false);
    }
  }

  async function loadRoomTypes() {
    if (!branchId) return;
    try {
      const res = await fetchWithAuth(
        `/api/owners/room-types?branch_id=${branchId}`,
      );
      if (handle401(res)) return;
      setRoomTypes((await res.json()).roomTypes || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadRooms() {
    if (!branchId) return;
    setLoadingRooms(true);
    try {
      const params = new URLSearchParams({ branch_id: branchId });
      if (activeRoomType) params.set("room_type_id", activeRoomType);
      const res = await fetchWithAuth(`/api/owners/rooms?${params.toString()}`);
      if (handle401(res)) return;
      setRooms((await res.json()).rooms || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingRooms(false);
    }
  }

  useEffect(() => {
    if (isOwner) loadHotels();
    else if (isBranchManager && me?.branch?.id) setBranchId(me.branch.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, isBranchManager, me]);

  useEffect(() => {
    if (isOwner && selectedHotelId) {
      setBranchId("");
      setActiveRoomType("");
      setError("");
      loadBranches(selectedHotelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, selectedHotelId]);

  useEffect(() => {
    if (isOwner && branchesReady && !branchId && branches.length > 0)
      setBranchId(branches[0].id);
  }, [isOwner, branchesReady, branches, branchId]);

  useEffect(() => {
    if (branchId) {
      setActiveRoomType("");
      loadRoomTypes();
      loadRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  useEffect(() => {
    if (branchId) loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomType]);

  // ---------- derived ----------
  const counts = useMemo(() => {
    const c = { all: rooms.length };
    for (const s of ROOM_STATUSES)
      c[s] = rooms.filter((r) => r.status === s).length;
    return c;
  }, [rooms]);

  const visibleRooms = useMemo(
    () =>
      statusFilter === "all"
        ? rooms
        : rooms.filter((r) => r.status === statusFilter),
    [rooms, statusFilter],
  );

  const statusLabel = (s) => t.rooms.statuses?.[s] || s;

  // ---------- room type handlers ----------
  async function saveRoomType(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const isEdit = !!roomTypeForm.id;
    try {
      const res = await fetchWithAuth(
        isEdit
          ? `/api/owners/room-types/${roomTypeForm.id}`
          : "/api/owners/room-types",
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify({
            ...roomTypeForm,
            base_price: Number(roomTypeForm.base_price),
            branch_id: branchId,
          }),
        },
      );
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return setError(data.error || t.rooms.types.saveError);
      setRoomTypeForm(null);
      loadRoomTypes();
      loadRooms();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRoomType(rt) {
    if (!confirm(t.rooms.types.confirmDelete.replace("{name}", rt.name)))
      return;
    try {
      const res = await fetchWithAuth(`/api/owners/room-types/${rt.id}`, {
        method: "DELETE",
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return alert(data.error || t.rooms.types.deleteError);
      if (activeRoomType === rt.id) setActiveRoomType("");
      loadRoomTypes();
      loadRooms();
    } catch (err) {
      alert(err.message);
    }
  }

  function openCreateRoomType() {
    setError("");
    if (!branchId)
      return setError(
        t.rooms.selectBranchFirst || "Please select a branch first",
      );
    setRoomTypeForm({ ...EMPTY_ROOM_TYPE });
  }

  function openCreateRoom() {
    setError("");
    if (!branchId)
      return setError(
        t.rooms.selectBranchFirst || "Please select a branch first",
      );
    if (roomTypes.length === 0) return setError(t.rooms.needRoomTypeFirst);
    setRoomForm({
      ...EMPTY_ROOM,
      room_type_id: activeRoomType || roomTypes[0]?.id || "",
    });
  }

  function openEditRoom(r) {
    setError("");
    setRoomForm({
      id: r.id,
      room_number: r.room_number,
      floor: r.floor || "",
      room_type_id: r.room_type?.id || "",
      status: r.status || "available",
      notes: r.notes || "",
      is_active: r.is_active ?? true,
    });
  }

  // ---------- room handlers ----------
  async function saveRoom(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const isEdit = !!roomForm.id;
    const payload = { ...roomForm, branch_id: branchId };
    delete payload.id;
    try {
      const res = await fetchWithAuth(
        isEdit ? `/api/owners/rooms/${roomForm.id}` : "/api/owners/rooms",
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return setError(data.error || t.rooms.list.saveError);
      setRoomForm(null);
      loadRooms();
      loadRoomTypes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRoom(r) {
    if (!confirm(t.rooms.list.confirmDelete.replace("{name}", r.room_number)))
      return;
    try {
      const res = await fetchWithAuth(`/api/owners/rooms/${r.id}`, {
        method: "DELETE",
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return alert(data.error || t.rooms.list.deleteError);
      loadRooms();
      loadRoomTypes();
    } catch (err) {
      alert(err.message);
    }
  }

  async function quickStatus(r, newStatus) {
    try {
      const res = await fetchWithAuth(`/api/owners/rooms/${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (handle401(res)) return;
      if (res.ok) loadRooms();
    } catch (err) {
      setError(err.message);
    }
  }

  // ---------- render ----------
  if (!me) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.common.loading || "Loading..."}
        </p>
      </div>
    );
  }

  const selectedHotelName =
    hotels.find((h) => h.id === selectedHotelId)?.name || "";
  const showPageError = error && !roomTypeForm && !roomForm;

  return (
    <div
      className="mx-auto max-w-[100%] overflow-x-hidden bg-gray-50/60 p-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100 sm:p-6"
      dir={dir}
    >
      {/* ===== header ===== */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{t.rooms.title}</h1>
          {isOwner && hotels.length > 1 ? (
            <div className="mt-2 flex items-center gap-2">
              <label
                htmlFor="hotel-select"
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                {t.branch.hotelLabel}:
              </label>
              <select
                id="hotel-select"
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="max-w-[220px] truncate rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          ) : isOwner && hotels.length === 1 ? (
            <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
              {selectedHotelName}
            </p>
          ) : isBranchManager ? (
            <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
              {me.branch?.name || t.branch.branchLabel}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={!branchesReady || branches.length === 0}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
            >
              {!branchesReady && <option>{t.branch.branchLoading}</option>}
              {branchesReady && branches.length === 0 && (
                <option>{t.branch.noBranches}</option>
              )}
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <Link
            href="/admin/room-stays"
            className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:border-teal-800 dark:bg-gray-800 dark:text-teal-300 dark:hover:bg-teal-900/30"
          >
            <ConciergeBell size={16} />
            {t.rooms.assignRoom || "Front desk"}
          </Link>
          <button
            onClick={openCreateRoom}
            disabled={!branchId}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 disabled:opacity-50 disabled:shadow-none"
          >
            <Plus size={16} />
            {t.rooms.list.add}
          </button>
        </div>
      </div>

      {showPageError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[250px_1fr]">
        {/* ===== room types sidebar ===== */}
        <aside className="min-w-0 md:sticky md:top-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">{t.rooms.types.title}</h2>
            <button
              onClick={openCreateRoomType}
              disabled={!branchId}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-40 dark:text-teal-300 dark:hover:bg-teal-900/30"
            >
              <Plus size={13} />
              {t.rooms.types.add}
            </button>
          </div>

          <div className="flex flex-row gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
            {[
              {
                id: "",
                name: t.rooms.types.allRooms,
                room_count: counts.all,
                all: true,
              },
              ...roomTypes,
            ].map((rt) => {
              const active = activeRoomType === rt.id;
              return (
                <div
                  key={rt.id || "all"}
                  className={`group flex shrink-0 items-center rounded-xl border transition md:shrink ${
                    active
                      ? "border-teal-600 bg-teal-700 text-white shadow-md shadow-teal-700/20"
                      : "border-gray-200 bg-white hover:border-teal-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-700"
                  }`}
                >
                  <button
                    onClick={() => setActiveRoomType(rt.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-start"
                  >
                    {rt.all ? (
                      <Layers size={15} className="shrink-0 opacity-70" />
                    ) : (
                      <Tag size={15} className="shrink-0 opacity-70" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {rt.name}
                      </span>
                      {!rt.all && rt.base_price != null && (
                        <span
                          className={`block text-[11px] tabular-nums ${active ? "text-teal-100" : "text-gray-500 dark:text-gray-400"}`}
                        >
                          {rt.base_price}
                        </span>
                      )}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                        active
                          ? "bg-white/20"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {rt.room_count ?? 0}
                    </span>
                  </button>
                  {!rt.all && (
                    <div className="hidden pe-1.5 md:flex md:opacity-0 md:transition md:group-hover:opacity-100 md:focus-within:opacity-100">
                      <button
                        onClick={() => setRoomTypeForm(rt)}
                        aria-label={t.common.edit}
                        title={t.common.edit}
                        className={`rounded-md p-1.5 ${active ? "hover:bg-white/20" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteRoomType(rt)}
                        aria-label={t.common.delete}
                        title={t.common.delete}
                        className={`rounded-md p-1.5 ${active ? "hover:bg-white/20" : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ===== rooms ===== */}
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold">{t.rooms.list.title}</h2>
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-gray-200/70 p-1 dark:bg-gray-800">
              {["all", ...ROOM_STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === s
                      ? "bg-white text-teal-800 shadow-sm dark:bg-gray-700 dark:text-teal-200"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {s !== "all" && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS[s].bar}`}
                    />
                  )}
                  {s === "all" ? t.rooms.types.allRooms : statusLabel(s)}
                  <span className="tabular-nums opacity-60">{counts[s]}</span>
                </button>
              ))}
            </div>
          </div>

          {loadingRooms ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-800"
                />
              ))}
            </div>
          ) : visibleRooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-gray-700">
              <BedDouble className="mx-auto mb-3 text-gray-400" size={32} />
              <p className="mb-1 font-semibold">{t.rooms.list.noRooms}</p>
              <p className="mx-auto max-w-md text-sm text-gray-500 dark:text-gray-400">
                {t.rooms.list.noRoomsHint}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {visibleRooms.map((r) => {
                const st = STATUS[r.status] || STATUS.available;
                return (
                  <div
                    key={r.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className={`h-1.5 ${st.bar}`} />
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-2xl font-bold leading-none tabular-nums">
                            {r.room_number}
                          </div>
                          <div className="mt-1.5 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                            {r.room_type?.name || "—"}
                          </div>
                        </div>
                        <div className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                          <button
                            onClick={() => openEditRoom(r)}
                            aria-label={t.common.edit}
                            title={t.common.edit}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-teal-700 dark:hover:bg-gray-700"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => deleteRoom(r)}
                            aria-label={t.common.delete}
                            title={t.common.delete}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                        {r.floor && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-700">
                            <Layers size={11} /> {t.rooms.floorShort} {r.floor}
                          </span>
                        )}
                        {r.room_type?.capacity != null && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-700">
                            <Users size={11} /> {r.room_type.capacity}{" "}
                            {t.rooms.guestsShort}
                          </span>
                        )}
                      </div>

                      {r.room_type?.base_price != null && (
                        <div className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
                          {r.room_type.base_price}
                        </div>
                      )}

                      <div className="mt-auto">
                        <div className={`relative rounded-lg ${st.pill}`}>
                          <span
                            className={`pointer-events-none absolute start-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${st.bar}`}
                          />
                          <select
                            value={r.status}
                            onChange={(e) => quickStatus(r, e.target.value)}
                            aria-label={t.rooms.statusLabel || "Status"}
                            className="w-full cursor-pointer appearance-none rounded-lg bg-transparent py-1.5 ps-6 pe-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-teal-500/40"
                          >
                            {ROOM_STATUSES.map((s) => (
                              <option
                                key={s}
                                value={s}
                                className="text-gray-900"
                              >
                                {statusLabel(s)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ===== room type modal ===== */}
      {roomTypeForm && (
        <Modal
          icon={Tag}
          title={
            roomTypeForm.id ? t.rooms.types.editTitle : t.rooms.types.addTitle
          }
          error={error}
          onClose={() => setRoomTypeForm(null)}
          onSubmit={saveRoomType}
          footer={
            <Footer
              onCancel={() => setRoomTypeForm(null)}
              saving={saving}
              t={t}
            />
          }
        >
          <Field label={t.rooms.types.namePlaceholder}>
            <input
              required
              value={roomTypeForm.name}
              onChange={(e) =>
                setRoomTypeForm({ ...roomTypeForm, name: e.target.value })
              }
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.rooms.types.basePricePlaceholder}>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={roomTypeForm.base_price}
                onChange={(e) =>
                  setRoomTypeForm({
                    ...roomTypeForm,
                    base_price: e.target.value,
                  })
                }
                className={inputCls}
              />
            </Field>
            <Field label={t.rooms.types.capacityPlaceholder}>
              <input
                type="number"
                min="1"
                value={roomTypeForm.capacity}
                onChange={(e) =>
                  setRoomTypeForm({
                    ...roomTypeForm,
                    capacity: Number(e.target.value),
                  })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <Toggle
            label={t.rooms.types.active}
            checked={roomTypeForm.is_active}
            onChange={(v) => setRoomTypeForm({ ...roomTypeForm, is_active: v })}
          />
        </Modal>
      )}

      {/* ===== room modal ===== */}
      {roomForm && (
        <Modal
          icon={DoorOpen}
          title={roomForm.id ? t.rooms.list.editTitle : t.rooms.list.addTitle}
          error={error}
          onClose={() => setRoomForm(null)}
          onSubmit={saveRoom}
          footer={
            <Footer onCancel={() => setRoomForm(null)} saving={saving} t={t} />
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.rooms.list.roomNumberPlaceholder}>
              <input
                required
                value={roomForm.room_number}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, room_number: e.target.value })
                }
                className={inputCls}
              />
            </Field>
            <Field label={t.rooms.list.floorPlaceholder}>
              <input
                value={roomForm.floor}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, floor: e.target.value })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <Field label={t.rooms.types.title}>
            <select
              required
              value={roomForm.room_type_id}
              onChange={(e) =>
                setRoomForm({ ...roomForm, room_type_id: e.target.value })
              }
              className={inputCls}
            >
              <option value="">{t.rooms.list.noRoomType}</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t.rooms.statusLabel || "Status"}>
            <div className="grid grid-cols-2 gap-2">
              {ROOM_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRoomForm({ ...roomForm, status: s })}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    roomForm.status === s
                      ? "border-teal-500 bg-teal-50 text-teal-900 ring-4 ring-teal-500/15 dark:bg-teal-900/30 dark:text-teal-100"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${STATUS[s].bar}`} />
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t.rooms.list.notesPlaceholder}>
            <textarea
              rows={2}
              value={roomForm.notes}
              onChange={(e) =>
                setRoomForm({ ...roomForm, notes: e.target.value })
              }
              className={inputCls}
            />
          </Field>
          <Toggle
            label={t.rooms.list.active}
            checked={roomForm.is_active}
            onChange={(v) => setRoomForm({ ...roomForm, is_active: v })}
          />
        </Modal>
      )}
    </div>
  );
}
