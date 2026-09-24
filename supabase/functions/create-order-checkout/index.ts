import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import {
  sendOrderReceivedEmails,
} from "../_shared/email.ts";
import {
  sendMpesaOrderReceivedEmails,
} from "../_shared/manualPaymentEmail.ts";
import {
  initializePaystackTransaction,
} from "../_shared/paystack.ts";

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys["default"],
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const {
      customer,
      items,
      payment_method,
      success_url,
    } = await req.json();

    if (
      !customer?.name?.trim() ||
      !customer?.email?.includes("@")
    ) {
      return Response.json(
        {
          error:
            "Please provide valid contact details.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return Response.json(
        {
          error: "Your cart is empty.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const method = String(
      payment_method || "",
    ).toLowerCase();

    if (
      !["card", "bank", "mpesa"].includes(method)
    ) {
      return Response.json(
        {
          error: "Unsupported payment method.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const {
      data: products,
      error: productsError,
    } = await supabaseAdmin
      .from("products")
      .select("id,name,price,currency,active")
      .eq("active", true);

    if (productsError) {
      throw productsError;
    }

    const byId = new Map(
      (products ?? []).map((product) => [
        product.id,
        product,
      ]),
    );

    const byName = new Map(
      (products ?? []).map((product) => [
        product.name.toLowerCase(),
        product,
      ]),
    );

    const canonicalItems = [];

    for (const item of items) {
      const qty = Number(item.qty);

      if (
        !Number.isInteger(qty) ||
        qty < 1 ||
        qty > 20
      ) {
        return Response.json(
          {
            error: "Invalid product quantity.",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      let product = null;

      if (item.product_id) {
        product = byId.get(item.product_id);
      }

      if (!product && item.name) {
        product = byName.get(
          String(item.name).toLowerCase(),
        );
      }

      if (!product) {
        return Response.json(
          {
            error:
              `Product is no longer available: ${
                item.name ?? "Unknown"
              }`,
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const unitPrice = Number(product.price);

      canonicalItems.push({
        product_id: product.id,
        name: product.name,
        unit_price: unitPrice,
        qty,
        line_total: unitPrice * qty,
      });
    }

    const subtotal = canonicalItems.reduce(
      (sum, item) => sum + item.line_total,
      0,
    );

    const shipping = subtotal >= 3000 ? 0 : 200;
    const total = subtotal + shipping;

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .insert({
        customer: {
          name: customer.name.trim(),
          email: customer.email.trim().toLowerCase(),
          phone: customer.phone || null,
          address: customer.address || null,
          city: customer.city || null,
          country: customer.country || null,
        },
        items: canonicalItems,
        subtotal,
        shipping,
        total,
        currency: "KES",
        payment_method: method,
        payment_status: "pending",
        status: "pending",
      })
      .select("*")
      .single();

    if (orderError) {
      throw orderError;
    }

    // Manual payment methods remain pending until ArtNovaX verifies them.
    if (method === "bank" || method === "mpesa") {
      await supabaseAdmin
        .from("orders")
        .update({
          email_last_attempt_at: new Date().toISOString(),
          email_last_error: null,
        })
        .eq("id", order.id);

      const delivery =
        method === "mpesa"
          ? await sendMpesaOrderReceivedEmails(order)
          : await sendOrderReceivedEmails(order, {
              sendCustomer: !order.order_received_email_sent_at,
              sendTeam: !order.order_received_team_email_sent_at,
            });

      const update: Record<string, unknown> = {};
      const now = new Date().toISOString();

      if (delivery.customerSent) {
        update.order_received_email_sent_at = now;
      }

      if (delivery.teamSent) {
        update.order_received_team_email_sent_at = now;
      }

      update.email_last_error =
        delivery.errors.length > 0
          ? delivery.errors.join(" | ")
          : null;

      await supabaseAdmin
        .from("orders")
        .update(update)
        .eq("id", order.id);

      if (delivery.errors.length > 0) {
        console.error(
          `${method} order email delivery errors:`,
          delivery.errors,
        );
      }

      return Response.json(
        {
          order_id: order.id,
          subtotal,
          shipping,
          total,
          payment_method: method,
          payment_status: "pending",
        },
        {
          headers: corsHeaders,
        },
      );
    }

    if (!success_url) {
      throw new Error("Missing Paystack callback URL.");
    }

    const reference =
      `AX-ORDER-${String(order.id).replaceAll("-", "")}`;

    const callbackUrl = new URL(success_url);
    callbackUrl.searchParams.set("order_id", order.id);

    const transaction = await initializePaystackTransaction({
      email: customer.email.trim().toLowerCase(),
      amountKes: total,
      reference,
      callbackUrl: callbackUrl.toString(),
      channels: ["card"],
      metadata: {
        type: "order",
        order_id: order.id,
      },
    });

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        paystack_reference: transaction.reference,
      })
      .eq("id", order.id);

    if (updateError) {
      throw updateError;
    }

    return Response.json(
      {
        url: transaction.authorization_url,
        order_id: order.id,
        reference: transaction.reference,
        subtotal,
        shipping,
        total,
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Order checkout error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start checkout.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
