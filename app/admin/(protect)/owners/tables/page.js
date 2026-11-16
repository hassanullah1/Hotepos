"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  X,
  LayoutGrid,
  Armchair,
  UtensilsCrossed,
  MapPin,
  Minus,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const EMPTY_AREA = { id: null, name: "" };
const EMPTY_TABLE = {
  id: null,
  table_number: "",
  capacity: 4,
  area_id: "",
  status: "available",
};
const STATUSES = ["available", "occupied", "reserved", "disabled"];

const STATUS = {
  available: {
    bar: "bg-emerald-500",
    pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
    seat: "bg-emerald-400",
  },
  occupied: {
    bar: "bg-amber-500",
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
    seat: "bg-amber-400",
  },
  reserved: {
    bar: "bg-sky-500",
    pill: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
    seat: "bg-sky-400",
  },
  disabled: {
    bar: "bg-gray-400",
    pill: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    seat: "bg-gray-400",
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

function Footer({ onCancel, saving, t }) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        {t.tables.modals.cancel}
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 disabled:opacity-50 disabled:shadow-none"
      >
        {saving ? t.tables.modals.saving : t.tables.modals.save}
      </button>
    </>
  );
}

// A tiny top-down table: round tabletop with one dot per seat (max 10 drawn)
function TableGlyph({ seats = 4, status }) {
  const n = Math.min(Math.max(Number(seats) || 1, 1), 10);
  const color = (STATUS[status] || STATUS.available).seat;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <div className="absolute inset-3 rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-700 dark:ring-gray-600" />
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        return (
          <span
            key={i}
            className={`absolute h-2.5 w-2.5 rounded-full ${color}`}
            style={{
              left: `calc(50% + ${Math.cos(a) * 26}px - 5px)`,
              top: `calc(50% + ${Math.sin(a) * 26}px - 5px)`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- page ---------- */

export default function TablesPage() {
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

  const [areas, setAreas] = useState([]);
  const [activeArea, setActiveArea] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const [areaForm, setAreaForm] = useState(null);
  const [tableForm, setTableForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const branchesReady = !loadingBranches && branchesHotelId === selectedHotelId;
  const statusLabel = (s) => t.tables.tables.statuses[s] || s;

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

  useEffect(() => {
    if (!isOwner) return;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/owners/hotel");
        if (!res.ok) {
          if (res.status === 401) return router.push("/hotel/login");
          throw new Error(t.tables.loadHotelsError || "Failed to load hotels");
        }
        const data = await res.json();
        setHotels(data.hotels || []);
        setSelectedHotelId(data.selectedHotelId || data.hotels?.[0]?.id || "");
      } catch (err) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  async function loadBranches(hotelId) {
    if (!hotelId) return;
    setLoadingBranches(true);
    setBranches([]);
    setBranchesHotelId("");
    try {
      const res = await fetchWithAuth(`/api/branches?hotel_id=${hotelId}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        throw new Error(
          t.tables.loadBranchesError || "Failed to load branches",
        );
      }
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

  useEffect(() => {
    if (isOwner && selectedHotelId) {
      setBranchId("");
      setActiveArea("");
      setError("");
      loadBranches(selectedHotelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, selectedHotelId]);

  useEffect(() => {
    if (isBranchManager && me?.branch?.id) setBranchId(me.branch.id);
  }, [isBranchManager, me]);

  useEffect(() => {
    if (isOwner && branchesReady && !branchId && branches.length > 0)
      setBranchId(branches[0].id);
  }, [isOwner, branchesReady, branches, branchId]);

  async function loadAreas() {
    if (!branchId) return;
    try {
      const res = await fetchWithAuth(
        `/api/owners/dining-areas?branch_id=${branchId}`,
      );
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        throw new Error(t.tables.loadAreasError || "Failed to load areas");
      }
      setAreas((await res.json()).areas || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadTables() {
    if (!branchId) return;
    setLoadingTables(true);
    try {
      const res = await fetchWithAuth(
        `/api/owners/dining-tables?branch_id=${branchId}`,
      );
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        throw new Error(t.tables.loadTablesError || "Failed to load tables");
      }
      setTables((await res.json()).tables || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTables(false);
    }
  }

  useEffect(() => {
    if (branchId) {
      setActiveArea("");
      loadAreas();
      loadTables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  // ---------- derived ----------
  const areaTables = useMemo(
    () =>
      activeArea ? tables.filter((tb) => tb.area?.id === activeArea) : tables,
    [tables, activeArea],
  );

  const counts = useMemo(() => {
    const c = { all: areaTables.length };
    for (const s of STATUSES)
      c[s] = areaTables.filter((tb) => tb.status === s).length;
    return c;
  }, [areaTables]);

  const visibleTables = useMemo(
    () =>
      statusFilter === "all"
        ? areaTables
        : areaTables.filter((tb) => tb.status === statusFilter),
    [areaTables, statusFilter],
  );

  const totalSeats = useMemo(
    () => areaTables.reduce((s, tb) => s + (Number(tb.capacity) || 0), 0),
    [areaTables],
  );

  // ---------- area handlers ----------
  function openCreateArea() {
    setError("");
    if (!branchId)
      return setError(
        t.tables.errors.selectBranch || "Please select a branch first",
      );
    setAreaForm({ ...EMPTY_AREA });
  }

  async function saveArea(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const isEdit = !!areaForm.id;
    try {
      const res = await fetchWithAuth(
        isEdit
          ? `/api/owners/dining-areas/${areaForm.id}`
          : "/api/owners/dining-areas",
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify({ ...areaForm, branch_id: branchId }),
        },
      );
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        const data = await res.json();
        return setError(
          data.error || t.tables.errors.saveArea || "Failed to save area",
        );
      }
      setAreaForm(null);
      loadAreas();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteArea(a) {
    if (
      !confirm(
        t.tables.areas.confirmDelete?.replace("{name}", a.name) ||
          `Delete area "${a.name}"?`,
      )
    )
      return;
    try {
      const res = await fetchWithAuth(`/api/owners/dining-areas/${a.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        const data = await res.json();
        return alert(
          data.error || t.tables.errors.deleteArea || "Failed to delete area",
        );
      }
      if (activeArea === a.id) setActiveArea("");
      loadAreas();
      loadTables();
    } catch (err) {
      alert(err.message);
    }
  }

  // ---------- table handlers ----------
  function openCreateTable() {
    setError("");
    if (!branchId)
      return setError(
        t.tables.errors.selectBranch || "Please select a branch first",
      );
    setTableForm({ ...EMPTY_TABLE, area_id: activeArea || "" });
  }

  function openEditTable(tb) {
    setError("");
    setTableForm({
      id: tb.id,
      table_number: tb.table_number,
      capacity: tb.capacity ?? 4,
      area_id: tb.area?.id || "",
      status: tb.status || "available",
    });
  }

  async function saveTable(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const isEdit = !!tableForm.id;
    const payload = {
      ...tableForm,
      capacity: Number(tableForm.capacity),
      branch_id: branchId,
    };
    delete payload.id;
    try {
      const res = await fetchWithAuth(
        isEdit
          ? `/api/owners/dining-tables/${tableForm.id}`
          : "/api/owners/dining-tables",
        { method: isEdit ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        const data = await res.json();
        return setError(
          data.error || t.tables.errors.saveTable || "Failed to save table",
        );
      }
      setTableForm(null);
      loadTables();
      loadAreas();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTable(tb) {
    if (
      !confirm(
        t.tables.areas.confirmDeleteTable?.replace(
          "{number}",
          tb.table_number,
        ) || `Delete table "${tb.table_number}"?`,
      )
    )
      return;
    try {
      const res = await fetchWithAuth(`/api/owners/dining-tables/${tb.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        if (res.status === 401) return router.push("/hotel/login");
        const data = await res.json();
        return alert(
          data.error || t.tables.errors.deleteTable || "Failed to delete table",
        );
      }
      loadTables();
      loadAreas();
    } catch (err) {
      alert(err.message);
    }
  }

  async function quickStatus(tb, status) {
    // optimistic update, reload on failure
    setTables((list) =>
      list.map((x) => (x.id === tb.id ? { ...x, status } : x)),
    );
    try {
      const res = await fetchWithAuth(`/api/owners/dining-tables/${tb.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, branch_id: branchId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      loadTables();
    }
  }

  // ---------- render ----------
  if (!me) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center p-6 dark:bg-gray-900"
        dir={dir}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.common.loading || "Loading..."}
        </p>
      </div>
    );
  }

  const selectedHotelName =
    hotels.find((h) => h.id === selectedHotelId)?.name || "";
  const subtitle =
    isOwner && hotels.length > 0
      ? selectedHotelName
      : isBranchManager
        ? me.branch?.name || t.tables.branchLabel
        : "";
  const showPageError = error && !areaForm && !tableForm;

  const areaItems = [
    {
      id: "",
      name: t.tables.areas.allTables,
      table_count: tables.length,
      all: true,
    },
    ...areas,
  ];

  return (
    <div
      className="mx-auto min-h-screen max-w-7xl bg-gray-50/60 p-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100 sm:p-6"
      dir={dir}
    >
      {/* ===== header ===== */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/30">
            <UtensilsCrossed size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {t.tables.title}
            </h1>
            {subtitle && (
              <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOwner && hotels.length > 1 && (
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium dark:border-gray-700 dark:bg-gray-800 sm:flex-none"
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}
          {isOwner && (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={!branchesReady || branches.length === 0}
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 sm:flex-none"
            >
              {!branchesReady && <option>{t.tables.loadingBranches}</option>}
              {branchesReady && branches.length === 0 && (
                <option>{t.tables.noBranches}</option>
              )}
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={openCreateTable}
            disabled={!branchId}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 disabled:opacity-50 disabled:shadow-none sm:w-auto"
          >
            <Plus size={16} />
            {t.tables.tables.add}
          </button>
        </div>
      </div>

      {showPageError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_1fr]">
        {/* ===== areas: chips on mobile, sidebar on desktop ===== */}
        <aside className="min-w-0 lg:sticky lg:top-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <MapPin size={14} className="text-teal-600" />
              {t.tables.areas.title}
            </h2>
            <button
              onClick={openCreateArea}
              disabled={!branchId}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-40 dark:text-teal-300 dark:hover:bg-teal-900/30"
            >
              <Plus size={13} />
              {t.tables.areas.add}
            </button>
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {areaItems.map((a) => {
              const active = activeArea === a.id;
              return (
                <div
                  key={a.id || "all"}
                  className={`group flex shrink-0 items-center rounded-xl border transition lg:shrink ${
                    active
                      ? "border-teal-600 bg-teal-700 text-white shadow-md shadow-teal-700/20"
                      : "border-gray-200 bg-white hover:border-teal-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-teal-700"
                  }`}
                >
                  <button
                    onClick={() => setActiveArea(a.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-start"
                  >
                    {a.all ? (
                      <LayoutGrid size={15} className="shrink-0 opacity-70" />
                    ) : (
                      <MapPin size={15} className="shrink-0 opacity-70" />
                    )}
                    <span className="min-w-0 flex-1 truncate whitespace-nowrap text-sm font-semibold">
                      {a.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                        active
                          ? "bg-white/20"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {a.table_count ?? 0}
                    </span>
                  </button>
                  {!a.all && (
                    <div className="flex pe-1.5 lg:opacity-0 lg:transition lg:group-hover:opacity-100 lg:focus-within:opacity-100">
                      <button
                        onClick={() => setAreaForm(a)}
                        aria-label="Edit area"
                        className={`rounded-md p-1.5 ${active ? "hover:bg-white/20" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteArea(a)}
                        aria-label="Delete area"
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

        {/* ===== tables ===== */}
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h2 className="text-sm font-bold">{t.tables.tables.title}</h2>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Users size={12} /> {totalSeats}
              </span>
            </div>
            <div className="-mx-4 flex max-w-[100vw] gap-1 overflow-x-auto px-4 sm:mx-0 sm:max-w-full sm:px-0">
              <div className="flex gap-1 rounded-xl bg-gray-200/70 p-1 dark:bg-gray-800">
                {["all", ...STATUSES].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
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
                    {s === "all" ? t.tables.areas.allTables : statusLabel(s)}
                    <span className="tabular-nums opacity-60">{counts[s]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingTables ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-800"
                />
              ))}
            </div>
          ) : visibleTables.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-gray-700">
              <Armchair className="mx-auto mb-3 text-gray-400" size={32} />
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {t.tables.tables.noTables}
              </p>
              {tables.length === 0 && (
                <button
                  onClick={openCreateTable}
                  disabled={!branchId}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"
                >
                  <Plus size={16} />
                  {t.tables.tables.add}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleTables.map((tb) => {
                const st = STATUS[tb.status] || STATUS.available;
                return (
                  <div
                    key={tb.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className={`h-1.5 ${st.bar}`} />
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="flex items-center gap-4">
                        <TableGlyph seats={tb.capacity} status={tb.status} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xl font-bold leading-tight">
                            {t.tables.tables.tableNumber.replace(
                              "{number}",
                              tb.table_number,
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1">
                              <Users size={12} /> {tb.capacity}
                            </span>
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <MapPin size={12} className="shrink-0" />
                              <span className="truncate">
                                {tb.area?.name || t.tables.tables.noArea}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex self-start sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                          <button
                            onClick={() => openEditTable(tb)}
                            aria-label="Edit table"
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-teal-700 dark:hover:bg-gray-700"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => deleteTable(tb)}
                            aria-label="Delete table"
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className={`relative mt-auto rounded-lg ${st.pill}`}>
                        <span
                          className={`pointer-events-none absolute start-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${st.bar}`}
                        />
                        <select
                          value={tb.status}
                          onChange={(e) => quickStatus(tb, e.target.value)}
                          aria-label={t.tables.tables.statusLabel || "Status"}
                          className="w-full cursor-pointer appearance-none rounded-lg bg-transparent py-1.5 ps-6 pe-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-teal-500/40"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="text-gray-900">
                              {statusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ===== area modal ===== */}
      {areaForm && (
        <Modal
          icon={MapPin}
          title={
            areaForm.id ? t.tables.modals.area.edit : t.tables.modals.area.add
          }
          error={error}
          onClose={() => setAreaForm(null)}
          onSubmit={saveArea}
          footer={
            <Footer onCancel={() => setAreaForm(null)} saving={saving} t={t} />
          }
        >
          <Field label={t.tables.modals.area.namePlaceholder}>
            <input
              required
              autoFocus
              value={areaForm.name}
              onChange={(e) =>
                setAreaForm({ ...areaForm, name: e.target.value })
              }
              className={inputCls}
            />
          </Field>
        </Modal>
      )}

      {/* ===== table modal ===== */}
      {tableForm && (
        <Modal
          icon={Armchair}
          title={
            tableForm.id
              ? t.tables.modals.table.edit
              : t.tables.modals.table.add
          }
          error={error}
          onClose={() => setTableForm(null)}
          onSubmit={saveTable}
          footer={
            <Footer onCancel={() => setTableForm(null)} saving={saving} t={t} />
          }
        >
          <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-gray-900/60">
            <TableGlyph seats={tableForm.capacity} status={tableForm.status} />
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {tableForm.table_number
                  ? t.tables.tables.tableNumber.replace(
                      "{number}",
                      tableForm.table_number,
                    )
                  : "—"}
              </div>
              <div className="flex items-center gap-1">
                <Users size={13} /> {Number(tableForm.capacity) || 0}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.tables.modals.table.numberPlaceholder}>
              <input
                required
                value={tableForm.table_number}
                onChange={(e) =>
                  setTableForm({ ...tableForm, table_number: e.target.value })
                }
                className={inputCls}
              />
            </Field>
            <Field label={t.tables.modals.table.capacityPlaceholder}>
              <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() =>
                    setTableForm((p) => ({
                      ...p,
                      capacity: Math.max(1, (Number(p.capacity) || 1) - 1),
                    }))
                  }
                  className="px-3 py-2.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Minus size={14} />
                </button>
                <input
                  required
                  type="number"
                  min="1"
                  value={tableForm.capacity}
                  onChange={(e) =>
                    setTableForm({ ...tableForm, capacity: e.target.value })
                  }
                  className="w-full bg-transparent text-center text-sm font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setTableForm((p) => ({
                      ...p,
                      capacity: (Number(p.capacity) || 0) + 1,
                    }))
                  }
                  className="px-3 py-2.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Plus size={14} />
                </button>
              </div>
            </Field>
          </div>

          <Field label={t.tables.areas.title}>
            <select
              value={tableForm.area_id}
              onChange={(e) =>
                setTableForm({ ...tableForm, area_id: e.target.value })
              }
              className={inputCls}
            >
              <option value="">{t.tables.modals.table.noAreaOption}</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t.tables.tables.statusLabel || "Status"}>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTableForm({ ...tableForm, status: s })}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    tableForm.status === s
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
        </Modal>
      )}
    </div>
  );
}
