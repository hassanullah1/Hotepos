import crypto from "crypto";

const HESABPAY_BASE = "https://api.hesab.com/api/v1";

/**
 * Encrypts the account PIN exactly as HesabPay's sample code expects:
 *   AES-256-CBC
 *   key   = API key, truncated/padded to 32 bytes with NUL
 *   iv    = 16 random bytes
 *   pad   = PKCS#7 (Node's default for aes-256-cbc)
 *   result = base64(iv || ciphertext)
 */
export function encryptPin(pin: string, apiKey: string): string {
  const key = Buffer.alloc(32);
  Buffer.from(apiKey, "utf-8").copy(key, 0, 0, Math.min(32, apiKey.length));

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(pin, "utf-8"),
    cipher.final(),
  ]);

  return Buffer.concat([iv, encrypted]).toString("base64");
}

export type VendorPayout = {
  account_number: string;
  amount: number;
};

/**
 * Calls HesabPay's multi-vendor send-money endpoint.
 * Money comes FROM the platform's own HesabPay account (identified by
 * HESABPAY_ACCOUNT_PIN) and is distributed to each vendor.
 */
export async function sendMultiVendorPayment(vendors: VendorPayout[]) {
  const apiKey = process.env.HESABPAY_API_KEY;
  const pin = process.env.HESABPAY_ACCOUNT_PIN;

  if (!apiKey) throw new Error("HESABPAY_API_KEY is not set");
  if (!pin) throw new Error("HESABPAY_ACCOUNT_PIN is not set");
  if (!vendors.length) throw new Error("No vendors to pay");

  // HesabPay rejects duplicates and >16 vendors per call
  const seen = new Set<string>();
  for (const v of vendors) {
    if (seen.has(v.account_number))
      throw new Error(`Duplicate vendor account: ${v.account_number}`);
    seen.add(v.account_number);
    if (!v.account_number || !v.amount || v.amount <= 0)
      throw new Error("Invalid vendor entry");
  }
  if (vendors.length > 16)
    throw new Error("HesabPay allows a maximum of 16 vendors per call");

  const encrypted_pin = encryptPin(pin, apiKey);

  const res = await fetch(`${HESABPAY_BASE}/payment/send-money-MultiVendor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `API-KEY ${apiKey}`,
    },
    body: JSON.stringify({ pin: encrypted_pin, vendors }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data || data.success !== true) {
    return {
      ok: false as const,
      status: res.status,
      message: data?.message || "Multi-vendor payment failed",
      raw: data,
    };
  }

  return {
    ok: true as const,
    transaction_id: data.transaction_id as string,
    total_amount: data.total_amount as number,
    raw: data,
  };
}

/**
 * Creates a HesabPay payment session for an order.
 * Same shape as the signup session route — money lands in the platform's
 * merchant account, then we distribute it via Multi-Vendor.
 */
export async function createOrderPaymentSession(input: {
  order_id: string;
  order_number: string;
  amount: number;
  email?: string | null;
  success_url: string;
  failure_url: string;
}) {
  const apiKey = process.env.HESABPAY_API_KEY;
  if (!apiKey) throw new Error("HESABPAY_API_KEY is not set");

  const res = await fetch(`${HESABPAY_BASE}/payment/create-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `API-KEY ${apiKey}`,
    },
    body: JSON.stringify({
      email: input.email || undefined,
      items: [
        {
          // Used as the correlation id when the webhook comes back
          id: input.order_id,
          name: `Order ${input.order_number}`,
          price: Number(input.amount),
        },
      ],
      redirect_success_url: input.success_url,
      redirect_failure_url: input.failure_url,
    }),
  });

  const data = await res.json().catch(() => null);
  const paymentUrl = data?.url || data?.payment_url;

  if (!res.ok || !data || data.success !== true || !paymentUrl) {
    return {
      ok: false as const,
      status: res.status,
      message: data?.message || "Could not start payment",
      raw: data,
    };
  }

  return { ok: true as const, payment_url: paymentUrl as string };
}
