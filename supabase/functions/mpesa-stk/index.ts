import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys["default"],
);

const MPESA_ENV = Deno.env.get("MPESA_ENV") || "sandbox";
const MPESA_CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY") || "";
const MPESA_CONSUMER_SECRET =
  Deno.env.get("MPESA_CONSUMER_SECRET") || "";
const MPESA_SHORTCODE = Deno.env.get("MPESA_SHORTCODE") || "";
const MPESA_PASSKEY = Deno.env.get("MPESA_PASSKEY") || "";

const DARAJA_BASE =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

function normalizeMsisdn(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");

  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) {
    return `254${digits}`;
  }

  return digits;
}

function kenyaTimestamp(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || "";

  return [
    get("year"),
    get("month"),
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  ].join("");
}

async function getAccessToken(): Promise<string> {
  const credentials = btoa(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`,
  );

  const response = await fetch(
    `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Daraja OAuth failed:", response.status, text);
    throw new Error("Unable to authenticate with M-Pesa.");
  }

  const body = await response.json();

  if (!body.access_token) {
    throw new Error("M-Pesa access token was not returned.");
  }

  return body.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (
      !MPESA_CONSUMER_KEY ||
      !MPESA_CONSUMER_SECRET ||
      !MPESA_SHORTCODE ||
      !MPESA_PASSKEY
    ) {
      throw new Error("M-Pesa is not configured.");
    }

    const { order_id, phone } = await req.json();

    if (!order_id) {
      return Response.json(
        { error: "Missing order ID." },
        { status: 400, headers: corsHeaders },
      );
    }

    const normalizedPhone = normalizeMsisdn(phone);

    // Kenya mobile MSISDNs are expected in 254XXXXXXXXX form.
    if (!/^254\d{9}$/.test(normalizedPhone)) {
      return Response.json(
        { error: "Please provide a valid Kenyan mobile number." },
        { status: 400, headers: corsHeaders },
      );
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id,total,payment_method,payment_status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return Response.json(
        { error: "Order not found." },
        { status: 404, headers: corsHeaders },
      );
    }

    if (order.payment_method !== "mpesa") {
      return Response.json(
        { error: "This order is not configured for M-Pesa." },
        { status: 400, headers: corsHeaders },
      );
    }

    if (order.payment_status === "paid") {
      return Response.json(
        { error: "This order has already been paid." },
        { status: 409, headers: corsHeaders },
      );
    }

    const amount = Math.round(Number(order.total));

    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json(
        { error: "Nothing to pay." },
        { status: 400, headers: corsHeaders },
      );
    }

    const timestamp = kenyaTimestamp();
    const password = btoa(
      `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`,
    );

    const accessToken = await getAccessToken();

    const callbackUrl =
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`;

    const response = await fetch(
      `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: normalizedPhone,
          PartyB: MPESA_SHORTCODE,
          PhoneNumber: normalizedPhone,
          CallBackURL: callbackUrl,
          AccountReference: `ArtNovaX-${order.id
            .slice(0, 8)
            .toUpperCase()}`,
          TransactionDesc: "ArtNovaX order",
        }),
      },
    );

    const body = await response.json();

    if (!response.ok || body.ResponseCode !== "0") {
      console.error("Daraja STK request failed:", body);

      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "failed",
          mpesa_result_description:
            body.errorMessage ||
            body.ResponseDescription ||
            "STK Push could not be started.",
        })
        .eq("id", order.id);

      return Response.json(
        {
          error:
            body.errorMessage ||
            body.ResponseDescription ||
            "Unable to start M-Pesa payment.",
        },
        { status: 502, headers: corsHeaders },
      );
    }

    const checkoutRequestId = body.CheckoutRequestID;
    const merchantRequestId = body.MerchantRequestID;

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        mpesa_phone: normalizedPhone,
        mpesa_checkout_request_id: checkoutRequestId,
        mpesa_merchant_request_id: merchantRequestId,
        payment_method: "mpesa",
        payment_status: "pending",
        status: "pending",
        mpesa_result_code: null,
        mpesa_result_description: null,
      })
      .eq("id", order.id);

    if (updateError) throw updateError;

    return Response.json(
      {
        order_id: order.id,
        ref: checkoutRequestId,
        message:
          body.CustomerMessage ||
          "Check your phone for the M-Pesa prompt and approve the payment there.",
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("M-Pesa STK error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start M-Pesa payment.",
      },
      { status: 500, headers: corsHeaders },
    );
  }
});
