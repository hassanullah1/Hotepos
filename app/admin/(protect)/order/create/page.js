"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Minus,
  ShoppingBag,
  UtensilsCrossed,
  Send,
  CheckCircle2,
  Users,
  ChevronUp,
  ChevronDown,
  Receipt,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

// ----- Shared UI primitives -----
const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";
const labelClass =
  "mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400";
const cardClass =
  "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm";

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ label, color = "teal" }) {
  const colorMap = {
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    green:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    gray: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[color] || colorMap.gray}`}
    >
      {label}
    </span>
  );
}

// Category colors
const CATEGORY_COLORS = [
  "#0D9488",
  "#0891B2",
  "#059669",
  "#4F46E5",
  "#7C3AED",
  "#DB2777",
];
function categoryColor(index) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

// ----- Main Component -----
export default function WaiterPOSPage() {
  const router = useRouter();
  const { dir } = useAdminPreferences();

  const [orderType, setOrderType] = useState("");
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [session, setSession] = useState(null);

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const [previousOrders, setPreviousOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [editingOrderId, setEditingOrderId] = useState(null);
  const [additions, setAdditions] = useState({});
  const [savingAdditionsFor, setSavingAdditionsFor] = useState(null);
  const [printing, setPrinting] = useState(false);

  function handle401(res) {
    if (res.status === 401) {
      router.push("/hotel/login");
      return true;
    }
    return false;
  }

  async function loadTables() {
    setLoadingTables(true);
    try {
      const res = await fetchWithAuth("/api/waiter/tables");
      if (handle401(res)) return;
      const data = await res.json();
      setTables(data.tables || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTables(false);
    }
  }

  async function loadMenu() {
    try {
      const res = await fetchWithAuth("/api/waiter/menu");
      if (handle401(res)) return;
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadTables();
    loadMenu();
  }, []);

  async function loadOrders(sessionId) {
    if (!sessionId) {
      setPreviousOrders([]);
      return;
    }
    setLoadingOrders(true);
    try {
      const res = await fetchWithAuth(
        `/api/waiter/orders?table_session_id=${sessionId}`,
      );
      if (handle401(res)) return;
      const data = await res.json();
      // Only keep orders that are still open (not completed)
      const openOrders = (data.orders || []).filter(
        (o) => o.status !== "completed",
      );
      setPreviousOrders(openOrders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingOrders(false);
    }
  }

  function selectTakeaway() {
    setError("");
    setSession(null);
    setPreviousOrders([]);
    setEditingOrderId(null);
    setAdditions({});
    setOrderType("takeaway");
  }

  async function selectTable(t) {
    setError("");
    try {
      const res = await fetchWithAuth("/api/waiter/table-sessions", {
        method: "POST",
        body: JSON.stringify({ table_id: t.id }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to open table");
        return;
      }
      setSession({ id: data.session.id, table_number: t.table_number });
      setOrderType("dine_in");
      loadOrders(data.session.id);
    } catch (err) {
      setError(err.message);
    }
  }

  function addToCart(item) {
    if (editingOrderId) {
      setAdditions((prev) => {
        const list = prev[editingOrderId] || [];
        const existing = list.find((c) => c.menu_item_id === item.id);
        const nextList = existing
          ? list.map((c) =>
              c.menu_item_id === item.id ? { ...c, qty: c.qty + 1 } : c,
            )
          : [
              ...list,
              {
                menu_item_id: item.id,
                name: item.name,
                price: Number(item.price),
                qty: 1,
                notes: "",
              },
            ];
        return { ...prev, [editingOrderId]: nextList };
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item_id === item.id ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          menu_item_id: item.id,
          name: item.name,
          price: Number(item.price),
          qty: 1,
          notes: "",
        },
      ];
    });
  }

  function changeQty(menuItemId, delta) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menu_item_id === menuItemId ? { ...c, qty: c.qty + delta } : c,
        )
        .filter((c) => c.qty > 0),
    );
  }

  function changeNotes(menuItemId, notes) {
    setCart((prev) =>
      prev.map((c) => (c.menu_item_id === menuItemId ? { ...c, notes } : c)),
    );
  }

  function qtyInCart(menuItemId) {
    if (editingOrderId) {
      return (
        (additions[editingOrderId] || []).find(
          (c) => c.menu_item_id === menuItemId,
        )?.qty || 0
      );
    }
    return cart.find((c) => c.menu_item_id === menuItemId)?.qty || 0;
  }

  function startAddingTo(orderId) {
    setEditingOrderId(orderId);
    setAdditions((prev) => ({ ...prev, [orderId]: prev[orderId] || [] }));
    setCartOpen(true);
  }

  function cancelAddingTo(orderId) {
    setAdditions((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
    setEditingOrderId((current) => (current === orderId ? null : current));
  }

  function changeAdditionQty(orderId, menuItemId, delta) {
    setAdditions((prev) => ({
      ...prev,
      [orderId]: (prev[orderId] || [])
        .map((c) =>
          c.menu_item_id === menuItemId ? { ...c, qty: c.qty + delta } : c,
        )
        .filter((c) => c.qty > 0),
    }));
  }

  function changeAdditionNotes(orderId, menuItemId, notes) {
    setAdditions((prev) => ({
      ...prev,
      [orderId]: (prev[orderId] || []).map((c) =>
        c.menu_item_id === menuItemId ? { ...c, notes } : c,
      ),
    }));
  }

  async function sendAdditions(orderId) {
    const list = additions[orderId] || [];
    if (list.length === 0) return;
    setSavingAdditionsFor(orderId);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/waiter/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({
          items: list.map((c) => ({
            menu_item_id: c.menu_item_id,
            quantity: c.qty,
            notes: c.notes || null,
          })),
        }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add items to that order");
        return;
      }
      setAdditions((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      setEditingOrderId((current) => (current === orderId ? null : current));
      if (session?.id) loadOrders(session.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingAdditionsFor(null);
    }
  }

  async function updateItemQuantity(orderId, orderItemId, quantity) {
    if (quantity <= 0) return;
    setError("");
    try {
      const res = await fetchWithAuth(`/api/waiter/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({
          quantity_updates: [{ order_item_id: orderItemId, quantity }],
        }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update that item");
        return;
      }
      if (session?.id) loadOrders(session.id);
    } catch (err) {
      setError(err.message);
    }
  }

  // ---------- Print and close a single order ----------
  async function printAndCloseOrder(orderId) {
    setPrinting(true);
    setError("");
    try {
      // 1. Get invoice
      const res = await fetchWithAuth("/api/waiter/invoices", {
        method: "POST",
        body: JSON.stringify({ order_id: orderId }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to prepare the bill");
        return;
      }
      openReceiptWindow(data);

      // 2. Mark order as completed
      const closeRes = await fetchWithAuth(
        `/api/waiter/orders/${orderId}/complete`,
        { method: "POST" },
      );
      if (handle401(closeRes)) return;
      const closeData = await closeRes.json();
      if (!closeRes.ok) {
        setError(closeData.error || "Bill printed but failed to close order");
      } else {
        // Reload orders so this one disappears
        if (session?.id) loadOrders(session.id);
        // If this was the last order and no more open orders remain,
        // we could optionally go back to selection, but we keep the session open.
        // The user can choose to add another round or close the table manually.
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPrinting(false);
    }
  }

  function openReceiptWindow({ invoice, lines, branch, order_numbers }) {
    const win = window.open("", "_blank", "width=380,height=640");
    if (!win) {
      setError("Pop-up blocked — allow pop-ups for this site to print.");
      return;
    }
    const rows = lines
      .map(
        (l) =>
          `<tr><td>${l.quantity}&times; ${l.name}</td><td class="amt">${l.line_total.toFixed(2)}</td></tr>`,
      )
      .join("");
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>${invoice.invoice_number}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 0; }
  h1 { font-size: 14px; text-align: center; margin: 0 0 2px; }
  .muted { text-align: center; color: #444; font-size: 10.5px; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; }
  .amt { text-align: right; white-space: nowrap; }
  hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  .grand td { font-weight: bold; font-size: 13px; border-top: 1px dashed #000; padding-top: 4px; }
</style>
</head>
<body>
  <h1>${branch?.name || "Receipt"}</h1>
  <p class="muted">${[branch?.address, branch?.phone].filter(Boolean).join(" &middot; ")}</p>
  <p class="muted">${invoice.invoice_number}<br/>Rounds: ${order_numbers.join(", ")}</p>
  <hr />
  <table>${rows}</table>
  <hr />
  <table>
    <tr><td>Subtotal</td><td class="amt">${Number(invoice.subtotal).toFixed(2)}</td></tr>
    ${Number(invoice.discount_amount) > 0 ? `<tr><td>Discount</td><td class="amt">-${Number(invoice.discount_amount).toFixed(2)}</td></tr>` : ""}
    <tr><td>Tax</td><td class="amt">${Number(invoice.tax_amount).toFixed(2)}</td></tr>
    ${Number(invoice.service_charge) > 0 ? `<tr><td>Service</td><td class="amt">${Number(invoice.service_charge).toFixed(2)}</td></tr>` : ""}
    <tr class="grand"><td>Total</td><td class="amt">${Number(invoice.total_amount).toFixed(2)}</td></tr>
  </table>
  <hr />
  <p class="muted">Thank you!</p>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`);
    win.document.close();
  }

  // ---------- Close table manually (no print) ----------
  async function closeTableManually() {
    if (!session?.id) return;
    if (
      !window.confirm(
        `Close table ${session.table_number}? This ends the visit.`,
      )
    )
      return;
    setError("");
    try {
      const res = await fetchWithAuth(
        `/api/waiter/table-sessions/${session.id}/close`,
        { method: "POST" },
      );
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to close the table");
        return;
      }
      loadTables();
      startOver();
    } catch (err) {
      setError(err.message);
    }
  }

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);
  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const previousOrdersTotal = previousOrders.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0,
  );

  function orderProgress(order) {
    const items = order.order_items || [];
    const statuses = new Set(items.map((i) => i.status || "pending"));
    if (statuses.size === 0) return { label: "No items", color: "gray" };
    if (statuses.has("pending") || statuses.has("preparing"))
      return { label: "In kitchen", color: "teal" };
    if (statuses.has("ready")) return { label: "Ready", color: "blue" };
    return { label: "Served", color: "green" };
  }

  async function sendToKitchen() {
    if (cart.length === 0) return;
    setSending(true);
    setError("");
    try {
      const res = await fetchWithAuth("/api/waiter/orders", {
        method: "POST",
        body: JSON.stringify({
          order_type: orderType,
          table_session_id: session?.id || null,
          items: cart.map((c) => ({
            menu_item_id: c.menu_item_id,
            quantity: c.qty,
            notes: c.notes || null,
          })),
        }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send order");
        return;
      }
      setLastOrder(data.order);
      setCart([]);
      setCartOpen(false);
      if (session?.id) loadOrders(session.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function startOver() {
    setOrderType("");
    setSession(null);
    setCart([]);
    setCartOpen(false);
    setLastOrder(null);
    setPreviousOrders([]);
    setEditingOrderId(null);
    setAdditions({});
    setError("");
  }

  function addAnotherRound() {
    setLastOrder(null);
  }

  const hasSelection = orderType !== "";
  const showBottomBar = hasSelection && !lastOrder;

  const categoriesWithItems = categories
    .map((c, i) => ({ ...c, _color: categoryColor(i) }))
    .filter((c) => (c.menu_items || []).length > 0);

  const sectionsToRender =
    activeCategory === "all"
      ? categoriesWithItems
      : categoriesWithItems.filter((c) => c.id === activeCategory);

  const totalItemCount = categoriesWithItems.reduce(
    (sum, c) => sum + (c.menu_items?.length || 0),
    0,
  );

  // ---- Shared cart lines ----
  function CartLines({ isAddition }) {
    const list = isAddition ? additions[editingOrderId] || [] : cart;
    if (list.length === 0) {
      return (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
          Tap an item to add it here.
        </p>
      );
    }
    return (
      <div className="space-y-3">
        {list.map((c) => {
          const isAdd = isAddition;
          const changeQtyFn = isAdd
            ? (delta) =>
                changeAdditionQty(editingOrderId, c.menu_item_id, delta)
            : (delta) => changeQty(c.menu_item_id, delta);
          const changeNotesFn = isAdd
            ? (notes) =>
                changeAdditionNotes(editingOrderId, c.menu_item_id, notes)
            : (notes) => changeNotes(c.menu_item_id, notes);
          return (
            <div
              key={c.menu_item_id}
              className="pb-3 border-b border-dashed border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
            >
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {c.name}
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {(c.price * c.qty).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/30 rounded-full px-1 py-1">
                  <button
                    onClick={() => changeQtyFn(-1)}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={12} strokeWidth={3} />
                  </button>
                  <span className="w-5 text-center text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {c.qty}
                  </span>
                  <button
                    onClick={() => changeQtyFn(1)}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Increase quantity"
                  >
                    <Plus size={12} strokeWidth={3} />
                  </button>
                </div>
                <input
                  placeholder="note (e.g. no onion)"
                  value={c.notes || ""}
                  onChange={(e) => changeNotesFn(e.target.value)}
                  className="flex-1 text-xs border border-gray-200 dark:border-gray-600 rounded-full px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ---- Previous Orders ----
  function PreviousOrdersBlock() {
    if (loadingOrders) {
      return (
        <p className="text-xs text-gray-400 dark:text-gray-500 py-3 text-center">
          Loading previous rounds…
        </p>
      );
    }
    if (previousOrders.length === 0) return null;
    return (
      <div className="mb-4 pb-4 border-b border-dashed border-gray-200 dark:border-gray-700">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
          Previous rounds
        </p>
        <div className="space-y-4">
          {previousOrders.map((o) => {
            const progress = orderProgress(o);
            const isEditing = editingOrderId === o.id;
            const staged = additions[o.id] || [];
            const stagedTotal = staged.reduce(
              (sum, c) => sum + c.price * c.qty,
              0,
            );
            return (
              <div key={o.id} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {o.order_number}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      label={progress.label}
                      color={progress.color}
                    />
                    {/* Print & Close button for this order */}
                    {o.status === "open" && (
                      <button
                        onClick={() => printAndCloseOrder(o.id)}
                        disabled={printing}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-teal-600 text-white text-[11px] font-semibold hover:bg-teal-700 disabled:opacity-40 transition-colors"
                      >
                        <Receipt size={12} strokeWidth={2.5} />
                        Print & Close
                      </button>
                    )}
                  </div>
                </div>

                <ul className="text-gray-500 dark:text-gray-400 space-y-1">
                  {(o.order_items || []).map((oi) => (
                    <li
                      key={oi.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate">
                        {oi.menu_items?.name || "Item"}
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {oi.status === "pending" ? (
                          <span className="flex items-center gap-0.5 bg-gray-50 dark:bg-gray-700/30 rounded-full px-0.5 py-0.5">
                            <button
                              onClick={() =>
                                updateItemQuantity(o.id, oi.id, oi.quantity - 1)
                              }
                              disabled={oi.quantity <= 1}
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={10} strokeWidth={3} />
                            </button>
                            <span className="w-4 text-center font-semibold text-gray-900 dark:text-gray-100">
                              {oi.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateItemQuantity(o.id, oi.id, oi.quantity + 1)
                              }
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                              aria-label="Increase quantity"
                            >
                              <Plus size={10} strokeWidth={3} />
                            </button>
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">
                            {oi.quantity}×
                          </span>
                        )}
                        {oi.status && oi.status !== "served" && (
                          <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            {oi.status}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {isEditing && staged.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 space-y-2">
                    {staged.map((c) => (
                      <div key={c.menu_item_id}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            + {c.name}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {(c.price * c.qty).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/30 rounded-full px-1 py-0.5">
                            <button
                              onClick={() =>
                                changeAdditionQty(o.id, c.menu_item_id, -1)
                              }
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={10} strokeWidth={3} />
                            </button>
                            <span className="w-4 text-center font-semibold text-gray-900 dark:text-gray-100">
                              {c.qty}
                            </span>
                            <button
                              onClick={() =>
                                changeAdditionQty(o.id, c.menu_item_id, 1)
                              }
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                              aria-label="Increase quantity"
                            >
                              <Plus size={10} strokeWidth={3} />
                            </button>
                          </div>
                          <input
                            placeholder="note"
                            value={c.notes || ""}
                            onChange={(e) =>
                              changeAdditionNotes(
                                o.id,
                                c.menu_item_id,
                                e.target.value,
                              )
                            }
                            className="flex-1 text-[11px] border border-gray-200 dark:border-gray-600 rounded-full px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {o.status === "open" && (
                  <div className="mt-2 flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => cancelAddingTo(o.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => sendAdditions(o.id)}
                          disabled={
                            staged.length === 0 || savingAdditionsFor === o.id
                          }
                          className="ms-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-600 text-white font-semibold disabled:opacity-40 hover:bg-teal-700 transition-colors"
                        >
                          <Send size={10} strokeWidth={3} />
                          {savingAdditionsFor === o.id
                            ? "Sending…"
                            : staged.length > 0
                              ? `Send (${stagedTotal.toFixed(2)})`
                              : "Tap menu items to add"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startAddingTo(o.id)}
                        className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300"
                      >
                        <Plus size={11} strokeWidth={3} />
                        Add items to this round
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ----- Main render -----
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={dir}>
      <div
        className={`max-w-7xl mx-auto p-6 ${showBottomBar ? "pb-28 lg:pb-6" : ""}`}
      >
        {error && (
          <p className="text-red-700 dark:text-red-400 text-sm mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl px-3.5 py-2.5">
            {error}
          </p>
        )}

        {/* Selection bar */}
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={selectTakeaway}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border-2 motion-safe:transition-colors ${
                orderType === "takeaway"
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-teal-500 dark:hover:border-teal-400"
              }`}
            >
              <ShoppingBag size={14} strokeWidth={2.5} />
              Takeaway
            </button>

            {loadingTables ? (
              <span className="text-sm text-gray-400 dark:text-gray-500 self-center px-2">
                Loading tables…
              </span>
            ) : (
              tables.map((t) => {
                const isSelected =
                  orderType === "dine_in" &&
                  session?.table_number === t.table_number;
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTable(t)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border-2 motion-safe:transition-colors ${
                      isSelected
                        ? "bg-teal-600 text-white border-teal-600"
                        : t.open_session
                          ? "bg-amber-50 dark:bg-amber-950/20 border-transparent text-gray-700 dark:text-gray-300 hover:border-amber-500"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-teal-500 dark:hover:border-teal-400"
                    }`}
                  >
                    <Users size={14} strokeWidth={2.5} />
                    Table {t.table_number}
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? "bg-white"
                          : t.open_session
                            ? "bg-amber-500"
                            : "bg-teal-500"
                      }`}
                    />
                  </button>
                );
              })
            )}

            {!loadingTables && tables.length === 0 && (
              <span className="text-sm text-gray-400 dark:text-gray-500 self-center px-2">
                No tables set up for this branch.
              </span>
            )}
          </div>
        </div>

        {/* Ordering area */}
        {!hasSelection ? (
          <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mb-3">
              <UtensilsCrossed size={20} strokeWidth={2.5} />
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a table or Takeaway above to start ordering.
            </p>
          </div>
        ) : lastOrder ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl p-8 text-center max-w-md mx-auto">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-3">
              <CheckCircle2 size={28} strokeWidth={2.5} />
            </span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              Order {lastOrder.order_number} sent to kitchen
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
              Total {Number(lastOrder.total_amount).toFixed(2)}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => printAndCloseOrder(lastOrder.id)}
                disabled={printing}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
              >
                <Receipt size={14} strokeWidth={2.5} />
                {printing ? "Preparing…" : "Print & Close this round"}
              </button>
              {session && (
                <button
                  onClick={addAnotherRound}
                  className="px-4 py-2 text-sm font-medium rounded-full border-2 border-gray-200 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-400 transition-colors"
                >
                  + Add another round
                </button>
              )}
              <button
                onClick={startOver}
                className="px-4 py-2 text-sm font-medium rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          // Menu + cart side by side
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-1.5 mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                {session ? (
                  <>
                    <UtensilsCrossed size={14} /> Table {session.table_number}
                  </>
                ) : (
                  <>
                    <ShoppingBag size={14} /> Takeaway order
                  </>
                )}
              </div>

              {editingOrderId && (
                <div className="flex items-center gap-2 mb-4 px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 text-sm font-medium">
                  <Plus size={14} strokeWidth={2.5} />
                  Adding items to{" "}
                  {previousOrders.find((o) => o.id === editingOrderId)
                    ?.order_number || "round"}{" "}
                  — tap items below
                  <button
                    onClick={() => cancelAddingTo(editingOrderId)}
                    className="ms-auto text-xs font-semibold underline underline-offset-2 hover:text-teal-800 dark:hover:text-teal-200"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border-2 motion-safe:transition-colors ${
                    activeCategory === "all"
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-teal-500 dark:hover:border-teal-400"
                  }`}
                >
                  All
                  <span
                    className={`text-xs ${
                      activeCategory === "all"
                        ? "text-white/70"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {totalItemCount}
                  </span>
                </button>
                {categoriesWithItems.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border-2 motion-safe:transition-colors ${
                      activeCategory === c.id
                        ? "text-white border-transparent"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-current"
                    }`}
                    style={
                      activeCategory === c.id
                        ? { backgroundColor: c._color }
                        : { color: undefined }
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          activeCategory === c.id
                            ? "rgba(255,255,255,0.8)"
                            : c._color,
                      }}
                    />
                    {c.name}
                    <span
                      className={`text-xs ${
                        activeCategory === c.id
                          ? "text-white/70"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {c.menu_items.length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Items grid */}
              <div className="max-h-[68vh] overflow-y-auto pe-1 -me-1">
                {sectionsToRender.map((cat) => (
                  <div key={cat.id} className="mb-7 last:mb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat._color }}
                      />
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {cat.name}
                      </h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {cat.menu_items.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                      {cat.menu_items.map((item) => {
                        const qty = qtyInCart(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="group relative text-left rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-lg motion-safe:hover:-translate-y-0.5 motion-safe:transition-all duration-150"
                          >
                            <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center opacity-40"
                                  style={{ color: cat._color }}
                                >
                                  <UtensilsCrossed size={36} />
                                </div>
                              )}

                              {qty > 0 && (
                                <span className="absolute top-2 end-2 flex items-center justify-center min-w-[26px] h-[26px] px-1.5 rounded-full bg-teal-600 text-white text-sm font-bold shadow">
                                  {qty}
                                </span>
                              )}

                              <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
                              <span className="absolute bottom-2 start-2.5 text-white text-sm font-bold">
                                {Number(item.price).toFixed(2)}
                              </span>
                              <span className="absolute bottom-2 end-2 flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-gray-800 shadow motion-safe:group-hover:scale-110 motion-safe:transition-transform">
                                <Plus
                                  size={18}
                                  strokeWidth={3}
                                  style={{ color: cat._color }}
                                />
                              </span>
                            </div>
                            <div className="px-3 py-2.5">
                              <div className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
                                {item.name}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {sectionsToRender.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No items in this category.
                  </p>
                )}
              </div>
            </div>

            {/* Desktop ticket panel */}
            <div className="hidden lg:flex lg:w-[340px] shrink-0 sticky top-6 flex-col max-h-[calc(100vh-3rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="shrink-0 px-5 pt-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Receipt
                    size={16}
                    className="text-teal-600 dark:text-teal-400"
                    strokeWidth={2.5}
                  />
                  <h2 className="text-sm font-bold tracking-wide text-gray-900 dark:text-gray-100 uppercase">
                    Order ticket
                  </h2>
                  {cartCount > 0 && (
                    <span className="ms-auto flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs font-bold">
                      {cartCount}
                    </span>
                  )}
                </div>
                {session && previousOrders.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    No previous rounds yet.
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-3">
                <PreviousOrdersBlock />
                {session && previousOrders.length > 0 && (
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                    This round
                  </p>
                )}
                <CartLines isAddition={false} />
              </div>

              <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-500 dark:text-gray-400">
                    {previousOrders.length > 0 ? "This round" : "Total"}
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {cartTotal.toFixed(2)}
                  </span>
                </div>
                <PrimaryButton
                  onClick={sendToKitchen}
                  disabled={cart.length === 0 || sending}
                  className="w-full justify-center"
                >
                  <Send size={14} strokeWidth={2.5} />
                  {sending ? "Sending…" : "Send to kitchen"}
                </PrimaryButton>
                {session && previousOrders.length > 0 && (
                  <button
                    onClick={closeTableManually}
                    className="w-full mt-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Close table (no print)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom bar for mobile */}
      {showBottomBar && (
        <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden">
          {cartOpen && (
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] max-h-[45vh] overflow-y-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                <PreviousOrdersBlock />
                {session && previousOrders.length > 0 && (
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                    This round
                  </p>
                )}
                <CartLines isAddition={false} />
              </div>
            </div>
          )}

          <div className="bg-gray-900 dark:bg-gray-950 text-white shadow-[0_-2px_10px_rgba(0,0,0,0.15)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
              <button
                onClick={() => setCartOpen((v) => !v)}
                disabled={cart.length === 0}
                className="flex items-center gap-2 text-left disabled:opacity-50"
              >
                <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                  <ShoppingBag size={15} strokeWidth={2.5} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -end-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-teal-500 text-[10px] font-bold">
                      {cartCount}
                    </span>
                  )}
                </span>
                <span className="text-sm font-semibold">
                  {cartTotal.toFixed(2)}
                </span>
                {cart.length > 0 &&
                  (cartOpen ? (
                    <ChevronDown size={15} className="text-white/60" />
                  ) : (
                    <ChevronUp size={15} className="text-white/60" />
                  ))}
              </button>

              <button
                onClick={sendToKitchen}
                disabled={cart.length === 0 || sending}
                className="ms-auto flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-sm disabled:opacity-40 transition-colors"
              >
                <Send size={14} strokeWidth={2.5} />
                {sending ? "Sending…" : "Send to kitchen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
