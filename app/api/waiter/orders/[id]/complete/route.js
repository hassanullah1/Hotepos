import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getStaffBranch } from "@/lib/pos-scope";

export async function POST(request, context) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getStaffBranch(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: orderId } = await context.params;

  const order = await prisma.orders.findFirst({
    where: { id: orderId, branch_id: scope.branchId },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "open") {
    return NextResponse.json(
      { error: "Order is already completed or closed" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Find or create a default payment method (Cash)
      let paymentMethod = await tx.payment_methods.findFirst({
        where: { branch_id: scope.branchId, is_active: true },
      });

      if (!paymentMethod) {
        // Create a default "Cash" payment method for this branch
        paymentMethod = await tx.payment_methods.create({
          data: {
            branch_id: scope.branchId,
            name: "Cash",
            type: "cash",
            is_active: true,
          },
        });
      }

      // 2. Mark the order as completed
      const completedOrder = await tx.orders.update({
        where: { id: order.id },
        data: { status: "completed" },
      });

      // 3. Create a payment record
      await tx.payments.create({
        data: {
          order_id: order.id,
          payment_method_id: paymentMethod.id,
          amount: order.total_amount,
          amount_tendered: order.total_amount,
          change_given: 0,
          status: "completed",
          received_by: user.id,
          paid_at: new Date(),
        },
      });

      return completedOrder;
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error("Complete order error:", err);
    return NextResponse.json(
      { error: "Failed to complete order" },
      { status: 500 },
    );
  }
}
