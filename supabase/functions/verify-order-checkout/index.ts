import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY")!,
);

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
      order_id,
      session_id,
    } = await req.json();

    if (!order_id || !session_id) {
      return Response.json(
        {
          error:
            "Missing order or Stripe session.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const session =
      await stripe.checkout.sessions.retrieve(
        session_id,
      );

    if (
      session.metadata?.type !== "order" ||
      session.metadata?.order_id !== order_id
    ) {
      return Response.json(
        {
          error:
            "Stripe session does not match this order.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const paid =
      session.payment_status === "paid";

    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null;

    const { error } =
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status:
            session.payment_status,

          status:
            paid ? "paid" : "pending",

          stripe_payment_intent_id:
            paymentIntent,
        })
        .eq("id", order_id);

    if (error) {
      throw error;
    }

    return Response.json(
      {
        paid,
        status:
          session.payment_status,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error(
      "Order verification error:",
      error,
    );

    return Response.json(
      {
        error:
          "Unable to verify payment.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
