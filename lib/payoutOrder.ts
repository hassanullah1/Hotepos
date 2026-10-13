import prisma from "@/lib/prisma";
import { sendMultiVendorPayment } from "@/lib/hesabpay";

/**
 * Given a paid order, send the money onwards:
 *   - 5% (configurable) stays with the platform
 *   - 95% goes to the hotel owner's HesabPay account
 *
 * Safe to call twice — if a completed payout already exists, it's a no-op.
 * If a pending row exists, it retries the same distribution.
 */
export async function payoutOrder(orderId: string) {
  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    select: {
      id: true,
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

  // Platform fee %
  const settings = await prisma.platform_settings.findFirst({
    select: { commission_rate: true, commission_account: true },
  });
  const feeRate = Number(settings?.commission_rate ?? 5) / 100;

  const gross = Number(order.total_amount);
  const platform_fee = Math.round(gross * feeRate * 100) / 100;
  const owner_amount = Math.round((gross - platform_fee) * 100) / 100;

  // Build vendor list. If the platform has a dedicated commission account,
  // send the fee there explicitly for visibility. Otherwise it stays in
  // the platform's merchant account and we only pay the owner.
  const vendors: { account_number: string; amount: number }[] = [
    { account_number: ownerAccount, amount: owner_amount },
  ];
  if (settings?.commission_account) {
    vendors.push({
      account_number: settings.commission_account,
      amount: platform_fee,
    });
  }

  // Upsert the ledger row
  const ledger = await prisma.order_payouts.upsert({
    where: { order_id: order.id },
    update: {
      owner_account: ownerAccount,
      commission_account: settings?.commission_account || null,
      gross_amount: gross,
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
      gross_amount: gross,
      platform_fee,
      owner_amount,
      status: "pending",
    },
  });

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
