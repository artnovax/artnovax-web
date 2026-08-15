import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  sendDonationPaidEmails,
  sendOrderPaidEmails,
} from "../_shared/email.ts";

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
  secretKeys["default"],
);

Deno.serve(async (req) => {
  const signature =
    req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(
      "Missing Stripe signature",
      {
        status: 400,
      },
    );
  }

  const body =
    await req.text();

  let event: Stripe.Event;

  try {
    event =
      await stripe.webhooks
        .constructEventAsync(
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
      {
        status: 400,
      },
    );
  }

  try {
    if (
      event.type ===
      "checkout.session.completed"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      const type =
        session.metadata?.type;

      const paymentIntent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null;

      /*
       * DONATION
       */
      if (type === "donation") {
        const donationId =
          session.metadata
            ?.donation_id;

        if (donationId) {
          const paid =
            session.payment_status ===
            "paid";

          const {
            data: donation,
            error,
          } = await supabaseAdmin
            .from("donations")
            .update({
              status:
                paid
                  ? "paid"
                  : "pending",

              stripe_payment_intent_id:
                paymentIntent,
            })
            .eq("id", donationId)
            .select("*")
            .single();

          if (error) {
            throw error;
          }

          if (paid) {
            await supabaseAdmin
              .from("donations")
              .update({
                email_last_attempt_at:
                  new Date().toISOString(),

                email_last_error: null,
              })
              .eq("id", donation.id);

            const delivery =
              await sendDonationPaidEmails(
                donation,
                {
                  sendCustomer:
                    !donation
                      .confirmation_email_sent_at,

                  sendTeam:
                    !donation
                      .team_email_sent_at,
                },
              );

            const update:
              Record<string, unknown> = {};

            const now =
              new Date().toISOString();

            if (
              delivery.customerSent
            ) {
              update.confirmation_email_sent_at =
                now;
            }

            if (
              delivery.teamSent
            ) {
              update.team_email_sent_at =
                now;
            }

            update.email_last_error =
              delivery.errors.length > 0
                ? delivery.errors.join(
                  " | ",
                )
                : null;

            await supabaseAdmin
              .from("donations")
              .update(update)
              .eq(
                "id",
                donation.id,
              );

            /*
             * Throwing here tells Stripe
             * processing did not completely
             * finish. Stripe can retry later.
             *
             * Successfully sent recipient
             * timestamps prevent duplicate
             * sends on the retry.
             */
            if (
              delivery.errors.length > 0
            ) {
              throw new Error(
                delivery.errors.join(
                  " | ",
                ),
              );
            }
          }
        }
      }

      /*
       * SHOP ORDER
       */
      if (type === "order") {
        const orderId =
          session.metadata
            ?.order_id;

        if (orderId) {
          const paid =
            session.payment_status ===
            "paid";

          const {
            data: order,
            error,
          } = await supabaseAdmin
            .from("orders")
            .update({
              payment_status:
                session.payment_status,

              status:
                paid
                  ? "paid"
                  : "pending",

              stripe_payment_intent_id:
                paymentIntent,
            })
            .eq("id", orderId)
            .select("*")
            .single();

          if (error) {
            throw error;
          }

          if (paid) {
            await supabaseAdmin
              .from("orders")
              .update({
                email_last_attempt_at:
                  new Date().toISOString(),

                email_last_error: null,
              })
              .eq("id", order.id);

            const delivery =
              await sendOrderPaidEmails(
                order,
                {
                  sendCustomer:
                    !order
                      .payment_confirmation_email_sent_at,

                  sendTeam:
                    !order
                      .payment_confirmation_team_email_sent_at,
                },
              );

            const update:
              Record<string, unknown> = {};

            const now =
              new Date().toISOString();

            if (
              delivery.customerSent
            ) {
              update.payment_confirmation_email_sent_at =
                now;
            }

            if (
              delivery.teamSent
            ) {
              update.payment_confirmation_team_email_sent_at =
                now;
            }

            update.email_last_error =
              delivery.errors.length > 0
                ? delivery.errors.join(
                  " | ",
                )
                : null;

            await supabaseAdmin
              .from("orders")
              .update(update)
              .eq("id", order.id);

            if (
              delivery.errors.length > 0
            ) {
              throw new Error(
                delivery.errors.join(
                  " | ",
                ),
              );
            }
          }
        }
      }
    }

    return Response.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Stripe webhook processing failed:",
      error,
    );

    return new Response(
      "Webhook processing failed",
      {
        status: 500,
      },
    );
  }
});
