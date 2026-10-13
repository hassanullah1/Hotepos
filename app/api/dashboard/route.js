import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { resolveDashboardScope } from "@/lib/dashboard-scope";

// ---------- small date helpers (server local time; see README note on timezones) ----------
function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function toNum(v) {
  if (v === null || v === undefined) return 0;
  return typeof v === "object" && typeof v.toNumber === "function"
    ? v.toNumber()
    : Number(v);
}

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

  // Nothing to query yet (e.g. brand-new hotel with zero branches)
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

  const today = startOfDay();
  const tomorrow = addDays(today, 1);
  const trendStart = addDays(today, -(trendDays - 1));

  const [
    salesAggToday,
    ordersCountToday,
    expensesAggToday,
    salesTrendRaw,
    hourlyRaw,
    topMenuItemsRaw,
    expenseBreakdownRaw,
    recentOrders,
    lowStockRaw,
    activeShifts,
    branchPerformanceRaw,
  ] = await Promise.all([
    // Today's completed-payment sales total
    prisma.payments.aggregate({
      where: {
        status: "completed",
        paid_at: { gte: today, lt: tomorrow },
        orders: { branch_id: { in: branchIds } },
      },
      _sum: { amount: true },
    }),

    // Today's order count (all statuses — gives a sense of floor traffic)
    prisma.orders.count({
      where: {
        branch_id: { in: branchIds },
        created_at: { gte: today, lt: tomorrow },
      },
    }),

    // Today's approved/paid expenses
    prisma.expenses.aggregate({
      where: {
        branch_id: { in: branchIds },
        expense_date: { gte: today, lt: tomorrow },
        status: { in: ["approved", "paid"] },
      },
      _sum: { amount: true },
    }),

    // Daily sales for the trend chart
    prisma.$queryRaw`
      SELECT date_trunc('day', p.paid_at) AS day, COALESCE(SUM(p.amount), 0) AS total
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE o.branch_id = ANY(${branchIds}::uuid[])
        AND p.status = 'completed'
        AND p.paid_at >= ${trendStart}
      GROUP BY 1
      ORDER BY 1
    `,

    // Hour-by-hour sales for today
    prisma.$queryRaw`
      SELECT date_trunc('hour', p.paid_at) AS hour, COALESCE(SUM(p.amount), 0) AS total
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE o.branch_id = ANY(${branchIds}::uuid[])
        AND p.status = 'completed'
        AND p.paid_at >= ${today} AND p.paid_at < ${tomorrow}
      GROUP BY 1
      ORDER BY 1
    `,

    // Best sellers over the trend window
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
        AND e.expense_date >= ${trendStart}
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
        order_type: true,
        total_amount: true,
        created_at: true,
        branches: { select: { name: true } },
        users: { select: { full_name: true } },
      },
    }),

    // Low stock alerts (quantity_on_hand <= reorder_level needs raw SQL:
    // Prisma can't compare two columns to each other in `where`)
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

    // Per-branch sales vs expenses over the trend window — powers the
    // "every branch" comparison chart and the top-branch highlight.
    // Only meaningful when more than one branch is in view, but it's cheap
    // to compute regardless.
    prisma.$queryRaw`
      SELECT b.id AS branch_id,
             b.name AS branch_name,
             COALESCE(sales.total, 0) AS sales,
             COALESCE(exp.total, 0) AS expenses
      FROM branches b
      LEFT JOIN (
        SELECT o.branch_id, SUM(p.amount) AS total
        FROM payments p
        JOIN orders o ON o.id = p.order_id
        WHERE p.status = 'completed'
          AND p.paid_at >= ${trendStart}
          AND o.branch_id = ANY(${branchIds}::uuid[])
        GROUP BY o.branch_id
      ) sales ON sales.branch_id = b.id
      LEFT JOIN (
        SELECT branch_id, SUM(amount) AS total
        FROM expenses
        WHERE status IN ('approved', 'paid')
          AND expense_date >= ${trendStart}
          AND branch_id = ANY(${branchIds}::uuid[])
        GROUP BY branch_id
      ) exp ON exp.branch_id = b.id
      WHERE b.id = ANY(${branchIds}::uuid[])
      ORDER BY sales DESC
    `,
  ]);

  // ---------- shape the response ----------

  const sales = toNum(salesAggToday._sum.amount);
  const expenses = toNum(expensesAggToday._sum.amount);

  const todaySummary = {
    sales,
    orders: ordersCountToday,
    expenses,
    net: sales - expenses,
    avgOrderValue: ordersCountToday > 0 ? sales / ordersCountToday : 0,
  };

  // Fill every day in the trend window, even days with 0 sales, so the
  // chart doesn't silently skip gaps.
  const trendMap = new Map(
    salesTrendRaw.map((r) => [
      new Date(r.day).toISOString().slice(0, 10),
      toNum(r.total),
    ]),
  );
  const salesTrend = [];
  for (let i = 0; i < trendDays; i++) {
    const dte = addDays(trendStart, i);
    const key = dte.toISOString().slice(0, 10);
    salesTrend.push({ date: key, sales: trendMap.get(key) || 0 });
  }

  // Fill every hour 0-23 for today
  const hourlyMap = new Map(
    hourlyRaw.map((r) => [new Date(r.hour).getHours(), toNum(r.total)]),
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
