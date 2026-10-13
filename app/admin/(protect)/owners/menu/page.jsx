"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ImageOff, Plus, Globe, Store } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const EMPTY_CATEGORY = { id: null, name: "", sort_order: 0, is_active: true };
const EMPTY_ITEM = {
  id: null,
  name: "",
  description: "",
  price: "",
  tax_rate: 0,
  is_available: true,
  is_online: false,
  is_kitchen: true,
  category_id: "",
  image_url: "",
};

export default function MenuPage() {
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

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [categoryForm, setCategoryForm] = useState(null);
  const [itemForm, setItemForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const fileInputRef = useRef(null);

  const branchesReady = !loadingBranches && branchesHotelId === selectedHotelId;

  function handle401(res) {
    if (res.status === 401) {
      router.push("/login");
      return true;
    }
    return false;
  }

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

  async function loadCategories() {
    if (!branchId) return;
    try {
      const res = await fetchWithAuth(
        `/api/owners/menu-categories?branch_id=${branchId}`,
      );
      if (handle401(res)) return;
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadItems() {
    if (!branchId) return;
    setLoadingItems(true);
    try {
      const params = new URLSearchParams({ branch_id: branchId });
      if (activeCategory) params.set("category_id", activeCategory);
      const res = await fetchWithAuth(
        `/api/owners/menu-items?${params.toString()}`,
      );
      if (handle401(res)) return;
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => {
    if (isOwner) {
      loadHotels();
    } else if (isBranchManager) {
      if (me?.branch?.id) {
        setBranchId(me.branch.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, isBranchManager, me]);

  useEffect(() => {
    if (isOwner && selectedHotelId) {
      setBranchId("");
      setActiveCategory("");
      setError("");
      loadBranches(selectedHotelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, selectedHotelId]);

  useEffect(() => {
    if (isOwner && branchesReady && !branchId && branches.length > 0) {
      setBranchId(branches[0].id);
    }
  }, [isOwner, branchesReady, branches, branchId]);

  useEffect(() => {
    if (branchId) {
      setActiveCategory("");
      loadCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  useEffect(() => {
    if (branchId) {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, activeCategory]);

  async function saveCategory(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const isEdit = !!categoryForm.id;
    const url = isEdit
      ? `/api/owners/menu-categories/${categoryForm.id}`
      : "/api/owners/menu-categories";
    try {
      const res = await fetchWithAuth(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify({ ...categoryForm, branch_id: branchId }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.branch.categories.saveError);
        return;
      }
      setCategoryForm(null);
      loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(c) {
    if (!confirm(t.branch.categories.confirmDelete.replace("{name}", c.name)))
      return;
    try {
      const res = await fetchWithAuth(`/api/owners/menu-categories/${c.id}`, {
        method: "DELETE",
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return alert(data.error || t.branch.categories.deleteError);
      if (activeCategory === c.id) setActiveCategory("");
      loadCategories();
    } catch (err) {
      alert(err.message);
    }
  }

  function openCreateCategory() {
    setError("");
    if (!branchId) {
      setError(t.branch.selectBranchFirst || "Please select a branch first");
      return;
    }
    setCategoryForm({ ...EMPTY_CATEGORY });
  }

  function openCreateItem() {
    setError("");
    if (!branchId) {
      setError(t.branch.selectBranchFirst || "Please select a branch first");
      return;
    }
    setItemForm({
      ...EMPTY_ITEM,
      category_id: activeCategory || categories[0]?.id || "",
    });
  }

  function openEditItem(i) {
    setError("");
    setItemForm({
      id: i.id,
      name: i.name,
      description: i.description || "",
      price: i.price,
      tax_rate: i.tax_rate ?? 0,
      is_available: i.is_available,
      is_online: i.is_online ?? false,
      is_kitchen: i.is_kitchen,
      category_id: i.category?.id || "",
      image_url: i.image_url || "",
    });
  }

  async function saveItem(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const isEdit = !!itemForm.id;
    const url = isEdit
      ? `/api/owners/menu-items/${itemForm.id}`
      : "/api/owners/menu-items";
    const payload = {
      ...itemForm,
      price: Number(itemForm.price),
      branch_id: branchId,
    };
    delete payload.id;
    try {
      const res = await fetchWithAuth(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.branch.items.saveError);
        return;
      }
      setItemForm(null);
      loadItems();
      loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(i) {
    if (!confirm(t.branch.items.confirmDelete.replace("{name}", i.name)))
      return;
    try {
      const res = await fetchWithAuth(`/api/owners/menu-items/${i.id}`, {
        method: "DELETE",
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return alert(data.error || t.branch.items.deleteError);
      loadItems();
      loadCategories();
    } catch (err) {
      alert(err.message);
    }
  }

  async function quickPrice(i, newPrice) {
    try {
      const res = await fetchWithAuth(`/api/owners/menu-items/${i.id}`, {
        method: "PATCH",
        body: JSON.stringify({ price: Number(newPrice) }),
      });
      if (handle401(res)) return;
      if (res.ok) loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  // ---------- online toggle ----------
  async function toggleOnline(item) {
    setTogglingId(item.id);
    try {
      const res = await fetchWithAuth(`/api/owners/menu-items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_online: !item.is_online }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_online: !item.is_online } : i,
        ),
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const token = localStorage.getItem("auth_token");

      const res = await fetch("/api/owners/menu-image-upload", {
        method: "POST",
        body: fd,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (handle401(res)) return;

      let data = null;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        setError(
          data?.error ||
            t.branch.items.uploadFailed.replace("{status}", res.status),
        );
        return;
      }
      if (!data?.url) {
        setError(t.branch.items.uploadNoUrl);
        return;
      }
      setItemForm((prev) => ({ ...prev, image_url: data.url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage() {
    setItemForm((prev) => ({ ...prev, image_url: "" }));
  }

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
      {/* header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">{t.branch.title}</h1>
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
        {/* categories */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t.branch.categories.title}
            </h2>
            <button
              onClick={openCreateCategory}
              disabled={!branchId}
              className="text-sm font-semibold text-teal-700 dark:text-teal-400 disabled:opacity-40"
            >
              {t.branch.categories.add}
            </button>
          </div>

          <div className="flex md:flex-col flex-row flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible gap-2 md:gap-1 pb-1">
            <button
              onClick={() => setActiveCategory("")}
              className={`shrink-0 md:shrink text-start px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                activeCategory === ""
                  ? "bg-teal-700 text-white"
                  : "hover:bg-teal-50 dark:hover:bg-teal-900/30"
              }`}
            >
              {t.branch.categories.allItems}
            </button>
            {categories.map((c) => (
              <div
                key={c.id}
                className="group shrink-0 md:shrink-0 flex items-center gap-0.5"
              >
                <button
                  onClick={() => setActiveCategory(c.id)}
                  className={`flex-1 text-start px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                    activeCategory === c.id
                      ? "bg-teal-700 text-white"
                      : "hover:bg-teal-50 dark:hover:bg-teal-900/30"
                  }`}
                >
                  {c.name}{" "}
                  <span className="text-xs opacity-60">({c.item_count})</span>
                </button>
                <button
                  onClick={() => setCategoryForm(c)}
                  aria-label={t.common.edit}
                  title={t.common.edit}
                  className="hidden md:inline-flex opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 hover:bg-teal-50 dark:hover:bg-teal-900/30"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => deleteCategory(c)}
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

        {/* items */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t.branch.items.title}
            </h2>
            <button
              onClick={openCreateItem}
              disabled={!branchId}
              className="inline-flex items-center gap-1.5 bg-teal-700 text-white px-3.5 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
            >
              <Plus size={15} />
              {t.branch.items.add}
            </button>
          </div>

          {loadingItems ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-[3/4] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="border border-dashed rounded-xl px-6 py-10 text-center dark:border-gray-700">
              <p className="font-semibold mb-1">{t.branch.items.noItems}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {t.branch.items.noItemsHint}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((i) => (
                <div
                  key={i.id}
                  className="flex flex-col rounded-xl border overflow-hidden bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition dark:bg-gray-800 dark:border-gray-700"
                >
                  <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-900">
                    {i.image_url ? (
                      <img
                        src={i.image_url}
                        alt={i.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageOff size={22} />
                      </div>
                    )}
                    <span
                      className={`absolute top-2 rtl:left-2 ltr:right-2 text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur ${
                        i.is_available
                          ? "bg-teal-50/90 text-teal-700"
                          : "bg-red-50/90 text-red-700"
                      }`}
                    >
                      {i.is_available
                        ? t.branch.items.available
                        : t.branch.items.unavailable}
                    </span>
                  </div>

                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold leading-snug">
                        {i.name}
                      </h3>
                      {i.category?.name && (
                        <span className="self-start text-[11px] text-gray-500 dark:text-gray-400 border rounded-full px-2 py-0.5 dark:border-gray-700">
                          {i.category.name}
                        </span>
                      )}
                    </div>

                    <input
                      type="number"
                      step="0.01"
                      defaultValue={i.price}
                      onBlur={(e) =>
                        e.target.value !== String(i.price) &&
                        quickPrice(i, e.target.value)
                      }
                      className="w-24 text-sm font-bold text-amber-700 bg-amber-50 rounded-md px-2 py-1 border border-transparent focus:outline-none focus:border-amber-500 dark:bg-amber-900/30 dark:text-amber-400"
                    />

                    {/* online / offline toggle */}
                    <button
                      type="button"
                      onClick={() => toggleOnline(i)}
                      disabled={togglingId === i.id}
                      title={
                        i.is_online
                          ? "Visible to online customers — click to hide"
                          : "Hidden from online — click to show"
                      }
                      className={`inline-flex items-center gap-1 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                        i.is_online
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {i.is_online ? <Globe size={11} /> : <Store size={11} />}
                      {i.is_online ? "Online" : "POS only"}
                    </button>

                    <div className="mt-auto pt-1 flex gap-4">
                      <button
                        onClick={() => openEditItem(i)}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-teal-700 dark:text-gray-400 dark:hover:text-teal-400"
                      >
                        <Pencil size={13} />
                        {t.common.edit}
                      </button>
                      <button
                        onClick={() => deleteItem(i)}
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

      {/* category modal */}
      {categoryForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
          dir={dir}
        >
          <form
            onSubmit={saveCategory}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-3"
          >
            <h2 className="text-lg font-semibold">
              {categoryForm.id
                ? t.branch.categories.editTitle
                : t.branch.categories.addTitle}
            </h2>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}
            <input
              required
              placeholder={t.branch.categories.namePlaceholder}
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, name: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <input
              type="number"
              placeholder={t.branch.categories.sortOrderPlaceholder}
              value={categoryForm.sort_order}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  sort_order: Number(e.target.value),
                })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={categoryForm.is_active}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    is_active: e.target.checked,
                  })
                }
              />
              {t.branch.categories.active}
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryForm(null)}
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

      {/* item modal */}
      {itemForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
          dir={dir}
        >
          <form
            onSubmit={saveItem}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-3"
          >
            <h2 className="text-lg font-semibold">
              {itemForm.id ? t.branch.items.editTitle : t.branch.items.addTitle}
            </h2>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}
            <div className="flex items-center gap-3">
              {itemForm.image_url ? (
                <img
                  src={itemForm.image_url}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-md border dark:border-gray-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-md border border-dashed flex items-center justify-center text-xs text-gray-400 dark:border-gray-700">
                  {t.branch.items.noImage}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageSelect}
                  disabled={uploadingImage}
                  className="text-xs"
                />
                {uploadingImage && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t.branch.items.uploading}
                  </span>
                )}
                {itemForm.image_url && !uploadingImage && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-xs text-red-600 dark:text-red-400 text-left"
                  >
                    {t.branch.items.removeImage}
                  </button>
                )}
              </div>
            </div>
            <input
              required
              placeholder={t.branch.items.namePlaceholder}
              value={itemForm.name}
              onChange={(e) =>
                setItemForm({ ...itemForm, name: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <select
              value={itemForm.category_id}
              onChange={(e) =>
                setItemForm({ ...itemForm, category_id: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="">{t.branch.items.noCategory}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              step="0.01"
              placeholder={t.branch.items.pricePlaceholder}
              value={itemForm.price}
              onChange={(e) =>
                setItemForm({ ...itemForm, price: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <input
              type="number"
              step="0.01"
              placeholder={t.branch.items.taxPlaceholder}
              value={itemForm.tax_rate}
              onChange={(e) =>
                setItemForm({ ...itemForm, tax_rate: Number(e.target.value) })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />
            <textarea
              placeholder={t.branch.items.descriptionPlaceholder}
              value={itemForm.description}
              onChange={(e) =>
                setItemForm({ ...itemForm, description: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={itemForm.is_available}
                onChange={(e) =>
                  setItemForm({ ...itemForm, is_available: e.target.checked })
                }
              />
              {t.branch.items.available}
            </label>

            {/* Online visibility checkbox */}
            <label className="flex items-start gap-2 text-sm rounded-md border border-emerald-200 bg-emerald-50/50 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <input
                type="checkbox"
                checked={itemForm.is_online}
                onChange={(e) =>
                  setItemForm({ ...itemForm, is_online: e.target.checked })
                }
                className="mt-0.5 accent-emerald-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
                  {itemForm.is_online ? (
                    <Globe size={13} />
                  ) : (
                    <Store size={13} />
                  )}
                  Show in online ordering
                </div>
                <p className="mt-0.5 text-[11px] text-emerald-700/70 dark:text-emerald-400/70">
                  Customers can order this item from the online marketplace. Off
                  means POS-only.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={itemForm.is_kitchen}
                onChange={(e) =>
                  setItemForm({ ...itemForm, is_kitchen: e.target.checked })
                }
              />
              {t.branch.items.kitchen}
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemForm(null)}
                className="px-4 py-2 text-sm rounded-md border dark:border-gray-700"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage}
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
