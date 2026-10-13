"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Search, Eye, Users, Banknote, X } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const EMPTY_FORM = {
  id: null,
  full_name: "",
  email: "",
  phone: "",
  username: "",
  role_id: "",
  branch_id: "",
  password: "",
  is_active: true,
};

// ---------- tiny inline icon (like TablesPage) ----------
function IconUsers({ className = "" }) {
  return <Users size={20} className={className} />;
}

// ---------- Shared UI primitives (updated with teal) ----------
const inputClass =
  "w-full rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950/40 px-3.5 py-2.5 text-sm text-teal-950 dark:text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent";
const selectClass = inputClass;
const labelClass =
  "block text-sm font-medium text-teal-800 dark:text-teal-300 mb-1";

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-teal-950 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-teal-200 dark:border-teal-800 px-4 py-2.5 text-sm font-medium text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-teal-950 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function IconButton({ tone = "default", title, className = "", ...props }) {
  const tones = {
    default:
      "text-teal-700/70 hover:text-teal-700 hover:bg-teal-100 dark:text-teal-300/70 dark:hover:text-teal-200 dark:hover:bg-teal-900/50",
    danger:
      "text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50",
  };
  return (
    <button
      {...props}
      title={title}
      aria-label={title}
      className={`shrink-0 rounded-full p-1.5 transition-colors ${tones[tone]} ${className}`}
    />
  );
}

export default function StaffPage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  // ---------- Current user ----------
  const [me, setMe] = useState(null);
  const isOwner = me?.role === "hotel_owner";
  const isBranchManager = me?.role === "branch_manager";

  // ---------- Owner: hotels & branches ----------
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchesHotelId, setBranchesHotelId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");

  // ---------- Staff data ----------
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  // ---------- Roles ----------
  const [roles, setRoles] = useState([]);

  // ---------- Form state ----------
  const [form, setForm] = useState(null);
  const [pendingEditStaff, setPendingEditStaff] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // ---------- Pay salary modal ----------
  const [showPayModal, setShowPayModal] = useState(false);

  const branchesReady = !loadingBranches && branchesHotelId === selectedHotelId;

  // ---------- Load current user ----------
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

  // ---------- Load roles ----------
  async function loadRoles() {
    try {
      const res = await fetchWithAuth("/api/roles");
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error("Failed to load roles");
      }
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (err) {
      console.error(err);
    }
  }

  // ---------- Owner: load hotels ----------
  async function loadHotels() {
    try {
      const res = await fetchWithAuth("/api/owners/hotel");
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error(t.staff.loadHotelsError);
      }
      const data = await res.json();
      setHotels(data.hotels || []);
      const defaultHotelId = data.selectedHotelId || data.hotels?.[0]?.id || "";
      setSelectedHotelId(defaultHotelId);
    } catch (err) {
      setError(err.message);
    }
  }

  // ---------- Owner: load branches ----------
  async function loadBranches(hotelId) {
    if (!hotelId) return;
    setLoadingBranches(true);
    setBranches([]);
    setBranchesHotelId("");
    try {
      const res = await fetchWithAuth(`/api/branches?hotel_id=${hotelId}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error(t.staff.loadBranchesError);
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

  // ---------- Load staff ----------
  async function loadStaff() {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (isOwner) {
        if (selectedHotelId) params.set("hotel_id", selectedHotelId);
        if (branchFilter) params.set("branch_id", branchFilter);
      } else if (isBranchManager) {
        if (me?.branch?.id) params.set("branch_id", me.branch.id);
        else {
          setStaff([]);
          setLoading(false);
          return;
        }
      } else {
        if (selectedHotelId) params.set("hotel_id", selectedHotelId);
        if (branchFilter) params.set("branch_id", branchFilter);
      }

      if (q) params.set("q", q);

      const res = await fetchWithAuth(`/api/owners/staff?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error(t.staff.loadStaffError);
      }
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---------- Initialisation ----------
  useEffect(() => {
    if (isOwner) {
      loadHotels();
      loadRoles();
    } else if (isBranchManager) {
      if (me?.branch?.id) {
        setBranchFilter(me.branch.id);
        if (me.branch.hotel_id) setSelectedHotelId(me.branch.hotel_id);
        setBranches([me.branch]);
        setBranchesHotelId(me.branch.hotel_id);
        loadRoles();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, isBranchManager, me]);

  // Owner: when hotel changes, reload branches & staff
  useEffect(() => {
    if (isOwner && selectedHotelId) {
      setBranchFilter("");
      if (!pendingEditStaff) setForm(null);
      setError("");
      loadBranches(selectedHotelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, selectedHotelId]);

  // Debounced staff load
  useEffect(() => {
    if (!me) return;
    const timer = setTimeout(loadStaff, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, branchFilter, selectedHotelId, me]);

  // ---------- Form handlers ----------
  function openCreate() {
    setError("");
    let defaultBranchId = "";

    if (isOwner) {
      if (!branchesReady) {
        setError(t.staff.branchesLoading);
        return;
      }
      if (branches.length === 0) {
        setError(t.staff.noBranchesError);
        return;
      }
      defaultBranchId = branches[0].id;
    } else if (isBranchManager) {
      if (!me?.branch?.id) {
        setError(t.staff.branchMismatchError);
        return;
      }
      defaultBranchId = me.branch.id;
    } else {
      setError(t.staff.branchMismatchError);
      return;
    }

    setForm({
      ...EMPTY_FORM,
      branch_id: defaultBranchId,
    });
  }

  function openEdit(s) {
    setError("");
    const branchId = s.branch?.id;
    if (!branchId) {
      setError(t.staff.branchMismatchError);
      return;
    }

    if (isOwner) {
      const hotelId = s.branch?.hotel_id;
      if (
        hotelId &&
        hotelId !== selectedHotelId &&
        hotels.some((h) => h.id === hotelId)
      ) {
        setPendingEditStaff(s);
        setSelectedHotelId(hotelId);
        return;
      }
    }

    if (isBranchManager && branchId !== me?.branch?.id) {
      setError(t.staff.branchMismatchError);
      return;
    }

    const roleUuid = roles.find((r) => r.name === s.role)?.id || "";

    setForm({
      id: s.id,
      full_name: s.full_name,
      email: s.email || "",
      phone: s.phone || "",
      username: s.username || "",
      role_id: roleUuid,
      branch_id: branchId,
      password: "",
      is_active: s.is_active,
    });
  }

  // Open edit after hotel switch (owner)
  useEffect(() => {
    if (pendingEditStaff && branchesReady) {
      const s = pendingEditStaff;
      const roleUuid = roles.find((r) => r.name === s.role)?.id || "";
      setForm({
        id: s.id,
        full_name: s.full_name,
        email: s.email || "",
        phone: s.phone || "",
        username: s.username || "",
        role_id: roleUuid,
        branch_id: s.branch.id,
        password: "",
        is_active: s.is_active,
      });
      setPendingEditStaff(null);
    }
  }, [pendingEditStaff, branchesReady, roles]);

  async function save(ev) {
    ev.preventDefault();
    setSaving(true);
    setError("");

    if (!form.branch_id) {
      setError(t.staff.branchRequired);
      setSaving(false);
      return;
    }

    if (isOwner) {
      if (!branchesReady) {
        setError(t.staff.branchesLoading);
        setSaving(false);
        return;
      }
      const branchExists = branches.some((b) => b.id === form.branch_id);
      if (!branchExists) {
        setError(t.staff.branchMismatchError);
        setSaving(false);
        return;
      }
    } else if (isBranchManager) {
      if (form.branch_id !== me?.branch?.id) {
        setError(t.staff.branchMismatchError);
        setSaving(false);
        return;
      }
    }

    const isEdit = !!form.id;
    const url = isEdit ? `/api/owners/staff/${form.id}` : "/api/owners/staff";
    const payload = {
      ...form,
      hotel_id: isOwner ? selectedHotelId : me?.branch?.hotel_id,
    };
    if (!payload.password) delete payload.password;
    delete payload.id;

    try {
      const res = await fetchWithAuth(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      if (res.status === 401) return router.push("/login");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.staff.saveError);
        return;
      }
      setForm(null);
      loadStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(s) {
    if (!confirm(t.staff.confirmDelete.replace("{name}", s.full_name))) return;
    try {
      const res = await fetchWithAuth(`/api/owners/staff/${s.id}`, {
        method: "DELETE",
      });
      if (res.status === 401) return router.push("/login");
      const data = await res.json();
      if (!res.ok) return alert(data.error || t.staff.deleteError);
      loadStaff();
    } catch (err) {
      alert(err.message);
    }
  }

  // ---------- Inline role change ----------
  async function handleRoleChange(staffId, newRoleId) {
    try {
      const res = await fetchWithAuth(`/api/owners/staff/${staffId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role_id: newRoleId }),
      });
      if (res.status === 401) return router.push("/login");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.staff.saveError);
      }
      loadStaff();
    } catch (err) {
      alert(err.message);
    }
  }

  // ---------- Inline status toggle ----------
  async function handleToggleStatus(staffId, currentStatus) {
    try {
      const res = await fetchWithAuth(`/api/owners/staff/${staffId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (res.status === 401) return router.push("/login");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.staff.saveError);
      }
      loadStaff();
    } catch (err) {
      alert(err.message);
    }
  }

  // ---------- Render ----------
  if (!me) {
    return (
      <div className="min-h-screen  p-6 flex items-center justify-center">
        <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
          {t.common.loading || "Loading..."}
        </p>
      </div>
    );
  }

  const selectedHotelName =
    hotels.find((h) => h.id === selectedHotelId)?.name || "";

  return (
    <div className="min-h-screen  p-6" dir={dir}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-900/10">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-teal-950 dark:text-teal-50 tracking-tight">
                {t.users.title}
              </h1>
              {isOwner && hotels.length > 1 ? (
                <div className="mt-1 flex items-center gap-2">
                  <label
                    htmlFor="hotel-select"
                    className="text-xs text-teal-700/70 dark:text-teal-300/70"
                  >
                    {t.staff.hotelLabel}
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
                  {me.branch?.name || t.staff.branchLabel}
                </p>
              ) : null}
            </div>
          </div>

          {/* Branch filter – only for owners */}
          {isOwner && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="border border-teal-200 dark:border-teal-800 rounded-full px-4 py-2 text-sm bg-white dark:bg-teal-950 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">{t.staff.allBranches}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {/* Branch manager static label */}
          {isBranchManager && (
            <div className="border border-teal-200 dark:border-teal-800 rounded-full px-4 py-2 text-sm bg-white dark:bg-teal-950 text-teal-900 dark:text-teal-100">
              {me.branch?.name || t.staff.branchLabel}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[180px]">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.staff.searchPlaceholder}
              className={`${inputClass} pl-9`}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPayModal(true)}
              disabled={branches.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 dark:border-teal-800 px-4 py-2 text-sm font-medium text-teal-800 dark:text-teal-200 transition-colors hover:bg-teal-50 dark:hover:bg-teal-900/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Banknote size={15} />
              Pay salary
            </button>

            <Link
              href="/admin/owners/staff/create"
              className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826]"
            >
              + {t.users.addUser}
            </Link>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-teal-700/70 dark:text-teal-300/70">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            {t.staff.loading}
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-teal-200 dark:border-teal-800">
            <Users className="h-8 w-8 text-teal-300 dark:text-teal-700 mb-3" />
            <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
              {t.staff.noStaffYet}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-teal-200 dark:border-teal-800 overflow-hidden">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="bg-teal-600 dark:bg-teal-700 text-white">
                  <th className="text-start font-medium px-4 py-3">
                    {t.staff.columns.name}
                  </th>
                  <th className="text-start font-medium px-4 py-3">
                    {t.staff.columns.role}
                  </th>
                  <th className="text-start font-medium px-4 py-3">
                    {t.staff.columns.branch}
                  </th>
                  <th className="text-start font-medium px-4 py-3">
                    {t.staff.columns.contact}
                  </th>
                  <th className="text-start font-medium px-4 py-3">
                    {t.staff.columns.status}
                  </th>
                  <th className="px-4 py-3 text-end w-20">
                    {t.common.actions || "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s, idx) => {
                  const roleUuid =
                    roles.find((r) => r.name === s.role)?.id || "";
                  return (
                    <tr
                      key={s.id}
                      className={`group border-t border-teal-100 dark:border-teal-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/40 transition-colors ${
                        idx % 2 === 1
                          ? "bg-teal-50/50 dark:bg-teal-950/30"
                          : "bg-white dark:bg-transparent"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                     
                          {s.full_name}
                       
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={roleUuid}
                          onChange={(e) =>
                            handleRoleChange(s.id, e.target.value)
                          }
                          className="rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950/40 px-2 py-1 text-sm text-teal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 ">{s.branch?.name || "—"}</td>
                      <td className="px-4 py-3 ">
                        {s.email || s.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(s.id, s.is_active)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            s.is_active
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              s.is_active ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          {s.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex justify-end gap-1">
                          <IconButton
                            onClick={() =>
                              router.push(`/admin/owners/staff/${s.id}`)
                            }
                            title={t.common.view || "View"}
                          >
                            <Eye size={16} />
                          </IconButton>
                          <IconButton
                            onClick={() => openEdit(s)}
                            title={t.common.edit}
                          >
                            <Pencil size={16} />
                          </IconButton>
                          <IconButton
                            tone="danger"
                            onClick={() => remove(s)}
                            title={t.common.delete}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal – Add / Edit */}
      {form && (
        <div className="fixed inset-0 bg-teal-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={save}
            className="bg-white dark:bg-teal-950 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 shadow-xl shadow-teal-950/20"
          >
            <h2 className="text-lg font-semibold text-teal-950 dark:text-white">
              {form.id ? t.staff.editTitle : t.staff.addTitle}
            </h2>
            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full-name" className={labelClass}>
                  {t.staff.fields.fullName}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="full-name"
                  required
                  placeholder={t.staff.fields.fullName}
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              {isOwner && (
                <div>
                  <label htmlFor="branch-id" className={labelClass}>
                    {t.staff.selectBranch}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="branch-id"
                    required
                    value={form.branch_id}
                    onChange={(e) =>
                      setForm({ ...form, branch_id: e.target.value })
                    }
                    className={selectClass}
                  >
                    <option value="">{t.staff.selectBranch}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {isBranchManager && (
                <div>
                  <label className={labelClass}>{t.staff.columns.branch}</label>
                  <p className="text-sm  mt-1">{me.branch?.name}</p>
                </div>
              )}

              <div>
                <label htmlFor="role-id" className={labelClass}>
                  {t.staff.columns.role} <span className="text-red-500">*</span>
                </label>
                <select
                  id="role-id"
                  required
                  value={form.role_id}
                  onChange={(e) =>
                    setForm({ ...form, role_id: e.target.value })
                  }
                  className={selectClass}
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  {t.staff.fields.email}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={t.staff.fields.email}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  {t.staff.fields.phone}
                </label>
                <input
                  id="phone"
                  placeholder={t.staff.fields.phone}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="username" className={labelClass}>
                  {t.staff.fields.username}
                </label>
                <input
                  id="username"
                  placeholder={t.staff.fields.username}
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="password" className={labelClass}>
                  {form.id
                    ? t.staff.fields.newPassword
                    : t.staff.fields.password}
                  {!form.id && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder={
                    form.id
                      ? t.staff.fields.newPassword
                      : t.staff.fields.password
                  }
                  required={!form.id}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm({ ...form, is_active: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500 dark:border-teal-700 dark:bg-teal-800/40"
                  />
                  {t.staff.active}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-teal-200 dark:border-teal-800">
              <SecondaryButton type="button" onClick={() => setForm(null)}>
                {t.common.cancel}
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? t.common.saving : t.common.save}
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}

      {/* Pay salary modal */}
      {showPayModal && (
        <PaySalaryModal
          branches={branches}
          dir={dir}
          onClose={() => setShowPayModal(false)}
          onPay={(branchId) => {
            setShowPayModal(false);
            router.push(`/admin/owners/branches/${branchId}/payroll`);
          }}
        />
      )}
    </div>
  );
}

/** Modal shown when "Pay salary" is clicked — picks a branch, then navigates. */
function PaySalaryModal({ branches, dir, onClose, onPay }) {
  const [selectedId, setSelectedId] = useState(branches[0]?.id ?? "");

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const selected = branches.find((b) => b.id === selectedId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      dir={dir}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-teal-200 bg-white p-6 shadow-xl shadow-teal-950/20 dark:border-teal-800 dark:bg-teal-950"
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/40">
              <Banknote
                size={18}
                className="text-teal-700 dark:text-teal-300"
              />
            </div>
            <div>
              <h2 className="text-base font-semibold text-teal-950 dark:text-white">
                Pay salary
              </h2>
              <p className="text-xs text-teal-700/70 dark:text-teal-300/70">
                Choose a branch to open its payroll
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-teal-400 transition-colors hover:bg-teal-50 dark:hover:bg-teal-900/40"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <label className={labelClass}>Branch</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className={`${selectClass} mb-1`}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.code ? ` · ${b.code}` : ""}
            </option>
          ))}
        </select>

        {selected && (
          <p className="mt-3 text-xs text-teal-700/70 dark:text-teal-300/70">
            {selected.city ? `${selected.city} · ` : ""}
            {selected.phone || "No phone"}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={!selectedId}
            onClick={() => onPay(selectedId)}
          >
            <Banknote size={15} />
            Pay
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
