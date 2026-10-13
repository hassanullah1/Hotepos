"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  Star,
  User as UserIcon,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import Link from "next/link";

const EMPTY_CUSTOMER = {
  id: null,
  full_name: "",
  phone: "",
  email: "",
  loyalty_points: 0,
  notes: "",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function CustomersPage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  // ---------- who is logged in ----------
  const [me, setMe] = useState(null);
  const isOwner = me?.role === "hotel_owner";
  const isBranchManager = me?.role === "branch_manager";

  // ---------- owner-only: hotel selection ----------
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");

  // ---------- data ----------
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ---------- pagination ----------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  function handle401(res) {
    if (res.status === 401) {
      router.push("/login");
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

  // ---------- owner: load hotels ----------
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

  // ---------- branch manager: derive hotel scope from user ----------
  useEffect(() => {
    if (isBranchManager) {
      const hotelId = me?.hotel_id || me?.branch?.hotel_id || "";
      if (hotelId) setSelectedHotelId(hotelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBranchManager, me]);

  // ---------- load customers (with pagination) ----------
  async function loadCustomers(
    hotelId = selectedHotelId,
    q = search,
    p = page,
    l = limit,
  ) {
    if (!hotelId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        hotel_id: hotelId,
        page: String(p),
        limit: String(l),
      });
      if (q.trim()) params.set("q", q.trim());

      const res = await fetchWithAuth(
        `/api/owners/customers?${params.toString()}`,
      );
      if (handle401(res)) return;
      const data = await res.json();

      // If the current page became empty (e.g. after delete), step back one page
      if (
        (data.customers || []).length === 0 &&
        p > 1 &&
        (data.total ?? 0) > 0
      ) {
        return loadCustomers(hotelId, q, p - 1, l);
      }

      setCustomers(data.customers || []);
      setPage(data.page ?? p);
      setLimit(data.limit ?? l);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---------- role-based init ----------
  useEffect(() => {
    if (isOwner) {
      loadHotels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  // ---------- reload when hotel changes (reset to page 1) ----------
  useEffect(() => {
    if (!selectedHotelId) return;
    setPage(1);
    loadCustomers(selectedHotelId, search, 1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotelId]);

  // ---------- debounce search (reset to page 1) ----------
  useEffect(() => {
    if (!selectedHotelId) return;
    const id = setTimeout(() => {
      setPage(1);
      loadCustomers(selectedHotelId, search, 1, limit);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ---------- handlers ----------
  function openCreate() {
    setError("");
    if (!selectedHotelId) {
      setError(t.customers.selectHotelFirst || "Please select a hotel first");
      return;
    }
    setForm({ ...EMPTY_CUSTOMER });
  }

  function openEdit(c) {
    setError("");
    setForm({
      id: c.id,
      full_name: c.full_name || "",
      phone: c.phone || "",
      email: c.email || "",
      loyalty_points: c.loyalty_points ?? 0,
      notes: c.notes || "",
    });
  }

  function goToPage(p) {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
    loadCustomers(selectedHotelId, search, p, limit);
  }

  function changeLimit(newLimit) {
    setLimit(newLimit);
    setPage(1);
    loadCustomers(selectedHotelId, search, 1, newLimit);
  }

  async function saveCustomer(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const isEdit = !!form.id;
    const url = isEdit
      ? `/api/owners/customers/${form.id}`
      : "/api/owners/customers";

    const payload = {
      hotel_id: selectedHotelId,
      full_name: form.full_name?.trim() || null,
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      loyalty_points: Number(form.loyalty_points) || 0,
      notes: form.notes?.trim() || null,
    };

    try {
      const res = await fetchWithAuth(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.customers.saveError);
        return;
      }
      setForm(null);
      loadCustomers(selectedHotelId, search, page, limit);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(c) {
    const name = c.full_name || c.phone || "this customer";
    if (!confirm(t.customers.confirmDelete.replace("{name}", name))) return;
    try {
      const res = await fetchWithAuth(`/api/owners/customers/${c.id}`, {
        method: "DELETE",
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return alert(data.error || t.customers.deleteError);
      loadCustomers(selectedHotelId, search, page, limit);
    } catch (err) {
      alert(err.message);
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

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div
      className="p-6 max-w-[100%] mx-auto overflow-x-hidden dark:bg-gray-900 dark:text-gray-100"
      dir={dir}
    >
      {/* ---------- header ---------- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">{t.customers.title}</h1>
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
                className="border rounded-md px-3 py-1.5 text-sm min-w-0 max-w-[200px] flex-1 truncate dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
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

        <button
          onClick={openCreate}
          disabled={!selectedHotelId}
          className="inline-flex items-center gap-1.5 bg-teal-700 text-white px-3.5 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
        >
          <Plus size={15} />
          {t.customers.add}
        </button>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
      )}

      {/* ---------- search + page size ---------- */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search
            size={15}
            className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.customers.searchPlaceholder}
            className="w-full border rounded-md ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label
            htmlFor="page-size"
            className="text-gray-500 dark:text-gray-400 whitespace-nowrap"
          >
            {t.common.rowsPerPage || "Rows"}:
          </label>
          <select
            id="page-size"
            value={limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className="border rounded-md px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-700"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------- table ---------- */}
      {loading && customers.length === 0 ? (
        <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-10 rounded-md bg-gray-100 dark:bg-gray-700/40 animate-pulse"
            />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="border border-dashed rounded-xl px-6 py-10 text-center dark:border-gray-700">
          <p className="font-semibold mb-1">{t.customers.noCustomers}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {t.customers.noCustomersHint}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-start px-4 py-3 font-medium">
                    {t.customers.nameLabel || "Customer"}
                  </th>
                  <th className="text-start px-4 py-3 font-medium">
                    {t.customers.phoneLabel || "Phone"}
                  </th>
                  <th className="text-start px-4 py-3 font-medium">
                    {t.customers.emailLabel || "Email"}
                  </th>
                  <th className="text-start px-4 py-3 font-medium">
                    {t.customers.loyaltyLabel || "Loyalty"}
                  </th>
                  <th className="text-start px-4 py-3 font-medium">
                    {t.customers.ordersLabel || "Orders / Stays"}
                  </th>
                  <th className="text-start px-4 py-3 font-medium">
                    {t.customers.notesLabel || "Notes"}
                  </th>
                  <th className="text-end px-4 py-3 font-medium">
                    {t.common.actions || "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className={loading ? "opacity-60" : ""}>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-300">
                          <UserIcon size={15} />
                        </div>
                        <span className="font-medium truncate max-w-[180px]">
                          {c.full_name || t.customers.unnamed}
                        </span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3">
                      {c.phone ? (
                        <span
                          className="text-gray-600 dark:text-gray-300"
                          dir="ltr"
                        >
                          {c.phone}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3">
                      {c.email ? (
                        <span
                          className="text-gray-600 dark:text-gray-300 truncate inline-block max-w-[200px] align-bottom"
                          dir="ltr"
                        >
                          {c.email}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Loyalty */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full text-xs font-semibold">
                        <Star size={12} />
                        {c.loyalty_points ?? 0}
                      </span>
                    </td>

                    {/* Orders / Stays */}
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center gap-2 text-xs">
                        <span>
                          {c.order_count ?? 0} {t.customers.orders || "orders"}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">
                          ·
                        </span>
                        <span>
                          {c.stay_count ?? 0} {t.customers.stays || "stays"}
                        </span>
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3">
                      {c.notes ? (
                        <span
                          className="text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[220px] inline-block align-bottom"
                          title={c.notes}
                        >
                          {c.notes}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          title={t.customers?.history || "History"}
                          className="p-1.5 rounded-md text-gray-500 hover:text-teal-700 hover:bg-teal-50 dark:text-gray-400 dark:hover:text-teal-400 dark:hover:bg-teal-900/30"
                        >
                          <Receipt size={15} />
                        </Link>
                        <button
                          onClick={() => openEdit(c)}
                          title={t.common.edit}
                          className="p-1.5 rounded-md text-gray-500 hover:text-teal-700 hover:bg-teal-50 dark:text-gray-400 dark:hover:text-teal-400 dark:hover:bg-teal-900/30"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => deleteCustomer(c)}
                          title={t.common.delete}
                          className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---------- pagination ---------- */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-gray-500 dark:text-gray-400">
              {total > 0
                ? `${from}–${to} / ${total}`
                : t.common.noResults || "0 results"}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronLeft size={14} className="rtl:rotate-180" />
                {t.common.previous || "Prev"}
              </button>

              <span className="px-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {t.common.page || "Page"} {page} / {totalPages}
              </span>

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {t.common.next || "Next"}
                <ChevronRight size={14} className="rtl:rotate-180" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---------- customer modal ---------- */}
      {form && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          dir={dir}
        >
          <form
            onSubmit={saveCustomer}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-3"
          >
            <h2 className="text-lg font-semibold">
              {form.id ? t.customers.editTitle : t.customers.addTitle}
            </h2>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}

            <input
              placeholder={t.customers.namePlaceholder}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <input
              placeholder={t.customers.phonePlaceholder}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
              dir="ltr"
            />
            <input
              type="email"
              placeholder={t.customers.emailPlaceholder}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
              dir="ltr"
            />
            <input
              type="number"
              min="0"
              placeholder={t.customers.loyaltyPlaceholder}
              value={form.loyalty_points}
              onChange={(e) =>
                setForm({
                  ...form,
                  loyalty_points: Number(e.target.value),
                })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <textarea
              placeholder={t.customers.notesPlaceholder}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForm(null)}
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
