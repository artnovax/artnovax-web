import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY")!,
);

const webhookSecret =
  Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const cryptoProvider =
  Stripe.createSubtleCryptoProvider();

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys.default,
);

Deno.serve(async (req) => {
  const signature =
    req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(
      "Missing Stripe signature",
      { status: 400 },
    );
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event =
      await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider,
      );
  } catch (error) {
    console.error(
      "Stripe webhook verification failed",
      error,
    );

    return new Response(
      "Invalid signature",
      { status: 400 },
    );
  }

if (event.type ==="checkout.session.completed") {
  const session =
    event.data.object as Stripe.Checkout.Session;

  const type =
    session.metadata?.type;

  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : null;

  if (type === "donation") {
    const donationId =
      session.metadata?.donation_id;

    if (donationId) {
      const { error } =
        await supabaseAdmin
          .from("donations")
          .update({
            status:
              session.payment_status === "paid"
                ? "paid"
                : "pending",

            stripe_payment_intent_id:
              paymentIntent,
          })
          .eq("id", donationId);

      if (error) throw error;
    }
  }

  if (type === "order") {
    const orderId =
      session.metadata?.order_id;

    if (orderId) {
      const paid =
        session.payment_status === "paid";

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
          .eq("id", orderId);

      if (error) throw error;
    }
  }
}

  return Response.json({
    received: true,
  });
});
