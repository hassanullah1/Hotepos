"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  Plus,
  Minus,
  Phone,
  Clock,
  LogOut,
  RefreshCw,
  X,
  Pencil,
  Trash2,
  CalendarPlus,
  Search,
  DoorOpen,
  DoorClosed,
  Wallet,
  Layers,
  IdCard,
  UserRound,
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

const money = (n) => (Number(n) || 0).toFixed(2);
const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-teal-500 dark:focus:bg-gray-900";

/* ---------- small building blocks ---------- */

function Modal({
  title,
  subtitle = null,
  icon: Icon,
  onClose,
  onSubmit,
  error = null,
  footer,
  children,
  wide = false,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-gray-800 sm:rounded-3xl ${
          wide ? "sm:max-w-lg" : "sm:max-w-md"
        }`}
      >
        <div className="flex items-start gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-700">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/30">
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-tight">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
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

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SelectedChip({ children, onClear }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-sm font-medium text-teal-900 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-100">
      <span className="truncate">{children}</span>
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 rounded-full p-1 text-teal-700 hover:bg-teal-100 hover:text-red-600 dark:hover:bg-teal-800"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function Suggestions({ children }) {
  return (
    <div className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      {children}
    </div>
  );
}

const suggestionCls =
  "block w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-teal-50 dark:hover:bg-teal-900/30";

function GhostBtn({ children, ...p }) {
  return (
    <button
      type="button"
      {...p}
      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      {children}
    </button>
  );
}

function PrimaryBtn({ children, color = "teal", ...p }) {
  const c =
    color === "emerald"
      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
      : "bg-teal-700 hover:bg-teal-800 shadow-teal-700/25";
  return (
    <button
      type="submit"
      {...p}
      className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50 disabled:shadow-none ${c}`}
    >
      {children}
    </button>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-xl font-bold tabular-nums leading-tight">
          {value}
        </div>
        <div className="truncate text-xs text-gray-500 dark:text-gray-400">
          {label}
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

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

  const [roomQuery, setRoomQuery] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [showRoomSuggestions, setShowRoomSuggestions] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // page filters
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

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

      if (cRes && cRes.ok) setCustomers((await cRes.json()).customers || []);
      else setCustomers([]);

      if (pRes && pRes.ok)
        setPaymentMethods((await pRes.json()).paymentMethods || []);
      else setPaymentMethods([]);
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

  const roomsWithStatus = useMemo(
    () => rooms.map((r) => ({ ...r, activeStay: staysByRoomId[r.id] || null })),
    [rooms, staysByRoomId],
  );

  const stats = useMemo(() => {
    const occupied = roomsWithStatus.filter((r) => r.activeStay).length;
    return {
      total: roomsWithStatus.length,
      occupied,
      available: roomsWithStatus.length - occupied,
      open: stays.reduce((sum, s) => sum + (s.grand_total || 0), 0),
    };
  }, [roomsWithStatus, stays]);

  const visibleRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roomsWithStatus.filter((r) => {
      if (filter === "available" && r.activeStay) return false;
      if (filter === "occupied" && !r.activeStay) return false;
      if (!q) return true;
      const s = r.activeStay;
      return (
        String(r.room_number).toLowerCase().includes(q) ||
        (r.room_type?.name || "").toLowerCase().includes(q) ||
        (s?.guest_name || s?.customer?.full_name || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [roomsWithStatus, filter, search]);

  const selectedHotelName =
    hotels.find((h) => h.id === selectedHotelId)?.name || "";

  // ----- check-in -----
  function openCheckIn(room) {
    setError("");
    setRoomQuery("");
    setCustomerQuery("");
    setShowRoomSuggestions(false);
    setShowCustomerSuggestions(false);
    setCheckInForm({
      ...EMPTY_CHECKIN,
      room_id: room?.id || "",
      rate_per_night: room?.room_type?.base_price ?? "",
    });
  }

  const availableRooms = useMemo(
    () =>
      roomsWithStatus.filter((r) => !r.activeStay && r.status !== "occupied"),
    [roomsWithStatus],
  );

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === checkInForm?.room_id) || null,
    [rooms, checkInForm?.room_id],
  );

  const roomSuggestions = useMemo(() => {
    const q = roomQuery.trim().toLowerCase();
    const list = !q
      ? availableRooms
      : availableRooms.filter(
          (r) =>
            String(r.room_number).toLowerCase().includes(q) ||
            (r.room_type?.name || "").toLowerCase().includes(q),
        );
    return list.slice(0, 8);
  }, [roomQuery, availableRooms]);

  function selectRoom(room) {
    setCheckInForm((prev) => ({
      ...prev,
      room_id: room.id,
      rate_per_night: prev?.rate_per_night || room.room_type?.base_price || "",
    }));
    setRoomQuery("");
    setShowRoomSuggestions(false);
  }

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === checkInForm?.customer_id) || null,
    [customers, checkInForm?.customer_id],
  );

  const customerSuggestions = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    const qn = q.replace(/\s+/g, "");
    if (!q) return customers.slice(0, 8);
    return customers
      .filter((c) => {
        const cp = (c.phone || "").replace(/\s+/g, "").toLowerCase();
        const cn = (c.full_name || "").toLowerCase();
        return cp.includes(qn) || cn.includes(q);
      })
      .slice(0, 8);
  }, [customerQuery, customers]);

  function applyCustomer(c) {
    setCheckInForm((prev) => ({
      ...prev,
      customer_id: c.id,
      guest_name: c.full_name || prev.guest_name,
      guest_phone: c.phone || prev.guest_phone,
    }));
    setCustomerQuery("");
    setShowCustomerSuggestions(false);
  }

  function handleCustomerQueryChange(e) {
    const v = e.target.value;
    setCustomerQuery(v);
    setShowCustomerSuggestions(true);
    const digits = v.replace(/\s+/g, "");
    if (digits.length >= 6) {
      const exact = customers.find(
        (c) => (c.phone || "").replace(/\s+/g, "") === digits,
      );
      if (exact) applyCustomer(exact);
    }
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
      room: stay.room?.room_number,
      guest_name: stay.guest_name || stay.customer?.full_name || "",
      guest_phone: stay.guest_phone || stay.customer?.phone || "",
      rate_per_night: stay.rate_per_night,
      nights: stay.nights,
      notes: stay.notes || "",
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
      <div className="flex min-h-[60vh] items-center justify-center p-6 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.common?.loading || "Loading..."}
        </p>
      </div>
    );
  }

  const tabs = [
    ["all", t.roomStays?.all || "All", stats.total],
    ["available", t.roomStays?.available || "Available", stats.available],
    ["occupied", t.roomStays?.occupied || "Occupied", stats.occupied],
  ];

  const checkInTotal =
    (Number(checkInForm?.rate_per_night) || 0) *
    (Number(checkInForm?.nights) || 1);

  return (
    <div
      className="mx-auto max-w-[100%] overflow-x-hidden bg-gray-50/60 p-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100 sm:p-6"
      dir={dir}
    >
      {/* ===== header ===== */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t.roomStays?.title || "Front Desk"}
          </h1>
          {isOwner && hotels.length > 1 ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t.branch?.hotelLabel}:
              </span>
              <select
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
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
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
            aria-label="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:text-teal-700 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => openCheckIn(null)}
            disabled={!branchId}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 disabled:opacity-50 disabled:shadow-none"
          >
            <Plus size={16} />
            {t.roomStays?.checkIn || "Check in"}
          </button>
        </div>
      </div>

      {/* ===== stats ===== */}
      {branchId && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            icon={Layers}
            tone="gray"
            label={t.roomStays?.totalRooms || "Total rooms"}
            value={stats.total}
          />
          <Stat
            icon={DoorOpen}
            tone="teal"
            label={t.roomStays?.available || "Available"}
            value={stats.available}
          />
          <Stat
            icon={DoorClosed}
            tone="amber"
            label={t.roomStays?.occupied || "Occupied"}
            value={stats.occupied}
          />
          <Stat
            icon={Wallet}
            tone="emerald"
            label={t.roomStays?.openBalance || "Open balance"}
            value={money(stats.open)}
          />
        </div>
      )}

      {/* ===== filters ===== */}
      {branchId && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-gray-200/70 p-1 dark:bg-gray-800">
            {tabs.map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                  filter === key
                    ? "bg-white text-teal-800 shadow-sm dark:bg-gray-700 dark:text-teal-200"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {label}{" "}
                <span className="ms-1 text-xs tabular-nums opacity-60">
                  {count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                t.roomStays?.searchRooms || "Search room, type or guest…"
              }
              className={`${inputCls} ps-9`}
            />
          </div>
        </div>
      )}

      {error && !checkInForm && !editForm && !checkoutFor && (
        <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {/* ===== rooms grid ===== */}
      {loading && rooms.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <p className="mb-1 font-semibold">
            {rooms.length === 0
              ? t.roomStays?.noRooms || "No rooms in this branch"
              : t.roomStays?.noResults || "No rooms match your filters"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {rooms.length === 0
              ? t.roomStays?.noRoomsHint ||
                "Add rooms from the Rooms page first."
              : t.roomStays?.noResultsHint ||
                "Try another status or search term."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleRooms.map((r) => {
            const stay = r.activeStay;
            const occupied = !!stay;
            const guest =
              stay?.guest_name || stay?.customer?.full_name || "Walk-in";
            const phone = stay?.guest_phone || stay?.customer?.phone;
            return (
              <div
                key={r.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div
                  className={`h-1.5 ${occupied ? "bg-amber-500" : "bg-teal-500"}`}
                />

                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-2xl font-bold leading-none tabular-nums">
                        {r.room_number}
                      </div>
                      <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {r.room_type?.name || "—"}
                        {r.floor
                          ? ` · ${t.rooms?.floorShort || "Floor"} ${r.floor}`
                          : ""}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        occupied
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                          : "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${occupied ? "bg-amber-500" : "bg-teal-500"}`}
                      />
                      {occupied
                        ? t.roomStays?.occupied || "Occupied"
                        : t.roomStays?.available || "Available"}
                    </span>
                  </div>

                  {occupied ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                          {initials(guest)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {guest}
                          </div>
                          <div className="flex items-center gap-1.5 truncate text-xs text-gray-500 dark:text-gray-400">
                            {phone ? (
                              <>
                                <Phone size={11} />
                                <span dir="ltr">{phone}</span>
                              </>
                            ) : (
                              <>
                                <Clock size={11} />
                                {stay.nights} {t.roomStays?.nights || "nights"}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-900/60">
                        <div className="flex justify-between text-gray-500 dark:text-gray-400">
                          <span>
                            {t.roomStays?.rent || "Rent"} · {stay.nights}×
                            {money(stay.rate_per_night)}
                          </span>
                          <span className="tabular-nums text-gray-800 dark:text-gray-200">
                            {money(stay.rent_total)}
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between text-gray-500 dark:text-gray-400">
                          <span>{t.roomStays?.orders || "Orders"}</span>
                          <span className="tabular-nums text-gray-800 dark:text-gray-200">
                            {money(stay.orders_total)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between border-t border-dashed border-gray-300 pt-2 dark:border-gray-600">
                          <span className="font-semibold">
                            {t.roomStays?.total || "Total"}
                          </span>
                          <span className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
                            {money(stay.grand_total)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto flex gap-2">
                        <button
                          onClick={() => openEdit(stay)}
                          aria-label={t.common?.edit || "Edit"}
                          title={t.common?.edit || "Edit"}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => extendStay(stay.id, 1)}
                          disabled={saving}
                          title="+1 night"
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <CalendarPlus size={14} /> +1
                        </button>
                        <button
                          onClick={() => openCheckout(stay)}
                          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <LogOut size={14} />{" "}
                          {t.roomStays?.checkout || "Check out"}
                        </button>
                        <button
                          onClick={() => cancelStay(stay)}
                          aria-label={t.roomStays?.cancelStay || "Cancel stay"}
                          title={t.roomStays?.cancelStay || "Cancel stay"}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-1 items-center gap-3 rounded-xl bg-teal-50/70 px-3 py-4 dark:bg-teal-900/20">
                        <BedDouble
                          size={22}
                          className="text-teal-600 dark:text-teal-300"
                        />
                        <div>
                          <div className="text-lg font-bold tabular-nums text-teal-800 dark:text-teal-200">
                            {r.room_type?.base_price != null
                              ? money(r.room_type.base_price)
                              : "—"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t.roomStays?.perNight || "per night"}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => openCheckIn(r)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                      >
                        <Plus size={15} /> {t.roomStays?.checkIn || "Check in"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== check-in modal ===== */}
      {checkInForm && (
        <Modal
          wide
          icon={DoorOpen}
          title={t.roomStays?.checkInTitle || "Check in guest"}
          subtitle={
            selectedRoom
              ? `${t.roomStays?.room || "Room"} ${selectedRoom.room_number}`
              : undefined
          }
          error={error}
          onClose={() => setCheckInForm(null)}
          onSubmit={submitCheckIn}
          footer={
            <>
              <GhostBtn onClick={() => setCheckInForm(null)}>
                {t.common?.cancel || "Cancel"}
              </GhostBtn>
              <PrimaryBtn disabled={saving || !checkInForm.room_id}>
                {saving
                  ? t.common?.saving || "Saving…"
                  : t.roomStays?.checkIn || "Check in"}
              </PrimaryBtn>
            </>
          }
        >
          <Section title={t.roomStays?.room || "Room"}>
            {selectedRoom ? (
              <SelectedChip
                onClear={() => setCheckInForm((p) => ({ ...p, room_id: "" }))}
              >
                #{selectedRoom.room_number}
                {selectedRoom.room_type?.name
                  ? ` — ${selectedRoom.room_type.name}`
                  : ""}
              </SelectedChip>
            ) : (
              <div className="relative">
                <input
                  value={roomQuery}
                  onChange={(e) => {
                    setRoomQuery(e.target.value);
                    setShowRoomSuggestions(true);
                  }}
                  onFocus={() => setShowRoomSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowRoomSuggestions(false), 150)
                  }
                  placeholder={
                    t.roomStays?.pickRoom || "Search room number or type…"
                  }
                  className={inputCls}
                />
                {showRoomSuggestions && (
                  <Suggestions>
                    {roomSuggestions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {t.roomStays?.noRoomsMatch ||
                          "No available rooms match."}
                      </div>
                    ) : (
                      roomSuggestions.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectRoom(r)}
                          className={suggestionCls}
                        >
                          <div className="font-semibold">
                            #{r.room_number}
                            {r.room_type?.name ? ` — ${r.room_type.name}` : ""}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {r.room_type?.base_price != null
                              ? `${r.room_type.base_price} / ${t.roomStays?.night || "night"}`
                              : ""}
                            {r.floor
                              ? ` · ${t.rooms?.floorShort || "Floor"} ${r.floor}`
                              : ""}
                          </div>
                        </button>
                      ))
                    )}
                  </Suggestions>
                )}
              </div>
            )}
          </Section>

          <Section title={t.roomStays?.guestSection || "Guest"}>
            {selectedCustomer ? (
              <SelectedChip
                onClear={() =>
                  setCheckInForm((p) => ({ ...p, customer_id: "" }))
                }
              >
                {selectedCustomer.full_name || "Unnamed"}
                {selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ""}
              </SelectedChip>
            ) : (
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={customerQuery}
                  onChange={handleCustomerQueryChange}
                  onFocus={() => setShowCustomerSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowCustomerSuggestions(false), 150)
                  }
                  placeholder={
                    t.roomStays?.searchCustomer ||
                    "Find existing customer by phone or name…"
                  }
                  className={`${inputCls} ps-9`}
                />
                {showCustomerSuggestions && (
                  <Suggestions>
                    {customerSuggestions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {t.roomStays?.noCustomerMatch || "No customers found."}
                      </div>
                    ) : (
                      customerSuggestions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyCustomer(c)}
                          className={suggestionCls}
                        >
                          <div className="font-semibold">
                            {c.full_name || "Unnamed"}
                          </div>
                          {c.phone && (
                            <div
                              className="text-xs text-gray-500 dark:text-gray-400"
                              dir="ltr"
                            >
                              {c.phone}
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </Suggestions>
                )}
                <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  {t.roomStays?.walkInHint ||
                    "Skip this for a walk-in guest and fill in the details below."}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <UserRound
                  size={15}
                  className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  placeholder={t.roomStays?.guestName || "Guest name"}
                  value={checkInForm.guest_name}
                  onChange={(e) =>
                    setCheckInForm({
                      ...checkInForm,
                      guest_name: e.target.value,
                    })
                  }
                  className={`${inputCls} ps-9`}
                />
              </div>
              <div className="relative">
                <Phone
                  size={15}
                  className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400"
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
                  className={`${inputCls} ps-9`}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="relative">
              <IdCard
                size={15}
                className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                placeholder={t.roomStays?.guestId || "ID / Passport (optional)"}
                value={checkInForm.guest_id_no}
                onChange={(e) =>
                  setCheckInForm({
                    ...checkInForm,
                    guest_id_no: e.target.value,
                  })
                }
                className={`${inputCls} ps-9`}
              />
            </div>
          </Section>

          <Section title={t.roomStays?.stayDetails || "Stay"}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t.roomStays?.rate || "Rate / night"}>
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
                  className={inputCls}
                />
              </Field>
              <Field label={t.roomStays?.nights || "Nights"}>
                <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <button
                    type="button"
                    onClick={() =>
                      setCheckInForm((p) => ({
                        ...p,
                        nights: Math.max(1, (Number(p.nights) || 1) - 1),
                      }))
                    }
                    className="px-3.5 py-2.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Minus size={14} />
                  </button>
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
                    className="w-full bg-transparent text-center text-sm font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCheckInForm((p) => ({
                        ...p,
                        nights: (Number(p.nights) || 1) + 1,
                      }))
                    }
                    className="px-3.5 py-2.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </Field>
            </div>
            <textarea
              placeholder={t.roomStays?.notes || "Notes (optional)"}
              value={checkInForm.notes}
              onChange={(e) =>
                setCheckInForm({ ...checkInForm, notes: e.target.value })
              }
              className={inputCls}
              rows={2}
            />
          </Section>

          <div className="flex items-baseline justify-between rounded-2xl bg-teal-700 px-5 py-4 text-white">
            <span className="text-sm text-teal-100">
              {Number(checkInForm.nights) || 1} ×{" "}
              {money(checkInForm.rate_per_night)}
            </span>
            <span className="text-2xl font-bold tabular-nums">
              {money(checkInTotal)}
            </span>
          </div>
        </Modal>
      )}

      {/* ===== edit modal ===== */}
      {editForm && (
        <Modal
          icon={Pencil}
          title={t.roomStays?.editStay || "Edit stay"}
          subtitle={
            editForm.room
              ? `${t.roomStays?.room || "Room"} ${editForm.room}`
              : undefined
          }
          error={error}
          onClose={() => setEditForm(null)}
          onSubmit={saveEdit}
          footer={
            <>
              <GhostBtn onClick={() => setEditForm(null)}>
                {t.common?.cancel || "Cancel"}
              </GhostBtn>
              <PrimaryBtn disabled={saving}>
                {saving
                  ? t.common?.saving || "Saving…"
                  : t.common?.save || "Save changes"}
              </PrimaryBtn>
            </>
          }
        >
          <Field label={t.roomStays?.guestName || "Guest name"}>
            <input
              value={editForm.guest_name}
              onChange={(e) =>
                setEditForm({ ...editForm, guest_name: e.target.value })
              }
              className={inputCls}
            />
          </Field>
          <Field label={t.roomStays?.guestPhone || "Phone"}>
            <input
              value={editForm.guest_phone}
              onChange={(e) =>
                setEditForm({ ...editForm, guest_phone: e.target.value })
              }
              className={inputCls}
              dir="ltr"
            />
          </Field>
          <Field label={t.roomStays?.rate || "Rate / night"}>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editForm.rate_per_night}
              onChange={(e) =>
                setEditForm({ ...editForm, rate_per_night: e.target.value })
              }
              className={inputCls}
            />
          </Field>
          <Field label={t.roomStays?.notes || "Notes"}>
            <textarea
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
              className={inputCls}
              rows={3}
            />
          </Field>
        </Modal>
      )}

      {/* ===== checkout modal ===== */}
      {checkoutFor && (
        <Modal
          icon={LogOut}
          title={t.roomStays?.checkoutTitle || "Check out"}
          subtitle={`${t.roomStays?.room || "Room"} ${checkoutFor.room?.room_number ?? ""}`}
          error={error}
          onClose={() => setCheckoutFor(null)}
          onSubmit={submitCheckout}
          footer={
            <>
              <GhostBtn onClick={() => setCheckoutFor(null)}>
                {t.common?.cancel || "Cancel"}
              </GhostBtn>
              <PrimaryBtn color="emerald" disabled={saving}>
                {saving
                  ? t.common?.saving || "Saving…"
                  : `${t.roomStays?.checkout || "Check out"} · ${money(checkoutFor.grand_total)}`}
              </PrimaryBtn>
            </>
          }
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              {initials(
                checkoutFor.guest_name || checkoutFor.customer?.full_name || "",
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold">
                {checkoutFor.guest_name ||
                  checkoutFor.customer?.full_name ||
                  "Walk-in"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {checkoutFor.nights} {t.roomStays?.nights || "nights"}
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl bg-gray-50 p-4 text-sm dark:bg-gray-900/60">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                {t.roomStays?.rent || "Rent"}
              </span>
              <span className="tabular-nums">
                {money(checkoutFor.rent_total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                {t.roomStays?.orders || "Orders"}
              </span>
              <span className="tabular-nums">
                {money(checkoutFor.orders_total)}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-dashed border-gray-300 pt-3 dark:border-gray-600">
              <span className="font-semibold">
                {t.roomStays?.total || "Total due"}
              </span>
              <span className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {money(checkoutFor.grand_total)}
              </span>
            </div>
          </div>

          {paymentMethods.length > 0 && (
            <Field label={t.roomStays?.paymentMethod || "Payment method"}>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCheckoutPaymentMethodId(p.id)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      checkoutPaymentMethodId === p.id
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-500/15 dark:bg-emerald-900/30 dark:text-emerald-200"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </Modal>
      )}
    </div>
  );
}
