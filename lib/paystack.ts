import crypto from "node:crypto";

export class PaystackConfigurationError extends Error {
  constructor(message = "Paystack is not configured.") {
    super(message);
    this.name = "PaystackConfigurationError";
  }
}

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

type InitializeData = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackVerification = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string;
  customer?: { email?: string };
  metadata?: Record<string, unknown>;
};

function secretKey() {
  if (process.env.PAYMENT_PROVIDER !== "paystack") {
    throw new PaystackConfigurationError("Payment provider is disabled. Set PAYMENT_PROVIDER=paystack.");
  }
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new PaystackConfigurationError("PAYSTACK_SECRET_KEY is required.");
  }
  return process.env.PAYSTACK_SECRET_KEY;
}

function baseUrl() {
  return (process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co").replace(/\/$/, "");
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const response = await fetch(`${baseUrl()}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      currency: "NGN",
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  const payload = (await response.json()) as PaystackResponse<InitializeData>;
  if (!response.ok || !payload.status) {
    throw new Error(payload.message || `Paystack initialize failed (${response.status}).`);
  }
  return payload.data;
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(`${baseUrl()}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      Accept: "application/json",
    },
  });
  const payload = (await response.json()) as PaystackResponse<PaystackVerification>;
  if (!response.ok || !payload.status) {
    throw new Error(payload.message || `Paystack verify failed (${response.status}).`);
  }
  return payload.data;
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const digest = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
