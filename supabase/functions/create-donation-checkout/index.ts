import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import {
  initializePaystackTransaction,
} from "../_shared/paystack.ts";

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
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
    } = await req.json();

    const amount = Number(amount_kes);
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

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

    if (!normalizedEmail.includes("@")) {
      return Response.json(
        {
          error: "Please provide a valid email for your payment receipt.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    if (!success_url) {
      return Response.json(
        {
          error: "Missing Paystack callback URL.",
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
          email: normalizedEmail,
          message: message?.trim() || null,
          status: "pending",
        })
        .select("id")
        .single();

    if (donationError) {
      throw donationError;
    }

    const reference =
      `AX-DONATION-${String(donation.id).replaceAll("-", "")}`;

    const callbackUrl = new URL(success_url);
    callbackUrl.searchParams.set("donation_id", donation.id);

    const transaction = await initializePaystackTransaction({
      email: normalizedEmail,
      amountKes: amount,
      reference,
      callbackUrl: callbackUrl.toString(),
      channels: ["card"],
      metadata: {
        type: "donation",
        donation_id: donation.id,
      },
    });

    const { error: updateError } = await supabaseAdmin
      .from("donations")
      .update({
        paystack_reference: transaction.reference,
      })
      .eq("id", donation.id);

    if (updateError) {
      throw updateError;
    }

    return Response.json(
      {
        url: transaction.authorization_url,
        donation_id: donation.id,
        reference: transaction.reference,
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Donation checkout error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start donation checkout.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
