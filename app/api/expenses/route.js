import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getExpenseScope, resolveBranchForScope } from "@/lib/expense-scope";

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
    created_by: e.creator
      ? { id: e.creator.id, full_name: e.creator.full_name }
      : null,
    approved_by: e.approver
      ? { id: e.approver.id, full_name: e.approver.full_name }
      : null,
  };
}

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getExpenseScope(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  console.log(scope);

  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get("hotel_id");
  const branchId = searchParams.get("branch_id");
  const status = searchParams.get("status");
  const categoryId = searchParams.get("category_id");
  const q = (searchParams.get("q") || "").trim();

  let branchIds;
  if (scope.role === "branch_manager") {
    // Branch managers only ever see their own branch — hotel_id/branch_id
    // query params from the client are ignored entirely.
    branchIds = [scope.branchId];
  } else {
    if (!hotelId || !scope.hotelIds.includes(hotelId)) {
      return NextResponse.json(
        { error: "hotel_id is required" },
        { status: 400 },
      );
    }
    if (branchId) {
      const branch = await prisma.branches.findUnique({
        where: { id: branchId },
      });
      if (!branch || branch.hotel_id !== hotelId)
        return NextResponse.json(
          { error: "Invalid branch_id" },
          { status: 400 },
        );
      branchIds = [branchId];
    } else {
      const branches = await prisma.branches.findMany({
        where: { hotel_id: hotelId },
        select: { id: true },
      });
      branchIds = branches.map((b) => b.id);
    }
  }

  if (branchIds.length === 0) return NextResponse.json({ expenses: [] });

  const where = { branch_id: { in: branchIds } };
  if (status) where.status = status;
  if (categoryId) where.category_id = categoryId;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { vendor_name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const expenses = await prisma.expenses.findMany({
    where,
    select: EXPENSE_SELECT,
    orderBy: { expense_date: "desc" },
  });

  return NextResponse.json({ expenses: expenses.map(serialize) });
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getExpenseScope(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { title, amount } = body;

  if (!title || amount === undefined || amount === null) {
    return NextResponse.json(
      { error: "title and amount are required" },
      { status: 400 },
    );
  }
  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json(
      { error: "amount must be a positive number" },
      { status: 400 },
    );
  }

  // This is the enforcement point: hotel_owner must supply a hotel_id +
  // branch_id they actually own; branch_manager's own branch is substituted
  // no matter what (or isn't) sent in the body.
  const resolved = await resolveBranchForScope(
    scope,
    body.hotel_id,
    body.branch_id,
  );
  if (!resolved) {
    return NextResponse.json(
      { error: "A valid hotel_id and branch_id are required" },
      { status: 400 },
    );
  }

  // Owners logging their own expense are auto-approved. Branch managers
  // submit into a pending queue the owner reviews (see status PATCH below).
  const isOwner = scope.role === "hotel_owner";

  try {
    const expense = await prisma.expenses.create({
      data: {
        branch_id: resolved.branchId,
        category_id: body.category_id || null,
        payment_method_id: body.payment_method_id || null,
        title,
        description: body.description || null,
        amount: Number(amount),
        vendor_name: body.vendor_name || null,
        receipt_url: body.receipt_url || null,
        expense_date: body.expense_date
          ? new Date(body.expense_date)
          : new Date(),
        is_recurring: !!body.is_recurring,
        recurrence_interval: body.is_recurring
          ? body.recurrence_interval || null
          : null,
        created_by: user.id,
        status: isOwner ? "approved" : "pending",
        approved_by: isOwner ? user.id : null,
        approved_at: isOwner ? new Date() : null,
      },
      select: EXPENSE_SELECT,
    });
    return NextResponse.json({ expense: serialize(expense) }, { status: 201 });
  } catch (err) {
    console.error("Create expense error:", err);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 400 },
    );
  }
}
