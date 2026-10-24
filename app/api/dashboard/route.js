import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { resolveDashboardScope } from "@/lib/dashboard-scope";

// ---------------------------------------------------------------------------
// Timezone helpers — the platform operates on Kabul time (UTC+4:30, no DST).
// "Today" always means "today in Afghanistan", regardless of where the Node
// process happens to run (Railway = UTC by default).
// ---------------------------------------------------------------------------
const KABUL_OFFSET_MS = 4.5 * 60 * 60 * 1000; // +04:30, fixed — no DST
const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC instant corresponding to 00:00 Kabul on the day containing `now`. */
function kabulStartOfDay(now = new Date()) {
  const kabul = new Date(now.getTime() + KABUL_OFFSET_MS);
  const y = kabul.getUTCFullYear();
  const m = kabul.getUTCMonth();
  const d = kabul.getUTCDate();
  return new Date(Date.UTC(y, m, d) - KABUL_OFFSET_MS);
}

function addDays(d, n) {
  return new Date(d.getTime() + n * DAY_MS);
}

/** "YYYY-MM-DD" for the Kabul calendar day containing `instant`. */
function kabulDateKey(instant) {
  return new Date(instant.getTime() + KABUL_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

function toNum(v) {
  if (v === null || v === undefined) return 0;
  return typeof v === "object" && typeof v.toNumber === "function"
    ? v.toNumber()
    : Number(v);
}

// A row counts as "paid" if the explicit payment_status is 'paid'
// OR the order lifecycle reached 'paid'. paid_at is used when set,
// otherwise updated_at / created_at as the effective paid instant.
const PAID_TIME_EXPR = `COALESCE(paid_at, updated_at, created_at)`;
const PAID_FILTER = `(payment_status = 'paid' OR status = 'paid')`;

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get("hotel_id") || undefined;
  const branchId = searchParams.get("branch_id") || undefined;
  const trendDays = Math.min(
    Math.max(Number(searchParams.get("trend_days")) || 7, 1),
    30,
  );

  const scope = await resolveDashboardScope(user, { hotelId, branchId });
  if (scope.error)
    return NextResponse.json({ error: scope.error }, { status: scope.status });

  const { branchIds } = scope;

  if (branchIds.length === 0) {
    return NextResponse.json({
      scope,
      todaySummary: {
        sales: 0,
        orders: 0,
        expenses: 0,
        net: 0,
        avgOrderValue: 0,
      },
      salesTrend: [],
      todayHourly: [],
      topMenuItems: [],
      expenseBreakdown: [],
      recentOrders: [],
      lowStock: [],
      activeShifts: 0,
      branchPerformance: [],
      topBranch: null,
    });
  }

  // Kabul calendar day boundaries, expressed as absolute UTC instants.
  const today = kabulStartOfDay();
  const tomorrow = addDays(today, 1);
  const trendStart = addDays(today, -(trendDays - 1));
  const todayDateStr = kabulDateKey(today);
  const trendStartDateStr = kabulDateKey(trendStart);

  const [
    salesTodayRaw,
    ordersCountToday,
    expensesTodayRaw,
    salesTrendRaw,
    hourlyRaw,
    topMenuItemsRaw,
    expenseBreakdownRaw,
    recentOrders,
    lowStockRaw,
    activeShifts,
    branchPerformanceRaw,
  ] = await Promise.all([
    // Today's sales — from orders marked paid, regardless of whether a
    // `payments` row was written for them.
    prisma.$queryRaw`
      SELECT COALESCE(SUM(total_amount), 0) AS total,
             COUNT(*)::int AS paid_count
      FROM orders
      WHERE branch_id = ANY(${branchIds}::uuid[])
        AND (payment_status = 'paid' OR status = 'paid')
        AND COALESCE(paid_at, updated_at, created_at) >= ${today}
        AND COALESCE(paid_at, updated_at, created_at) < ${tomorrow}
    `,

    // Today's order count — every order created today (paid or not)
    prisma.orders.count({
      where: {
        branch_id: { in: branchIds },
        created_at: { gte: today, lt: tomorrow },
      },
    }),

    // Today's approved/paid expenses (date column compares on Kabul day)
    prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE branch_id = ANY(${branchIds}::uuid[])
        AND expense_date = ${todayDateStr}::date
        AND status IN ('approved', 'paid')
    `,

    // Daily sales trend — grouped by KABUL calendar day, from orders
    prisma.$queryRaw`
      SELECT (COALESCE(paid_at, updated_at, created_at) AT TIME ZONE 'Asia/Kabul')::date::text AS day,
             COALESCE(SUM(total_amount), 0) AS total
      FROM orders
      WHERE branch_id = ANY(${branchIds}::uuid[])
        AND (payment_status = 'paid' OR status = 'paid')
        AND COALESCE(paid_at, updated_at, created_at) >= ${trendStart}
      GROUP BY 1
      ORDER BY 1
    `,

    // Hour-by-hour sales for today (Kabul wall clock, 0..23)
    prisma.$queryRaw`
      SELECT EXTRACT(HOUR FROM (COALESCE(paid_at, updated_at, created_at) AT TIME ZONE 'Asia/Kabul'))::int AS hour,
             COALESCE(SUM(total_amount), 0) AS total
      FROM orders
      WHERE branch_id = ANY(${branchIds}::uuid[])
        AND (payment_status = 'paid' OR status = 'paid')
        AND COALESCE(paid_at, updated_at, created_at) >= ${today}
        AND COALESCE(paid_at, updated_at, created_at) < ${tomorrow}
      GROUP BY 1
      ORDER BY 1
    `,

    // Best sellers over the trend window (all order items, paid or not —
    // this is a "what's popular" view, not a revenue view)
    prisma.$queryRaw`
      SELECT mi.name AS name,
             SUM(oi.quantity) AS qty,
             SUM(oi.line_total) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE o.branch_id = ANY(${branchIds}::uuid[])
        AND o.created_at >= ${trendStart}
      GROUP BY mi.name
      ORDER BY revenue DESC
      LIMIT 5
    `,

    // Expense breakdown by category over the trend window
    prisma.$queryRaw`
      SELECT COALESCE(ec.name, 'Uncategorized') AS category,
             SUM(e.amount) AS total
      FROM expenses e
      LEFT JOIN expense_categories ec ON ec.id = e.category_id
      WHERE e.branch_id = ANY(${branchIds}::uuid[])
        AND e.expense_date >= ${trendStartDateStr}::date
        AND e.status IN ('approved', 'paid')
      GROUP BY 1
      ORDER BY total DESC
      LIMIT 6
    `,

    // Recent orders feed
    prisma.orders.findMany({
      where: { branch_id: { in: branchIds } },
      orderBy: { created_at: "desc" },
      take: 8,
      select: {
        id: true,
        order_number: true,
        status: true,
        payment_status: true,
        order_type: true,
        total_amount: true,
        created_at: true,
        paid_at: true,
        branches: { select: { name: true } },
        users: { select: { full_name: true } },
      },
    }),

    // Low stock alerts (quantity_on_hand <= reorder_level needs raw SQL)
    prisma.$queryRaw`
      SELECT id, name, unit, quantity_on_hand, reorder_level
      FROM inventory_items
      WHERE branch_id = ANY(${branchIds}::uuid[])
        AND quantity_on_hand <= reorder_level
      ORDER BY (quantity_on_hand - reorder_level) ASC
      LIMIT 6
    `,

    // Staff currently clocked in on a shift
    prisma.shifts.count({
      where: { branch_id: { in: branchIds }, status: "open" },
    }),

    // Per-branch sales vs expenses over the trend window
    prisma.$queryRaw`
      SELECT b.id AS branch_id,
             b.name AS branch_name,
             COALESCE(sales.total, 0) AS sales,
             COALESCE(exp.total, 0) AS expenses
      FROM branches b
      LEFT JOIN (
        SELECT branch_id, SUM(total_amount) AS total
        FROM orders
        WHERE (payment_status = 'paid' OR status = 'paid')
          AND COALESCE(paid_at, updated_at, created_at) >= ${trendStart}
          AND branch_id = ANY(${branchIds}::uuid[])
        GROUP BY branch_id
      ) sales ON sales.branch_id = b.id
      LEFT JOIN (
        SELECT branch_id, SUM(amount) AS total
        FROM expenses
        WHERE status IN ('approved', 'paid')
          AND expense_date >= ${trendStartDateStr}::date
          AND branch_id = ANY(${branchIds}::uuid[])
        GROUP BY branch_id
      ) exp ON exp.branch_id = b.id
      WHERE b.id = ANY(${branchIds}::uuid[])
      ORDER BY sales DESC
    `,
  ]);

  // ---------- shape the response ----------

  const salesRow = salesTodayRaw[0] || { total: 0, paid_count: 0 };
  const sales = toNum(salesRow.total);
  const paidOrderCount = Number(salesRow.paid_count) || 0;

  const expensesRow = expensesTodayRaw[0] || { total: 0 };
  const expenses = toNum(expensesRow.total);

  const todaySummary = {
    sales,
    orders: ordersCountToday,
    expenses,
    net: sales - expenses,
    // Average of PAID orders only (not all orders)
    avgOrderValue: paidOrderCount > 0 ? sales / paidOrderCount : 0,
  };

  // Fill every day in the trend window, even days with 0 sales.
  const trendMap = new Map(
    salesTrendRaw.map((r) => [String(r.day).slice(0, 10), toNum(r.total)]),
  );
  const salesTrend = [];
  for (let i = 0; i < trendDays; i++) {
    const dayInstant = addDays(trendStart, i);
    const key = kabulDateKey(dayInstant);
    salesTrend.push({ date: key, sales: trendMap.get(key) || 0 });
  }

  // Fill every hour 0-23 for today.
  const hourlyMap = new Map(
    hourlyRaw.map((r) => [Number(r.hour), toNum(r.total)]),
  );
  const todayHourly = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    sales: hourlyMap.get(hour) || 0,
  }));

  const topMenuItems = topMenuItemsRaw.map((r) => ({
    name: r.name,
    qty: Number(r.qty),
    revenue: toNum(r.revenue),
  }));

  const expenseBreakdown = expenseBreakdownRaw.map((r) => ({
    category: r.category,
    amount: toNum(r.total),
  }));

  const lowStock = lowStockRaw.map((r) => ({
    id: r.id,
    name: r.name,
    unit: r.unit,
    quantityOnHand: toNum(r.quantity_on_hand),
    reorderLevel: toNum(r.reorder_level),
  }));

  const recentOrdersSerialized = recentOrders.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    orderType: o.order_type,
    totalAmount: toNum(o.total_amount),
    createdAt: o.created_at,
    branchName: o.branches?.name || null,
    waiterName: o.users?.full_name || null,
  }));

  const branchPerformance = branchPerformanceRaw
    .map((r) => ({
      branchId: r.branch_id,
      branchName: r.branch_name,
      sales: toNum(r.sales),
      expenses: toNum(r.expenses),
      net: toNum(r.sales) - toNum(r.expenses),
    }))
    .sort((a, b) => b.sales - a.sales);

  const totalBranchSales = branchPerformance.reduce((s, b) => s + b.sales, 0);
  const topBranch =
    branchPerformance.length > 0 && branchPerformance[0].sales > 0
      ? {
          ...branchPerformance[0],
          sharePct:
            totalBranchSales > 0
              ? (branchPerformance[0].sales / totalBranchSales) * 100
              : 0,
        }
      : null;

  // ---------- diagnostics (server logs only, no UI impact) ----------
  if (sales === 0 && ordersCountToday > 0) {
    try {
      const [statusRows, payRows, paymentRows] = await Promise.all([
        prisma.orders.groupBy({
          by: ["status"],
          where: {
            branch_id: { in: branchIds },
            created_at: { gte: today, lt: tomorrow },
          },
          _count: { _all: true },
        }),
        prisma.orders.groupBy({
          by: ["payment_status"],
          where: {
            branch_id: { in: branchIds },
            created_at: { gte: today, lt: tomorrow },
          },
          _count: { _all: true },
        }),
        prisma.payments.groupBy({
          by: ["status"],
          where: {
            orders: { branch_id: { in: branchIds } },
            paid_at: { gte: today, lt: tomorrow },
          },
          _count: { _all: true },
        }),
      ]);
      console.warn("[dashboard] sales=0 with orders today — inspection", {
        todayCount: ordersCountToday,
        orders_by_status: statusRows.map((r) => ({
          status: r.status,
          n: r._count._all,
        })),
        orders_by_payment_status: payRows.map((r) => ({
          payment_status: r.payment_status,
          n: r._count._all,
        })),
        payments_by_status: paymentRows.map((r) => ({
          status: r.status,
          n: r._count._all,
        })),
      });
    } catch (e) {
      console.warn("[dashboard] diagnostic failed:", e?.message);
    }
  }

  return NextResponse.json({
    scope,
    todaySummary,
    salesTrend,
    todayHourly,
    topMenuItems,
    expenseBreakdown,
    recentOrders: recentOrdersSerialized,
    lowStock,
    activeShifts,
    branchPerformance,
    topBranch,
  });
}
