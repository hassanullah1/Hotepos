"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Wallet,
  Settings2,
  Plus,
  Search,
  Receipt,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { LOCALES } from "@/lib/i18n/translations";

const STATUS_DOT = {
  pending: "bg-amber-500",
  approved: "bg-emerald-500",
  rejected: "bg-red-500",
  paid: "bg-teal-500",
};

const STATUS_TEXT = {
  pending: "text-amber-700 dark:text-amber-400",
  approved: "text-emerald-700 dark:text-emerald-400",
  rejected: "text-red-700 dark:text-red-400",
  paid: "text-teal-700 dark:text-teal-400",
};

const STATUS_BG = {
  pending: "bg-amber-50 dark:bg-amber-950/40",
  approved: "bg-emerald-50 dark:bg-emerald-950/40",
  rejected: "bg-red-50 dark:bg-red-950/40",
  paid: "bg-teal-50 dark:bg-teal-950/40",
};

const EMPTY_FORM = {
  id: null,
  title: "",
  description: "",
  amount: "",
  category_id: "",
  payment_method_id: "",
  vendor_name: "",
  expense_date: new Date().toISOString().slice(0, 10),
  is_recurring: false,
  recurrence_interval: "monthly",
  branch_id: "", // only shown/used for hotel_owner
};

// shared input/select styling so every field in the form matches
const fieldClass =
  "w-full border border-teal-200 dark:border-teal-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-teal-900/40 text-teal-950 dark:text-white placeholder:text-teal-400 dark:placeholder:text-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400";

export default function ExpensesPage() {
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
  // Same guard as the staff page: never trust `branches` unless this
  // matches the currently selected hotel, so stale data from a previous
  // hotel can never be submitted alongside a new hotel_id.
  const [branchesHotelId, setBranchesHotelId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchFilter, setBranchFilter] = useState(""); // "" = all branches in hotel

  const branchesReady =
    !isOwner || (!loadingBranches && branchesHotelId === selectedHotelId);

  const effectiveHotelId = isOwner
    ? selectedHotelId
    : me?.branch?.hotel_id || "";

  // ---------- reference data ----------
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // ---------- list ----------
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // ---------- form ----------
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // ---------- category management ----------
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categoryEdits, setCategoryEdits] = useState({}); // id -> draft name
  const [categorySaving, setCategorySaving] = useState(false);

  // ---------- load current user (decides owner vs branch_manager UI) ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");
        if (!res.ok) {
          if (res.status === 401) return router.push("/owner/login");
          throw new Error(t.expenses.loadUserError);
        }
        const data = await res.json();
        setMe(data.user);
      } catch (err) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- owner: load owned hotels once role is known ----------
  useEffect(() => {
    if (!isOwner) return;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/owners/hotel");
        if (!res.ok) {
          if (res.status === 401) return router.push("/owner/login");
          throw new Error(t.expenses.loadHotelsError);
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

  // ---------- owner: load branches for the selected hotel ----------
  async function loadBranches(hotelId) {
    if (!hotelId) return;
    setLoadingBranches(true);
    setBranches([]);
    setBranchesHotelId("");
    try {
      const res = await fetchWithAuth(`/api/branches?hotel_id=${hotelId}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/owner/login");
        throw new Error(t.expenses.loadBranchesError);
      }
      const data = await res.json();
      // Ignore stale responses if the user switched hotels again mid-flight.
      setSelectedHotelId((current) => {
        if (current === hotelId) {
          setBranches(data.branches || []);
          setBranchesHotelId(hotelId);
        }
        return current;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBranches(false);
    }
  }

  useEffect(() => {
    if (isOwner && selectedHotelId) {
      setBranchFilter("");
      setForm(null);
      loadBranches(selectedHotelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, selectedHotelId]);

  // ---------- reference data: categories ----------
  async function loadCategories() {
    // if (!effectiveHotelId) return;
    try {
      const res = await fetchWithAuth(
        `/api/expense-categories?hotel_id=${effectiveHotelId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      // non-fatal — dropdown just stays empty
    }
  }

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveHotelId]);

  async function createCategory(name) {
    if (!name.trim()) return null;
    try {
      const res = await fetchWithAuth("/api/expense-categories", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), hotel_id: effectiveHotelId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.expenses.createCategoryError);
        return null;
      }
      await loadCategories();
      return data.category;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }

  async function handleAddCategoryFromForm() {
    const category = await createCategory(newCategoryName);
    if (category) {
      setForm((f) => ({ ...f, category_id: category.id }));
      setNewCategoryName("");
      setShowNewCategoryInput(false);
    }
  }

  async function saveCategoryEdit(id) {
    const name = categoryEdits[id];
    if (name === undefined || !name.trim()) return;
    setCategorySaving(true);
    try {
      const res = await fetchWithAuth(`/api/expense-categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || t.expenses.renameCategoryError);
      await loadCategories();
    } catch (err) {
      alert(err.message);
    } finally {
      setCategorySaving(false);
    }
  }

  async function deactivateCategory(id) {
    if (!confirm(t.expenses.removeCategoryConfirm)) return;
    setCategorySaving(true);
    try {
      const res = await fetchWithAuth(`/api/expense-categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || t.expenses.removeCategoryError);
      await loadCategories();
    } catch (err) {
      alert(err.message);
    } finally {
      setCategorySaving(false);
    }
  }

  // ---------- reference data: payment methods (branch-scoped) ----------
  useEffect(() => {
    const branchForMethods = isBranchManager ? me?.branch?.id : branchFilter;
    if (!branchForMethods) {
      setPaymentMethods([]);
      return;
    }
    (async () => {
      try {
        const res = await fetchWithAuth(
          `/api/payment-methods?branch_id=${branchForMethods}`,
        );
        if (res.ok) {
          const data = await res.json();
          setPaymentMethods(data.payment_methods || []);
        }
      } catch {
        // non-fatal
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBranchManager, me?.branch?.id, branchFilter]);

  // ---------- load expenses ----------
  async function loadExpenses() {
    if (!me) return;
    if (isOwner && !effectiveHotelId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (isOwner) {
        params.set("hotel_id", effectiveHotelId);
        if (branchFilter) params.set("branch_id", branchFilter);
      }
      if (q) params.set("q", q);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category_id", categoryFilter);

      const res = await fetchWithAuth(`/api/expenses?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/owner/login");
        throw new Error(t.expenses.loadExpensesError);
      }
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadExpenses, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, effectiveHotelId, branchFilter, q, statusFilter, categoryFilter]);

  // ---------- form handlers ----------
  function openCreate() {
    setError("");
    if (isOwner) {
      if (!branchesReady) {
        setError(t.expenses.branchesLoading);
        return;
      }
      if (branches.length === 0) {
        setError(t.expenses.noBranchesError);
        return;
      }
    }
    setForm({
      ...EMPTY_FORM,
      branch_id: isOwner ? branchFilter || branches[0]?.id || "" : "",
    });
  }

  function openEdit(e) {
    setError("");
    setForm({
      id: e.id,
      title: e.title,
      description: e.description || "",
      amount: String(e.amount),
      category_id: e.category?.id || "",
      payment_method_id: e.payment_method?.id || "",
      vendor_name: e.vendor_name || "",
      expense_date: e.expense_date ? e.expense_date.slice(0, 10) : "",
      is_recurring: !!e.is_recurring,
      recurrence_interval: e.recurrence_interval || "monthly",
      branch_id: e.branch?.id || "",
    });
  }

  async function save(ev) {
    ev.preventDefault();
    setSaving(true);
    setError("");

    if (!form.title.trim()) {
      setError(t.expenses.titleRequired);
      setSaving(false);
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError(t.expenses.amountRequired);
      setSaving(false);
      return;
    }
    if (isOwner && !form.branch_id) {
      setError(t.expenses.branchRequired);
      setSaving(false);
      return;
    }

    const isEdit = !!form.id;
    const url = isEdit ? `/api/expenses/${form.id}` : "/api/expenses";
    const payload = {
      title: form.title,
      description: form.description || undefined,
      amount: Number(form.amount),
      category_id: form.category_id || undefined,
      payment_method_id: form.payment_method_id || undefined,
      vendor_name: form.vendor_name || undefined,
      expense_date: form.expense_date || undefined,
      is_recurring: form.is_recurring,
      recurrence_interval: form.is_recurring
        ? form.recurrence_interval
        : undefined,
    };
    // Only the owner sends hotel_id/branch_id — branch_manager's branch is
    // enforced server-side regardless of what's sent.
    if (isOwner) {
      payload.hotel_id = effectiveHotelId;
      payload.branch_id = form.branch_id;
    }

    try {
      const res = await fetchWithAuth(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      if (res.status === 401) return router.push("/owner/login");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.expenses.saveExpenseError);
        return;
      }
      setForm(null);
      loadExpenses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(e) {
    if (!confirm(t.expenses.confirmDelete.replace("{title}", e.title))) return;
    try {
      const res = await fetchWithAuth(`/api/expenses/${e.id}`, {
        method: "DELETE",
      });
      if (res.status === 401) return router.push("/owner/login");
      const data = await res.json();
      if (!res.ok) return alert(data.error || t.expenses.deleteExpenseError);
      loadExpenses();
    } catch (err) {
      alert(err.message);
    }
  }

  async function setStatus(e, status) {
    try {
      const res = await fetchWithAuth(`/api/expenses/${e.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) return router.push("/owner/login");
      const data = await res.json();
      if (!res.ok) return alert(data.error || t.expenses.statusUpdateError);
      loadExpenses();
    } catch (err) {
      alert(err.message);
    }
  }

  // ---------- render ----------
  const selectedHotelName =
    hotels.find((h) => h.id === selectedHotelId)?.name || "";

  if (!me) {
    return (
      <div
        className="min-h-screen bg-[#F4FAF9] dark:bg-[#0B2624] p-6 flex items-center justify-center"
        dir={dir}
      >
        <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
          {t.expenses.loading}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen light:bg-[#F4FAF9]  p-6" dir={dir}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-900/10 shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-teal-950 dark:text-teal-50 tracking-tight">
                {t.expenses.title}
              </h1>
              {isOwner && hotels.length > 1 ? (
                <div className="mt-1 flex items-center gap-2">
                  <label
                    htmlFor="hotel-select"
                    className="text-xs text-teal-700/70 dark:text-teal-300/70"
                  >
                    {t.expenses.hotelLabel}:
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
                  {me.branch?.name}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={openCreate}
              disabled={isOwner && !branchesReady}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm shadow-teal-900/20 disabled:opacity-40 whitespace-nowrap transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {t.expenses.addExpense}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 mb-5">
          {isOwner && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="border border-teal-200 dark:border-teal-800 rounded-full px-3.5 py-2 text-sm bg-white dark:bg-teal-950 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">{t.expenses.allBranches}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-teal-200 dark:border-teal-800 rounded-full px-3.5 py-2 text-sm bg-white dark:bg-teal-950 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">{t.expenses.allStatuses}</option>
            <option value="pending">{t.expenses.statuses.pending}</option>
            <option value="approved">{t.expenses.statuses.approved}</option>
            <option value="rejected">{t.expenses.statuses.rejected}</option>
            <option value="paid">{t.expenses.statuses.paid}</option>
          </select>
          <div className="flex items-center gap-1.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-teal-200 dark:border-teal-800 rounded-full px-3.5 py-2 text-sm bg-white dark:bg-teal-950 text-teal-900 dark:text-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">{t.expenses.allCategories}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCategoryManagerOpen(true)}
              title={t.expenses.manage}
              aria-label={t.expenses.manage}
              className="text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 p-2 border border-teal-200 dark:border-teal-800 rounded-full transition-colors"
            >
              <Settings2 size={16} />
            </button>
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 h-3.5 w-3.5 text-teal-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.expenses.searchPlaceholder}
              className="w-full border border-teal-200 dark:border-teal-800 rounded-full ps-9 pe-3.5 py-2 text-sm bg-white dark:bg-teal-950 text-teal-900 dark:text-teal-100 placeholder:text-teal-400 dark:placeholder:text-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="rounded-2xl border border-teal-100 dark:border-teal-800/60 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-12 border-b last:border-b-0 border-teal-100 dark:border-teal-800/60 bg-teal-100/40 dark:bg-teal-900/20 animate-pulse"
              />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-teal-200 dark:border-teal-800">
            <Receipt className="h-8 w-8 text-teal-300 dark:text-teal-700 mb-3" />
            <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
              {t.expenses.noResults}
            </p>
          </div>
        ) : (
          // Horizontal scroll on small screens instead of squeezing columns.
          <div className="w-full overflow-x-auto rounded-2xl border border-teal-200 dark:border-teal-800">
            <table className="w-full min-w-max text-sm border-collapse">
              <thead>
                <tr className="bg-teal-600 dark:bg-teal-700 text-white">
                  <th className="text-start font-medium py-3 whitespace-nowrap ps-4 pe-4">
                    {t.expenses.columns.title}
                  </th>
                  <th className="text-start font-medium whitespace-nowrap pe-4">
                    {t.expenses.columns.category}
                  </th>
                  {isOwner && (
                    <th className="text-start font-medium whitespace-nowrap pe-4">
                      {t.expenses.columns.branch}
                    </th>
                  )}
                  <th className="text-start font-medium whitespace-nowrap pe-4">
                    {t.expenses.columns.amount}
                  </th>
                  <th className="text-start font-medium whitespace-nowrap pe-4">
                    {t.expenses.columns.date}
                  </th>
                  <th className="text-start font-medium whitespace-nowrap pe-4">
                    {t.expenses.columns.status}
                  </th>
                  <th className="pe-4 w-32" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, idx) => (
                  <tr
                    key={e.id}
                    className={`border-t border-teal-100 dark:border-teal-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/40 transition-colors ${
                      idx % 2 === 1
                        ? "bg-teal-50/50 dark:bg-teal-950/30"
                        : "bg-white dark:bg-transparent"
                    }`}
                  >
                    <td className="py-3 whitespace-nowrap ps-4 pe-4">
                      <span className="font-semibold text-teal-950 dark:text-white">
                        {e.title}
                      </span>
                      {e.vendor_name && (
                        <span className="text-teal-500/70 dark:text-teal-400/60">
                          {" "}
                          · {e.vendor_name}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap pe-4 text-teal-700/80 dark:text-teal-300/70">
                      {e.category?.name || "—"}
                    </td>
                    {isOwner && (
                      <td className="whitespace-nowrap pe-4 text-teal-700/80 dark:text-teal-300/70">
                        {e.branch?.name || "—"}
                      </td>
                    )}
                    <td className="whitespace-nowrap pe-4 font-medium text-teal-950 dark:text-white">
                      {Number(e.amount).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap pe-4 text-teal-700/80 dark:text-teal-300/70">
                      {e.expense_date
                        ? new Date(e.expense_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap pe-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BG[e.status] || "bg-gray-100 dark:bg-gray-800/40"} ${STATUS_TEXT[e.status] || "text-gray-500"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[e.status] || "bg-gray-400"}`}
                        />
                        {t.expenses.statuses[e.status] || e.status}
                      </span>
                    </td>
                    <td className="text-end whitespace-nowrap pe-4">
                      <div className="inline-flex items-center gap-1 flex-shrink-0">
                        {isOwner && e.status === "pending" && (
                          <>
                            <button
                              onClick={() => setStatus(e, "approved")}
                              title={t.expenses.approve}
                              aria-label={t.expenses.approve}
                              className="text-emerald-600/80 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 p-1.5 rounded-full transition-colors flex-shrink-0"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setStatus(e, "rejected")}
                              title={t.expenses.reject}
                              aria-label={t.expenses.reject}
                              className="text-red-500/80 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-full transition-colors flex-shrink-0"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {isOwner && e.status === "approved" && (
                          <button
                            onClick={() => setStatus(e, "paid")}
                            title={t.expenses.markPaid}
                            aria-label={t.expenses.markPaid}
                            className="text-teal-600/80 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/40 p-1.5 rounded-full transition-colors flex-shrink-0"
                          >
                            <Wallet size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(e)}
                          title={t.common.edit}
                          aria-label={t.common.edit}
                          className="text-teal-700/70 hover:text-teal-700 hover:bg-teal-100 dark:text-teal-300/70 dark:hover:text-teal-200 dark:hover:bg-teal-900 p-1.5 rounded-full transition-colors flex-shrink-0"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => remove(e)}
                          title={t.common.delete}
                          aria-label={t.common.delete}
                          className="text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-full transition-colors flex-shrink-0"
                        >
                          <Trash2 size={16} />
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

      {form && (
        <div
          className="fixed inset-0 bg-teal-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          dir={dir}
        >
          <form
            onSubmit={save}
            className="bg-white dark:bg-teal-950 rounded-2xl p-6 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto shadow-xl shadow-teal-950/20"
          >
            <h2 className="text-lg font-semibold text-teal-950 dark:text-white">
              {form.id ? t.expenses.editTitle : t.expenses.addTitle}
            </h2>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder={t.expenses.fields.title}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={fieldClass}
              />

              {isOwner && (
                <select
                  required
                  value={form.branch_id}
                  onChange={(e) =>
                    setForm({ ...form, branch_id: e.target.value })
                  }
                  className={fieldClass}
                >
                  <option value="">{t.expenses.selectBranch}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
              {isBranchManager && (
                <p className="text-xs text-teal-700/70 dark:text-teal-300/70">
                  {t.expenses.branchLabel}: {me.branch?.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder={t.expenses.fields.amount}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className={fieldClass}
              />
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) =>
                  setForm({ ...form, expense_date: e.target.value })
                }
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={showNewCategoryInput ? "__new__" : form.category_id}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setShowNewCategoryInput(true);
                  } else {
                    setShowNewCategoryInput(false);
                    setForm({ ...form, category_id: e.target.value });
                  }
                }}
                className={fieldClass}
              >
                <option value="">{t.expenses.noCategory}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="__new__">{t.expenses.addNewCategory}</option>
              </select>
              <select
                value={form.payment_method_id}
                onChange={(e) =>
                  setForm({ ...form, payment_method_id: e.target.value })
                }
                className={fieldClass}
              >
                <option value="">{t.expenses.noPaymentMethod}</option>
                {paymentMethods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            {showNewCategoryInput && (
              <div className="flex gap-2">
                <input
                  autoFocus
                  placeholder={t.expenses.newCategoryPlaceholder}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className={`flex-1 ${fieldClass}`}
                />
                <button
                  type="button"
                  onClick={handleAddCategoryFromForm}
                  className="px-3.5 py-2 text-sm rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors"
                >
                  {t.common.add}
                </button>
              </div>
            )}

            <input
              placeholder={t.expenses.fields.vendor}
              value={form.vendor_name}
              onChange={(e) =>
                setForm({ ...form, vendor_name: e.target.value })
              }
              className={fieldClass}
            />

            <textarea
              placeholder={t.expenses.fields.description}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className={fieldClass}
              rows={2}
            />

            <div
              className={
                form.is_recurring ? "grid grid-cols-2 gap-3 items-center" : ""
              }
            >
              <label className="flex items-center gap-2 text-sm text-teal-900 dark:text-teal-100">
                <input
                  type="checkbox"
                  checked={form.is_recurring}
                  onChange={(e) =>
                    setForm({ ...form, is_recurring: e.target.checked })
                  }
                  className="rounded border-teal-300 dark:border-teal-700 text-teal-600 focus:ring-teal-400"
                />
                {t.expenses.recurring}
              </label>
              {form.is_recurring && (
                <select
                  value={form.recurrence_interval}
                  onChange={(e) =>
                    setForm({ ...form, recurrence_interval: e.target.value })
                  }
                  className={fieldClass}
                >
                  <option value="weekly">{t.expenses.intervals.weekly}</option>
                  <option value="monthly">
                    {t.expenses.intervals.monthly}
                  </option>
                  <option value="yearly">{t.expenses.intervals.yearly}</option>
                </select>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="px-4 py-2 text-sm rounded-full border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? t.common.saving : t.common.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {categoryManagerOpen && (
        <div
          className="fixed inset-0 bg-teal-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          dir={dir}
        >
          <div className="bg-white dark:bg-teal-950 rounded-2xl p-6 w-full max-w-sm space-y-3 shadow-xl shadow-teal-950/20">
            <h2 className="text-lg font-semibold text-teal-950 dark:text-white">
              {t.expenses.categoriesTitle}
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.length === 0 && (
                <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
                  {t.expenses.noCategoriesYet}
                </p>
              )}
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5">
                  <input
                    value={categoryEdits[c.id] ?? c.name}
                    onChange={(e) =>
                      setCategoryEdits((prev) => ({
                        ...prev,
                        [c.id]: e.target.value,
                      }))
                    }
                    className="flex-1 border border-teal-200 dark:border-teal-800 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-teal-900/40 text-teal-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <button
                    type="button"
                    disabled={categorySaving}
                    onClick={() => saveCategoryEdit(c.id)}
                    title={t.common.save}
                    aria-label={t.common.save}
                    className="text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900 p-1.5 rounded-full disabled:opacity-50 transition-colors"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={categorySaving}
                    onClick={() => deactivateCategory(c.id)}
                    title={t.expenses.remove}
                    aria-label={t.expenses.remove}
                    className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-full disabled:opacity-50 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-3 border-t border-teal-100 dark:border-teal-800/60">
              <input
                placeholder={t.expenses.newCategoryPlaceholder}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className={`flex-1 ${fieldClass}`}
              />
              <button
                type="button"
                onClick={async () => {
                  const category = await createCategory(newCategoryName);
                  if (category) setNewCategoryName("");
                }}
                className="px-3.5 py-2 text-sm rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors"
              >
                {t.common.add}
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCategoryManagerOpen(false)}
                className="px-4 py-2 text-sm rounded-full border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-colors"
              >
                {t.expenses.done}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
