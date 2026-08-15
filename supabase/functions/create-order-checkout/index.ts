import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");

if (!stripeSecret) {
  throw new Error("STRIPE_SECRET_KEY is missing");
}

const stripe = new Stripe(stripeSecret);

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
      cancel_url,
    } = await req.json();

    if (
      !customer?.name?.trim() ||
      !customer?.email?.includes("@")
    ) {
      return Response.json(
        { error: "Please provide valid contact details." },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json(
        { error: "Your cart is empty." },
        { status: 400, headers: corsHeaders },
      );
    }

    const method = String(
      payment_method || "",
    ).toLowerCase();

    if (!["card", "bank", "mpesa"].includes(method)) {
      return Response.json(
        { error: "Unsupported payment method." },
        { status: 400, headers: corsHeaders },
      );
    }

    const { data: products, error: productsError } =
      await supabaseAdmin
        .from("products")
        .select("id,name,price,currency,active")
        .eq("active", true);

    if (productsError) {
      throw productsError;
    }

    const byId = new Map(
      (products ?? []).map((p) => [p.id, p]),
    );

    const byName = new Map(
      (products ?? []).map((p) => [
        p.name.toLowerCase(),
        p,
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
          { error: "Invalid product quantity." },
          { status: 400, headers: corsHeaders },
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
              `Product is no longer available: ${item.name ?? "Unknown"}`,
          },
          { status: 400, headers: corsHeaders },
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

    const { data: order, error: orderError } =
      await supabaseAdmin
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
        .select("id")
        .single();

    if (orderError) {
      throw orderError;
    }

    if (method === "bank" || method === "mpesa") {
      return Response.json(
        {
          order_id: order.id,
          subtotal,
          shipping,
          total,
          payment_method: method,
        },
        { headers: corsHeaders },
      );
    }

    if (!success_url || !cancel_url) {
      throw new Error("Missing Stripe redirect URLs.");
    }

    const lineItems = canonicalItems.map((item) => ({
      price_data: {
        currency: "kes",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(
          item.unit_price * 100,
        ),
      },
      quantity: item.qty,
    }));

    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: "kes",
          product_data: {
            name: "Shipping",
          },
          unit_amount: Math.round(
            shipping * 100,
          ),
        },
        quantity: 1,
      });
    }

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        customer_email: customer.email.trim(),
        client_reference_id: order.id,
        metadata: {
          type: "order",
          order_id: order.id,
        },
        success_url:
          `${success_url}?order_id=${order.id}` +
          `&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url,
      });

    const { error: sessionUpdateError } =
      await supabaseAdmin
        .from("orders")
        .update({
          stripe_session_id: session.id,
        })
        .eq("id", order.id);

    if (sessionUpdateError) {
      throw sessionUpdateError;
    }

    return Response.json(
      {
        url: session.url,
        order_id: order.id,
        subtotal,
        shipping,
        total,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("Order checkout error:", error);

    return Response.json(
      {
        error: "Unable to start checkout.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
