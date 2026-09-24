const PAYSTACK_API_BASE = "https://api.paystack.co";

function getSecretKey(): string {
  const key = Deno.env.get("PAYSTACK_SECRET_KEY")?.trim();

  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is missing.");
  }

  return key;
}

export type PaystackTransaction = {
  id?: number | string;
  status?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  paid_at?: string | null;
  channel?: string | null;
  metadata?: unknown;
};

export function parsePaystackMetadata(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object"
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }

  return {};
}

export async function initializePaystackTransaction({
  email,
  amountKes,
  reference,
  callbackUrl,
  metadata,
  channels = ["card"],
}: {
  email: string;
  amountKes: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
  channels?: string[];
}) {
  const response = await fetch(
    `${PAYSTACK_API_BASE}/transaction/initialize`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: String(Math.round(amountKes * 100)),
        currency: "KES",
        reference,
        callback_url: callbackUrl,
        channels,
        metadata: JSON.stringify(metadata),
      }),
    },
  );

  const body = await response.json().catch(() => null);

  if (
    !response.ok ||
    !body?.status ||
    !body?.data?.authorization_url ||
    !body?.data?.reference
  ) {
    console.error("Paystack initialization failed:", body);
    throw new Error(
      body?.message ||
        body?.data?.message ||
        "Unable to initialize Paystack checkout.",
    );
  }

  return body.data as {
    authorization_url: string;
    access_code?: string;
    reference: string;
  };
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackTransaction> {
  const response = await fetch(
    `${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
      },
    },
  );

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.status || !body?.data) {
    console.error("Paystack verification failed:", body);
    throw new Error(
      body?.message || "Unable to verify Paystack transaction.",
    );
  }

  return body.data as PaystackTransaction;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < a.length; i += 1) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return difference === 0;
}

export async function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string,
): Promise<boolean> {
  const secret = getSecretKey();
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-512",
    },
    false,
    ["sign"],
  );

  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody),
  );

  const digest = Array.from(new Uint8Array(signed))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return constantTimeEqual(
    digest.toLowerCase(),
    signature.trim().toLowerCase(),
  );
}
