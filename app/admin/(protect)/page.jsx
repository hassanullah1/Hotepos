"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  ShoppingBag,
  PackageX,
  Clock,
  Trophy,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

// ---------------- Shared UI tokens (same teal system as the staff page) ----------------

const SALES_COLOR = "#0d9488"; // teal-600
const EXPENSE_COLOR = "#f43f5e"; // rose-500

const cardClass =
  "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm";

const selectClass =
  "w-full sm:w-auto sm:min-w-[9rem] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";

const sectionTitleClass =
  "mb-3 text-sm font-medium text-gray-700 dark:text-gray-300";

function currency(n, code = "AFN") {
  const value = Number(n) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${code}`;
  }
}

function KpiCard({ icon: Icon, label, value, tone = "default", sub }) {
  const tones = {
    default: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    up: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    down: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  };
  return (
    <div className={cardClass}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded-lg p-2 ${tones[tone]}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-0.5 truncate text-xl font-semibold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {sub ? (
            <p className="truncate text-xs text-gray-400 dark:text-gray-500">
              {sub}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const STATUS_TONES = {
  open: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  completed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

function StatusBadge({ status }) {
  const tone =
    STATUS_TONES[status] ||
    "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {status}
    </span>
  );
}

function EmptyNote({ children }) {
  return <p className="py-6 text-center text-sm text-gray-400">{children}</p>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t, locale, dir } = useAdminPreferences();
  const d = t?.dashboard || {}; // graceful fallback if translation keys aren't added yet

  // "" = All hotels / All branches (the default landing state)
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [data, setData] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard({ hotelId, branchId } = {}) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (hotelId) params.set("hotel_id", hotelId);
      if (branchId) params.set("branch_id", branchId);

      const res = await fetchWithAuth(`/api/dashboard?${params.toString()}`);
      if (res.status === 401) return router.push("/hotel/login");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || d.loadError || "Could not load dashboard data.");
        return;
      }
      setData(json);
      setRole(json.scope.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onHotelChange(hotelId) {
    setSelectedHotelId(hotelId);
    setSelectedBranchId("");
    loadDashboard({ hotelId: hotelId || undefined });
  }

  function onBranchChange(branchId) {
    setSelectedBranchId(branchId);
    loadDashboard({
      hotelId: selectedHotelId || undefined,
      branchId: branchId || undefined,
    });
  }

  const hotels = data?.scope?.hotels || [];
  const allBranches = data?.scope?.branches || [];
  // Branch dropdown options: scoped to the selected hotel, or every branch
  // (grouped by hotel) when "All hotels" is selected.
  const branchOptionsByHotel = useMemo(() => {
    if (!selectedHotelId) {
      const map = new Map();
      for (const b of allBranches) {
        const hotelName = hotels.find((h) => h.id === b.hotel_id)?.name || "";
        if (!map.has(hotelName)) map.set(hotelName, []);
        map.get(hotelName).push(b);
      }
      return map;
    }
    return new Map([["", allBranches]]);
  }, [allBranches, hotels, selectedHotelId]);

  const scopeLabel = useMemo(() => {
    if (role === "branch_manager")
      return data?.scope?.branches?.[0]?.name || "";
    if (selectedBranchId)
      return allBranches.find((b) => b.id === selectedBranchId)?.name || "";
    if (selectedHotelId)
      return hotels.find((h) => h.id === selectedHotelId)?.name || "";
    return d.allHotelsAllBranches || "All hotels · All branches";
  }, [role, selectedBranchId, selectedHotelId, allBranches, hotels, data, d]);

  const chartDates = useMemo(
    () =>
      (data?.salesTrend || []).map((r) => ({
        ...r,
        label: new Date(r.date).toLocaleDateString(locale || undefined, {
          month: "short",
          day: "numeric",
        }),
      })),
    [data, locale],
  );

  const chartHours = useMemo(
    () =>
      (data?.todayHourly || []).map((r) => ({
        ...r,
        label: `${String(r.hour).padStart(2, "0")}:00`,
      })),
    [data],
  );

  const showBranchComparison =
    (data?.branchPerformance?.length || 0) > 1 && !selectedBranchId;

  return (
    <div
      className="mx-auto max-w-7xl p-4 text-gray-900 dark:text-gray-100 sm:p-6"
      dir={dir}
    >
      {/* Header + filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {d.pageTitle || "Dashboard"}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Building2 size={14} className="shrink-0" />
            {scopeLabel}
          </p>
        </div>

        {role === "hotel_owner" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedHotelId}
              onChange={(e) => onHotelChange(e.target.value)}
              className={selectClass}
            >
              <option value="">{d.allHotels || "All hotels"}</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            <select
              value={selectedBranchId}
              onChange={(e) => onBranchChange(e.target.value)}
              className={selectClass}
            >
              <option value="">{d.allBranches || "All branches"}</option>
              {[...branchOptionsByHotel.entries()].map(([hotelName, list]) =>
                hotelName ? (
                  <optgroup key={hotelName} label={hotelName}>
                    {list.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  list.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))
                ),
              )}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          {d.loading || "Loading dashboard…"}
        </div>
      ) : data ? (
        <div
          className={`space-y-6 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}
        >
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            <KpiCard
              icon={TrendingUp}
              label={d.kpi?.salesToday || "Sales today"}
              value={currency(data.todaySummary.sales)}
              tone="up"
            />
            <KpiCard
              icon={ShoppingBag}
              label={d.kpi?.ordersToday || "Orders today"}
              value={data.todaySummary.orders}
            />
            <KpiCard
              icon={Receipt}
              label={d.kpi?.expensesToday || "Expenses today"}
              value={currency(data.todaySummary.expenses)}
              tone="down"
            />
            <KpiCard
              icon={data.todaySummary.net >= 0 ? TrendingUp : TrendingDown}
              label={d.kpi?.netToday || "Net today"}
              value={currency(data.todaySummary.net)}
              tone={data.todaySummary.net >= 0 ? "up" : "down"}
            />
            <KpiCard
              icon={Wallet}
              label={d.kpi?.avgOrder || "Avg order value"}
              value={currency(data.todaySummary.avgOrderValue)}
            />
            <KpiCard
              icon={Clock}
              label={d.kpi?.activeShifts || "Staff clocked in"}
              value={data.activeShifts}
            />
          </div>

          {/* Top branch highlight (only meaningful with more than one branch in view) */}
          {data.topBranch && showBranchComparison && (
            <div className="flex items-center gap-4 rounded-xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900/50 dark:bg-teal-900/10 sm:p-5">
              <div className="shrink-0 rounded-full bg-teal-600 p-2.5 text-white">
                <Trophy size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-teal-700 dark:text-teal-400">
                  {d.topBranch?.label ||
                    `Top branch — last ${chartDates.length || 7} days`}
                </p>
                <p className="truncate text-lg font-semibold">
                  {data.topBranch.branchName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold text-teal-700 dark:text-teal-400">
                  {currency(data.topBranch.sales)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {data.topBranch.sharePct.toFixed(0)}%{" "}
                  {d.topBranch?.ofSales || "of total sales"}
                </p>
              </div>
            </div>
          )}

          {/* Charts: trend + hourly */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className={cardClass}>
              <p className={sectionTitleClass}>
                {d.charts?.trend?.replace("{days}", chartDates.length) ||
                  `Sales — last ${chartDates.length || 7} days`}
              </p>
              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartDates}
                    margin={{ left: 0, right: 8, top: 8 }}
                  >
                    <defs>
                      <linearGradient
                        id="salesFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={SALES_COLOR}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor={SALES_COLOR}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip formatter={(v) => currency(v)} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke={SALES_COLOR}
                      strokeWidth={2}
                      fill="url(#salesFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={cardClass}>
              <p className={sectionTitleClass}>
                {d.charts?.hourly || "Today by hour"}
              </p>
              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartHours}
                    margin={{ left: 0, right: 8, top: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip formatter={(v) => currency(v)} />
                    <Bar
                      dataKey="sales"
                      fill={SALES_COLOR}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Per-branch comparison */}
          {showBranchComparison && (
            <div className={cardClass}>
              <p className={sectionTitleClass}>
                {d.charts?.branchComparison?.replace(
                  "{days}",
                  chartDates.length,
                ) ||
                  `Every branch — sales vs expenses (last ${chartDates.length || 7} days)`}
              </p>
              <div
                className="h-64 sm:h-72"
                style={{
                  minWidth:
                    data.branchPerformance.length > 5
                      ? data.branchPerformance.length * 90
                      : "100%",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.branchPerformance}
                    margin={{ left: 0, right: 8, top: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="branchName"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip formatter={(v) => currency(v)} />
                    <Legend
                      formatter={(value) =>
                        value === "sales"
                          ? d.legend?.sales || "Sales"
                          : d.legend?.expenses || "Expenses"
                      }
                    />
                    <Bar
                      dataKey="sales"
                      fill={SALES_COLOR}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      fill={EXPENSE_COLOR}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Best sellers / expenses / low stock */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={cardClass}>
              <p className={sectionTitleClass}>
                {d.sections?.topItems || "Best sellers"}
              </p>
              {data.topMenuItems.length === 0 ? (
                <EmptyNote>{d.empty?.topItems || "No sales yet."}</EmptyNote>
              ) : (
                <ul className="space-y-2.5">
                  {data.topMenuItems.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate text-gray-700 dark:text-gray-300">
                        {item.name}{" "}
                        <span className="text-gray-400">×{item.qty}</span>
                      </span>
                      <span className="shrink-0 font-medium">
                        {currency(item.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={cardClass}>
              <p className={sectionTitleClass}>
                {d.sections?.expenseBreakdown || "Expenses by category"}
              </p>
              {data.expenseBreakdown.length === 0 ? (
                <EmptyNote>
                  {d.empty?.expenses || "No expenses logged."}
                </EmptyNote>
              ) : (
                <ul className="space-y-2.5">
                  {data.expenseBreakdown.map((row) => (
                    <li
                      key={row.category}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate text-gray-700 dark:text-gray-300">
                        {row.category}
                      </span>
                      <span className="shrink-0 font-medium">
                        {currency(row.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={cardClass}>
              <p className={sectionTitleClass}>
                {d.sections?.lowStock || "Low stock"}
              </p>
              {data.lowStock.length === 0 ? (
                <EmptyNote>
                  {d.empty?.lowStock || "Inventory looks healthy."}
                </EmptyNote>
              ) : (
                <ul className="space-y-2.5">
                  {data.lowStock.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-1.5 truncate text-gray-700 dark:text-gray-300">
                        <PackageX
                          size={14}
                          className="shrink-0 text-rose-500"
                        />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="shrink-0 text-xs text-gray-500">
                        {item.quantityOnHand} / {item.reorderLevel}{" "}
                        {item.unit || ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recent orders */}
          <div className={cardClass}>
            <p className={sectionTitleClass}>
              {d.sections?.recentOrders || "Recent orders"}
            </p>
            {data.recentOrders.length === 0 ? (
              <EmptyNote>{d.empty?.orders || "No orders yet."}</EmptyNote>
            ) : (
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {d.columns?.order || "Order"}
                      </th>
                      {!selectedBranchId && (
                        <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {d.columns?.branch || "Branch"}
                        </th>
                      )}
                      <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {d.columns?.waiter || "Waiter"}
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {d.columns?.status || "Status"}
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-end text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {d.columns?.total || "Total"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-gray-100 last:border-0 dark:border-gray-700/60"
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 font-medium">
                          {o.orderNumber}
                        </td>
                        {!selectedBranchId && (
                          <td className="whitespace-nowrap px-3 py-2.5 text-gray-600 dark:text-gray-300">
                            {o.branchName || "—"}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-3 py-2.5 text-gray-600 dark:text-gray-300">
                          {o.waiterName || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-end font-medium">
                          {currency(o.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
