import { createClient } from "@supabase/supabase-js";
import {
  parsePaystackMetadata,
  verifyPaystackWebhookSignature,
} from "../_shared/paystack.ts";
import {
  settlePaystackDonation,
  settlePaystackOrder,
} from "../_shared/paystackSettlement.ts";

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys["default"],
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
    });
  }

  const signature =
    req.headers.get("x-paystack-signature") || "";

  if (!signature) {
    return new Response("Missing Paystack signature", {
      status: 400,
    });
  }

  const rawBody = await req.text();

  if (
    !(await verifyPaystackWebhookSignature(
      rawBody,
      signature,
    ))
  ) {
    console.error("Paystack webhook signature verification failed.");
    return new Response("Invalid signature", {
      status: 400,
    });
  }

  let event: any;

  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", {
      status: 400,
    });
  }

  // Paystack currently sends charge.success for successful payments.
  if (event?.event !== "charge.success") {
    return Response.json({ received: true });
  }

  try {
    const transaction = event.data || {};
    const reference = String(transaction.reference || "");
    const metadata = parsePaystackMetadata(transaction.metadata);

    if (!reference) {
      throw new Error("Paystack webhook has no transaction reference.");
    }

    if (
      transaction.status &&
      transaction.status !== "success"
    ) {
      return Response.json({ received: true });
    }

    if (metadata.type === "order") {
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("paystack_reference", reference)
        .single();

      if (error || !order) {
        throw error || new Error("Paystack order not found.");
      }

      if (
        order.payment_method !== "card" ||
        metadata.order_id !== order.id
      ) {
        throw new Error("Paystack order metadata mismatch.");
      }

      const expectedAmount = Math.round(Number(order.total) * 100);

      if (
        transaction.currency !== "KES" ||
        Number(transaction.amount) !== expectedAmount
      ) {
        throw new Error("Paystack order amount/currency mismatch.");
      }

      await settlePaystackOrder(
        supabaseAdmin,
        order,
        transaction,
      );
    } else if (metadata.type === "donation") {
      const { data: donation, error } = await supabaseAdmin
        .from("donations")
        .select("*")
        .eq("paystack_reference", reference)
        .single();

      if (error || !donation) {
        throw error || new Error("Paystack donation not found.");
      }

      if (metadata.donation_id !== donation.id) {
        throw new Error("Paystack donation metadata mismatch.");
      }

      const expectedAmount =
        Math.round(Number(donation.amount_kes) * 100);

      if (
        transaction.currency !== "KES" ||
        Number(transaction.amount) !== expectedAmount
      ) {
        throw new Error("Paystack donation amount/currency mismatch.");
      }

      await settlePaystackDonation(
        supabaseAdmin,
        donation,
        transaction,
      );
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed:", error);

    return new Response("Webhook processing failed", {
      status: 500,
    });
  }
});
