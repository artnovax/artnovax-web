import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import {
  sendOrderPaidEmails,
} from "../_shared/email.ts";

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseUrl =
  Deno.env.get("SUPABASE_URL")!;

const supabaseAdmin = createClient(
  supabaseUrl,
  secretKeys["default"],
);

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
    const authorization =
      req.headers.get("Authorization") || "";

    const token = authorization
      .replace(/^Bearer\s+/i, "")
      .trim();

    if (!token) {
      return Response.json(
        {
          error: "Admin authentication is required.",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    const {
      data: userData,
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return Response.json(
        {
          error: "Admin authentication is invalid or expired.",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    const {
      data: roleRow,
      error: roleError,
    } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .single();

    if (
      roleError ||
      roleRow?.role !== "admin"
    ) {
      return Response.json(
        {
          error:
            "Only ArtNovaX admins can confirm manual payments.",
        },
        {
          status: 403,
          headers: corsHeaders,
        },
      );
    }

    const { order_id } =
      await req.json();

    const orderId =
      String(order_id || "").trim();

    if (!orderId) {
      return Response.json(
        {
          error: "Order ID is required.",
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
          error: "Order not found.",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    if (
      !["mpesa", "bank"].includes(
        order.payment_method,
      )
    ) {
      return Response.json(
        {
          error:
            "Only manual M-Pesa or bank-transfer orders can be confirmed here.",
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
          already_paid: true,
          order_id: order.id,
        },
        {
          headers: corsHeaders,
        },
      );
    }

    if (
      order.payment_method === "mpesa" &&
      !order.manual_payment_reference
    ) {
      return Response.json(
        {
          error:
            "This M-Pesa order does not have a submitted transaction code yet.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const now =
      new Date().toISOString();

    const update:
      Record<string, unknown> = {
        payment_status: "paid",
        status: "paid",
        manual_payment_reference_status:
          "verified",
        manual_payment_verified_at:
          now,
        manual_payment_verified_by:
          userData.user.id,
      };

    if (
      order.payment_method === "mpesa" &&
      order.manual_payment_reference
    ) {
      // Once an admin has independently verified the incoming payment,
      // the submitted reference can become the trusted M-Pesa receipt
      // stored on the paid order.
      update.mpesa_receipt =
        order.manual_payment_reference;
    }

    const {
      data: paidOrder,
      error: updateError,
    } = await supabaseAdmin
      .from("orders")
      .update(update)
      .eq("id", order.id)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

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
        paidOrder,
        {
          sendCustomer:
            !paidOrder
              .payment_confirmation_email_sent_at,
          sendTeam:
            !paidOrder
              .payment_confirmation_team_email_sent_at,
        },
      );

    const emailUpdate:
      Record<string, unknown> = {};

    if (delivery.customerSent) {
      emailUpdate.payment_confirmation_email_sent_at =
        new Date().toISOString();
    }

    if (delivery.teamSent) {
      emailUpdate.payment_confirmation_team_email_sent_at =
        new Date().toISOString();
    }

    emailUpdate.email_last_error =
      delivery.errors.length > 0
        ? delivery.errors.join(" | ")
        : null;

    await supabaseAdmin
      .from("orders")
      .update(emailUpdate)
      .eq("id", order.id);

    if (delivery.errors.length > 0) {
      console.error(
        "Manual payment confirmation email errors:",
        delivery.errors,
      );
    }

    return Response.json(
      {
        ok: true,
        order_id: order.id,
        payment_status: "paid",
        reference:
          order.manual_payment_reference || null,
        email_errors:
          delivery.errors,
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error(
      "Manual payment confirmation error:",
      error,
    );

    return Response.json(
      {
        error:
          "Unable to confirm this payment.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
