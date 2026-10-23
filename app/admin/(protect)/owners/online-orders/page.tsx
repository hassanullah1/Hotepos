"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  RefreshCw,
  Search,
  Receipt,
  ChefHat,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  MapPin,
  ShoppingBag,
  ChevronRight,
  Printer,
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Mail,
  TrendingUp,
  Package,
  Navigation,
  ExternalLink,
  StickyNote,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const ACTIVE_STATUSES = ["open", "in_progress", "served", "ready"];
const COMPLETED_STATUSES = ["paid", "closed", "completed"];
const CANCELLED_STATUSES = ["cancelled", "rejected"];

const STATUS_STYLES: Record<string, any> = {
  open: {
    bg: "bg-sky-100 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
    dot: "bg-sky-500",
    Icon: Receipt,
    label: "Placed",
  },
  in_progress: {
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    Icon: ChefHat,
    label: "Preparing",
  },
  ready: {
    bg: "bg-teal-100 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
    dot: "bg-teal-500",
    Icon: Clock,
    label: "Ready",
  },
  served: {
    bg: "bg-teal-100 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
    dot: "bg-teal-500",
    Icon: CheckCircle2,
    label: "Served",
  },
  paid: {
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    Icon: CheckCircle2,
    label: "Completed",
  },
  completed: {
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    Icon: CheckCircle2,
    label: "Completed",
  },
  closed: {
    bg: "bg-gray-100 dark:bg-gray-800/40",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-800",
    dot: "bg-gray-400",
    Icon: CheckCircle2,
    label: "Closed",
  },
  cancelled: {
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500",
    Icon: XCircle,
    label: "Cancelled",
  },
  rejected: {
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500",
    Icon: XCircle,
    label: "Rejected",
  },
};

const PAYMENT_STYLES: Record<string, any> = {
  paid: {
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    Icon: CheckCircle2,
    label: "Paid",
  },
  unpaid: {
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    Icon: Clock,
    label: "Unpaid",
  },
  failed: {
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    Icon: XCircle,
    label: "Failed",
  },
  refunded: {
    bg: "bg-sky-100 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    Icon: RotateCcw,
    label: "Refunded",
  },
};

function escapeHtml(s: string) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/**
 * Build Google Maps URL.
 * Priority: exact GPS pin → address text → null (no map link)
 */
function buildMapUrl(
  lat: number | null,
  lng: number | null,
  address: string | null,
): string | null {
  const hasPin =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  if (hasPin) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  if (address && address.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
  }
  return null;
}

function buildDirectionsUrl(
  lat: number | null,
  lng: number | null,
  address: string | null,
): string | null {
  const hasPin =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  if (hasPin) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (address && address.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}`;
  }
  return null;
}

export default function AdminOnlineOrdersPage() {
  const router = useRouter();
  const { dir } = useAdminPreferences();

  const [me, setMe] = useState<any>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [orders, setOrders] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    refunded: 0,
    unpaid: 0,
  });
  const [stats, setStats] = useState({ totalRevenue: 0, completedOrders: 0 });

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pollRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/auth/me");
        if (!res.ok) {
          if (res.status === 401) return router.push("/login");
          throw new Error("Failed to load user");
        }
        const data = await res.json();
        setMe(data.user);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingMe(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOwner = me?.role === "hotel_owner";
  const isBranchManager = me?.role === "branch_manager";

  useEffect(() => {
    if (!me) return;
    if (isBranchManager && me.branch?.id) {
      setBranchId(me.branch.id);
      return;
    }
    if (isOwner && me.hotel_id) {
      (async () => {
        setLoadingBranches(true);
        try {
          const res = await fetchWithAuth(
            `/api/branches?hotel_id=${me.hotel_id}`,
          );
          if (!res.ok) throw new Error("Failed to load branches");
          const data = await res.json();
          const list = data.branches || [];
          setBranches(list);
          if (list.length === 1) setBranchId(list[0].id);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoadingBranches(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);

  async function fetchOrders(targetPage: number, replace: boolean) {
    setError("");
    if (replace) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        filter,
        page: String(targetPage),
        pageSize: "25",
      });

      if (branchId) {
        params.set("branch_id", branchId);
      } else if (isOwner && me?.hotel_id) {
        params.set("hotel_id", me.hotel_id);
      }

      if (debouncedQuery) params.set("q", debouncedQuery);

      const res = await fetchWithAuth(`/api/owners/online-orders?${params}`);
      if (res.status === 401) return router.push("/login");
      if (!res.ok) throw new Error("Failed to load orders");

      const data = await res.json();
      setOrders((prev) => (replace ? data.orders : [...prev, ...data.orders]));
      setCounts(data.counts || counts);
      setStats(data.stats || stats);
      setTotalPages(data.totalPages || 1);
      setPage(targetPage);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (loadingMe || !me) return;
    fetchOrders(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMe, me, branchId, filter, debouncedQuery]);

  useEffect(() => {
    if (loadingMe || !me) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchOrders(1, true), 20000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMe, me, branchId, filter, debouncedQuery]);

  function printOrder(order: any) {
    const buyer = order.buyers || {};
    const branch = order.branches || {};
    const d = order.online_details || null;
    const isDelivery = order.order_type === "delivery";
    const created = new Date(order.created_at).toLocaleString();

    const rowsHtml = order.order_items
      .map(
        (i: any) => `<tr>
          <td>${i.quantity} × ${escapeHtml(i.menu_items?.name || "Item")}</td>
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
            ? `<div>${escapeHtml(d.delivery_address)}${d.delivery_city ? `, ${escapeHtml(d.delivery_city)}` : ""}</div>`
            : ""
        }
        ${isDelivery && d.delivery_notes ? `<div class="muted">Note: ${escapeHtml(d.delivery_notes)}</div>` : ""}
        ${
          d.delivery_lat != null && d.delivery_lng != null
            ? `<div class="muted" dir="ltr">GPS: ${Number(d.delivery_lat).toFixed(5)}, ${Number(d.delivery_lng).toFixed(5)}</div>`
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
        <h1>${escapeHtml(branch.name || "")}</h1>
        <div class="muted">${created}</div>
        <div class="muted">${escapeHtml(order.order_number)}</div>
      </div>
      ${deliveryBlock}
      <hr/>
      <table>${rowsHtml}</table>
      <hr/>
      <div class="total">TOTAL: ${Number(order.total_amount).toFixed(2)} ${branch.currency || "AFN"}</div>
      <hr/>
      <div class="center muted">${d ? (isDelivery ? "Delivery" : "Pickup") : "POS"} order</div>
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300);}</script>
      </body></html>`;
    const w = window.open("", "_blank", "width=360,height=640");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  const tabs = useMemo(
    () => [
      { key: "all", label: "All", count: counts.all },
      { key: "active", label: "Active", count: counts.active },
      { key: "completed", label: "Completed", count: counts.completed },
      { key: "cancelled", label: "Cancelled", count: counts.cancelled },
      { key: "refunded", label: "Refunded", count: counts.refunded },
    ],
    [counts],
  );

  if (loadingMe) {
    return (
      <div
        className="min-h-screen bg-[#F4FAF9] dark:bg-[#0B2624] flex items-center justify-center p-6"
        dir={dir}
      >
        <Loader2 className="h-6 w-6 animate-spin text-teal-600 dark:text-teal-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" dir={dir}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/owners/orders"
              className="h-9 w-9 rounded-full flex items-center justify-center border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40 shrink-0"
              title="Back to orders"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-teal-950 dark:text-teal-50 leading-tight whitespace-nowrap">
                Online order history
              </h1>
              <p className="text-[11px] text-teal-700/70 dark:text-teal-300/70">
                All orders placed by buyers from the public site
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={loadingBranches}
                className="bg-white dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-full px-3 py-1.5 text-xs text-teal-800 dark:text-teal-200 focus:outline-none disabled:opacity-50"
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            {isBranchManager && (
              <span className="text-xs text-teal-700/70 dark:text-teal-300/70 whitespace-nowrap px-2 py-1.5 rounded-full border border-teal-200 dark:border-teal-800">
                {me?.branch?.name || "My branch"}
              </span>
            )}

            <button
              onClick={() => fetchOrders(1, true)}
              disabled={loading}
              title="Refresh"
              className="h-9 w-9 rounded-full flex items-center justify-center border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40 disabled:opacity-40"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950/60 px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-teal-700/70 dark:text-teal-300/70 font-semibold">
              <TrendingUp className="h-3 w-3" />
              Revenue (completed)
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-teal-950 dark:text-teal-50">
              {stats.totalRevenue.toFixed(2)}
              <span className="ms-1 text-[10px] font-medium opacity-60">
                AFN
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950/60 px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-teal-700/70 dark:text-teal-300/70 font-semibold">
              <Package className="h-3 w-3" />
              Completed orders
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-teal-950 dark:text-teal-50">
              {stats.completedOrders}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950/60 px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-teal-700/70 dark:text-teal-300/70 font-semibold">
              <Clock className="h-3 w-3" />
              Waiting for payment
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-amber-600 dark:text-amber-300">
              {counts.unpaid}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-3 relative">
          <Search className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-teal-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order #, buyer name, phone, email, address or restaurant…"
            className="w-full rounded-full border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950/40 ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2.5 text-sm text-teal-900 dark:text-teal-100 placeholder:text-teal-500/60 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-white dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/40"
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] font-semibold rounded-full px-1.5 ${
                    active
                      ? "bg-white/25 text-white"
                      : "bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            <span>{error}</span>
            <button
              onClick={() => fetchOrders(1, true)}
              className="text-[11px] font-semibold rounded-full border border-red-300 dark:border-red-800 px-2.5 py-0.5 hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              Retry
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-teal-100/40 dark:bg-teal-900/20 animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-teal-200 dark:border-teal-800">
            <Globe className="h-8 w-8 text-teal-300 dark:text-teal-700 mb-2" />
            <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
              {filter === "all"
                ? "No online orders yet."
                : `No ${filter} orders.`}
            </p>
            <p className="text-xs text-teal-700/50 dark:text-teal-300/50 mt-1">
              Orders placed by buyers from the public site will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <OnlineOrderCard
                key={o.id}
                order={o}
                onPrint={() => printOrder(o)}
              />
            ))}

            {page < totalPages && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => fetchOrders(page + 1, false)}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-full border border-teal-200 dark:border-teal-800 px-4 py-2 text-xs font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40 disabled:opacity-60"
                >
                  {loadingMore ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════ Order Card ═════════════════════ */
function OnlineOrderCard({
  order,
  onPrint,
}: {
  order: any;
  onPrint: () => void;
}) {
  const buyer = order.buyers || {};
  const branch = order.branches || {};
  const d = order.online_details || null;

  const status = STATUS_STYLES[order.status] || STATUS_STYLES.open;
  const payment = PAYMENT_STYLES[order.payment_status] || PAYMENT_STYLES.unpaid;
  const StatusIcon = status.Icon;
  const PaymentIcon = payment.Icon;

  const items = order.order_items || [];
  const preview = items
    .slice(0, 3)
    .map((i: any) => `${i.quantity}× ${i.menu_items?.name || "Item"}`)
    .join(" · ");
  const moreCount = Math.max(0, items.length - 3);

  const trackHref = order.public_token
    ? `/order/track/${order.public_token}`
    : null;

  const isDelivery = order.order_type === "delivery";

  const contactName = d?.contact_name || buyer.full_name || "Guest";
  const contactPhone = d?.contact_phone || buyer.phone || "";

  const lat = d?.delivery_lat != null ? Number(d.delivery_lat) : null;
  const lng = d?.delivery_lng != null ? Number(d.delivery_lng) : null;
  const fullAddress = d?.delivery_address
    ? `${d.delivery_address}${d.delivery_city ? `, ${d.delivery_city}` : ""}`
    : "";

  const mapUrl = buildMapUrl(lat, lng, fullAddress || null);
  const directionsUrl = buildDirectionsUrl(lat, lng, fullAddress || null);
  const hasGps = lat != null && lng != null;

  return (
    <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-teal-950/60 overflow-hidden shadow-sm hover:shadow transition">
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[11px] font-bold text-teal-950 dark:text-teal-50"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                {order.order_number}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-full ${status.bg} ${status.text} border ${status.border} px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide`}
              >
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-full ${payment.bg} ${payment.text} px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide`}
              >
                <PaymentIcon className="h-3 w-3" />
                {payment.label}
              </span>

              {d && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    isDelivery
                      ? "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                      : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {isDelivery ? "Delivery" : "Pickup"}
                </span>
              )}
            </div>

            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-teal-700/70 dark:text-teal-300/70">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {branch.name || "Restaurant"}
                {branch.city ? `, ${branch.city}` : ""}
              </span>
            </div>
          </div>

          <div className="text-end shrink-0">
            <div className="text-[10px] text-teal-600/70 dark:text-teal-300/60">
              {timeAgo(order.created_at)}
            </div>
            <div className="text-base font-bold tabular-nums text-teal-950 dark:text-teal-50 mt-0.5">
              {Number(order.total_amount).toFixed(2)}
              <span className="ms-1 text-[10px] font-medium opacity-60">
                {branch.currency || "AFN"}
              </span>
            </div>
          </div>
        </div>

        {/* Buyer contact */}
        <div className="mb-2 rounded-xl bg-teal-50/60 dark:bg-teal-900/20 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5 text-[12px] text-teal-900 dark:text-teal-100 min-w-0">
            <User className="h-3 w-3 text-teal-500 dark:text-teal-400 shrink-0" />
            <span className="font-medium truncate">{contactName}</span>
          </div>
          {contactPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="flex items-center gap-1.5 text-[11px] text-teal-700/80 dark:text-teal-300/80 hover:text-teal-900 dark:hover:text-teal-100"
            >
              <Phone className="h-3 w-3 text-teal-500 dark:text-teal-400 shrink-0" />
              <span dir="ltr" className="font-medium">
                {contactPhone}
              </span>
            </a>
          )}
          {buyer.email && (
            <div className="flex items-center gap-1.5 text-[11px] text-teal-700/80 dark:text-teal-300/80 min-w-0">
              <Mail className="h-3 w-3 text-teal-500 dark:text-teal-400 shrink-0" />
              <span dir="ltr" className="truncate max-w-[200px]">
                {buyer.email}
              </span>
            </div>
          )}
        </div>

        {/* Delivery address + navigation */}
        {isDelivery && d && (fullAddress || hasGps) && (
          <div className="mb-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/20 overflow-hidden">
            <div className="flex items-start gap-2 p-3">
              <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] text-sky-900 dark:text-sky-100 leading-snug break-words">
                  {fullAddress || "— no address text —"}
                </div>
                {d.delivery_notes && (
                  <div className="mt-1 flex items-start gap-1 text-[11px] italic text-sky-700/80 dark:text-sky-300/80">
                    <StickyNote className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{d.delivery_notes}</span>
                  </div>
                )}
                {hasGps && (
                  <div
                    className="mt-1 text-[10px] tabular-nums text-sky-700/70 dark:text-sky-300/70"
                    dir="ltr"
                  >
                    📍 {lat!.toFixed(5)}, {lng!.toFixed(5)}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            {(mapUrl || directionsUrl) && (
              <div className="flex flex-wrap gap-1.5 border-t border-sky-200 dark:border-sky-800 bg-white/40 dark:bg-sky-950/30 px-3 py-2">
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 text-[11px] font-semibold shadow-sm transition"
                  >
                    <MapPin className="h-3 w-3" />
                    Open in Maps
                    <ExternalLink className="h-2.5 w-2.5 opacity-80" />
                  </a>
                )}
                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 dark:border-sky-700 bg-white dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 px-3 py-1.5 text-[11px] font-semibold hover:bg-sky-50 dark:hover:bg-sky-900/40 transition"
                  >
                    <Navigation className="h-3 w-3" />
                    Directions
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Items preview */}
        <div className="flex items-start gap-2 text-[12px] text-teal-800 dark:text-teal-200 mb-3">
          <ShoppingBag className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="truncate">{preview}</span>
            {moreCount > 0 && (
              <span className="ms-1 text-teal-600/70 dark:text-teal-400/70">
                +{moreCount} more
              </span>
            )}
            <div className="text-[10px] text-teal-600/70 dark:text-teal-400/70 mt-0.5">
              {items.length} item{items.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-teal-100 dark:border-teal-800/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40"
            >
              <Printer className="h-3 w-3" />
              Print
            </button>
            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
              >
                <Phone className="h-3 w-3" />
                Call
              </a>
            )}
          </div>

          {trackHref && (
            <Link
              href={trackHref}
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 transition"
            >
              View order
              <ChevronRight className="h-3 w-3 rtl:rotate-180" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
