"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  Plus,
  User as UserIcon,
  Phone,
  Clock,
  LogOut,
  RefreshCw,
  X,
  Pencil,
  Trash2,
  CalendarPlus,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const EMPTY_CHECKIN = {
  room_id: "",
  customer_id: "",
  guest_name: "",
  guest_phone: "",
  guest_id_no: "",
  rate_per_night: "",
  nights: 1,
  expected_check_out: "",
  notes: "",
};

export default function RoomStaysPage() {
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
  const branchesReady = !loadingBranches && branchesHotelId === selectedHotelId;

  const [rooms, setRooms] = useState([]);
  const [stays, setStays] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [checkInForm, setCheckInForm] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [checkoutFor, setCheckoutFor] = useState(null);
  const [checkoutPaymentMethodId, setCheckoutPaymentMethodId] = useState("");

  function handle401(res) {
    if (res.status === 401) {
      router.push("/hotel/login");
      return true;
    }
    return false;
  }

  // ----- me -----
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");
        if (!res.ok) {
          if (res.status === 401) return router.push("/hotel/login");
          throw new Error(t.common?.loadUserError || "Failed to load user");
        }
        const data = await res.json();
        setMe(data.user);
      } catch (err) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- owner: hotels -----
  useEffect(() => {
    if (!isOwner) return;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/owners/hotel");
        if (handle401(res)) return;
        const data = await res.json();
        setHotels(data.hotels || []);
        const only = data.hotels?.length === 1 ? data.hotels[0].id : "";
        setSelectedHotelId(data.selectedHotelId || only || "");
      } catch (err) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  // ----- owner: branches -----
  async function loadBranches(hotelId) {
    if (!hotelId) return;
    setLoadingBranches(true);
    setBranches([]);
    setBranchesHotelId("");
    try {
      const res = await fetchWithAuth(`/api/branches?hotel_id=${hotelId}`);
      if (handle401(res)) return;
      const data = await res.json();
      setSelectedHotelId((cur) => {
        if (cur === hotelId) {
          const list = data.branches || [];
          setBranches(list);
          setBranchesHotelId(hotelId);
          setError("");
          if (list.length === 1) setBranchId(list[0].id);
        }
        return cur;
      });
    } catch (err) {
      setError(err.message);
      setBranches([]);
      setBranchesHotelId("");
    } finally {
      setLoadingBranches(false);
    }
  }

  useEffect(() => {
    if (isOwner && selectedHotelId) {
      setBranchId("");
      loadBranches(selectedHotelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, selectedHotelId]);

  useEffect(() => {
    if (isBranchManager && me?.branch?.id) setBranchId(me.branch.id);
  }, [isBranchManager, me]);

  // ----- load data -----
  async function loadAll() {
    if (!branchId) return;
    setLoading(true);
    setError("");
    try {
      const hotelIdForCustomers =
        selectedHotelId ||
        me?.hotel_id ||
        me?.branch?.hotel_id ||
        branches.find((b) => b.id === branchId)?.hotel_id ||
        "";

      const [rRes, sRes, cRes, pRes] = await Promise.all([
        fetchWithAuth(`/api/owners/rooms?branch_id=${branchId}`),
        fetchWithAuth(
          `/api/owners/room-stays?branch_id=${branchId}&status=active`,
        ),
        hotelIdForCustomers
          ? fetchWithAuth(
              `/api/owners/customers?hotel_id=${hotelIdForCustomers}`,
            )
          : Promise.resolve(null),
        fetchWithAuth(`/api/owners/payment-methods?branch_id=${branchId}`),
      ]);

      if (rRes.status === 401 || sRes.status === 401)
        return router.push("/hotel/login");

      if (!rRes.ok) throw new Error("Failed to load rooms");
      if (!sRes.ok) throw new Error("Failed to load stays");

      const rData = await rRes.json();
      const sData = await sRes.json();

      setRooms(rData.rooms || []);
      setStays(sData.stays || []);

      if (cRes && cRes.ok) {
        const cData = await cRes.json();
        setCustomers(cData.customers || []);
      } else {
        setCustomers([]);
      }

      if (pRes && pRes.ok) {
        const pData = await pRes.json();
        setPaymentMethods(pData.paymentMethods || []);
      } else {
        setPaymentMethods([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (branchId) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  // ----- derived -----
  const staysByRoomId = useMemo(() => {
    const m = {};
    for (const s of stays) if (s.room?.id) m[s.room.id] = s;
    return m;
  }, [stays]);

  const roomsWithStatus = useMemo(() => {
    return rooms.map((r) => ({
      ...r,
      activeStay: staysByRoomId[r.id] || null,
    }));
  }, [rooms, staysByRoomId]);

  const selectedHotelName =
    hotels.find((h) => h.id === selectedHotelId)?.name || "";

  // ----- check-in -----
  function openCheckIn(room) {
    setError("");
    setCheckInForm({
      ...EMPTY_CHECKIN,
      room_id: room?.id || "",
      rate_per_night: room?.room_type?.base_price ?? "",
    });
  }

  function pickRoomForCheckIn(roomId) {
    setCheckInForm((prev) => {
      const room = rooms.find((r) => r.id === roomId);
      return {
        ...prev,
        room_id: roomId,
        rate_per_night:
          prev?.rate_per_night || room?.room_type?.base_price || "",
      };
    });
  }

  function pickCustomerForCheckIn(customerId) {
    setCheckInForm((prev) => {
      if (!customerId) {
        return { ...prev, customer_id: "" };
      }
      const c = customers.find((x) => x.id === customerId);
      return {
        ...prev,
        customer_id: customerId,
        guest_name: c?.full_name || prev.guest_name || "",
        guest_phone: c?.phone || prev.guest_phone || "",
      };
    });
  }

  async function submitCheckIn(e) {
    e.preventDefault();
    if (!checkInForm.room_id) {
      setError("Pick a room");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        branch_id: branchId,
        room_id: checkInForm.room_id,
        customer_id: checkInForm.customer_id || null,
        guest_name: checkInForm.guest_name || null,
        guest_phone: checkInForm.guest_phone || null,
        guest_id_no: checkInForm.guest_id_no || null,
        rate_per_night: Number(checkInForm.rate_per_night) || 0,
        nights: Number(checkInForm.nights) || 1,
        expected_check_out: checkInForm.expected_check_out || null,
        notes: checkInForm.notes || null,
      };
      const res = await fetchWithAuth(`/api/owners/room-stays`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed to check in");
      setCheckInForm(null);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ----- edit / extend -----
  function openEdit(stay) {
    setError("");
    setEditForm({
      id: stay.id,
      guest_name: stay.guest_name || stay.customer?.full_name || "",
      guest_phone: stay.guest_phone || stay.customer?.phone || "",
      rate_per_night: stay.rate_per_night,
      nights: stay.nights,
      notes: stay.notes || "",
      extendNights: 1,
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/owners/room-stays/${editForm.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "update",
          guest_name: editForm.guest_name,
          guest_phone: editForm.guest_phone,
          rate_per_night: Number(editForm.rate_per_night) || 0,
          notes: editForm.notes,
        }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed to save");
      setEditForm(null);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function extendStay(stayId, extraNights) {
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/owners/room-stays/${stayId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "extend", nights: extraNights }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed to extend");
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ----- checkout -----
  function openCheckout(stay) {
    setError("");
    setCheckoutFor(stay);
    setCheckoutPaymentMethodId(
      paymentMethods.find((p) => p.is_active !== false)?.id || "",
    );
  }

  async function submitCheckout(e) {
    e.preventDefault();
    if (!checkoutFor) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth(
        `/api/owners/room-stays/${checkoutFor.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action: "checkout",
            payment_method_id: checkoutPaymentMethodId || null,
          }),
        },
      );
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed to check out");
      setCheckoutFor(null);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancelStay(stay) {
    if (!confirm(`Cancel stay for room ${stay.room?.room_number}?`)) return;
    try {
      const res = await fetchWithAuth(`/api/owners/room-stays/${stay.id}`, {
        method: "DELETE",
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to cancel");
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!me) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh] dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.common?.loading || "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <div
      className="p-6 max-w-[100%] mx-auto overflow-x-hidden dark:bg-gray-900 dark:text-gray-100"
      dir={dir}
    >
      {/* header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">
            {t.roomStays?.title || "Front Desk"}
          </h1>
          {isOwner && hotels.length > 1 ? (
            <div className="mt-2 flex items-center gap-3 min-w-0">
              <label className="text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                {t.branch?.hotelLabel}:
              </label>
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm max-w-[200px] truncate dark:bg-gray-800 dark:border-gray-700"
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
              {me.branch?.name || t.branch?.branchLabel}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={!branchesReady || branches.length === 0}
              className="border rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700"
            >
              {!branchesReady && <option>Loading…</option>}
              {branchesReady && branches.length === 0 && (
                <option>No branches</option>
              )}
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={loadAll}
            disabled={!branchId || loading}
            className="h-9 w-9 rounded-full flex items-center justify-center border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40 disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => openCheckIn(null)}
            disabled={!branchId}
            className="inline-flex items-center gap-1.5 bg-teal-700 text-white px-3.5 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
          >
            <Plus size={15} />
            {t.roomStays?.checkIn || "Check in"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
      )}

      {/* rooms grid */}
      {loading && rooms.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : roomsWithStatus.length === 0 ? (
        <div className="border border-dashed rounded-xl px-6 py-10 text-center dark:border-gray-700">
          <p className="font-semibold mb-1">
            {t.roomStays?.noRooms || "No rooms in this branch"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.roomStays?.noRoomsHint || "Add rooms from the Rooms page first."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roomsWithStatus.map((r) => {
            const stay = r.activeStay;
            const occupied = !!stay;
            return (
              <div
                key={r.id}
                className={`rounded-xl border p-4 flex flex-col gap-3 ${
                  occupied
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        occupied
                          ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                          : "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300"
                      }`}
                    >
                      <BedDouble size={20} />
                    </div>
                    <div>
                      <div className="text-lg font-bold">#{r.room_number}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {r.room_type?.name || "—"}
                        {r.floor
                          ? ` · ${t.rooms?.floorShort || "Floor"} ${r.floor}`
                          : ""}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      occupied
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                        : "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200"
                    }`}
                  >
                    {occupied
                      ? t.roomStays?.occupied || "Occupied"
                      : t.roomStays?.available || "Available"}
                  </span>
                </div>

                {occupied ? (
                  <>
                    <div className="text-sm">
                      <div className="flex items-center gap-1.5 font-medium truncate">
                        <UserIcon size={13} />
                        {stay.guest_name ||
                          stay.customer?.full_name ||
                          "Walk-in"}
                      </div>
                      {(stay.guest_phone || stay.customer?.phone) && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <Phone size={12} />
                          <span dir="ltr">
                            {stay.guest_phone || stay.customer?.phone}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Clock size={12} />
                        {stay.nights} {t.roomStays?.nights || "nights"}
                        {" · "}
                        {stay.rate_per_night.toFixed(2)}
                        {"/"}
                        {t.roomStays?.night || "night"}
                      </div>
                    </div>

                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          {t.roomStays?.rent || "Rent"}
                        </span>
                        <span className="tabular-nums">
                          {stay.rent_total.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          {t.roomStays?.orders || "Orders"}
                        </span>
                        <span className="tabular-nums">
                          {stay.orders_total.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold border-t dark:border-gray-700 pt-1 mt-1">
                        <span>{t.roomStays?.total || "Total"}</span>
                        <span className="tabular-nums text-amber-700 dark:text-amber-400">
                          {stay.grand_total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => openEdit(stay)}
                        className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-medium border rounded-md py-1.5 hover:bg-white/50 dark:hover:bg-gray-900/40 dark:border-gray-700"
                      >
                        <Pencil size={12} /> {t.common?.edit || "Edit"}
                      </button>
                      <button
                        onClick={() => extendStay(stay.id, 1)}
                        disabled={saving}
                        className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-medium border rounded-md py-1.5 hover:bg-white/50 dark:hover:bg-gray-900/40 dark:border-gray-700 disabled:opacity-50"
                        title="+1 night"
                      >
                        <CalendarPlus size={12} /> +1
                      </button>
                      <button
                        onClick={() => openCheckout(stay)}
                        className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-medium bg-emerald-600 text-white rounded-md py-1.5 hover:bg-emerald-700"
                      >
                        <LogOut size={12} />{" "}
                        {t.roomStays?.checkout || "Check out"}
                      </button>
                    </div>
                    <button
                      onClick={() => cancelStay(stay)}
                      className="text-[11px] text-red-500 hover:text-red-700 self-center"
                    >
                      <Trash2 size={11} className="inline" />{" "}
                      {t.roomStays?.cancelStay || "Cancel stay"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {r.room_type?.base_price != null && (
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">
                          {r.room_type.base_price}
                        </span>
                      )}
                      {r.room_type?.base_price != null && (
                        <span className="ms-1 text-xs">
                          / {t.roomStays?.night || "night"}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => openCheckIn(r)}
                      className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-md py-2"
                    >
                      <Plus size={13} /> {t.roomStays?.checkIn || "Check in"}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* check-in modal */}
      {checkInForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          dir={dir}
        >
          <form
            onSubmit={submitCheckIn}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-3"
          >
            <h2 className="text-lg font-semibold">
              {t.roomStays?.checkInTitle || "Check in guest"}
            </h2>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                {t.roomStays?.room || "Room"}
              </label>
              <select
                required
                value={checkInForm.room_id}
                onChange={(e) => pickRoomForCheckIn(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="">
                  {t.roomStays?.pickRoom || "Select a room"}
                </option>
                {rooms
                  .filter((r) => !r.activeStay && r.status !== "occupied")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      #{r.room_number} — {r.room_type?.name || ""} —{" "}
                      {r.room_type?.base_price ?? ""}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                {t.roomStays?.customer || "Customer (optional)"}
              </label>
              <select
                value={checkInForm.customer_id}
                onChange={(e) => pickCustomerForCheckIn(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="">
                  {t.roomStays?.walkIn || "Walk-in (no account)"}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || c.phone || "Unnamed"}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder={t.roomStays?.guestName || "Guest name"}
                value={checkInForm.guest_name}
                onChange={(e) =>
                  setCheckInForm({
                    ...checkInForm,
                    guest_name: e.target.value,
                  })
                }
                className="border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
              />
              <input
                placeholder={t.roomStays?.guestPhone || "Phone"}
                value={checkInForm.guest_phone}
                onChange={(e) =>
                  setCheckInForm({
                    ...checkInForm,
                    guest_phone: e.target.value,
                  })
                }
                className="border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
                dir="ltr"
              />
            </div>

            <input
              placeholder={t.roomStays?.guestId || "ID / Passport (optional)"}
              value={checkInForm.guest_id_no}
              onChange={(e) =>
                setCheckInForm({
                  ...checkInForm,
                  guest_id_no: e.target.value,
                })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  {t.roomStays?.rate || "Rate / night"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={checkInForm.rate_per_night}
                  onChange={(e) =>
                    setCheckInForm({
                      ...checkInForm,
                      rate_per_night: e.target.value,
                    })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  {t.roomStays?.nights || "Nights"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={checkInForm.nights}
                  onChange={(e) =>
                    setCheckInForm({
                      ...checkInForm,
                      nights: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
            </div>

            <div className="rounded-md bg-teal-50 dark:bg-teal-900/30 px-3 py-2 text-sm">
              <span className="text-teal-700 dark:text-teal-300">
                {t.roomStays?.total || "Total"}:{" "}
              </span>
              <span className="font-bold text-teal-900 dark:text-teal-100">
                {(
                  (Number(checkInForm.rate_per_night) || 0) *
                  (Number(checkInForm.nights) || 1)
                ).toFixed(2)}
              </span>
            </div>

            <textarea
              placeholder={t.roomStays?.notes || "Notes (optional)"}
              value={checkInForm.notes}
              onChange={(e) =>
                setCheckInForm({ ...checkInForm, notes: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
              rows={2}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCheckInForm(null)}
                className="px-4 py-2 text-sm rounded-md border dark:border-gray-700"
              >
                {t.common?.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={saving || !checkInForm.room_id}
                className="px-4 py-2 text-sm rounded-md bg-teal-700 text-white disabled:opacity-50"
              >
                {saving
                  ? t.common?.saving || "Saving…"
                  : t.roomStays?.checkIn || "Check in"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* edit modal */}
      {editForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          dir={dir}
        >
          <form
            onSubmit={saveEdit}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-3"
          >
            <h2 className="text-lg font-semibold">
              {t.roomStays?.editStay || "Edit stay"}
            </h2>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}
            <input
              placeholder={t.roomStays?.guestName || "Guest name"}
              value={editForm.guest_name}
              onChange={(e) =>
                setEditForm({ ...editForm, guest_name: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <input
              placeholder={t.roomStays?.guestPhone || "Phone"}
              value={editForm.guest_phone}
              onChange={(e) =>
                setEditForm({ ...editForm, guest_phone: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
              dir="ltr"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder={t.roomStays?.rate || "Rate / night"}
              value={editForm.rate_per_night}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  rate_per_night: e.target.value,
                })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <textarea
              placeholder={t.roomStays?.notes || "Notes"}
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
              rows={2}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditForm(null)}
                className="px-4 py-2 text-sm rounded-md border dark:border-gray-700"
              >
                {t.common?.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md bg-teal-700 text-white disabled:opacity-50"
              >
                {saving
                  ? t.common?.saving || "Saving…"
                  : t.common?.save || "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* checkout modal */}
      {checkoutFor && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          dir={dir}
        >
          <form
            onSubmit={submitCheckout}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-3"
          >
            <h2 className="text-lg font-semibold">
              {t.roomStays?.checkoutTitle || "Check out"}
            </h2>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  {t.roomStays?.room || "Room"}
                </span>
                <span className="font-semibold">
                  #{checkoutFor.room?.room_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  {t.roomStays?.guest || "Guest"}
                </span>
                <span>
                  {checkoutFor.guest_name ||
                    checkoutFor.customer?.full_name ||
                    "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  {t.roomStays?.rent || "Rent"}
                </span>
                <span className="tabular-nums">
                  {checkoutFor.rent_total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  {t.roomStays?.orders || "Orders"}
                </span>
                <span className="tabular-nums">
                  {checkoutFor.orders_total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t dark:border-gray-700 pt-1 font-bold">
                <span>{t.roomStays?.total || "Total"}</span>
                <span className="text-amber-700 dark:text-amber-400 tabular-nums">
                  {checkoutFor.grand_total.toFixed(2)}
                </span>
              </div>
            </div>

            {paymentMethods.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  {t.roomStays?.paymentMethod || "Payment method"}
                </label>
                <select
                  value={checkoutPaymentMethodId}
                  onChange={(e) => setCheckoutPaymentMethodId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
                >
                  {paymentMethods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutFor(null)}
                className="px-4 py-2 text-sm rounded-md border dark:border-gray-700"
              >
                {t.common?.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white disabled:opacity-50"
              >
                {saving
                  ? t.common?.saving || "Saving…"
                  : t.roomStays?.checkout || "Check out"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
