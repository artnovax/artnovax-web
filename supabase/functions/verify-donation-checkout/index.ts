import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import {
  parsePaystackMetadata,
  verifyPaystackTransaction,
} from "../_shared/paystack.ts";
import {
  settlePaystackDonation,
} from "../_shared/paystackSettlement.ts";

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
      donation_id,
      reference,
    } = await req.json();

    if (!donation_id || !reference) {
      return Response.json(
        {
          error: "Missing donation or Paystack reference.",
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
        .select("*")
        .eq("id", donation_id)
        .single();

    if (donationError || !donation) {
      return Response.json(
        { error: "Donation not found." },
        { status: 404, headers: corsHeaders },
      );
    }

    if (
      !donation.paystack_reference ||
      donation.paystack_reference !== reference
    ) {
      return Response.json(
        { error: "Paystack reference does not match this donation." },
        { status: 400, headers: corsHeaders },
      );
    }

    const transaction = await verifyPaystackTransaction(reference);
    const metadata = parsePaystackMetadata(transaction.metadata);

    if (
      metadata.type !== "donation" ||
      metadata.donation_id !== donation.id
    ) {
      return Response.json(
        { error: "Paystack transaction does not match this donation." },
        { status: 400, headers: corsHeaders },
      );
    }

    const expectedAmount =
      Math.round(Number(donation.amount_kes) * 100);

    if (
      transaction.currency !== "KES" ||
      Number(transaction.amount) !== expectedAmount
    ) {
      console.error("Paystack donation amount/currency mismatch", {
        donation_id: donation.id,
        expectedAmount,
        actualAmount: transaction.amount,
        currency: transaction.currency,
      });

      return Response.json(
        { error: "Paystack payment amount does not match this donation." },
        { status: 400, headers: corsHeaders },
      );
    }

    if (transaction.status !== "success") {
      return Response.json(
        {
          paid: false,
          status: transaction.status || "pending",
        },
        { headers: corsHeaders },
      );
    }

    await settlePaystackDonation(
      supabaseAdmin,
      donation,
      transaction,
    );

    return Response.json(
      {
        paid: true,
        status: "success",
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("Donation verification error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify donation payment.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
