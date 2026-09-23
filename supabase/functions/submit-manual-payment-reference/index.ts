import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import {
  sendManualPaymentReferenceEmails,
} from "../_shared/manualPaymentEmail.ts";

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys["default"],
);

const normalizeEmail = (value: unknown) =>
  String(value || "").trim().toLowerCase();

const normalizeReference = (value: unknown) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return Response.json(
      { error: "Method not allowed." },
      {
        status: 405,
        headers: corsHeaders,
      },
    );
  }

  try {
    const {
      order_id,
      email,
      reference,
    } = await req.json();

    const orderId = String(order_id || "").trim();
    const submittedEmail = normalizeEmail(email);
    const submittedReference = normalizeReference(reference);

    if (!orderId || !submittedEmail) {
      return Response.json(
        {
          error:
            "Order ID and customer email are required.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // M-Pesa transaction codes are alphanumeric. Keep the validation
    // deliberately tolerant enough for future Safaricom formatting changes.
    if (!/^[A-Z0-9]{8,16}$/.test(submittedReference)) {
      return Response.json(
        {
          error:
            "Enter a valid M-Pesa transaction code using letters and numbers only.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return Response.json(
        {
          error:
            "We could not find that order.",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    const orderEmail = normalizeEmail(
      order.customer?.email,
    );

    if (
      !orderEmail ||
      orderEmail !== submittedEmail
    ) {
      return Response.json(
        {
          error:
            "The email address does not match this order.",
        },
        {
          status: 403,
          headers: corsHeaders,
        },
      );
    }

    if (order.payment_method !== "mpesa") {
      return Response.json(
        {
          error:
            "This order is not configured for M-Pesa Paybill verification.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (order.payment_status === "paid") {
      return Response.json(
        {
          ok: true,
          paid: true,
          message:
            "This order has already been confirmed as paid.",
        },
        {
          headers: corsHeaders,
        },
      );
    }

    const submittedAt =
      new Date().toISOString();

    const {
      data: updatedOrder,
      error: updateError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        manual_payment_reference:
          submittedReference,
        manual_payment_reference_submitted_at:
          submittedAt,
        manual_payment_reference_status:
          "submitted",
        // The order intentionally remains pending. A customer-provided
        // transaction code is not authoritative proof of payment.
        payment_status: "pending",
        status: "pending",
      })
      .eq("id", order.id)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    const delivery =
      await sendManualPaymentReferenceEmails(
        updatedOrder,
        submittedReference,
      );

    if (delivery.errors.length > 0) {
      console.error(
        "Manual M-Pesa reference email errors:",
        delivery.errors,
      );
    }

    return Response.json(
      {
        ok: true,
        paid: false,
        reference:
          submittedReference,
        message:
          "Reference received. ArtNovaX will verify the incoming payment before confirming your order.",
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error(
      "Manual payment reference error:",
      error,
    );

    return Response.json(
      {
        error:
          "Unable to save the payment reference.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
