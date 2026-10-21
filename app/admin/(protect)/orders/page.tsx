"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Globe,
  Ban,
  Clock,
  Phone,
  Mail,
  User,
  MapPin,
  Navigation,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const OPEN_STATUSES = ["open", "in_progress", "served"];

const STATUS_BG: Record<string, string> = {
  open: "bg-sky-50 dark:bg-sky-950/40",
  in_progress: "bg-amber-50 dark:bg-amber-950/40",
  served: "bg-teal-50 dark:bg-teal-950/40",
  paid: "bg-emerald-50 dark:bg-emerald-950/40",
  closed: "bg-gray-100 dark:bg-gray-800/40",
  cancelled: "bg-red-50 dark:bg-red-950/40",
  rejected: "bg-rose-50 dark:bg-rose-950/40",
};
const STATUS_TEXT: Record<string, string> = {
  open: "text-sky-700 dark:text-sky-300",
  in_progress: "text-amber-700 dark:text-amber-300",
  served: "text-teal-700 dark:text-teal-300",
  paid: "text-emerald-700 dark:text-emerald-300",
  closed: "text-gray-500 dark:text-gray-400",
  cancelled: "text-red-600 dark:text-red-300",
  rejected: "text-rose-700 dark:text-rose-300",
};
const STATUS_DOT: Record<string, string> = {
  open: "bg-sky-500",
  in_progress: "bg-amber-500",
  served: "bg-teal-500",
  paid: "bg-emerald-500",
  closed: "bg-gray-400",
  cancelled: "bg-red-500",
  rejected: "bg-rose-600",
};

function escapeHtml(s: any) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string,
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  const [me, setMe] = useState<any>(null);
  const isOwner = me?.role === "hotel_owner";
  const isBranchManager = me?.role === "branch_manager";

  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [branchesHotelId, setBranchesHotelId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchId, setBranchId] = useState("");

  const branchesReady = !loadingBranches && branchesHotelId === selectedHotelId;

  const [tables, setTables] = useState<any[]>([]);
  const [roomStays, setRoomStays] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersHotelId, setCustomersHotelId] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tableFilter, setTableFilter] = useState("");

  // ── DEFAULT: POS (not "all") ──
  const [sourceFilter, setSourceFilter] = useState("pos");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState<any>(null);
  const pollRef = useRef<any>(null);

  function handle401(res: Response) {
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
          throw new Error(t.common?.loadUserError || "Failed to load user");
        }
        const data = await res.json();
        setMe(data.user);
      } catch (err: any) {
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
        if (handle401(res)) return;
        const data = await res.json();
        setHotels(data.hotels || []);
        const only = data.hotels?.length === 1 ? data.hotels[0].id : "";
        setSelectedHotelId(data.selectedHotelId || only || "");
      } catch (err: any) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  async function loadBranches(hotelId: string) {
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
    } catch (err: any) {
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
      setSourceFilter("pos"); // ← reset to POS
      setDraft(null);
      loadBranches(selectedHotelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, selectedHotelId]);

  useEffect(() => {
    if (isBranchManager && me?.branch?.id) setBranchId(me.branch.id);
  }, [isBranchManager, me]);

  async function loadAll({ silent = false }: { silent?: boolean } = {}) {
    if (!branchId) return;
    if (!silent) setLoading(true);
    setError("");
    try {
      const hotelIdForCustomers =
        selectedHotelId ||
        me?.hotel_id ||
        me?.branch?.hotel_id ||
        branches.find((b: any) => b.id === branchId)?.hotel_id ||
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

      if (rRes && rRes.ok) {
        const rData = await rRes.json();
        setRoomStays(rData.stays || []);
      } else {
        setRoomStays([]);
      }

      if (cRes && cRes.ok) {
        const cData = await cRes.json();
        setCustomers(cData.customers || []);
        setCustomersHotelId(hotelIdForCustomers);
      } else {
        setCustomers([]);
        setCustomersHotelId(hotelIdForCustomers);
      }
    } catch (err: any) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    if (branchId) {
      setTableFilter("");
      setSourceFilter("pos"); // ← reset to POS
      setDraft(null);
      loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  useEffect(() => {
    if (!branchId) return;
    pollRef.current = setInterval(() => {
      loadAll({ silent: true });
    }, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const openOrders = useMemo(
    () => orders.filter((o: any) => OPEN_STATUSES.includes(o.status)),
    [orders],
  );

  const visibleOrders = useMemo(() => {
    let list = openOrders;

    if (sourceFilter === "pos") {
      list = list.filter(
        (o: any) => o.source === "pos" || !o.source || o.source === null,
      );
    } else if (sourceFilter === "online") {
      list = list.filter((o: any) => o.source === "customer");
    } else if (sourceFilter === "qr") {
      list = list.filter((o: any) => o.source === "qr");
    }

    if (tableFilter) {
      list = list.filter((o: any) => o.table?.id === tableFilter);
    }

    return list;
  }, [openOrders, tableFilter, sourceFilter]);

  const openCountByTable = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of openOrders) {
      const key = o.table?.id || "_no_table";
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [openOrders]);

  const sourceCounts = useMemo(
    () => ({
      pos: openOrders.filter(
        (o: any) => o.source === "pos" || !o.source || o.source === null,
      ).length,
      online: openOrders.filter((o: any) => o.source === "customer").length,
      qr: openOrders.filter((o: any) => o.source === "qr").length,
    }),
    [openOrders],
  );

  const draftTotal = useMemo(() => {
    if (!draft) return 0;
    return draft.items.reduce((s: number, ci: any) => {
      const item = menuItems.find((m: any) => m.id === ci.menu_item_id);
      return s + (item ? Number(item.price) * ci.quantity : 0);
    }, 0);
  }, [draft, menuItems]);

  function defaultScope() {
    if (roomStays.length > 0) return "table";
    if (tables.length > 0) return "table";
    return "takeaway";
  }

  function pickTable(id: string) {
    setDraft((prev: any) => ({
      mode: prev?.mode || "new",
      orderId: prev?.orderId,
      items: prev?.items || [],
      scope: "table",
      tableId: id,
      roomStayId: null,
      customerId: prev?.customerId || "",
    }));
  }

  function pickRoom(stayId: string) {
    const stay = roomStays.find((s: any) => s.id === stayId);
    setDraft((prev: any) => ({
      mode: prev?.mode || "new",
      orderId: prev?.orderId,
      items: prev?.items || [],
      scope: "room",
      tableId: null,
      roomStayId: stayId,
      customerId: stay?.customer?.id || prev?.customerId || "",
    }));
  }

  function setScope(scope: string) {
    setDraft((prev: any) => ({
      mode: prev?.mode || "new",
      orderId: prev?.orderId,
      items: prev?.items || [],
      scope,
      tableId: scope === "table" ? prev?.tableId || "" : null,
      roomStayId: scope === "room" ? prev?.roomStayId || "" : null,
      customerId: prev?.customerId || "",
    }));
  }

  function setCustomer(customerId: string) {
    setDraft((prev: any) => ({
      mode: prev?.mode || "new",
      orderId: prev?.orderId,
      items: prev?.items || [],
      scope: prev?.scope || defaultScope(),
      tableId: prev?.tableId || "",
      roomStayId: prev?.roomStayId || "",
      customerId,
    }));
  }

  function handleCustomerCreated(customer: any) {
    if (!customer) return;
    setCustomers((prev: any[]) => {
      if (prev.some((c) => c.id === customer.id)) return prev;
      return [customer, ...prev];
    });
    setCustomer(customer.id);
  }

  function addItem(menuItemId: string) {
    setDraft((prev: any) => {
      const base = prev || {
        mode: "new",
        scope: defaultScope(),
        tableId: "",
        roomStayId: "",
        customerId: "",
        items: [],
      };
      const ex = base.items.find((i: any) => i.menu_item_id === menuItemId);
      if (ex) {
        return {
          ...base,
          items: base.items.map((i: any) =>
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

  function decItem(menuItemId: string) {
    setDraft((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items
          .map((i: any) =>
            i.menu_item_id === menuItemId
              ? { ...i, quantity: i.quantity - 1 }
              : i,
          )
          .filter((i: any) => i.quantity > 0),
      };
    });
  }

  function removeItem(menuItemId: string) {
    setDraft((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((i: any) => i.menu_item_id !== menuItemId),
      };
    });
  }

  function cancelDraft() {
    setDraft(null);
  }

  function startAddToOrder(orderId: string) {
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
            prev.map((o: any) => (o.id === lastOrder.id ? lastOrder : o)),
          );
        cancelDraft();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const res = await fetchWithAuth(`/api/owners/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed to update order");
      setOrders((prev) =>
        prev.map((o: any) => (o.id === orderId ? data.order : o)),
      );
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function rejectOrder(orderId: string) {
    if (
      !confirm(
        "Reject this order? The customer will be notified and the order will be closed.",
      )
    )
      return;
    await updateOrderStatus(orderId, "rejected");
  }

  async function cancelOrder(orderId: string) {
    if (!confirm("Cancel this order?")) return;
    await updateOrderStatus(orderId, "cancelled");
  }

  async function removeOrderItem(orderId: string, itemId: string) {
    try {
      const res = await fetchWithAuth(
        `/api/owners/orders/${orderId}/items?item_id=${itemId}`,
        { method: "DELETE" },
      );
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed to remove item");
      setOrders((prev) =>
        prev.map((o: any) => (o.id === orderId ? data.order : o)),
      );
    } catch (err: any) {
      setError(err.message);
    }
  }

  function printOrder(order: any) {
    let target = "Takeaway";
    if (order.room_stay?.room?.room_number) {
      target = `Room ${order.room_stay.room.room_number}`;
      if (order.room_stay.guest_name)
        target += ` — ${order.room_stay.guest_name}`;
    } else if (order.table?.table_number) {
      target = `Table ${order.table.table_number}`;
    } else if (order.source === "customer") {
      target = "Online order";
    }

    const d = order.online_details;
    const buyer = order.buyer || {};
    const isDelivery = order.order_type === "delivery";

    const created = new Date(order.created_at).toLocaleString();
    const rowsHtml = order.items
      .map(
        (i: any) => `<tr>
          <td>${i.quantity} × ${escapeHtml(i.name)}</td>
          <td style="text-align:right">${Number(i.line_total).toFixed(2)}</td>
        </tr>`,
      )
      .join("");

    const deliveryBlock = d
      ? `
        <hr/>
        <div><strong>${isDelivery ? "DELIVERY TO" : "PICKUP BY"}</strong></div>
        <div>${escapeHtml(d.contact_name || buyer.full_name || "")}</div>
        <div>TEL: ${escapeHtml(d.contact_phone || buyer.phone || "")}</div>
        ${
          isDelivery && d.delivery_address
            ? `<div>${escapeHtml(d.delivery_address)}${
                d.delivery_city ? `, ${escapeHtml(d.delivery_city)}` : ""
              }</div>`
            : ""
        }
        ${
          isDelivery && d.delivery_notes
            ? `<div class="muted">Note: ${escapeHtml(d.delivery_notes)}</div>`
            : ""
        }
      `
      : "";

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
        <div class="muted">${escapeHtml(target)} · ${created}</div>
      </div>
      ${deliveryBlock}
      <hr/>
      <table>${rowsHtml}</table>
      <hr/>
      <div class="total">TOTAL: ${Number(order.total_amount).toFixed(2)}</div>
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

  const isOnlineView = sourceFilter === "online";

  return (
    <div className="min-h-screen p-4" dir={dir}>
      <div className="max-w-7xl mx-auto">
        {/* ═══ HEADER ═══ */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Utensils className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg font-semibold text-teal-950 dark:text-teal-50 leading-tight whitespace-nowrap">
                {t.orders?.title || "Orders"}
              </h1>

              {isOwner && (
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  disabled={!branchesReady || branches.length === 0}
                  className="bg-transparent border border-teal-200 dark:border-teal-800 rounded-full px-3 py-1 text-xs text-teal-800 dark:text-teal-200 focus:outline-none disabled:opacity-50"
                >
                  {!branchesReady && <option>Loading…</option>}
                  {branchesReady && branches.length === 0 && (
                    <option>No branches</option>
                  )}
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
              {isBranchManager && (
                <span className="text-xs text-teal-700/70 dark:text-teal-300/70 whitespace-nowrap">
                  {me.branch?.name || t.branch?.branchLabel || "Branch"}
                </span>
              )}
            </div>
          </div>

          {/* Source tabs — POS / Online / QR */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              {
                key: "pos",
                label: "POS",
                count: sourceCounts.pos,
                icon: ShoppingBag,
                activeCls: "bg-teal-600 text-white",
              },
              {
                key: "online",
                label: "Online",
                count: sourceCounts.online,
                icon: Globe,
                activeCls: "bg-emerald-600 text-white",
              },
              {
                key: "qr",
                label: "QR",
                count: sourceCounts.qr,
                icon: Table2,
                activeCls: "bg-blue-600 text-white",
              },
            ]
              .filter(
                (f) => f.key === "pos" || f.count > 0 || sourceFilter === f.key,
              )
              .map((f) => {
                const Icon = f.icon;
                const active = sourceFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setSourceFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                      active
                        ? f.activeCls
                        : "bg-white dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/40"
                    }`}
                  >
                    <Icon className="h-3 w-3 opacity-80" />
                    {f.label}
                    <span
                      className={`text-[10px] font-semibold rounded-full px-1.5 ${
                        active
                          ? "bg-white/25 text-white"
                          : "bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200"
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                );
              })}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/owners/online-orders"
              title="Online order history"
              className="inline-flex items-center gap-1.5 h-9 rounded-full px-3 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 text-xs font-semibold"
            >
              <Globe className="h-3.5 w-3.5" />
              History
            </Link>

            <button
              onClick={() => loadAll()}
              disabled={!branchId || loading}
              title="Refresh"
              className="h-9 w-9 rounded-full flex items-center justify-center border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40 disabled:opacity-40"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* ═══ TABLE FILTER — POS & QR only ═══ */}
        {!isOnlineView && tables.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <button
              onClick={() => setTableFilter("")}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                tableFilter === ""
                  ? "bg-teal-600 text-white"
                  : "bg-white dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/40"
              }`}
            >
              All tables
            </button>
            {tables.map((tb: any) => {
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

        {/* ═══ MAIN CONTENT ═══ */}
        {isOnlineView ? (
          /* ── ONLINE: full-width cards only, NO menu panel ── */
          <div className="space-y-2">
            {loading && orders.length === 0 ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-teal-100/40 dark:bg-teal-900/20 animate-pulse"
                />
              ))
            ) : visibleOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-800">
                <Globe className="h-7 w-7 text-emerald-300 dark:text-emerald-700 mb-2" />
                <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
                  No online orders waiting.
                </p>
                <p className="text-xs text-teal-700/50 dark:text-teal-300/50 mt-1">
                  New online orders will appear here automatically.
                </p>
                <Link
                  href="/owners/online-orders"
                  className="mt-3 text-[11px] font-semibold underline text-emerald-700 dark:text-emerald-300"
                >
                  View order history →
                </Link>
              </div>
            ) : (
              visibleOrders.map((o: any) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  active={false}
                  onPrint={() => printOrder(o)}
                  onStatus={(s: string) => updateOrderStatus(o.id, s)}
                  onCancel={() => cancelOrder(o.id)}
                  onReject={() => rejectOrder(o.id)}
                  onAddItem={() => {}}
                  onRemoveItem={() => {}}
                  t={t}
                />
              ))
            )}
          </div>
        ) : (
          /* ── POS / QR: grid with cards + menu panel ── */
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4">
            <div className="space-y-2 min-w-0">
              {loading && orders.length === 0 ? (
                [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 rounded-xl bg-teal-100/40 dark:bg-teal-900/20 animate-pulse"
                  />
                ))
              ) : visibleOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 rounded-2xl border border-dashed border-teal-200 dark:border-teal-800">
                  <Receipt className="h-6 w-6 text-teal-300 dark:text-teal-700 mb-2" />
                  <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
                    {sourceFilter === "qr"
                      ? "No QR orders waiting."
                      : "No open orders yet."}
                  </p>
                </div>
              ) : (
                visibleOrders.map((o: any) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    active={draft?.mode === "add" && draft.orderId === o.id}
                    onPrint={() => printOrder(o)}
                    onStatus={(s: string) => updateOrderStatus(o.id, s)}
                    onCancel={() => cancelOrder(o.id)}
                    onReject={() => rejectOrder(o.id)}
                    onAddItem={() => startAddToOrder(o.id)}
                    onRemoveItem={(iid: string) => removeOrderItem(o.id, iid)}
                    t={t}
                  />
                ))
              )}
            </div>

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
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   OrderRow — unified card
   ═══════════════════════════════════════════════ */
function OrderRow({
  order,
  active,
  onPrint,
  onStatus,
  onCancel,
  onReject,
  onAddItem,
  onRemoveItem,
  t,
}: {
  order: any;
  active: boolean;
  onPrint: () => void;
  onStatus: (s: string) => void;
  onCancel: () => void;
  onReject: () => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  t: any;
}) {
  const isOnline = order.source === "customer";
  const isQr = order.source === "qr";
  const isPos = !isOnline && !isQr;

  const roomLabel = order.room_stay?.room?.room_number;
  const guestLabel =
    order.room_stay?.guest_name || order.room_stay?.customer?.full_name;
  const tableLabel = order.table?.table_number;

  const buyer = order.buyer || {};
  const onlineDetails = order.online_details;
  const isDelivery = order.order_type === "delivery";

  const isUnpaid = order.payment_status !== "paid";
  const blockedByPayment = (isQr || isOnline) && isUnpaid;

  const sourceBadge = isOnline
    ? { Icon: Globe, label: "Online", cls: "bg-emerald-600 text-white" }
    : isQr
      ? { Icon: Table2, label: "QR", cls: "bg-blue-600 text-white" }
      : { Icon: ShoppingBag, label: "POS", cls: "bg-teal-600 text-white" };
  const SourceIcon = sourceBadge.Icon;

  const contactName =
    onlineDetails?.contact_name || buyer.full_name || guestLabel || "";
  const contactPhone = onlineDetails?.contact_phone || buyer.phone || "";
  const deliveryAddress = onlineDetails?.delivery_address
    ? `${onlineDetails.delivery_address}${
        onlineDetails.delivery_city ? `, ${onlineDetails.delivery_city}` : ""
      }`
    : "";

  const hasGps =
    onlineDetails?.delivery_lat != null && onlineDetails?.delivery_lng != null;
  const mapHref = hasGps
    ? `https://www.google.com/maps?q=${onlineDetails.delivery_lat},${onlineDetails.delivery_lng}`
    : deliveryAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryAddress)}`
      : null;
  const directionsHref = hasGps
    ? `https://www.google.com/maps/dir/?api=1&destination=${onlineDetails.delivery_lat},${onlineDetails.delivery_lng}`
    : deliveryAddress
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(deliveryAddress)}`
      : null;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        active
          ? "border-teal-500 ring-2 ring-teal-500/30"
          : blockedByPayment
            ? "border-emerald-400 dark:border-emerald-700"
            : isOnline
              ? "border-emerald-200 dark:border-emerald-800"
              : isQr
                ? "border-blue-200 dark:border-blue-800"
                : "border-teal-200 dark:border-teal-800"
      } ${STATUS_BG[order.status] || ""}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-teal-100 dark:border-teal-800/60 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 rounded-md ${sourceBadge.cls} text-[11px] font-bold px-2 py-0.5 shrink-0`}
          >
            <SourceIcon className="h-3 w-3" />
            {sourceBadge.label}
          </span>

          {roomLabel ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 text-white text-[11px] font-bold px-2 py-0.5 shrink-0">
              <BedDouble className="h-3 w-3" />
              {roomLabel}
            </span>
          ) : tableLabel ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-700 text-white text-[11px] font-bold px-2 py-0.5 shrink-0">
              <Table2 className="h-3 w-3" />
              {tableLabel}
            </span>
          ) : isPos ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-500 text-white text-[11px] font-bold px-2 py-0.5 shrink-0">
              <ShoppingBag className="h-3 w-3" />
              TA
            </span>
          ) : null}

          {blockedByPayment && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
              <Clock className="h-3 w-3" />
              Unpaid
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
          {order.status !== "rejected" && (
            <button
              onClick={onReject}
              title="Reject order"
              className="h-7 w-7 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Ban className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onCancel}
            title="Cancel"
            className="h-7 w-7 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Online-only delivery strip */}
      {isOnline && (contactName || contactPhone || deliveryAddress) && (
        <div className="px-3 py-2 bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
          {(contactName || contactPhone) && (
            <div className="flex items-center gap-2 text-[11px] flex-wrap">
              <User className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {contactName && (
                <span className="font-medium text-emerald-900 dark:text-emerald-100 truncate">
                  {contactName}
                </span>
              )}
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  <span dir="ltr">{contactPhone}</span>
                </a>
              )}
              {buyer.email && !contactPhone && (
                <span className="flex items-center gap-1 text-emerald-700/80 dark:text-emerald-300/80">
                  <Mail className="h-3 w-3" />
                  <span dir="ltr" className="truncate max-w-[140px]">
                    {buyer.email}
                  </span>
                </span>
              )}
            </div>
          )}

          {isDelivery && deliveryAddress && (
            <div className="flex items-start gap-2 text-[11px]">
              <MapPin className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="flex-1 text-emerald-900 dark:text-emerald-100 leading-snug line-clamp-2">
                {deliveryAddress}
              </span>
              <div className="shrink-0 flex gap-1">
                {mapHref && (
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 text-[10px] font-semibold"
                  >
                    <MapPin className="h-2.5 w-2.5" />
                    Map
                  </a>
                )}
                {directionsHref && (
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-semibold"
                  >
                    <Navigation className="h-2.5 w-2.5" />
                    Go
                  </a>
                )}
              </div>
            </div>
          )}

          {isDelivery && onlineDetails?.delivery_notes && (
            <div className="flex items-start gap-1 text-[10px] italic text-emerald-700/80 dark:text-emerald-300/80">
              <span>Note:</span>
              <span className="flex-1 truncate">
                {onlineDetails.delivery_notes}
              </span>
            </div>
          )}

          {hasGps && (
            <div
              className="text-[10px] tabular-nums text-emerald-700/70 dark:text-emerald-300/70"
              dir="ltr"
            >
              📍 {Number(onlineDetails.delivery_lat).toFixed(5)},{" "}
              {Number(onlineDetails.delivery_lng).toFixed(5)}
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="px-3 py-2">
        <ul className="space-y-0.5">
          {order.items.map((i: any) => (
            <li
              key={i.id}
              className="flex items-center justify-between text-[13px] gap-2 group"
            >
              <span className="text-teal-950 dark:text-teal-50 truncate">
                <span className="font-medium">{i.quantity}×</span> {i.name}
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="text-teal-700/80 dark:text-teal-300/70 tabular-nums">
                  {Number(i.line_total).toFixed(2)}
                </span>
                {(isPos || isQr) && (
                  <button
                    onClick={() => onRemoveItem(i.id)}
                    title="Remove"
                    className="h-5 w-5 rounded-full flex items-center justify-center text-red-400/0 group-hover:text-red-500/70 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-teal-100 dark:border-teal-800/60">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(isPos || isQr) && (
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
          )}

          {order.status === "open" && (
            <button
              onClick={() => onStatus("in_progress")}
              disabled={blockedByPayment}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.orders?.startPreparing || "Prepare"}
            </button>
          )}
          {order.status === "in_progress" && (
            <button
              onClick={() => onStatus("served")}
              disabled={blockedByPayment}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.orders?.markServed || "Served"}
            </button>
          )}
          {order.status !== "paid" && order.status !== "closed" && (
            <button
              onClick={() => onStatus("paid")}
              disabled={blockedByPayment}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="h-3 w-3" />
              {isOnline ? "Complete" : t.orders?.markPaid || "Paid"}
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
          {Number(order.total_amount).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CustomerPicker
   ═══════════════════════════════════════════════ */
function CustomerPicker({
  customers,
  value,
  onChange,
  onQuickAdd,
  t,
}: {
  customers: any[];
  value: string;
  onChange: (id: string) => void;
  onQuickAdd: () => void;
  t: any;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<any>(null);
  const inputRef = useRef<any>(null);

  const selected = customers.find((c: any) => c.id === value);

  useEffect(() => {
    function onDocClick(e: any) {
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
      ? customers.filter((c: any) => {
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

  function commit(customer: any) {
    if (!customer) onChange("");
    else onChange(customer.id);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(e: any) {
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
            filtered.map((c: any, idx: number) => {
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

/* ═══════════════════════════════════════════════
   MenuPanel
   ═══════════════════════════════════════════════ */
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
}: any) {
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

  async function submitQuickAdd(e: any) {
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
    } catch (err: any) {
      setQuickError(err.message);
    } finally {
      setQuickSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950/60 overflow-hidden shadow-sm flex flex-col max-h-[calc(100vh-140px)]">
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
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

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

        {isNew && scope === "table" && (
          <>
            {!hasTables ? (
              <p className="text-[11px] text-teal-700/70 dark:text-teal-300/70">
                {t.orders?.noTables || "No tables in this branch."}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tables.map((tb: any) => {
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

        {isNew && scope === "room" && (
          <>
            {!hasRooms ? (
              <p className="text-[11px] text-indigo-700/70 dark:text-indigo-300/70">
                {t.orders?.noRooms || "No active room stays in this branch."}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {roomStays.map((s: any) => {
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
            {menuItems.map((m: any) => (
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
              {items.map((ci: any) => {
                const item = menuItems.find(
                  (m: any) => m.id === ci.menu_item_id,
                );
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

      {quickOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onMouseDown={(e: any) => {
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
