"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { LOCALES } from "@/lib/i18n/translations";

const EMPTY_AREA = { id: null, name: "" };
const EMPTY_TABLE = {
  id: null,
  table_number: "",
  capacity: 4,
  area_id: "",
  status: "available",
};

// ---------- tiny inline icons (no extra deps) ----------
function IconUtensils({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 3v6a2 2 0 0 0 2 2v10M6 3v6a2 2 0 0 1-2 2v0M6 3v0M18 3c-1.7 0-3 2.2-3 5s1.3 5 3 5v8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChair({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 4h10v8H7V4ZM6 12h12l-1 8h-2l-.4-3H9.4L9 20H7l-1-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlus({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPencil({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 20l1-4.2L15.6 5.2a1.5 1.5 0 0 1 2.1 0l1.1 1.1a1.5 1.5 0 0 1 0 2.1L8.2 19 4 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrash({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTable({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <ellipse
        cx="12"
        cy="7"
        rx="8"
        ry="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4 7v3c0 1.7 3.6 3 8 3s8-1.3 8-3V7"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 13v8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 21h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const STATUS_DOT = {
  available: "bg-emerald-500",
  occupied: "bg-amber-500",
  reserved: "bg-teal-500",
  disabled: "bg-gray-400",
};

const STATUS_TEXT = {
  available: "text-emerald-700 dark:text-emerald-400",
  occupied: "text-amber-700 dark:text-amber-400",
  reserved: "text-teal-700 dark:text-teal-400",
  disabled: "text-gray-500 dark:text-gray-400",
};

const STATUS_BG = {
  available: "bg-emerald-50 dark:bg-emerald-950/40",
  occupied: "bg-amber-50 dark:bg-amber-950/40",
  reserved: "bg-teal-50 dark:bg-teal-950/40",
  disabled: "bg-gray-100 dark:bg-gray-800/40",
};

export default function TablesPage() {
  const router = useRouter();
  const { t, locale, setLocale, dir } = useAdminPreferences();

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

  const [areas, setAreas] = useState([]);
  const [activeArea, setActiveArea] = useState("");
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const [areaForm, setAreaForm] = useState(null);
  const [tableForm, setTableForm] = useState(null);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const branchesReady = !loadingBranches && branchesHotelId === selectedHotelId;

  // ---------- load current user ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");
        if (!res.ok) {
          if (res.status === 401) return router.push("/login");
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
  useEffect(() => {
    if (!isOwner) return;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/owners/hotel");
        if (!res.ok) {
          if (res.status === 401) return router.push("/login");
          throw new Error(t.tables.loadHotelsError || "Failed to load hotels");
        }
        const data = await res.json();
        setHotels(data.hotels || []);
        const defaultHotelId =
          data.selectedHotelId || data.hotels?.[0]?.id || "";
        setSelectedHotelId(defaultHotelId);
      } catch (err) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  // ---------- owner: load branches for selected hotel ----------
  async function loadBranches(hotelId) {
    if (!hotelId) return;
    setLoadingBranches(true);
    setBranches([]);
    setBranchesHotelId("");
    try {
      const res = await fetchWithAuth(`/api/branches?hotel_id=${hotelId}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
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

  // ---------- for branch managers: use their own branch ----------
  useEffect(() => {
    if (isBranchManager && me?.branch?.id) {
      setBranchId(me.branch.id);
    }
  }, [isBranchManager, me]);

  // ---------- auto-select first branch for owner ----------
  useEffect(() => {
    if (isOwner && branchesReady && !branchId && branches.length > 0) {
      setBranchId(branches[0].id);
    }
  }, [isOwner, branchesReady, branches, branchId]);

  // ---------- load areas and tables when branch changes ----------
  async function loadAreas() {
    if (!branchId) return;
    try {
      const res = await fetchWithAuth(
        `/api/owners/dining-areas?branch_id=${branchId}`,
      );
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error(t.tables.loadAreasError || "Failed to load areas");
      }
      const data = await res.json();
      setAreas(data.areas || []);
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
        if (res.status === 401) return router.push("/login");
        throw new Error(t.tables.loadTablesError || "Failed to load tables");
      }
      const data = await res.json();
      setTables(data.tables || []);
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

  const visibleTables = activeArea
    ? tables.filter((tb) => tb.area?.id === activeArea)
    : tables;

  // ---------- area handlers ----------
  function openCreateArea() {
    setError("");
    if (!branchId) {
      setError(t.tables.errors.selectBranch || "Please select a branch first");
      return;
    }
    setAreaForm({ ...EMPTY_AREA });
  }

  async function saveArea(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const isEdit = !!areaForm.id;
    const url = isEdit
      ? `/api/owners/dining-areas/${areaForm.id}`
      : "/api/owners/dining-areas";
    try {
      const res = await fetchWithAuth(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify({ ...areaForm, branch_id: branchId }),
      });
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        const data = await res.json();
        setError(
          data.error || t.tables.errors.saveArea || "Failed to save area",
        );
        return;
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
        if (res.status === 401) return router.push("/login");
        const data = await res.json();
        alert(
          data.error || t.tables.errors.deleteArea || "Failed to delete area",
        );
        return;
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
    if (!branchId) {
      setError(t.tables.errors.selectBranch || "Please select a branch first");
      return;
    }
    setTableForm({
      ...EMPTY_TABLE,
      area_id: activeArea || "",
    });
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
    const url = isEdit
      ? `/api/owners/dining-tables/${tableForm.id}`
      : "/api/owners/dining-tables";
    const payload = {
      ...tableForm,
      capacity: Number(tableForm.capacity),
      branch_id: branchId,
    };
    delete payload.id;
    try {
      const res = await fetchWithAuth(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        const data = await res.json();
        setError(
          data.error || t.tables.errors.saveTable || "Failed to save table",
        );
        return;
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
        if (res.status === 401) return router.push("/login");
        const data = await res.json();
        alert(
          data.error || t.tables.errors.deleteTable || "Failed to delete table",
        );
        return;
      }
      loadTables();
      loadAreas();
    } catch (err) {
      alert(err.message);
    }
  }

  // ---------- render ----------
  const selectedHotelName =
    hotels.find((h) => h.id === selectedHotelId)?.name || "";

  // If user not loaded yet, show loading
  if (!me) {
    return (
      <div
        className="min-h-screen bg-[#F4FAF9] dark:bg-[#0B2624] p-6 flex items-center justify-center"
        dir={dir}
      >
        <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
          {t.common.loading || "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen light:bg-[#F4FAF9] p-6" dir={dir}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-900/10">
              <IconUtensils className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-teal-950 dark:text-teal-50 tracking-tight">
                {t.tables.title}
              </h1>
              {isOwner && hotels.length > 1 ? (
                <div className="mt-1 flex items-center gap-2">
                  <label
                    htmlFor="hotel-select"
                    className="text-xs text-teal-700/70 dark:text-teal-300/70"
                  >
                    {t.tables.hotelLabel}
                  </label>
                  <select
                    id="hotel-select"
                    value={selectedHotelId}
                    onChange={(e) => setSelectedHotelId(e.target.value)}
                    className="border border-teal-200 dark:border-teal-800 rounded-full px-3 py-1 text-sm bg-white dark:bg-teal-950 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : isOwner && hotels.length === 1 ? (
                <p className="text-sm text-teal-700/70 dark:text-teal-300/70 mt-0.5">
                  {selectedHotelName}
                </p>
              ) : isBranchManager ? (
                <p className="text-sm text-teal-700/70 dark:text-teal-300/70 mt-0.5">
                  {me.branch?.name || t.tables.branchLabel}
                </p>
              ) : null}
            </div>
          </div>

          {/* Branch selector – only for owners */}
          {isOwner && (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={!branchesReady || branches.length === 0}
              className="border border-teal-200 dark:border-teal-800 rounded-full px-4 py-2 text-sm bg-white dark:bg-teal-950 text-teal-900 dark:text-teal-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-teal-400"
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

          {/* For branch managers, show static branch name instead of dropdown */}
          {isBranchManager && (
            <div className="border border-teal-200 dark:border-teal-800 rounded-full px-4 py-2 text-sm bg-white dark:bg-teal-950 text-teal-900 dark:text-teal-100">
              {me.branch?.name || t.tables.branchLabel}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-6">
          {/* Areas sidebar */}
          <div className="col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-sm text-teal-800/80 dark:text-teal-300/80">
                {t.tables.areas.title}
              </h2>
              <button
                onClick={openCreateArea}
                disabled={!branchId}
                className="h-6 w-6 rounded-full flex items-center justify-center text-teal-700 hover:bg-teal-100 dark:hover:bg-teal-900 disabled:opacity-40 transition-colors"
                aria-label={t.tables.areas.add}
              >
                <IconPlus className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => setActiveArea("")}
                  className={`w-full text-start px-3.5 py-2 rounded-xl text-sm transition-colors ${
                    activeArea === ""
                      ? "bg-teal-600 text-white shadow-sm shadow-teal-900/20"
                      : "text-teal-900 dark:text-teal-100 hover:bg-teal-100/70 dark:hover:bg-teal-900/50"
                  }`}
                >
                  {t.tables.areas.allTables}
                </button>
              </li>
              {areas.map((a) => (
                <li key={a.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => setActiveArea(a.id)}
                    className={`flex-1 text-start px-3.5 py-2 rounded-xl text-sm transition-colors ${
                      activeArea === a.id
                        ? "bg-teal-600 text-white shadow-sm shadow-teal-900/20"
                        : "text-teal-900 dark:text-teal-100 hover:bg-teal-100/70 dark:hover:bg-teal-900/50"
                    }`}
                  >
                    {a.name}{" "}
                    <span className="text-xs opacity-60">
                      ({a.table_count})
                    </span>
                  </button>
                  <button
                    onClick={() => setAreaForm(a)}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-teal-700/70 hover:text-teal-700 hover:bg-teal-100 dark:text-teal-300/70 dark:hover:text-teal-200 dark:hover:bg-teal-900 transition-colors shrink-0"
                    aria-label="Edit area"
                  >
                    <IconPencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deleteArea(a)}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors shrink-0"
                    aria-label="Delete area"
                  >
                    <IconTrash className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tables grid */}
          <div className="col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-sm text-teal-800/80 dark:text-teal-300/80">
                {t.tables.tables.title}
              </h2>
              <button
                onClick={openCreateTable}
                disabled={!branchId}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm shadow-teal-900/20 disabled:opacity-40 transition-colors"
              >
                <IconPlus className="h-3.5 w-3.5" />
                {t.tables.tables.add}
              </button>
            </div>

            {loadingTables ? (
              <div className="rounded-2xl border border-teal-100 dark:border-teal-800/60 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 border-b last:border-b-0 border-teal-100 dark:border-teal-800/60 bg-teal-100/40 dark:bg-teal-900/20 animate-pulse"
                  />
                ))}
              </div>
            ) : visibleTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-teal-200 dark:border-teal-800">
                <IconTable className="h-8 w-8 text-teal-300 dark:text-teal-700 mb-3" />
                <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
                  {t.tables.tables.noTables}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-teal-200 dark:border-teal-800 overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-teal-600 dark:bg-teal-700 text-white">
                      <th className="text-start font-medium px-4 py-3">
                        {t.tables.tables.title}
                      </th>
                      <th className="text-start font-medium px-4 py-3">
                        {t.tables.areas.title}
                      </th>
                      <th className="text-start font-medium px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <IconChair className="h-3.5 w-3.5" />
                          {t.tables.tables.capacityLabel || "Seats"}
                        </span>
                      </th>
                      <th className="text-start font-medium px-4 py-3">
                        {t.tables.tables.statusLabel || "Status"}
                      </th>
                      <th className="px-4 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTables.map((table, idx) => (
                      <tr
                        key={table.id}
                        className={`group border-t border-teal-100 dark:border-teal-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/40 transition-colors ${
                          idx % 2 === 1
                            ? "bg-teal-50/50 dark:bg-teal-950/30"
                            : "bg-white dark:bg-transparent"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-semibold text-teal-950 dark:text-white">
                            {t.tables.tables.tableNumber.replace(
                              "{number}",
                              table.table_number,
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-teal-700/80 dark:text-teal-300/70">
                          {table.area?.name || t.tables.tables.noArea}
                        </td>
                        <td className="px-4 py-3 text-teal-700/80 dark:text-teal-300/70">
                          {table.capacity}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              STATUS_BG[table.status] ||
                              "bg-gray-100 dark:bg-gray-800/40"
                            } ${STATUS_TEXT[table.status] || "text-gray-500"}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                STATUS_DOT[table.status] || "bg-gray-400"
                              }`}
                            />
                            {t.tables.tables.statuses[table.status] ||
                              table.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openEditTable(table)}
                              className="h-7 w-7 rounded-full flex items-center justify-center text-teal-700/70 hover:text-teal-700 hover:bg-teal-100 dark:text-teal-300/70 dark:hover:text-teal-200 dark:hover:bg-teal-900 transition-colors"
                              aria-label="Edit table"
                            >
                              <IconPencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTable(table)}
                              className="h-7 w-7 rounded-full flex items-center justify-center text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                              aria-label="Delete table"
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Area Modal */}
      {areaForm && (
        <div className="fixed inset-0 bg-teal-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={saveArea}
            className="bg-white dark:bg-teal-950 rounded-2xl p-6 w-full max-w-sm space-y-3 shadow-xl shadow-teal-950/20"
          >
            <h2 className="text-lg font-semibold text-teal-950 dark:text-white">
              {areaForm.id
                ? t.tables.modals.area.edit
                : t.tables.modals.area.add}
            </h2>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <input
              required
              placeholder={t.tables.modals.area.namePlaceholder}
              value={areaForm.name}
              onChange={(e) =>
                setAreaForm({ ...areaForm, name: e.target.value })
              }
              className="w-full border border-teal-200 dark:border-teal-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-teal-900/40 text-teal-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAreaForm(null)}
                className="px-4 py-2 text-sm rounded-full border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-colors"
              >
                {t.tables.modals.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? t.tables.modals.saving : t.tables.modals.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Modal */}
      {tableForm && (
        <div className="fixed inset-0 bg-teal-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={saveTable}
            className="bg-white dark:bg-teal-950 rounded-2xl p-6 w-full max-w-sm space-y-3 shadow-xl shadow-teal-950/20"
          >
            <h2 className="text-lg font-semibold text-teal-950 dark:text-white">
              {tableForm.id
                ? t.tables.modals.table.edit
                : t.tables.modals.table.add}
            </h2>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <input
              required
              placeholder={t.tables.modals.table.numberPlaceholder}
              value={tableForm.table_number}
              onChange={(e) =>
                setTableForm({ ...tableForm, table_number: e.target.value })
              }
              className="w-full border border-teal-200 dark:border-teal-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-teal-900/40 text-teal-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <select
              value={tableForm.area_id}
              onChange={(e) =>
                setTableForm({ ...tableForm, area_id: e.target.value })
              }
              className="w-full border border-teal-200 dark:border-teal-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-teal-900/40 text-teal-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">{t.tables.modals.table.noAreaOption}</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              min="1"
              placeholder={t.tables.modals.table.capacityPlaceholder}
              value={tableForm.capacity}
              onChange={(e) =>
                setTableForm({ ...tableForm, capacity: e.target.value })
              }
              className="w-full border border-teal-200 dark:border-teal-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-teal-900/40 text-teal-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <select
              value={tableForm.status}
              onChange={(e) =>
                setTableForm({ ...tableForm, status: e.target.value })
              }
              className="w-full border border-teal-200 dark:border-teal-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-teal-900/40 text-teal-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="available">
                {t.tables.tables.statuses.available}
              </option>
              <option value="occupied">
                {t.tables.tables.statuses.occupied}
              </option>
              <option value="reserved">
                {t.tables.tables.statuses.reserved}
              </option>
              <option value="disabled">
                {t.tables.tables.statuses.disabled}
              </option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTableForm(null)}
                className="px-4 py-2 text-sm rounded-full border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-colors"
              >
                {t.tables.modals.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? t.tables.modals.saving : t.tables.modals.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
