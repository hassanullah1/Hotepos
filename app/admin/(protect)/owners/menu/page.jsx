"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  ImageOff,
  Plus,
  Globe,
  Store,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const HOTEL_PROFILE_PATH = "/admin/profile";
const HESABPAY_PATTERN = /^07\d{8}$/;

const EMPTY_CATEGORY = {
  id: null,
  name: "",
  sort_order: 0,
  is_active: true,
  default_product_category_id: "",
};

const EMPTY_ITEM = {
  id: null,
  name: "",
  description: "",
  base_price: "",
  tax_rate: 0,
  is_available: true,
  is_online: false,
  is_kitchen: true,
  category_id: "",
  product_category_id: "",
  image_url: "",
  unit_id: "",
  unit_quantity: "",
};

const inputClass =
  "w-full text-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 bg-white dark:bg-teal-900/40 text-teal-900 dark:text-teal-100 placeholder:text-teal-400/70 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 disabled:opacity-50";
const labelClass =
  "block text-xs font-medium text-teal-800 dark:text-teal-200 mb-1.5";

// Unit display helper — "1 Plate", "250 Gram", or nothing
function displayUnit(item) {
  if (!item.unit) return null;
  const qty =
    item.unit_quantity != null && item.unit_quantity !== ""
      ? Number(item.unit_quantity)
      : 1;
  return `${qty} ${item.unit.name}`;
}

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
  const [productCategories, setProductCategories] = useState([]);
  const [units, setUnits] = useState([]);
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

  const [hesabpayStatus, setHesabpayStatus] = useState("loading");
  const [showHesabpayModal, setShowHesabpayModal] = useState(false);

  const branchesReady = !loadingBranches && branchesHotelId === selectedHotelId;

  function handle401(res) {
    if (res.status === 401) {
      router.push("/hotel/login");
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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/product-categories");
        if (!res.ok) return;
        const data = await res.json();
        setProductCategories(data.categories || []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/units");
        if (!res.ok) return;
        const data = await res.json();
        setUnits(data.units || []);
      } catch {}
    })();
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

  async function loadHesabpayStatus(hotelId) {
    if (!hotelId) {
      setHesabpayStatus("missing");
      return;
    }
    try {
      const res = await fetchWithAuth(`/api/owners/hotel/${hotelId}`);
      if (handle401(res)) return;
      if (!res.ok) {
        setHesabpayStatus("valid");
        return;
      }
      const data = await res.json();
      const hp = String(data.hotel?.hesabpay_account_number || "").trim();
      setHesabpayStatus(HESABPAY_PATTERN.test(hp) ? "valid" : "missing");
    } catch {
      setHesabpayStatus("valid");
    }
  }

  useEffect(() => {
    if (isOwner) {
      loadHotels();
    } else if (isBranchManager) {
      if (me?.branch?.id) setBranchId(me.branch.id);
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
    if (branchId) loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, activeCategory]);

  const hotelIdForHesabpay = isOwner
    ? selectedHotelId
    : me?.branch?.hotel_id || me?.hotel_id || "";

  useEffect(() => {
    if (!me) return;
    loadHesabpayStatus(hotelIdForHesabpay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, isOwner, hotelIdForHesabpay]);

  function guardOnline(desired) {
    if (!desired) return true;
    if (hesabpayStatus === "missing") {
      setShowHesabpayModal(true);
      return false;
    }
    return true;
  }

  async function saveCategory(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const isEdit = !!categoryForm.id;
    const url = isEdit
      ? `/api/owners/menu-categories/${categoryForm.id}`
      : "/api/owners/menu-categories";
    const payload = {
      branch_id: branchId,
      name: categoryForm.name,
      sort_order: categoryForm.sort_order,
      is_active: categoryForm.is_active,
      default_product_category_id:
        categoryForm.default_product_category_id || null,
    };
    try {
      const res = await fetchWithAuth(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
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
      base_price: i.base_price,
      tax_rate: i.tax_rate ?? 0,
      is_available: i.is_available,
      is_online: i.is_online ?? false,
      is_kitchen: i.is_kitchen,
      category_id: i.category?.id || "",
      product_category_id: i.product_category?.id || "",
      image_url: i.image_url || "",
      unit_id: i.unit_id || "",
      unit_quantity:
        i.unit_quantity != null && i.unit_quantity !== ""
          ? String(i.unit_quantity)
          : "",
    });
  }

  async function saveItem(e) {
    e.preventDefault();
    if (itemForm.is_online && !guardOnline(true)) return;

    setSaving(true);
    setError("");
    const isEdit = !!itemForm.id;
    const url = isEdit
      ? `/api/owners/menu-items/${itemForm.id}`
      : "/api/owners/menu-items";

    const unitId = itemForm.unit_id || null;

    const payload = {
      branch_id: branchId,
      name: itemForm.name,
      description: itemForm.description,
      image_url: itemForm.image_url,
      base_price: Number(itemForm.base_price),
      tax_rate: itemForm.tax_rate,
      is_kitchen: itemForm.is_kitchen,
      category_id: itemForm.category_id || null,
      product_category_id: itemForm.product_category_id || null,
      is_available: itemForm.is_available,
      is_online: itemForm.is_online,

      unit_id: unitId,
      unit_quantity:
        unitId &&
        itemForm.unit_quantity !== "" &&
        itemForm.unit_quantity !== null &&
        itemForm.unit_quantity !== undefined
          ? Number(itemForm.unit_quantity)
          : null,
    };

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
    const n = Number(newPrice);
    if (!Number.isFinite(n)) return;
    try {
      const res = await fetchWithAuth(`/api/owners/menu-items/${i.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          branch_id: branchId,
          price_override: n,
        }),
      });
      if (handle401(res)) return;
      if (res.ok) loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleOnline(item) {
    const desired = !item.is_online;
    if (!guardOnline(desired)) return;

    setTogglingId(item.id);
    try {
      const res = await fetchWithAuth(`/api/owners/menu-items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          branch_id: branchId,
          is_online: desired,
        }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_online: desired } : i)),
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
      <div
        className="min-h-screen p-6 flex items-center justify-center"
        dir={dir}
      >
        <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
      </div>
    );
  }

  const selectedHotelName =
    hotels.find((h) => h.id === selectedHotelId)?.name || "";

  return (
    <div className="min-h-screen p-4" dir={dir}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-teal-950 dark:text-teal-50 leading-tight">
                {t.branch.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-teal-700/70 dark:text-teal-300/70">
                {isOwner && hotels.length > 1 ? (
                  <select
                    value={selectedHotelId}
                    onChange={(e) => setSelectedHotelId(e.target.value)}
                    className="bg-transparent border-0 p-0 pr-4 text-xs text-teal-700/70 dark:text-teal-300/70 focus:outline-none"
                  >
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                ) : isOwner && hotels.length === 1 ? (
                  <span className="truncate">{selectedHotelName}</span>
                ) : isBranchManager ? (
                  <span className="truncate">
                    {me.branch?.name || t.branch.branchLabel}
                  </span>
                ) : null}
                {isOwner && (
                  <>
                    <span className="opacity-40">·</span>
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      disabled={!branchesReady || branches.length === 0}
                      className="bg-transparent border-0 p-0 pr-4 text-xs text-teal-700/70 dark:text-teal-300/70 focus:outline-none disabled:opacity-50"
                    >
                      {!branchesReady && (
                        <option>{t.branch.branchLoading}</option>
                      )}
                      {branchesReady && branches.length === 0 && (
                        <option>{t.branch.noBranches}</option>
                      )}
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
          </div>

          {isBranchManager && (
            <div className="border border-teal-200 dark:border-teal-800 rounded-full px-3 py-1.5 text-xs font-medium text-teal-800 dark:text-teal-200">
              {me.branch?.name || t.branch.branchLabel}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-start">
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-teal-700/70 dark:text-teal-300/70">
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

            <div className="flex md:flex-col flex-row overflow-x-auto md:overflow-visible gap-1 pb-1">
              <button
                onClick={() => setActiveCategory("")}
                className={`shrink-0 text-start px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                  activeCategory === ""
                    ? "bg-teal-700 text-white"
                    : "hover:bg-teal-50 dark:hover:bg-teal-900/30 text-teal-900 dark:text-teal-100"
                }`}
              >
                {t.branch.categories.allItems}
              </button>
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="group shrink-0 flex items-center gap-0.5"
                >
                  <button
                    onClick={() => setActiveCategory(c.id)}
                    className={`flex-1 text-start px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                      activeCategory === c.id
                        ? "bg-teal-700 text-white"
                        : "hover:bg-teal-50 dark:hover:bg-teal-900/30 text-teal-900 dark:text-teal-100"
                    }`}
                  >
                    {c.name}{" "}
                    <span className="text-xs opacity-60">({c.item_count})</span>
                  </button>
                  <button
                    onClick={() => setCategoryForm(c)}
                    aria-label={t.common.edit}
                    title={t.common.edit}
                    className="hidden md:inline-flex opacity-0 group-hover:opacity-100 p-1 rounded text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30"
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

          <div className="min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-teal-700/70 dark:text-teal-300/70">
                {t.branch.items.title}
              </h2>
              <button
                onClick={openCreateItem}
                disabled={!branchId}
                className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
              >
                <Plus size={15} />
                {t.branch.items.add}
              </button>
            </div>

            {loadingItems ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-[3/4] rounded-xl bg-teal-100/40 dark:bg-teal-900/20 animate-pulse"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-teal-200 dark:border-teal-800 px-6 py-14 text-center">
                <p className="font-semibold text-teal-900 dark:text-teal-100 mb-1">
                  {t.branch.items.noItems}
                </p>
                <p className="text-sm text-teal-700/70 dark:text-teal-300/70 max-w-md mx-auto">
                  {t.branch.items.noItemsHint}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map((i) => {
                  const unitText = displayUnit(i);
                  return (
                    <div
                      key={i.id}
                      className="flex flex-col rounded-2xl border border-teal-200 dark:border-teal-800 overflow-hidden bg-white dark:bg-teal-950/60 shadow-sm hover:shadow-md transition"
                    >
                      <div className="relative w-full aspect-[4/3] bg-teal-50 dark:bg-teal-900/40">
                        {i.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={i.image_url}
                            alt={i.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-teal-400">
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
                          <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-50 leading-snug">
                            {i.name}
                          </h3>
                          {i.category?.name && (
                            <span className="self-start text-[11px] text-teal-700/70 dark:text-teal-300/70 border border-teal-200 dark:border-teal-800 rounded-full px-2 py-0.5">
                              {i.category.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
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
                          {unitText && (
                            <span className="text-[11px] font-medium text-teal-700/80 dark:text-teal-300/80 bg-teal-50 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-800 rounded-full px-2 py-0.5">
                              {unitText}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleOnline(i)}
                          disabled={togglingId === i.id}
                          title={
                            i.is_online
                              ? "Visible to online customers at this branch — click to hide"
                              : "Hidden from online at this branch — click to show"
                          }
                          className={`inline-flex items-center gap-1 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                            i.is_online
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {i.is_online ? (
                            <Globe size={11} />
                          ) : (
                            <Store size={11} />
                          )}
                          {i.is_online ? "Online" : "POS only"}
                        </button>

                        <div className="mt-auto pt-1 flex gap-4">
                          <button
                            onClick={() => openEditItem(i)}
                            className="inline-flex items-center gap-1 text-xs text-teal-700/70 hover:text-teal-700 dark:text-teal-300/70 dark:hover:text-teal-300"
                          >
                            <Pencil size={13} />
                            {t.common.edit}
                          </button>
                          <button
                            onClick={() => deleteItem(i)}
                            className="inline-flex items-center gap-1 text-xs text-teal-700/70 hover:text-red-600 dark:text-teal-300/70 dark:hover:text-red-400"
                          >
                            <Trash2 size={13} />
                            {t.common.delete}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {categoryForm && (
        <CategoryModal
          t={t}
          dir={dir}
          form={categoryForm}
          setForm={setCategoryForm}
          productCategories={productCategories}
          onSubmit={saveCategory}
          onClose={() => !saving && setCategoryForm(null)}
          saving={saving}
          error={error}
        />
      )}

      {itemForm && (
        <ItemModal
          t={t}
          dir={dir}
          form={itemForm}
          setForm={setItemForm}
          categories={categories}
          productCategories={productCategories}
          units={units}
          onSubmit={saveItem}
          onClose={() => !saving && setItemForm(null)}
          saving={saving}
          error={error}
          uploadingImage={uploadingImage}
          handleImageSelect={handleImageSelect}
          removeImage={removeImage}
          fileInputRef={fileInputRef}
          guardOnline={guardOnline}
        />
      )}

      {showHesabpayModal && (
        <HesabpayRequiredModal
          t={t}
          dir={dir}
          isOwner={isOwner}
          onClose={() => setShowHesabpayModal(false)}
          onGoToProfile={() => router.push(HOTEL_PROFILE_PATH)}
        />
      )}
    </div>
  );
}

function HesabpayRequiredModal({ t, dir, isOwner, onClose, onGoToProfile }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      dir={dir}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-teal-950 shadow-2xl overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-teal-950 dark:text-teal-50">
              {t.hotel?.hesabpayRequiredTitle || "HesabPay number required"}
            </h2>
            <p className="mt-1 text-sm text-teal-700/80 dark:text-teal-300/80 leading-relaxed">
              {isOwner
                ? t.hotel?.hesabpayRequiredMessage ||
                  "You can't make menu items available online until you set a valid HesabPay account number (format: 07XXXXXXXX). Please update your hotel profile first."
                : t.hotel?.hesabpayRequiredMessageBranch ||
                  "You can't make menu items available online until the hotel owner sets a valid HesabPay account number. Please contact your hotel owner."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 -mr-1 -mt-1 rounded-full flex items-center justify-center text-teal-700/70 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900 shrink-0"
            aria-label={t.common?.close || "Close"}
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex justify-end gap-2 border-t border-teal-100 dark:border-teal-800/60 px-5 py-3 bg-teal-50/40 dark:bg-teal-900/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-full border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/50"
          >
            {t.common?.close || "Close"}
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={onGoToProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm"
            >
              {t.hotel?.goToProfile || "Go to hotel profile"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryModal({
  t,
  dir,
  form,
  setForm,
  productCategories,
  onSubmit,
  onClose,
  saving,
  error,
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [saving, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      dir={dir}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 border-b border-teal-100 dark:border-teal-800/60 px-5 py-3">
          <h2 className="text-base font-semibold text-teal-950 dark:text-teal-50">
            {form.id
              ? t.branch.categories.editTitle
              : t.branch.categories.addTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-8 w-8 rounded-full flex items-center justify-center text-teal-700/70 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t.branch.categories.namePlaceholder || "Name"} *
              </label>
              <input
                required
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t.branch.categories.sortOrderPlaceholder || "Sort order"}
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
                dir="ltr"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {t.branch.categories.defaultProductCategory ||
                "Default product category (auto-tag new items)"}
            </label>
            <select
              value={form.default_product_category_id || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  default_product_category_id: e.target.value,
                })
              }
              className={inputClass}
            >
              <option value="">
                {t.branch.categories.noDefaultProductCategory ||
                  "— None (items inherit nothing) —"}
              </option>
              {productCategories.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.icon ? `${pc.icon} ` : ""}
                  {pc.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-teal-700/60 dark:text-teal-300/60">
              New items created in this category will be auto-tagged for the
              online marketplace chips.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-teal-900 dark:text-teal-100 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="h-4 w-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
            />
            {t.branch.categories.active}
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-teal-100 dark:border-teal-800/60 px-5 py-3 bg-white dark:bg-teal-950">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-full border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/50 disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? t.common.saving : t.common.save}
          </button>
        </div>
      </form>
    </div>
  );
}

function ItemModal({
  t,
  dir,
  form,
  setForm,
  categories,
  productCategories,
  units,
  onSubmit,
  onClose,
  saving,
  error,
  uploadingImage,
  handleImageSelect,
  removeImage,
  fileInputRef,
  guardOnline,
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !saving && !uploadingImage) onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [saving, uploadingImage, onClose]);

  const isEdit = !!form.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
      dir={dir}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving && !uploadingImage)
          onClose();
      }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 border-b border-teal-100 dark:border-teal-800/60 px-5 py-3">
          <h2 className="text-base font-semibold text-teal-950 dark:text-teal-50 truncate">
            {isEdit ? t.branch.items.editTitle : t.branch.items.addTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploadingImage}
            className="h-8 w-8 rounded-full flex items-center justify-center text-teal-700/70 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="h-24 w-24 shrink-0 rounded-xl overflow-hidden border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/40 flex items-center justify-center">
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-[11px] text-teal-700/60 dark:text-teal-300/60">
                  <ImageOff className="h-5 w-5 mx-auto mb-0.5 opacity-60" />
                  {t.branch.items.noImage}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageSelect}
                disabled={uploadingImage}
                className="block w-full text-xs text-teal-900 dark:text-teal-100 file:me-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700 file:cursor-pointer"
              />
              {uploadingImage && (
                <p className="inline-flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-300">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t.branch.items.uploading}
                </p>
              )}
              {form.image_url && !uploadingImage && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  {t.branch.items.removeImage}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t.branch.items.namePlaceholder || "Name"} *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t.branch.items.categoryLabel || "Menu category"}
              </label>
              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
                className={inputClass}
              >
                <option value="">{t.branch.items.noCategory}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {t.branch.items.productCategory ||
                "Marketplace category (helps customers find it)"}
            </label>
            <select
              value={form.product_category_id || ""}
              onChange={(e) =>
                setForm({ ...form, product_category_id: e.target.value })
              }
              className={inputClass}
            >
              <option value="">
                {t.branch.items.noProductCategory || "— Not tagged —"}
              </option>
              {productCategories.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.icon ? `${pc.icon} ` : ""}
                  {pc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t.branch.items.basePrice || "Base price (hotel-wide)"} *
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={form.base_price}
                onChange={(e) =>
                  setForm({ ...form, base_price: e.target.value })
                }
                dir="ltr"
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-teal-700/60 dark:text-teal-300/60">
                Changing this affects every branch. Use the card's quick price
                to set a per-branch override.
              </p>
            </div>
            <div>
              <label className={labelClass}>
                {t.branch.items.taxPlaceholder || "Tax rate %"}
              </label>
              <input
                type="number"
                step="0.01"
                value={form.tax_rate}
                onChange={(e) =>
                  setForm({ ...form, tax_rate: Number(e.target.value) })
                }
                dir="ltr"
                className={inputClass}
              />
            </div>
          </div>

          {/* ── unit row (unit + quantity) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                {t.branch.items.unitLabel || "Unit (optional)"}
              </label>
              <select
                value={form.unit_id || ""}
                onChange={(e) => {
                  const newUnitId = e.target.value;
                  setForm({
                    ...form,
                    unit_id: newUnitId,
                    unit_quantity: newUnitId ? form.unit_quantity : "",
                  });
                }}
                className={inputClass}
              >
                <option value="">
                  {t.branch.items.noUnit || "— No unit —"}
                </option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                    {u.short_name ? ` (${u.short_name})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                {t.branch.items.unitQuantityLabel || "Quantity"}
              </label>
              <input
                type="number"
                step="0.001"
                value={form.unit_quantity ?? ""}
                onChange={(e) =>
                  setForm({ ...form, unit_quantity: e.target.value })
                }
                disabled={!form.unit_id}
                placeholder="1, 250, 500…"
                dir="ltr"
                className={inputClass}
              />
            </div>
          </div>

          <p className="text-[11px] text-teal-700/60 dark:text-teal-300/60 -mt-2">
            {t.branch.items.unitHint ||
              "Shown on the public home page next to the price (e.g. “1 Plate”, “250 Gram”). Leave empty for items without a portion."}
          </p>

          <div>
            <label className={labelClass}>
              {t.branch.items.descriptionPlaceholder || "Description"}
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className={inputClass + " resize-none"}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <ToggleTile
              checked={form.is_available}
              onChange={(v) => setForm({ ...form, is_available: v })}
              label={t.branch.items.available}
            />
            <ToggleTile
              checked={form.is_kitchen}
              onChange={(v) => setForm({ ...form, is_kitchen: v })}
              label={t.branch.items.kitchen}
            />
            <ToggleTile
              checked={form.is_online}
              onChange={(v) => {
                if (
                  v &&
                  typeof guardOnline === "function" &&
                  !guardOnline(true)
                )
                  return;
                setForm({ ...form, is_online: v });
              }}
              label={t.branch.items.online || "Online (this branch)"}
              icon={form.is_online ? <Globe size={12} /> : <Store size={12} />}
              accent={form.is_online ? "emerald" : undefined}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-teal-100 dark:border-teal-800/60 px-5 py-3 bg-white dark:bg-teal-950">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploadingImage}
            className="px-4 py-2 text-sm rounded-full border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/50 disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? t.common.saving : t.common.save}
          </button>
        </div>
      </form>
    </div>
  );
}

function ToggleTile({ checked, onChange, label, icon, accent }) {
  const borderCls = checked
    ? accent === "emerald"
      ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30"
      : "border-teal-300 dark:border-teal-700 bg-teal-50/60 dark:bg-teal-900/30"
    : "border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-900/20";

  return (
    <label
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer select-none transition-colors ${borderCls}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500 shrink-0"
      />
      {icon && (
        <span className="shrink-0 text-teal-700 dark:text-teal-300">
          {icon}
        </span>
      )}
      <span className="text-sm text-teal-900 dark:text-teal-100 truncate">
        {label}
      </span>
    </label>
  );
}
