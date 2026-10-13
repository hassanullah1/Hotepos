import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getExpenseScope } from "@/lib/expense-scope";

const EXPENSE_SELECT = {
  id: true,
  title: true,
  description: true,
  amount: true,
  vendor_name: true,
  receipt_url: true,
  expense_date: true,
  status: true,
  is_recurring: true,
  recurrence_interval: true,
  created_at: true,
  approved_at: true,
  branch_id: true,
  branches: { select: { id: true, name: true, hotel_id: true } },
  expense_categories: { select: { id: true, name: true } },
  payment_methods: { select: { id: true, name: true } },
  creator: { select: { id: true, full_name: true } },
  approver: { select: { id: true, full_name: true } },
};

function serialize(e) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    amount: e.amount ? Number(e.amount) : 0,
    vendor_name: e.vendor_name,
    receipt_url: e.receipt_url,
    expense_date: e.expense_date,
    status: e.status,
    is_recurring: e.is_recurring,
    recurrence_interval: e.recurrence_interval,
    created_at: e.created_at,
    approved_at: e.approved_at,
    branch: e.branches ? { id: e.branches.id, name: e.branches.name } : null,
    category: e.expense_categories
      ? { id: e.expense_categories.id, name: e.expense_categories.name }
      : null,
    payment_method: e.payment_methods
      ? { id: e.payment_methods.id, name: e.payment_methods.name }
      : null,
    created_by: e.creator ? { id: e.creator.id, full_name: e.creator.full_name } : null,
    approved_by: e.approver ? { id: e.approver.id, full_name: e.approver.full_name } : null,
  };
}

async function loadScopedExpense(id, scope) {
  const expense = await prisma.expenses.findUnique({ where: { id }, select: EXPENSE_SELECT });
  if (!expense) return null;
  if (scope.role === "branch_manager") {
    if (expense.branch_id !== scope.branchId) return null;
  } else if (!scope.hotelIds.includes(expense.branches?.hotel_id)) {
    return null;
  }
  return expense;
}

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getExpenseScope(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const expense = await loadScopedExpense(id, scope);
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ expense: serialize(expense) });
}

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getExpenseScope(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await loadScopedExpense(id, scope);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const data = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.amount !== undefined) {
    if (isNaN(Number(body.amount)) || Number(body.amount) <= 0)
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
    data.amount = Number(body.amount);
  }
  if (body.category_id !== undefined) data.category_id = body.category_id || null;
  if (body.payment_method_id !== undefined) data.payment_method_id = body.payment_method_id || null;
  if (body.vendor_name !== undefined) data.vendor_name = body.vendor_name || null;
  if (body.receipt_url !== undefined) data.receipt_url = body.receipt_url || null;
  if (body.expense_date !== undefined) data.expense_date = new Date(body.expense_date);
  if (body.is_recurring !== undefined) data.is_recurring = !!body.is_recurring;
  if (body.recurrence_interval !== undefined)
    data.recurrence_interval = body.is_recurring ? body.recurrence_interval || null : null;

  // Only the hotel owner can approve/reject/mark-paid. A branch manager
  // cannot self-approve their own submitted expense.
  if (body.status !== undefined) {
    if (scope.role !== "hotel_owner")
      return NextResponse.json({ error: "Only the hotel owner can change status" }, { status: 403 });
    if (!["pending", "approved", "rejected", "paid"].includes(body.status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    data.status = body.status;
    if (body.status === "approved") {
      data.approved_by = user.id;
      data.approved_at = new Date();
    }
  }

  data.updated_at = new Date();

  try {
    await prisma.expenses.update({ where: { id }, data });
    const updated = await loadScopedExpense(id, scope);
    return NextResponse.json({ expense: serialize(updated) });
  } catch (err) {
    console.error("Update expense error:", err);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getExpenseScope(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await loadScopedExpense(id, scope);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // A branch manager may only remove their own still-pending submissions —
  // once the owner has approved/rejected/paid it, it's locked from their side.
  if (scope.role === "branch_manager" && existing.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending expenses can be deleted" },
      { status: 403 },
    );
  }

  try {
    await prisma.expenses.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete expense error:", err);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 400 });
  }
}
