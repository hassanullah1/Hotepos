"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, BedDouble, Asterisk, Home } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import Link from "next/link";

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

const STATUS_STYLE = {
  available: "bg-teal-50/90 text-teal-700",
  occupied: "bg-amber-50/90 text-amber-700",
  cleaning: "bg-blue-50/90 text-blue-700",
  maintenance: "bg-red-50/90 text-red-700",
};

export default function RoomsPage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  // ---------- who is logged in ----------
  const [me, setMe] = useState(null);
  const isOwner = me?.role === "hotel_owner";
  const isBranchManager = me?.role === "branch_manager";

  // ---------- owner-only: hotel + branch selection ----------
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");

  const [branches, setBranches] = useState([]);
  const [branchesHotelId, setBranchesHotelId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchId, setBranchId] = useState("");

  const [roomTypes, setRoomTypes] = useState([]);
  const [activeRoomType, setActiveRoomType] = useState("");
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

  // ---------- load current user ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");
        if (!res.ok) {
          if (res.status === 401) return router.push("/hotel/login");
          throw new Error(t.common.loadUserError || "Failed to load user");
        }
        const data = await res.json();
        setMe(data.user);
      } catch (err) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- owner: load owned hotels ----------
  async function loadHotels() {
    try {
      const res = await fetchWithAuth("/api/owners/hotel");
      if (handle401(res)) return;
      const data = await res.json();
      setHotels(data.hotels || []);
      const defaultHotelId = data.selectedHotelId || data.hotels?.[0]?.id || "";
      setSelectedHotelId(defaultHotelId);
    } catch (err) {
      setError(err.message);
    }
  }

  // ---------- owner: load branches for selected hotel ----------
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

  // ---------- load room types & rooms ----------
  async function loadRoomTypes() {
    if (!branchId) return;
    try {
      const res = await fetchWithAuth(
        `/api/owners/room-types?branch_id=${branchId}`,
      );
      if (handle401(res)) return;
      const data = await res.json();
      setRoomTypes(data.roomTypes || []);
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
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingRooms(false);
    }
  }

  // ---------- role-based init ----------
  useEffect(() => {
    if (isOwner) {
      loadHotels();
    } else if (isBranchManager) {
      if (me?.branch?.id) setBranchId(me.branch.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, isBranchManager, me]);

  // Owner: when hotel changes, reload branches
  useEffect(() => {
    if (isOwner && selectedHotelId) {
      setBranchId("");
      setActiveRoomType("");
      setError("");
      loadBranches(selectedHotelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, selectedHotelId]);

  // Owner: default-select first branch when ready
  useEffect(() => {
    if (isOwner && branchesReady && !branchId && branches.length > 0) {
      setBranchId(branches[0].id);
    }
  }, [isOwner, branchesReady, branches, branchId]);

  // When branchId changes → reset type, reload types & rooms
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

  // ---------- room type handlers ----------
  async function saveRoomType(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const isEdit = !!roomTypeForm.id;
    const url = isEdit
      ? `/api/owners/room-types/${roomTypeForm.id}`
      : "/api/owners/room-types";
    try {
      const res = await fetchWithAuth(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify({
          ...roomTypeForm,
          base_price: Number(roomTypeForm.base_price),
          branch_id: branchId,
        }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.rooms.types.saveError);
        return;
      }
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
    if (!branchId) {
      setError(t.rooms.selectBranchFirst || "Please select a branch first");
      return;
    }
    setRoomTypeForm({ ...EMPTY_ROOM_TYPE });
  }

  function openCreateRoom() {
    setError("");
    if (!branchId) {
      setError(t.rooms.selectBranchFirst || "Please select a branch first");
      return;
    }
    if (roomTypes.length === 0) {
      setError(t.rooms.needRoomTypeFirst);
      return;
    }
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
    const url = isEdit
      ? `/api/owners/rooms/${roomForm.id}`
      : "/api/owners/rooms";
    const payload = { ...roomForm, branch_id: branchId };
    delete payload.id;
    try {
      const res = await fetchWithAuth(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.rooms.list.saveError);
        return;
      }
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
      <div className="p-6 flex items-center justify-center min-h-[60vh] dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.common.loading || "Loading..."}
        </p>
      </div>
    );
  }

  const selectedHotelName =
    hotels.find((h) => h.id === selectedHotelId)?.name || "";

  return (
    <div
      className="p-6 max-w-[100%] mx-auto overflow-x-hidden dark:bg-gray-900 dark:text-gray-100"
      dir={dir}
    >
      {/* ---------- header ---------- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">{t.rooms.title}</h1>
          {isOwner && hotels.length > 1 ? (
            <div className="mt-2 flex items-center gap-3 min-w-0">
              <label
                htmlFor="hotel-select"
                className="text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400"
              >
                {t.branch.hotelLabel}:
              </label>
              <select
                id="hotel-select"
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm min-w-0 max-w-[160px] flex-1 truncate dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          ) : isOwner && hotels.length === 1 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {selectedHotelName}
            </p>
          ) : isBranchManager ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {me.branch?.name || t.branch.branchLabel}
            </p>
          ) : null}
        </div>

        {isOwner && (
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            disabled={!branchesReady || branches.length === 0}
            className="border rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
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

        {isBranchManager && (
          <div className="border rounded-md px-3 py-2 text-sm font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
            {me.branch?.name || t.branch.branchLabel}
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-start">
        {/* ---------- room types (sidebar) ---------- */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t.rooms.types.title}
            </h2>
            <button
              onClick={openCreateRoomType}
              disabled={!branchId}
              className="text-sm font-semibold text-teal-700 dark:text-teal-400 disabled:opacity-40"
            >
              {t.rooms.types.add}
            </button>
          </div>

          <div className="flex md:flex-col flex-row flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible gap-2 md:gap-1 pb-1">
            <button
              onClick={() => setActiveRoomType("")}
              className={`shrink-0 md:shrink text-start px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                activeRoomType === ""
                  ? "bg-teal-700 text-white"
                  : "hover:bg-teal-50 dark:hover:bg-teal-900/30"
              }`}
            >
              {t.rooms.types.allRooms}
            </button>
            {roomTypes.map((rt) => (
              <div
                key={rt.id}
                className="group shrink-0 md:shrink-0 flex items-center gap-0.5"
              >
                <button
                  onClick={() => setActiveRoomType(rt.id)}
                  className={`flex-1 text-start px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                    activeRoomType === rt.id
                      ? "bg-teal-700 text-white"
                      : "hover:bg-teal-50 dark:hover:bg-teal-900/30"
                  }`}
                >
                  {rt.name}{" "}
                  <span className="text-xs opacity-60">({rt.room_count})</span>
                </button>
                <button
                  onClick={() => setRoomTypeForm(rt)}
                  aria-label={t.common.edit}
                  title={t.common.edit}
                  className="hidden md:inline-flex opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 hover:bg-teal-50 dark:hover:bg-teal-900/30"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => deleteRoomType(rt)}
                  aria-label={t.common.delete}
                  title={t.common.delete}
                  className="hidden md:inline-flex opacity-0 group-hover:opacity-100 p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- rooms grid ---------- */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-between mb-3 min-w-40">
              {" "}
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t.rooms.list.title}
              </h2>
              <Link
                href={`/admin/room-stays`}
                className="inline-flex items-center gap-1 text-l text-teal-500 hover:text-teal-700 dark:text-gray-400 dark:hover:text-teal-400"
              >
                <Home size={13} />
                {t.customers?.history || "Assign room"}
              </Link>
            </div>
            <button
              onClick={openCreateRoom}
              disabled={!branchId}
              className="inline-flex items-center gap-1.5 bg-teal-700 text-white px-3.5 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
            >
              <Plus size={15} />
              {t.rooms.list.add}
            </button>
          </div>

          {loadingRooms ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-[3/2] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="border border-dashed rounded-xl px-6 py-10 text-center dark:border-gray-700">
              <p className="font-semibold mb-1">{t.rooms.list.noRooms}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {t.rooms.list.noRoomsHint}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {rooms.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col rounded-xl border overflow-hidden bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition dark:bg-gray-800 dark:border-gray-700"
                >
                  <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <BedDouble
                      size={40}
                      className="text-teal-700/60 dark:text-teal-400/60"
                    />
                    <span className="absolute top-2 left-2 text-xs font-bold bg-white/90 dark:bg-gray-800/90 px-2 py-0.5 rounded-full">
                      #{r.room_number}
                    </span>
                    <span
                      className={`absolute top-2 rtl:left-2 ltr:right-2 text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur ${
                        STATUS_STYLE[r.status] || STATUS_STYLE.available
                      }`}
                    >
                      {t.rooms.statuses?.[r.status] || r.status}
                    </span>
                  </div>

                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold leading-snug">
                        {r.room_type?.name || "—"}
                      </h3>
                      <div className="flex flex-wrap gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                        {r.floor && (
                          <span className="border rounded-full px-2 py-0.5 dark:border-gray-700">
                            {t.rooms.floorShort} {r.floor}
                          </span>
                        )}
                        {r.room_type?.capacity != null && (
                          <span className="border rounded-full px-2 py-0.5 dark:border-gray-700">
                            {r.room_type.capacity} {t.rooms.guestsShort}
                          </span>
                        )}
                      </div>
                    </div>

                    {r.room_type?.base_price != null && (
                      <span className="w-fit text-sm font-bold text-amber-700 bg-amber-50 rounded-md px-2 py-1 dark:bg-amber-900/30 dark:text-amber-400">
                        {r.room_type.base_price}
                      </span>
                    )}

                    <select
                      value={r.status}
                      onChange={(e) => quickStatus(r, e.target.value)}
                      className="text-xs border rounded-md px-2 py-1 dark:bg-gray-900 dark:border-gray-700"
                    >
                      {ROOM_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t.rooms.statuses?.[s] || s}
                        </option>
                      ))}
                    </select>

                    <div className="mt-auto pt-1 flex gap-4">
                      <button
                        onClick={() => openEditRoom(r)}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-teal-700 dark:text-gray-400 dark:hover:text-teal-400"
                      >
                        <Pencil size={13} />
                        {t.common.edit}
                      </button>
                      <button
                        onClick={() => deleteRoom(r)}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        <Trash2 size={13} />
                        {t.common.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- room type modal ---------- */}
      {roomTypeForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
          dir={dir}
        >
          <form
            onSubmit={saveRoomType}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-3"
          >
            <h2 className="text-lg font-semibold">
              {roomTypeForm.id
                ? t.rooms.types.editTitle
                : t.rooms.types.addTitle}
            </h2>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}
            <input
              required
              placeholder={t.rooms.types.namePlaceholder}
              value={roomTypeForm.name}
              onChange={(e) =>
                setRoomTypeForm({ ...roomTypeForm, name: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <input
              required
              type="number"
              step="0.01"
              placeholder={t.rooms.types.basePricePlaceholder}
              value={roomTypeForm.base_price}
              onChange={(e) =>
                setRoomTypeForm({ ...roomTypeForm, base_price: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <input
              type="number"
              min="1"
              placeholder={t.rooms.types.capacityPlaceholder}
              value={roomTypeForm.capacity}
              onChange={(e) =>
                setRoomTypeForm({
                  ...roomTypeForm,
                  capacity: Number(e.target.value),
                })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={roomTypeForm.is_active}
                onChange={(e) =>
                  setRoomTypeForm({
                    ...roomTypeForm,
                    is_active: e.target.checked,
                  })
                }
              />
              {t.rooms.types.active}
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoomTypeForm(null)}
                className="px-4 py-2 text-sm rounded-md border dark:border-gray-700"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md bg-teal-700 text-white disabled:opacity-50"
              >
                {saving ? t.common.saving : t.common.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---------- room modal ---------- */}
      {roomForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
          dir={dir}
        >
          <form
            onSubmit={saveRoom}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-3"
          >
            <h2 className="text-lg font-semibold">
              {roomForm.id ? t.rooms.list.editTitle : t.rooms.list.addTitle}
            </h2>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}
            <input
              required
              placeholder={t.rooms.list.roomNumberPlaceholder}
              value={roomForm.room_number}
              onChange={(e) =>
                setRoomForm({ ...roomForm, room_number: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <select
              required
              value={roomForm.room_type_id}
              onChange={(e) =>
                setRoomForm({ ...roomForm, room_type_id: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="">{t.rooms.list.noRoomType}</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
            <input
              placeholder={t.rooms.list.floorPlaceholder}
              value={roomForm.floor}
              onChange={(e) =>
                setRoomForm({ ...roomForm, floor: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <select
              value={roomForm.status}
              onChange={(e) =>
                setRoomForm({ ...roomForm, status: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            >
              {ROOM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.rooms.statuses?.[s] || s}
                </option>
              ))}
            </select>
            <textarea
              placeholder={t.rooms.list.notesPlaceholder}
              value={roomForm.notes}
              onChange={(e) =>
                setRoomForm({ ...roomForm, notes: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={roomForm.is_active}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, is_active: e.target.checked })
                }
              />
              {t.rooms.list.active}
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoomForm(null)}
                className="px-4 py-2 text-sm rounded-md border dark:border-gray-700"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md bg-teal-700 text-white disabled:opacity-50"
              >
                {saving ? t.common.saving : t.common.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
