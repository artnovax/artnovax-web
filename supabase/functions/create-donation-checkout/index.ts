import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

import { corsHeaders } from "../_shared/cors.ts";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");

if (!stripeSecret) {
  throw new Error("STRIPE_SECRET_KEY is missing");
}

const stripe = new Stripe(stripeSecret);

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseAdmin = createClient(
  supabaseUrl,
  secretKeys.default,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const {
      amount_kes,
      name,
      email,
      message,
      success_url,
      cancel_url,
    } = await req.json();

    const amount = Number(amount_kes);

    if (!Number.isInteger(amount) || amount < 100) {
      return Response.json(
        {
          error: "Minimum donation is KES 100.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const { data: donation, error: donationError } =
      await supabaseAdmin
        .from("donations")
        .insert({
          amount_kes: amount,
          name: name?.trim() || null,
          email: email?.trim().toLowerCase() || null,
          message: message?.trim() || null,
          status: "pending",
        })
        .select("id")
        .single();

    if (donationError) {
      throw donationError;
    }

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        line_items: [
          {
            price_data: {
              currency: "kes",

              product_data: {
                name: "ArtNovaX Donation",
              },

              unit_amount: amount * 100,
            },

            quantity: 1,
          },
        ],

        success_url:
          `${success_url}?donation_id=${donation.id}` +
          `&session_id={CHECKOUT_SESSION_ID}`,

        cancel_url,

        customer_email:
          email?.trim() || undefined,

        metadata: {
          type: "donation",
          donation_id: donation.id,
        },
      });

    const { error: updateError } =
      await supabaseAdmin
        .from("donations")
        .update({
          stripe_session_id: session.id,
        })
        .eq("id", donation.id);

    if (updateError) {
      throw updateError;
    }

    return Response.json(
      {
        url: session.url,
        donation_id: donation.id,
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: "Unable to start donation checkout.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
