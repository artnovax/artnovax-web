import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys["default"],
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json(
        { error: "Missing order ID." },
        { status: 400, headers: corsHeaders },
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id,status,payment_status,mpesa_receipt,mpesa_result_code,mpesa_result_description",
      )
      .eq("id", order_id)
      .single();

    if (error || !order) {
      return Response.json(
        { error: "Order not found." },
        { status: 404, headers: corsHeaders },
      );
    }

    return Response.json(
      {
        order_id: order.id,
        status: order.status,
        payment_status: order.payment_status,
        paid: order.payment_status === "paid",
        failed: order.payment_status === "failed",
        receipt: order.mpesa_receipt,
        result_code: order.mpesa_result_code,
        message: order.mpesa_result_description,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("M-Pesa status error:", error);

    return Response.json(
      { error: "Unable to check payment status." },
      { status: 500, headers: corsHeaders },
    );
  }
});
