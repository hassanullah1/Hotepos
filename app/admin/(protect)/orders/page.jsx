"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Utensils,
  Plus,
  Printer,
  X,
  Check,
  Minus,
  Table2,
  BedDouble,
  ShoppingBag,
  Receipt,
  RefreshCw,
  ImageOff,
  Search,
  UserPlus,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const OPEN_STATUSES = ["open", "in_progress", "served"];

const STATUS_BG = {
  open: "bg-sky-50 dark:bg-sky-950/40",
  in_progress: "bg-amber-50 dark:bg-amber-950/40",
  served: "bg-teal-50 dark:bg-teal-950/40",
  paid: "bg-emerald-50 dark:bg-emerald-950/40",
  closed: "bg-gray-100 dark:bg-gray-800/40",
  cancelled: "bg-red-50 dark:bg-red-950/40",
};
const STATUS_TEXT = {
  open: "text-sky-700 dark:text-sky-300",
  in_progress: "text-amber-700 dark:text-amber-300",
  served: "text-teal-700 dark:text-teal-300",
  paid: "text-emerald-700 dark:text-emerald-300",
  closed: "text-gray-500 dark:text-gray-400",
  cancelled: "text-red-600 dark:text-red-300",
};
const STATUS_DOT = {
  open: "bg-sky-500",
  in_progress: "bg-amber-500",
  served: "bg-teal-500",
  paid: "bg-emerald-500",
  closed: "bg-gray-400",
  cancelled: "bg-red-500",
};

function escapeHtml(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

export default function OrdersPage() {
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

  const [tables, setTables] = useState([]);
  const [roomStays, setRoomStays] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customersHotelId, setCustomersHotelId] = useState("");
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tableFilter, setTableFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState(null);

  function handle401(res) {
    if (res.status === 401) {
      router.push("/login");
      return true;
    }
    return false;
  }

  // ---------- me ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");
        if (!res.ok) {
          if (res.status === 401) return router.push("/login");
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

  // ---------- owner: hotels ----------
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

  // ---------- owner: branches ----------
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
      setTableFilter("");
      setDraft(null);
      loadBranches(selectedHotelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, selectedHotelId]);

  useEffect(() => {
    if (isBranchManager && me?.branch?.id) setBranchId(me.branch.id);
  }, [isBranchManager, me]);

  // ---------- load all data ----------
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

      const [tRes, mRes, oRes, rRes, cRes] = await Promise.all([
        fetchWithAuth(`/api/owners/dining-tables?branch_id=${branchId}`),
        fetchWithAuth(`/api/owners/menu-items?branch_id=${branchId}`),
        fetchWithAuth(`/api/owners/orders?branch_id=${branchId}`),
        fetchWithAuth(
          `/api/owners/room-stays?branch_id=${branchId}&status=active`,
        ),
        hotelIdForCustomers
          ? fetchWithAuth(
              `/api/owners/customers?hotel_id=${hotelIdForCustomers}`,
            )
          : Promise.resolve(null),
      ]);

      if (
        tRes.status === 401 ||
        mRes.status === 401 ||
        oRes.status === 401 ||
        (rRes && rRes.status === 401)
      )
        return router.push("/login");

      if (!tRes.ok) throw new Error("Failed to load tables");
      if (!mRes.ok) throw new Error("Failed to load menu");
      if (!oRes.ok) throw new Error("Failed to load orders");

      const tData = await tRes.json();
      const mData = await mRes.json();
      const oData = await oRes.json();

      setTables(tData.tables || []);
      setMenuItems(mData.items || []);
      setOrders(oData.orders || []);

      // Room stays (optional — endpoint may 404 in hotels without rooms)
      if (rRes && rRes.ok) {
        const rData = await rRes.json();
        setRoomStays(rData.stays || []);
      } else {
        setRoomStays([]);
      }

      // Customers (optional — may fail silently)
      if (cRes && cRes.ok) {
        const cData = await cRes.json();
        // Support both paginated ({ customers: [...] }) and plain shapes
        setCustomers(cData.customers || []);
        setCustomersHotelId(hotelIdForCustomers);
      } else {
        setCustomers([]);
        setCustomersHotelId(hotelIdForCustomers);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (branchId) {
      setTableFilter("");
      setDraft(null);
      loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  // ---------- derived ----------
  const openOrders = useMemo(
    () => orders.filter((o) => OPEN_STATUSES.includes(o.status)),
    [orders],
  );

  const visibleOrders = useMemo(() => {
    if (!tableFilter) return openOrders;
    return openOrders.filter((o) => o.table?.id === tableFilter);
  }, [openOrders, tableFilter]);

  const openCountByTable = useMemo(() => {
    const map = {};
    for (const o of openOrders) {
      const key = o.table?.id || "_no_table";
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [openOrders]);

  const draftTotal = useMemo(() => {
    if (!draft) return 0;
    return draft.items.reduce((s, ci) => {
      const item = menuItems.find((m) => m.id === ci.menu_item_id);
      return s + (item ? Number(item.price) * ci.quantity : 0);
    }, 0);
  }, [draft, menuItems]);

  const selectedHotelName =
    hotels.find((h) => h.id === selectedHotelId)?.name || "";

  // ---------- draft actions ----------
  function defaultScope() {
    if (roomStays.length > 0) return "table"; // prefer table if both exist
    if (tables.length > 0) return "table";
    return "takeaway";
  }

  function pickTable(id) {
    setDraft((prev) => ({
      mode: prev?.mode || "new",
      orderId: prev?.orderId,
      items: prev?.items || [],
      scope: "table",
      tableId: id,
      roomStayId: null,
      customerId: prev?.customerId || "",
    }));
  }

  function pickRoom(stayId) {
    const stay = roomStays.find((s) => s.id === stayId);
    setDraft((prev) => ({
      mode: prev?.mode || "new",
      orderId: prev?.orderId,
      items: prev?.items || [],
      scope: "room",
      tableId: null,
      roomStayId: stayId,
      // Auto-attach customer if the stay has one
      customerId: stay?.customer?.id || prev?.customerId || "",
    }));
  }

  function setScope(scope) {
    setDraft((prev) => ({
      mode: prev?.mode || "new",
      orderId: prev?.orderId,
      items: prev?.items || [],
      scope,
      tableId: scope === "table" ? prev?.tableId || "" : null,
      roomStayId: scope === "room" ? prev?.roomStayId || "" : null,
      customerId: prev?.customerId || "",
    }));
  }

  function setCustomer(customerId) {
    setDraft((prev) => ({
      mode: prev?.mode || "new",
      orderId: prev?.orderId,
      items: prev?.items || [],
      scope: prev?.scope || defaultScope(),
      tableId: prev?.tableId || "",
      roomStayId: prev?.roomStayId || "",
      customerId,
    }));
  }

  // Called after the quick-add modal successfully creates a customer.
  function handleCustomerCreated(customer) {
    if (!customer) return;
    setCustomers((prev) => {
      if (prev.some((c) => c.id === customer.id)) return prev;
      return [customer, ...prev];
    });
    // Auto-select the newly created customer on the current draft
    setCustomer(customer.id);
  }

  function addItem(menuItemId) {
    setDraft((prev) => {
      const base = prev || {
        mode: "new",
        scope: defaultScope(),
        tableId: "",
        roomStayId: "",
        customerId: "",
        items: [],
      };
      const ex = base.items.find((i) => i.menu_item_id === menuItemId);
      if (ex) {
        return {
          ...base,
          items: base.items.map((i) =>
            i.menu_item_id === menuItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        };
      }
      return {
        ...base,
        items: [...base.items, { menu_item_id: menuItemId, quantity: 1 }],
      };
    });
  }

  function decItem(menuItemId) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items
          .map((i) =>
            i.menu_item_id === menuItemId
              ? { ...i, quantity: i.quantity - 1 }
              : i,
          )
          .filter((i) => i.quantity > 0),
      };
    });
  }

  function removeItem(menuItemId) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((i) => i.menu_item_id !== menuItemId),
      };
    });
  }

  function cancelDraft() {
    setDraft(null);
  }

  function startAddToOrder(orderId) {
    setError("");
    setDraft({ mode: "add", orderId, items: [] });
  }

  async function submitDraft() {
    if (!draft || draft.items.length === 0) return;

    if (draft.mode === "new") {
      if (draft.scope === "table" && !draft.tableId) {
        setError("Choose a table first");
        return;
      }
      if (draft.scope === "room" && !draft.roomStayId) {
        setError("Choose a room first");
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      if (draft.mode === "new") {
        const res = await fetchWithAuth(`/api/owners/orders`, {
          method: "POST",
          body: JSON.stringify({
            branch_id: branchId,
            table_id: draft.scope === "table" ? draft.tableId : null,
            room_stay_id: draft.scope === "room" ? draft.roomStayId : null,
            customer_id: draft.customerId || null,
            order_type:
              draft.scope === "room"
                ? "room_service"
                : draft.scope === "takeaway"
                  ? "takeaway"
                  : "dine_in",
            items: draft.items,
          }),
        });
        if (handle401(res)) return;
        const data = await res.json();
        if (!res.ok) return setError(data.error || "Failed to create order");
        setOrders((prev) => [data.order, ...prev]);
        // Refresh room stays so totals update in the picker
        if (draft.scope === "room") loadAll();
        cancelDraft();
      } else {
        let lastOrder = null;
        for (const line of draft.items) {
          const res = await fetchWithAuth(
            `/api/owners/orders/${draft.orderId}/items`,
            {
              method: "POST",
              body: JSON.stringify({
                menu_item_id: line.menu_item_id,
                quantity: line.quantity,
              }),
            },
          );
          if (handle401(res)) return;
          const data = await res.json();
          if (!res.ok) return setError(data.error || "Failed to add item");
          lastOrder = data.order;
        }
        if (lastOrder)
          setOrders((prev) =>
            prev.map((o) => (o.id === lastOrder.id ? lastOrder : o)),
          );
        cancelDraft();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ---------- order actions ----------
  async function updateOrderStatus(orderId, status) {
    try {
      const res = await fetchWithAuth(`/api/owners/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed to update order");
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function cancelOrder(orderId) {
    if (!confirm("Cancel this order?")) return;
    await updateOrderStatus(orderId, "cancelled");
  }

  async function removeOrderItem(orderId, itemId) {
    try {
      const res = await fetchWithAuth(
        `/api/owners/orders/${orderId}/items?item_id=${itemId}`,
        { method: "DELETE" },
      );
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed to remove item");
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    } catch (err) {
      setError(err.message);
    }
  }

  // ---------- print ----------
  function printOrder(order) {
    const hotelName = isOwner ? selectedHotelName : me?.hotel?.name || "";
    const branchName = isOwner
      ? branches.find((b) => b.id === branchId)?.name || ""
      : me?.branch?.name || "";

    let target = "Takeaway";
    if (order.room_stay?.room?.room_number) {
      target = `Room ${order.room_stay.room.room_number}`;
      if (order.room_stay.guest_name)
        target += ` — ${order.room_stay.guest_name}`;
    } else if (order.table?.table_number) {
      target = `Table ${order.table.table_number}`;
    }

    const created = new Date(order.created_at).toLocaleString();
    const rowsHtml = order.items
      .map(
        (i) => `<tr>
        <td>${i.quantity} × ${escapeHtml(i.name)}</td>
        <td style="text-align:right">${i.line_total.toFixed(2)}</td>
      </tr>`,
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"/>
      <title>${escapeHtml(order.order_number)}</title>
      <style>
        body{font-family:ui-monospace,Menlo,monospace;padding:16px;max-width:320px}
        h1{font-size:16px;margin:0 0 4px}
        .muted{color:#666;font-size:12px;margin-bottom:8px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        td{padding:3px 0}
        hr{border:none;border-top:1px dashed #999;margin:8px 0}
        .total{font-weight:700;font-size:14px;text-align:right}
        .center{text-align:center}
      </style></head><body>
      <div class="center">
        <h1>${escapeHtml(hotelName)}</h1>
        <div class="muted">${escapeHtml(branchName)}</div>
        <div class="muted">${escapeHtml(target)} · ${created}</div>
      </div>
      <hr/>
      <table>${rowsHtml}</table>
      <hr/>
      <div class="total">TOTAL: ${order.total_amount.toFixed(2)}</div>
      ${order.notes ? `<hr/><div class="muted">Note: ${escapeHtml(order.notes)}</div>` : ""}
      <hr/>
      <div class="center muted">${escapeHtml(order.order_number)}</div>
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300);}</script>
      </body></html>`;
    const w = window.open("", "_blank", "width=360,height=640");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  if (!me) {
    return (
      <div
        className="min-h-screen bg-[#F4FAF9] dark:bg-[#0B2624] p-6 flex items-center justify-center"
        dir={dir}
      >
        <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
          {t.common?.loading || "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4FAF9] dark:bg-[#0B2624] p-4" dir={dir}>
      <div className="max-w-7xl mx-auto">
        {/* =============== HEADER =============== */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Utensils className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-teal-950 dark:text-teal-50 leading-tight">
                {t.orders?.title || "Orders"}
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
                    {me.branch?.name || t.branch?.branchLabel || "Branch"}
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
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={loadAll}
            disabled={!branchId || loading}
            title="Refresh"
            className="h-9 w-9 rounded-full flex items-center justify-center border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40 disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* =============== FILTER CHIPS =============== */}
        {tables.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <button
              onClick={() => setTableFilter("")}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                tableFilter === ""
                  ? "bg-teal-600 text-white"
                  : "bg-white dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/40"
              }`}
            >
              All ({openOrders.length})
            </button>
            {tables.map((tb) => {
              const count = openCountByTable[tb.id] || 0;
              const active = tableFilter === tb.id;
              return (
                <button
                  key={tb.id}
                  onClick={() => setTableFilter(active ? "" : tb.id)}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    active
                      ? "bg-teal-600 text-white"
                      : "bg-white dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/40"
                  }`}
                >
                  <Table2 className="h-3 w-3 opacity-70" />
                  {tb.table_number}
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-semibold rounded-full px-1.5 ${
                        active
                          ? "bg-white/25 text-white"
                          : "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* =============== MAIN GRID =============== */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4">
          {/* ---------- LEFT: orders ---------- */}
          <div className="space-y-2 min-w-0">
            {loading && orders.length === 0 ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-teal-100/40 dark:bg-teal-900/20 animate-pulse"
                />
              ))
            ) : visibleOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12 rounded-2xl border border-dashed border-teal-200 dark:border-teal-800">
                <Receipt className="h-6 w-6 text-teal-300 dark:text-teal-700 mb-2" />
                <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
                  {openOrders.length === 0
                    ? t.orders?.noOpenOrders || "No open orders yet."
                    : t.orders?.noOrdersForTable ||
                      "No open orders for this table."}
                </p>
              </div>
            ) : (
              visibleOrders.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  active={draft?.mode === "add" && draft.orderId === o.id}
                  onPrint={() => printOrder(o)}
                  onStatus={(s) => updateOrderStatus(o.id, s)}
                  onCancel={() => cancelOrder(o.id)}
                  onAddItem={() => startAddToOrder(o.id)}
                  onRemoveItem={(iid) => removeOrderItem(o.id, iid)}
                  t={t}
                />
              ))
            )}
          </div>

          {/* ---------- RIGHT: menu ---------- */}
          <aside className="lg:sticky lg:top-4 h-fit">
            <MenuPanel
              draft={draft}
              tables={tables}
              roomStays={roomStays}
              customers={customers}
              customersHotelId={customersHotelId}
              onCustomerCreated={handleCustomerCreated}
              menuItems={menuItems}
              draftTotal={draftTotal}
              onPickTable={pickTable}
              onPickRoom={pickRoom}
              onSetScope={setScope}
              onSetCustomer={setCustomer}
              onAddItem={addItem}
              onDecItem={decItem}
              onRemoveItem={removeItem}
              onCancel={cancelDraft}
              onSubmit={submitDraft}
              saving={saving}
              t={t}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ================= Order Row ================= */
function OrderRow({
  order,
  active,
  onPrint,
  onStatus,
  onCancel,
  onAddItem,
  onRemoveItem,
  t,
}) {
  const roomLabel = order.room_stay?.room?.room_number
    ? `${order.room_stay.room.room_number}`
    : null;
  const guestLabel =
    order.room_stay?.guest_name || order.room_stay?.customer?.full_name || null;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        active
          ? "border-teal-500 ring-2 ring-teal-500/30"
          : "border-teal-200 dark:border-teal-800"
      } ${STATUS_BG[order.status] || ""}`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-teal-100 dark:border-teal-800/60 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {roomLabel ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 text-white text-[11px] font-bold px-2 py-0.5 shrink-0">
              <BedDouble className="h-3 w-3" />
              {roomLabel}
            </span>
          ) : order.table?.table_number ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-600 text-white text-[11px] font-bold px-2 py-0.5 shrink-0">
              <Table2 className="h-3 w-3" />
              {order.table.table_number}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-500 text-white text-[11px] font-bold px-2 py-0.5 shrink-0">
              <ShoppingBag className="h-3 w-3" />
              TA
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-teal-950/40 px-2 py-0.5 text-[11px] font-medium shrink-0 ${
              STATUS_TEXT[order.status] || "text-gray-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                STATUS_DOT[order.status] || "bg-gray-400"
              }`}
            />
            {order.status.replace("_", " ")}
          </span>

          <span className="text-[11px] text-teal-700/70 dark:text-teal-300/70 truncate">
            {order.order_number}
            {guestLabel ? ` · ${guestLabel}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onPrint}
            title="Print"
            className="h-7 w-7 rounded-full flex items-center justify-center text-teal-700 hover:bg-teal-100/70 dark:text-teal-200 dark:hover:bg-teal-900/60"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onCancel}
            title="Cancel"
            className="h-7 w-7 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-3 py-2">
        <ul className="space-y-0.5">
          {order.items.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between text-[13px] gap-2 group"
            >
              <span className="text-teal-950 dark:text-teal-50 truncate">
                <span className="font-medium">{i.quantity}×</span> {i.name}
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="text-teal-700/80 dark:text-teal-300/70 tabular-nums">
                  {i.line_total.toFixed(2)}
                </span>
                <button
                  onClick={() => onRemoveItem(i.id)}
                  title="Remove"
                  className="h-5 w-5 rounded-full flex items-center justify-center text-red-400/0 group-hover:text-red-500/70 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-teal-100 dark:border-teal-800/60">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={onAddItem}
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
              active
                ? "border-teal-500 bg-teal-600 text-white"
                : "border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-white/70 dark:hover:bg-teal-900/40"
            }`}
          >
            <Plus className="h-3 w-3" />
            {t.orders?.addItem || "Item"}
          </button>
          {order.status === "open" && (
            <button
              onClick={() => onStatus("in_progress")}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {t.orders?.startPreparing || "Prepare"}
            </button>
          )}
          {order.status === "in_progress" && (
            <button
              onClick={() => onStatus("served")}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {t.orders?.markServed || "Served"}
            </button>
          )}
          {order.status !== "paid" && (
            <button
              onClick={() => onStatus("paid")}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="h-3 w-3" />
              {t.orders?.markPaid || "Paid"}
            </button>
          )}
          {order.status === "paid" && (
            <button
              onClick={() => onStatus("closed")}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-700 hover:bg-gray-800 text-white"
            >
              {t.orders?.closeOrder || "Close"}
            </button>
          )}
        </div>
        <span className="text-sm font-semibold text-teal-950 dark:text-white tabular-nums">
          {order.total_amount.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/* ================= Customer Picker (autocomplete) ================= */
function CustomerPicker({ customers, value, onChange, onQuickAdd, t }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selected = customers.find((c) => c.id === value);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? customers.filter((c) => {
          const name = (c.full_name || "").toLowerCase();
          const phone = (c.phone || "").toLowerCase();
          const email = (c.email || "").toLowerCase();
          return name.includes(q) || phone.includes(q) || email.includes(q);
        })
      : customers;
    return base.slice(0, 8);
  }, [customers, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  function commit(customer) {
    if (!customer) {
      onChange("");
    } else {
      onChange(customer.id);
    }
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (filtered[highlight]) {
        e.preventDefault();
        commit(filtered[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex items-center gap-1">
        {selected ? (
          <div className="flex-1 flex items-center gap-1.5 text-xs border border-teal-200 dark:border-teal-800 rounded-md px-2 py-1 bg-white dark:bg-teal-950/40 min-w-0">
            <span className="truncate text-teal-900 dark:text-teal-100 flex-1">
              {selected.full_name || selected.phone || "Unnamed"}
              {selected.phone ? ` · ${selected.phone}` : ""}
            </span>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setQuery("");
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              title="Clear"
              className="h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-teal-700/70 hover:bg-teal-100 dark:text-teal-200 dark:hover:bg-teal-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex-1 relative min-w-0">
            <Search className="absolute top-1/2 -translate-y-1/2 ltr:left-2 rtl:right-2 h-3 w-3 text-teal-400 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={t.orders?.searchCustomer || "Search customer…"}
              className="w-full text-xs border border-teal-200 dark:border-teal-800 rounded-md ltr:pl-7 ltr:pr-2 rtl:pr-7 rtl:pl-2 py-1.5 bg-white dark:bg-teal-950/40 text-teal-900 dark:text-teal-100"
            />
          </div>
        )}

        <button
          type="button"
          onClick={onQuickAdd}
          title={t.orders?.quickAddCustomer || "Quick add customer"}
          className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40"
        >
          <UserPlus className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && !selected && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950 shadow-lg">
          <button
            type="button"
            onClick={() => commit(null)}
            className="w-full text-start px-2.5 py-1.5 text-xs text-teal-700/80 dark:text-teal-300/80 hover:bg-teal-50 dark:hover:bg-teal-900/40"
          >
            {t.orders?.noCustomer || "No customer (walk-in)"}
          </button>

          {filtered.length === 0 ? (
            <div className="px-2.5 py-2 text-xs text-teal-700/70 dark:text-teal-300/70">
              {t.orders?.noMatches || "No matches"}
            </div>
          ) : (
            filtered.map((c, idx) => {
              const isHi = idx === highlight;
              return (
                <button
                  key={c.id}
                  type="button"
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => commit(c)}
                  className={`w-full text-start px-2.5 py-1.5 text-xs flex items-center justify-between gap-2 ${
                    isHi
                      ? "bg-teal-50 dark:bg-teal-900/50"
                      : "hover:bg-teal-50 dark:hover:bg-teal-900/40"
                  }`}
                >
                  <span className="truncate text-teal-900 dark:text-teal-100">
                    {c.full_name || c.phone || "Unnamed"}
                  </span>
                  {c.phone && (
                    <span
                      className="text-[10px] text-teal-700/70 dark:text-teal-300/70 shrink-0"
                      dir="ltr"
                    >
                      {c.phone}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ================= Menu Panel ================= */
function MenuPanel({
  draft,
  tables,
  roomStays,
  customers,
  customersHotelId,
  onCustomerCreated,
  menuItems,
  draftTotal,
  onPickTable,
  onPickRoom,
  onSetScope,
  onSetCustomer,
  onAddItem,
  onDecItem,
  onRemoveItem,
  onCancel,
  onSubmit,
  saving,
  t,
}) {
  const isNew = !draft || draft.mode === "new";
  const items = draft?.items || [];
  const scope = draft?.scope || "table";

  const hasTables = tables.length > 0;
  const hasRooms = roomStays.length > 0;

  const scopeReady =
    !isNew ||
    (scope === "table" && !!draft?.tableId) ||
    (scope === "room" && !!draft?.roomStayId) ||
    scope === "takeaway";

  const canSubmit =
    !saving && items.length > 0 && (draft?.mode === "add" || scopeReady);

  // ---------- quick-add customer modal state ----------
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({
    full_name: "",
    phone: "",
    email: "",
  });
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState("");

  function openQuickAdd() {
    setQuickError("");
    setQuickForm({ full_name: "", phone: "", email: "" });
    setQuickOpen(true);
  }

  async function submitQuickAdd(e) {
    e.preventDefault();
    if (!customersHotelId) {
      setQuickError("No hotel scope for this branch");
      return;
    }
    const name = quickForm.full_name.trim();
    const phone = quickForm.phone.trim();
    const email = quickForm.email.trim();
    if (!name && !phone && !email) {
      setQuickError("Enter at least a name, phone or email");
      return;
    }
    setQuickSaving(true);
    setQuickError("");
    try {
      const res = await fetchWithAuth("/api/owners/customers", {
        method: "POST",
        body: JSON.stringify({
          hotel_id: customersHotelId,
          full_name: name || null,
          phone: phone || null,
          email: email || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuickError(data.error || "Failed to create customer");
        return;
      }
      onCustomerCreated?.(data.customer);
      setQuickOpen(false);
      setQuickForm({ full_name: "", phone: "", email: "" });
    } catch (err) {
      setQuickError(err.message);
    } finally {
      setQuickSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950/60 overflow-hidden shadow-sm flex flex-col max-h-[calc(100vh-140px)]">
      {/* header: mode + scope toggle + scope pickers */}
      <div className="px-3 py-2.5 border-b border-teal-100 dark:border-teal-800/60">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-sm font-semibold text-teal-950 dark:text-white truncate">
            {!draft
              ? t.orders?.menu || "Menu"
              : draft.mode === "new"
                ? t.orders?.newOrder || "New order"
                : t.orders?.addItem || "Add items"}
          </span>
          {draft && (
            <button
              onClick={onCancel}
              className="h-7 w-7 rounded-full flex items-center justify-center text-teal-700/70 hover:bg-teal-100 dark:text-teal-200 dark:hover:bg-teal-900"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Scope toggle */}
        {isNew && (
          <div className="flex items-center gap-1 mb-2 p-0.5 rounded-full bg-teal-50 dark:bg-teal-900/30 w-fit">
            {hasTables && (
              <button
                onClick={() => onSetScope("table")}
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                  scope === "table"
                    ? "bg-teal-600 text-white"
                    : "text-teal-800 dark:text-teal-200 hover:bg-white/70 dark:hover:bg-teal-900/40"
                }`}
              >
                <Table2 className="h-3 w-3" />
                {t.orders?.scopeTable || "Table"}
              </button>
            )}
            {hasRooms && (
              <button
                onClick={() => onSetScope("room")}
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                  scope === "room"
                    ? "bg-indigo-600 text-white"
                    : "text-indigo-800 dark:text-indigo-200 hover:bg-white/70 dark:hover:bg-indigo-900/40"
                }`}
              >
                <BedDouble className="h-3 w-3" />
                {t.orders?.scopeRoom || "Room"}
              </button>
            )}
            <button
              onClick={() => onSetScope("takeaway")}
              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                scope === "takeaway"
                  ? "bg-gray-600 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-800/40"
              }`}
            >
              <ShoppingBag className="h-3 w-3" />
              {t.orders?.scopeTakeaway || "Takeaway"}
            </button>
          </div>
        )}

        {/* Table picker */}
        {isNew && scope === "table" && (
          <>
            {!hasTables ? (
              <p className="text-[11px] text-teal-700/70 dark:text-teal-300/70">
                {t.orders?.noTables || "No tables in this branch."}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tables.map((tb) => {
                  const active = draft?.tableId === tb.id;
                  return (
                    <button
                      key={tb.id}
                      onClick={() => onPickTable(tb.id)}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                        active
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "bg-white dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40"
                      }`}
                    >
                      <Table2 className="h-3 w-3 opacity-70" />
                      {tb.table_number}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Room picker */}
        {isNew && scope === "room" && (
          <>
            {!hasRooms ? (
              <p className="text-[11px] text-indigo-700/70 dark:text-indigo-300/70">
                {t.orders?.noRooms ||
                  "No active room stays in this branch. Check someone in first."}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {roomStays.map((s) => {
                  const active = draft?.roomStayId === s.id;
                  const label = s.room?.room_number || "—";
                  const guest = s.guest_name || s.customer?.full_name || "";
                  return (
                    <button
                      key={s.id}
                      onClick={() => onPickRoom(s.id)}
                      className={`inline-flex flex-col items-start gap-0.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                        active
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-3 w-3 opacity-70" />
                        {label}
                      </span>
                      {guest && (
                        <span
                          className={`text-[10px] ${
                            active
                              ? "text-white/80"
                              : "text-indigo-700/70 dark:text-indigo-300/70"
                          }`}
                        >
                          {guest}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Takeaway — nothing to pick */}

        {/* Customer selector (optional) — autocomplete + quick add */}
        {isNew && (scope === "table" || scope === "takeaway") && (
          <div className="mt-2">
            <CustomerPicker
              customers={customers}
              value={draft?.customerId || ""}
              onChange={onSetCustomer}
              onQuickAdd={openQuickAdd}
              t={t}
            />
          </div>
        )}

        {draft?.mode === "add" && (
          <p className="text-[11px] text-teal-700/70 dark:text-teal-300/70 mt-2">
            {t.orders?.addingToOrder || "Adding items to selected order"}
          </p>
        )}
      </div>

      {/* MENU grid */}
      <div
        className={`px-3 py-2.5 overflow-y-auto flex-1 min-h-0 ${
          isNew && !scopeReady ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {isNew && !scopeReady && (
          <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-2.5 py-1.5 mb-2">
            {scope === "room"
              ? t.orders?.pickRoomFirst ||
                "Pick an active room above to start adding items."
              : t.orders?.pickTableFirst ||
                "Pick a table above to start adding items."}
          </p>
        )}

        {menuItems.length === 0 ? (
          <p className="text-xs text-teal-700/70 dark:text-teal-300/70 py-3 text-center">
            {t.orders?.noMenu || "No menu items for this branch."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {menuItems.map((m) => (
              <button
                key={m.id}
                onClick={() => onAddItem(m.id)}
                className="text-start rounded-lg border border-teal-100 dark:border-teal-800 p-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:border-teal-300 dark:hover:border-teal-700 transition-colors flex gap-2 items-center min-w-0"
              >
                <div className="h-11 w-11 rounded-md bg-teal-50 dark:bg-teal-900/40 overflow-hidden shrink-0 flex items-center justify-center">
                  {m.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.image_url}
                      alt={m.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageOff className="h-4 w-4 text-teal-400/70 dark:text-teal-600/70" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-teal-950 dark:text-teal-50 truncate leading-tight">
                    {m.name}
                  </div>
                  <div className="text-[11px] text-teal-700/70 dark:text-teal-300/70 tabular-nums">
                    {Number(m.price).toFixed(2)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CART */}
      {draft && items.length > 0 && (
        <div className="border-t border-teal-100 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-900/20">
          <div className="px-3 py-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-teal-700/70 dark:text-teal-300/70">
              {t.orders?.cart || "Cart"} ({items.length})
            </span>
            <span className="text-sm font-bold text-teal-950 dark:text-white tabular-nums">
              {draftTotal.toFixed(2)}
            </span>
          </div>
          <div className="px-3 pb-2 max-h-40 overflow-y-auto">
            <ul className="space-y-1">
              {items.map((ci) => {
                const item = menuItems.find((m) => m.id === ci.menu_item_id);
                return (
                  <li
                    key={ci.menu_item_id}
                    className="flex items-center justify-between gap-2 text-[13px]"
                  >
                    <span className="truncate text-teal-900 dark:text-teal-100">
                      {item?.name || "Item"}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => onDecItem(ci.menu_item_id)}
                        className="h-6 w-6 rounded-full border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-200"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center tabular-nums text-sm">
                        {ci.quantity}
                      </span>
                      <button
                        onClick={() => onAddItem(ci.menu_item_id)}
                        className="h-6 w-6 rounded-full border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-200"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(ci.menu_item_id)}
                        className="h-6 w-6 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="px-3 pb-2.5 flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-1.5 text-sm rounded-full border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/50"
            >
              {t.common?.cancel || "Cancel"}
            </button>
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className="flex-1 px-3 py-1.5 text-sm rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50"
            >
              {saving
                ? t.common?.saving || "Saving…"
                : draft?.mode === "new"
                  ? t.orders?.createOrder || "Create order"
                  : t.orders?.addItems || "Add items"}
            </button>
          </div>
        </div>
      )}

      {/* ---------- quick-add customer modal ---------- */}
      {quickOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setQuickOpen(false);
          }}
        >
          <form
            onSubmit={submitQuickAdd}
            className="bg-white dark:bg-teal-950 rounded-xl p-4 w-full max-w-xs space-y-2.5 shadow-xl border border-teal-200 dark:border-teal-800"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-50">
                {t.orders?.quickAddCustomerTitle || "Quick add customer"}
              </h3>
              <button
                type="button"
                onClick={() => setQuickOpen(false)}
                className="h-6 w-6 rounded-full flex items-center justify-center text-teal-700/70 hover:bg-teal-100 dark:text-teal-200 dark:hover:bg-teal-900"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {quickError && (
              <p className="text-[11px] text-red-600 dark:text-red-400">
                {quickError}
              </p>
            )}

            <input
              autoFocus
              placeholder={t.customers?.namePlaceholder || "Full name"}
              value={quickForm.full_name}
              onChange={(e) =>
                setQuickForm({ ...quickForm, full_name: e.target.value })
              }
              className="w-full border border-teal-200 dark:border-teal-800 rounded-md px-2.5 py-1.5 text-xs bg-white dark:bg-teal-900/40 text-teal-900 dark:text-teal-100"
            />
            <input
              placeholder={t.customers?.phonePlaceholder || "Phone"}
              value={quickForm.phone}
              onChange={(e) =>
                setQuickForm({ ...quickForm, phone: e.target.value })
              }
              dir="ltr"
              className="w-full border border-teal-200 dark:border-teal-800 rounded-md px-2.5 py-1.5 text-xs bg-white dark:bg-teal-900/40 text-teal-900 dark:text-teal-100"
            />
            <input
              type="email"
              placeholder={t.customers?.emailPlaceholder || "Email"}
              value={quickForm.email}
              onChange={(e) =>
                setQuickForm({ ...quickForm, email: e.target.value })
              }
              dir="ltr"
              className="w-full border border-teal-200 dark:border-teal-800 rounded-md px-2.5 py-1.5 text-xs bg-white dark:bg-teal-900/40 text-teal-900 dark:text-teal-100"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQuickOpen(false)}
                className="px-3 py-1.5 text-xs rounded-full border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/50"
              >
                {t.common?.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={quickSaving}
                className="px-3 py-1.5 text-xs rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50"
              >
                {quickSaving
                  ? t.common?.saving || "Saving…"
                  : t.common?.save || "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
