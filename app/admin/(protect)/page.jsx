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
  CalendarDays,
  Crown,
  Flame,
  BarChart3,
  Boxes,
  ClipboardList,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

// ---------------- Design tokens ----------------

const SALES_COLOR = "#0d9488"; // teal-600
const EXPENSE_COLOR = "#f43f5e"; // rose-500
const GRID_STROKE = "rgba(148,163,184,0.25)";
const TICK = { fontSize: 12, fill: "#94a3b8" };
const DONUT_COLORS = [
  "#0d9488",
  "#f43f5e",
  "#f59e0b",
  "#6366f1",
  "#0ea5e9",
  "#a855f7",
  "#84cc16",
];

const cardClass =
  "rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-700/60 dark:bg-gray-800 sm:p-5";

const selectClass =
  "w-full sm:w-auto sm:min-w-[10rem] rounded-xl border border-white/25 bg-white/15 px-3.5 py-2.5 text-sm font-medium text-white backdrop-blur transition focus:outline-none focus:ring-2 focus:ring-white/60 [&>option]:text-gray-900 [&>optgroup]:text-gray-900";

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

// ---------------- Small building blocks ----------------

const TONES = {
  teal: {
    tile: "from-teal-500 to-emerald-500 shadow-teal-500/30",
    glow: "bg-teal-400/20",
    bar: "from-teal-500 to-emerald-400",
  },
  indigo: {
    tile: "from-indigo-500 to-violet-500 shadow-indigo-500/30",
    glow: "bg-indigo-400/20",
    bar: "from-indigo-500 to-violet-400",
  },
  rose: {
    tile: "from-rose-500 to-orange-400 shadow-rose-500/30",
    glow: "bg-rose-400/20",
    bar: "from-rose-500 to-orange-400",
  },
  emerald: {
    tile: "from-emerald-500 to-lime-400 shadow-emerald-500/30",
    glow: "bg-emerald-400/20",
    bar: "from-emerald-500 to-lime-400",
  },
  amber: {
    tile: "from-amber-500 to-yellow-400 shadow-amber-500/30",
    glow: "bg-amber-400/20",
    bar: "from-amber-500 to-yellow-400",
  },
  sky: {
    tile: "from-sky-500 to-cyan-400 shadow-sky-500/30",
    glow: "bg-sky-400/20",
    bar: "from-sky-500 to-cyan-400",
  },
};

function KpiCard({ icon: Icon, label, value, tone = "teal", spark }) {
  const c = TONES[tone] || TONES.teal;
  return (
    <div
      className={`${cardClass} group relative overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div
        className={`pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full blur-2xl ${c.glow}`}
      />
      <div className="relative flex items-center justify-between gap-2">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${c.tile}`}
        >
          <Icon size={18} />
        </div>
      </div>
      <p className="relative mt-3 truncate text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="relative mt-0.5 truncate text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-50">
        {value}
      </p>
      {spark && spark.length > 1 ? (
        <div className="relative -mx-1 mt-2 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={spark}
              margin={{ top: 2, bottom: 0, left: 0, right: 0 }}
            >
              <defs>
                <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SALES_COLOR} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={SALES_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="sales"
                stroke={SALES_COLOR}
                strokeWidth={2}
                fill="url(#sparkFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}

function SectionTitle({ icon: Icon, children, tone = "teal" }) {
  const c = TONES[tone] || TONES.teal;
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white ${c.tile}`}
      >
        <Icon size={14} />
      </span>
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
        {children}
      </h2>
    </div>
  );
}

const STATUS_TONES = {
  open: {
    pill: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  in_progress: {
    pill: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  ready: {
    pill: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  completed: {
    pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  paid: {
    pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  cancelled: {
    pill: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    dot: "bg-gray-400",
  },
};

function StatusBadge({ status }) {
  const tone = STATUS_TONES[status] || STATUS_TONES.cancelled;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${tone.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {String(status).replace(/_/g, " ")}
    </span>
  );
}

function EmptyNote({ icon: Icon, children }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-gray-400">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/60">
        <Icon size={18} />
      </span>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label, names }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur dark:border-gray-600 dark:bg-gray-900/95">
      {label ? (
        <p className="mb-1 font-semibold text-gray-700 dark:text-gray-200">
          {label}
        </p>
      ) : null}
      {payload.map((p) => (
        <p
          key={p.dataKey}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          {names?.[p.dataKey] ? `${names[p.dataKey]}: ` : ""}
          <span className="font-semibold text-gray-900 dark:text-gray-50">
            {currency(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-800"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-800" />
        <div className="h-72 animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-800" />
      </div>
    </div>
  );
}

// ---------------- Page ----------------

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

  const trendStats = useMemo(() => {
    const vals = chartDates.map((r) => Number(r.sales) || 0);
    if (!vals.length) return null;
    const total = vals.reduce((a, b) => a + b, 0);
    let bestIdx = 0;
    vals.forEach((v, i) => {
      if (v > vals[bestIdx]) bestIdx = i;
    });
    const last = vals[vals.length - 1];
    const prev = vals.length > 1 ? vals[vals.length - 2] : 0;
    return {
      total,
      avg: total / vals.length,
      best: { label: chartDates[bestIdx].label, value: vals[bestIdx] },
      delta: prev > 0 ? ((last - prev) / prev) * 100 : null,
    };
  }, [chartDates]);

  const margin = useMemo(() => {
    const sales = Number(data?.todaySummary?.sales) || 0;
    const net = Number(data?.todaySummary?.net) || 0;
    if (sales <= 0) return 0;
    return Math.max(-100, Math.min(100, (net / sales) * 100));
  }, [data]);

  const peakHour = useMemo(() => {
    let best = null;
    for (const r of chartHours) {
      if (r.sales > 0 && (!best || r.sales > best.sales)) best = r;
    }
    return best;
  }, [chartHours]);

  const expenseTotal = useMemo(
    () =>
      (data?.expenseBreakdown || []).reduce(
        (s, r) => s + (Number(r.amount) || 0),
        0,
      ),
    [data],
  );

  const maxItemRevenue = useMemo(
    () =>
      Math.max(
        1,
        ...(data?.topMenuItems || []).map((i) => Number(i.revenue) || 0),
      ),
    [data],
  );

  const showBranchComparison =
    (data?.branchPerformance?.length || 0) > 1 && !selectedBranchId;

  const todayLabel = new Date().toLocaleDateString(locale || undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const rankStyles = [
    "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-amber-500/30",
    "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-400/30",
    "bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-orange-500/30",
  ];

  return (
    <div
      className="mx-auto max-w-7xl p-4 text-gray-900 dark:text-gray-100 sm:p-6"
      dir={dir}
    >
      {/* ───────── Hero header + filters ───────── */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500 p-5 text-white shadow-xl shadow-teal-900/20 sm:p-7">
        <div className="pointer-events-none absolute -end-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 start-1/3 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute end-10 top-6 h-20 w-20 rounded-full border-4 border-white/15" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-teal-100">
              <CalendarDays size={13} />
              {todayLabel}
            </p>
            <h1 className="mt-1.5 text-3xl font-bold tracking-tight">
              {d.pageTitle || "Dashboard"}
            </h1>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur">
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
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && !data ? (
        <DashboardSkeleton />
      ) : data ? (
        <div
          className={`space-y-6 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}
        >
          {/* ───────── Hero: sales + profit gauge ───────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Sales hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-500 to-emerald-400 p-5 text-white shadow-xl shadow-teal-500/25 sm:p-6 lg:col-span-2">
              <div className="pointer-events-none absolute -end-12 -top-16 h-56 w-56 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-20 start-10 h-48 w-48 rounded-full bg-white/10" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-teal-50">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                      <TrendingUp size={16} />
                    </span>
                    {d.kpi?.salesToday || "Sales today"}
                  </p>
                  <p className="mt-3 text-4xl font-extrabold tabular-nums tracking-tight sm:text-5xl">
                    {currency(data.todaySummary.sales)}
                  </p>
                  <p className="mt-1.5 text-sm text-teal-50/90">
                    {data.todaySummary.orders}{" "}
                    {(d.kpi?.ordersToday || "Orders today").toLowerCase()} ·{" "}
                    {currency(data.todaySummary.avgOrderValue)}{" "}
                    {(d.kpi?.avgOrder || "Avg order value").toLowerCase()}
                  </p>
                </div>

                {trendStats?.delta !== null &&
                  trendStats?.delta !== undefined && (
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur ${
                        trendStats.delta >= 0
                          ? "bg-white/25 text-white"
                          : "bg-rose-500/80 text-white"
                      }`}
                    >
                      {trendStats.delta >= 0 ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownRight size={14} />
                      )}
                      {Math.abs(trendStats.delta).toFixed(0)}%
                    </span>
                  )}
              </div>

              <div className="relative -mx-2 mt-4 h-32 sm:h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartDates}
                    margin={{ top: 6, bottom: 0, left: 8, right: 8 }}
                  >
                    <defs>
                      <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fff" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "rgba(255,255,255,0.75)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ stroke: "rgba(255,255,255,0.5)" }}
                      content={
                        <ChartTooltip
                          names={{ sales: d.legend?.sales || "Sales" }}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#fff"
                      strokeWidth={3}
                      fill="url(#heroFill)"
                      dot={false}
                      activeDot={{ r: 5, fill: "#fff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profit gauge */}
            <div className={`${cardClass} flex flex-col`}>
              <SectionTitle
                icon={data.todaySummary.net >= 0 ? TrendingUp : TrendingDown}
                tone={data.todaySummary.net >= 0 ? "emerald" : "rose"}
              >
                {d.kpi?.netToday || "Net today"}
              </SectionTitle>

              <div className="relative mx-auto h-44 w-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="74%"
                    outerRadius="100%"
                    data={[
                      {
                        name: "margin",
                        value: Math.abs(margin),
                        fill:
                          data.todaySummary.net >= 0 ? "#10b981" : "#f43f5e",
                      },
                    ]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      tick={false}
                    />
                    <RadialBar
                      dataKey="value"
                      cornerRadius={20}
                      background={{ fill: "rgba(148,163,184,0.2)" }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`text-2xl font-extrabold tabular-nums ${
                      data.todaySummary.net >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {margin.toFixed(0)}%
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">
                    margin
                  </span>
                </div>
              </div>

              <p
                className={`mt-2 text-center text-xl font-bold tabular-nums ${
                  data.todaySummary.net >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {currency(data.todaySummary.net)}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-xs dark:border-gray-700/60">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                  <span className="text-gray-500 dark:text-gray-400">
                    {d.legend?.sales || "Sales"}
                  </span>
                </div>
                <p className="text-end font-semibold tabular-nums">
                  {currency(data.todaySummary.sales)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-gray-500 dark:text-gray-400">
                    {d.legend?.expenses || "Expenses"}
                  </span>
                </div>
                <p className="text-end font-semibold tabular-nums">
                  {currency(data.todaySummary.expenses)}
                </p>
              </div>
            </div>
          </div>

          {/* ───────── KPI cards ───────── */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <KpiCard
              icon={ShoppingBag}
              tone="indigo"
              label={d.kpi?.ordersToday || "Orders today"}
              value={data.todaySummary.orders}
            />
            <KpiCard
              icon={Receipt}
              tone="rose"
              label={d.kpi?.expensesToday || "Expenses today"}
              value={currency(data.todaySummary.expenses)}
            />
            <KpiCard
              icon={Wallet}
              tone="amber"
              label={d.kpi?.avgOrder || "Avg order value"}
              value={currency(data.todaySummary.avgOrderValue)}
            />
            <KpiCard
              icon={Clock}
              tone="sky"
              label={d.kpi?.activeShifts || "Staff clocked in"}
              value={data.activeShifts}
            />
          </div>

          {/* ───────── Top branch highlight ───────── */}
          {data.topBranch && showBranchComparison && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 p-4 text-white shadow-lg shadow-amber-500/25 sm:p-5">
              <Crown
                size={110}
                className="pointer-events-none absolute -end-4 -top-4 rotate-12 text-white/15"
              />
              <div className="relative flex items-center gap-4">
                <div className="shrink-0 rounded-2xl bg-white/25 p-3 backdrop-blur">
                  <Trophy size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-amber-50">
                    {d.topBranch?.label ||
                      `Top branch — last ${chartDates.length || 7} days`}
                  </p>
                  <p className="truncate text-xl font-bold">
                    {data.topBranch.branchName}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/30">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{
                        width: `${Math.min(100, data.topBranch.sharePct)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-xl font-bold tabular-nums">
                    {currency(data.topBranch.sales)}
                  </p>
                  <p className="text-xs text-amber-50">
                    {data.topBranch.sharePct.toFixed(0)}%{" "}
                    {d.topBranch?.ofSales || "of total sales"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ───────── Charts: trend + hourly ───────── */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className={cardClass}>
              <SectionTitle icon={TrendingUp} tone="teal">
                {d.charts?.trend?.replace("{days}", chartDates.length) ||
                  `Sales — last ${chartDates.length || 7} days`}
              </SectionTitle>
              {trendStats && (
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {[
                    { k: "Total", v: currency(trendStats.total) },
                    { k: "Avg / day", v: currency(trendStats.avg) },
                    {
                      k: `Best · ${trendStats.best.label}`,
                      v: currency(trendStats.best.value),
                    },
                  ].map((x) => (
                    <div
                      key={x.k}
                      className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-900/40"
                    >
                      <p className="truncate text-[10px] uppercase tracking-wider text-gray-400">
                        {x.k}
                      </p>
                      <p className="truncate text-sm font-bold tabular-nums">
                        {x.v}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="h-60 sm:h-64">
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
                          stopOpacity={0.45}
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
                      stroke={GRID_STROKE}
                    />
                    <XAxis
                      dataKey="label"
                      tick={TICK}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={TICK}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          names={{ sales: d.legend?.sales || "Sales" }}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke={SALES_COLOR}
                      strokeWidth={3}
                      fill="url(#salesFill)"
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={cardClass}>
              <SectionTitle icon={Flame} tone="amber">
                <span className="flex flex-wrap items-center gap-2">
                  {d.charts?.hourly || "Today by hour"}
                  {peakHour && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      🔥 {peakHour.label}
                    </span>
                  )}
                </span>
              </SectionTitle>
              <div className="h-60 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartHours}
                    margin={{ left: 0, right: 8, top: 8 }}
                  >
                    <defs>
                      <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#0f766e" />
                      </linearGradient>
                      <linearGradient id="barPeak" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={GRID_STROKE}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ ...TICK, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={TICK}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(148,163,184,0.12)" }}
                      content={
                        <ChartTooltip
                          names={{ sales: d.legend?.sales || "Sales" }}
                        />
                      }
                    />
                    <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                      {chartHours.map((r) => (
                        <Cell
                          key={r.hour}
                          fill={
                            peakHour && r.hour === peakHour.hour
                              ? "url(#barPeak)"
                              : "url(#barFill)"
                          }
                          fillOpacity={r.sales > 0 ? 1 : 0.35}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ───────── Per-branch comparison ───────── */}
          {showBranchComparison && (
            <div className={cardClass}>
              <SectionTitle icon={BarChart3} tone="indigo">
                {d.charts?.branchComparison?.replace(
                  "{days}",
                  chartDates.length,
                ) ||
                  `Every branch — sales vs expenses (last ${chartDates.length || 7} days)`}
              </SectionTitle>
              <div className="overflow-x-auto">
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
                        stroke={GRID_STROKE}
                      />
                      <XAxis
                        dataKey="branchName"
                        tick={TICK}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={TICK}
                        axisLine={false}
                        tickLine={false}
                        width={44}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(148,163,184,0.12)" }}
                        content={
                          <ChartTooltip
                            names={{
                              sales: d.legend?.sales || "Sales",
                              expenses: d.legend?.expenses || "Expenses",
                            }}
                          />
                        }
                      />
                      <Legend
                        iconType="circle"
                        formatter={(value) =>
                          value === "sales"
                            ? d.legend?.sales || "Sales"
                            : d.legend?.expenses || "Expenses"
                        }
                      />
                      <Bar
                        dataKey="sales"
                        fill={SALES_COLOR}
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="expenses"
                        fill={EXPENSE_COLOR}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ───────── Best sellers / expenses / low stock ───────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Best sellers */}
            <div className={cardClass}>
              <SectionTitle icon={Crown} tone="amber">
                {d.sections?.topItems || "Best sellers"}
              </SectionTitle>
              {data.topMenuItems.length === 0 ? (
                <EmptyNote icon={ShoppingBag}>
                  {d.empty?.topItems || "No sales yet."}
                </EmptyNote>
              ) : (
                <ul className="space-y-3.5">
                  {data.topMenuItems.map((item, idx) => (
                    <li key={item.name} className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-md ${
                          rankStyles[idx] ||
                          "bg-gray-100 text-gray-500 shadow-none dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium text-gray-800 dark:text-gray-100">
                            {item.name}{" "}
                            <span className="font-normal text-gray-400">
                              ×{item.qty}
                            </span>
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums">
                            {currency(item.revenue)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                            style={{
                              width: `${((Number(item.revenue) || 0) / maxItemRevenue) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Expenses donut */}
            <div className={cardClass}>
              <SectionTitle icon={CircleDollarSign} tone="rose">
                {d.sections?.expenseBreakdown || "Expenses by category"}
              </SectionTitle>
              {data.expenseBreakdown.length === 0 ? (
                <EmptyNote icon={Receipt}>
                  {d.empty?.expenses || "No expenses logged."}
                </EmptyNote>
              ) : (
                <>
                  <div className="relative mx-auto h-44 w-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.expenseBreakdown}
                          dataKey="amount"
                          nameKey="category"
                          innerRadius={54}
                          outerRadius={80}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {data.expenseBreakdown.map((row, i) => (
                            <Cell
                              key={row.category}
                              fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">
                        {d.legend?.expenses || "Expenses"}
                      </span>
                      <span className="text-base font-bold tabular-nums">
                        {currency(expenseTotal)}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {data.expenseBreakdown.map((row, i) => (
                      <li
                        key={row.category}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-gray-700 dark:text-gray-300">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              background: DONUT_COLORS[i % DONUT_COLORS.length],
                            }}
                          />
                          <span className="truncate">{row.category}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {expenseTotal
                              ? Math.round(
                                  ((Number(row.amount) || 0) / expenseTotal) *
                                    100,
                                )
                              : 0}
                            %
                          </span>
                          <span className="font-semibold tabular-nums">
                            {currency(row.amount)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Low stock */}
            <div className={cardClass}>
              <SectionTitle icon={Boxes} tone="rose">
                {d.sections?.lowStock || "Low stock"}
              </SectionTitle>
              {data.lowStock.length === 0 ? (
                <EmptyNote icon={Boxes}>
                  {d.empty?.lowStock || "Inventory looks healthy."}
                </EmptyNote>
              ) : (
                <ul className="space-y-3.5">
                  {data.lowStock.map((item) => {
                    const pct =
                      item.reorderLevel > 0
                        ? Math.max(
                            4,
                            Math.min(
                              100,
                              (item.quantityOnHand / item.reorderLevel) * 100,
                            ),
                          )
                        : 4;
                    const critical = pct <= 35;
                    return (
                      <li key={item.id}>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex min-w-0 items-center gap-1.5 text-gray-800 dark:text-gray-100">
                            <PackageX
                              size={14}
                              className={`shrink-0 ${critical ? "text-rose-500" : "text-amber-500"}`}
                            />
                            <span className="truncate font-medium">
                              {item.name}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                              critical
                                ? "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            }`}
                          >
                            {item.quantityOnHand} / {item.reorderLevel}{" "}
                            {item.unit || ""}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${
                              critical
                                ? "from-rose-500 to-orange-400"
                                : "from-amber-500 to-yellow-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* ───────── Recent orders ───────── */}
          <div className={cardClass}>
            <SectionTitle icon={ClipboardList} tone="sky">
              {d.sections?.recentOrders || "Recent orders"}
            </SectionTitle>
            {data.recentOrders.length === 0 ? (
              <EmptyNote icon={ClipboardList}>
                {d.empty?.orders || "No orders yet."}
              </EmptyNote>
            ) : (
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/40">
                      <th className="whitespace-nowrap rounded-s-lg px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {d.columns?.order || "Order"}
                      </th>
                      {!selectedBranchId && (
                        <th className="whitespace-nowrap px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {d.columns?.branch || "Branch"}
                        </th>
                      )}
                      <th className="whitespace-nowrap px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {d.columns?.waiter || "Waiter"}
                      </th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {d.columns?.status || "Status"}
                      </th>
                      <th className="whitespace-nowrap rounded-e-lg px-3 py-2.5 text-end text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {d.columns?.total || "Total"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-gray-100 transition-colors last:border-0 hover:bg-teal-50/50 dark:border-gray-700/60 dark:hover:bg-teal-900/10"
                      >
                        <td className="whitespace-nowrap px-3 py-3 font-semibold">
                          {o.orderNumber}
                        </td>
                        {!selectedBranchId && (
                          <td className="whitespace-nowrap px-3 py-3 text-gray-600 dark:text-gray-300">
                            {o.branchName || "—"}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-3 py-3">
                          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            {o.waiterName ? (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold uppercase text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                                {o.waiterName.trim().charAt(0)}
                              </span>
                            ) : null}
                            {o.waiterName || "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-end font-semibold tabular-nums">
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
