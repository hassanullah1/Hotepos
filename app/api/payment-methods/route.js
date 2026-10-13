import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getExpenseScope } from "@/lib/expense-scope";

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getExpenseScope(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const requestedBranchId = searchParams.get("branch_id");
  const branchId = scope.role === "branch_manager" ? scope.branchId : requestedBranchId;

  if (!branchId) {
    return NextResponse.json({ error: "branch_id is required" }, { status: 400 });
  }

  const branch = await prisma.branches.findUnique({ where: { id: branchId } });
  if (!branch || !scope.hotelIds.includes(branch.hotel_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const methods = await prisma.payment_methods.findMany({
    where: { branch_id: branchId, is_active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ payment_methods: methods });
}
