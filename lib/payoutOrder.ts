import prisma from "@/lib/prisma";
import { sendMultiVendorPayment } from "@/lib/hesabpay";

/**
 * Split a paid order between the hotel owner and the platform.
 *
 * Rules:
 *   commission = 5% of subtotal (food only — delivery is never commissioned)
 *   delivery_fee = total_amount − subtotal      (0 | 50 | 50)
 *
 *   delivery_type = "paid"  → owner delivers → owner keeps delivery_fee
 *   delivery_type = "none"  → platform delivers → platform keeps delivery_fee
 *   delivery_type = "free"  → no delivery fee
 *
 * Safe to call twice: completed payouts are a no-op; pending ones retry.
 */
export async function payoutOrder(orderId: string) {
  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      subtotal: true,
      total_amount: true,
      payment_status: true,
      branch_id: true,
      branches: {
        select: {
          hotel_id: true,
          hotels: {
            select: {
              id: true,
              name: true,
              delivery_type: true, // "none" | "paid" | "free"
              hotel_owner: { select: { hesabpay_account_number: true } },
            },
          },
        },
      },
      payout: { select: { id: true, status: true } },
    },
  });

  if (!order) return { ok: false as const, error: "ORDER_NOT_FOUND" };
  if (order.payment_status !== "paid")
    return { ok: false as const, error: "ORDER_NOT_PAID" };

  if (order.payout?.status === "completed") {
    return { ok: true as const, already: true };
  }

  const hotel = order.branches?.hotels;
  if (!hotel) return { ok: false as const, error: "NO_HOTEL" };

  const ownerAccount = hotel.hotel_owner?.hesabpay_account_number;
  if (!ownerAccount)
    return { ok: false as const, error: "OWNER_ACCOUNT_MISSING" };

  // ── Platform settings ──
  const settings = await prisma.platform_settings.findFirst({
    select: { commission_rate: true, commission_account: true },
  });
  const feeRate = Number(settings?.commission_rate ?? 5) / 100;

  // ── Numbers ──
  const round = (n: number) => Math.round(n * 100) / 100;

  const total = Number(order.total_amount); // food + delivery
  const subtotal = Number(order.subtotal); // food only
  const deliveryFee = round(Math.max(0, total - subtotal));
  const deliveryType = hotel.delivery_type ?? "none";

  const commission = round(subtotal * feeRate); // 5% of food only
  const foodToOwner = round(subtotal - commission);

  let owner_amount: number;
  let platform_fee: number;

  if (deliveryFee > 0 && deliveryType === "paid") {
    // Owner provides delivery → owner keeps the delivery fee
    owner_amount = round(foodToOwner + deliveryFee);
    platform_fee = commission;
  } else if (deliveryFee > 0 && deliveryType === "none") {
    // Platform provides delivery → platform keeps the delivery fee
    owner_amount = foodToOwner;
    platform_fee = round(commission + deliveryFee);
  } else {
    // "free", or any order with no delivery fee (dine-in)
    owner_amount = foodToOwner;
    platform_fee = commission;
  }

  // Safety check: never pay out more than was collected
  if (round(owner_amount + platform_fee) > round(total) + 0.01) {
    return { ok: false as const, error: "SPLIT_EXCEEDS_TOTAL" };
  }

  // ── Build vendor list ──
  const vendors: { account_number: string; amount: number }[] = [];
  if (owner_amount > 0) {
    vendors.push({ account_number: ownerAccount, amount: owner_amount });
  }
  if (platform_fee > 0 && settings?.commission_account) {
    vendors.push({
      account_number: settings.commission_account,
      amount: platform_fee,
    });
  }

  // ── Ledger row ──
  const ledger = await prisma.order_payouts.upsert({
    where: { order_id: order.id },
    update: {
      owner_account: ownerAccount,
      commission_account: settings?.commission_account || null,
      gross_amount: total,
      platform_fee,
      owner_amount,
      status: "pending",
      error_message: null,
    },
    create: {
      order_id: order.id,
      hotel_id: hotel.id,
      owner_account: ownerAccount,
      commission_account: settings?.commission_account || null,
      gross_amount: total,
      platform_fee,
      owner_amount,
      status: "pending",
    },
  });

  // ── Move the money ──
  try {
    const result = await sendMultiVendorPayment(vendors);

    if (!result.ok) {
      await prisma.order_payouts.update({
        where: { id: ledger.id },
        data: {
          status: "failed",
          error_message: result.message?.slice(0, 500) || "Unknown error",
        },
      });
      return { ok: false as const, error: result.message };
    }

    await prisma.order_payouts.update({
      where: { id: ledger.id },
      data: {
        status: "completed",
        transaction_id: result.transaction_id,
        completed_at: new Date(),
      },
    });

    return {
      ok: true as const,
      transaction_id: result.transaction_id,
      owner_amount,
      platform_fee,
      delivery_fee: deliveryFee,
      delivery_type: deliveryType,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Payout failed";
    await prisma.order_payouts.update({
      where: { id: ledger.id },
      data: { status: "failed", error_message: msg.slice(0, 500) },
    });
    return { ok: false as const, error: msg };
  }
}
