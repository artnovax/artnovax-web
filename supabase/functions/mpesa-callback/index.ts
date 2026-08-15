import { createClient } from "@supabase/supabase-js";

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys["default"],
);

type CallbackItem = {
  Name?: string;
  Value?: string | number;
};

function metadataValue(
  items: CallbackItem[],
  name: string,
): string | number | null {
  return items.find((item) => item.Name === name)?.Value ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    const callback = payload?.Body?.stkCallback;

    if (!callback?.CheckoutRequestID) {
      console.error("Invalid M-Pesa callback:", payload);
      return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const checkoutRequestId = String(callback.CheckoutRequestID);
    const resultCode = Number(callback.ResultCode);
    const resultDescription = String(
      callback.ResultDesc || "",
    );

    const items: CallbackItem[] =
      callback.CallbackMetadata?.Item || [];

    const receipt =
      metadataValue(items, "MpesaReceiptNumber");
    const phone =
      metadataValue(items, "PhoneNumber");

    const paid = resultCode === 0;

    const update: Record<string, unknown> = {
      mpesa_result_code: resultCode,
      mpesa_result_description: resultDescription,
      mpesa_callback_received_at: new Date().toISOString(),
      payment_status: paid ? "paid" : "failed",
      status: paid ? "paid" : "payment_failed",
    };

    if (receipt != null) {
      update.mpesa_receipt = String(receipt);
    }

    if (phone != null) {
      update.mpesa_phone = String(phone);
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update(update)
      .eq("mpesa_checkout_request_id", checkoutRequestId);

    if (error) {
      console.error("M-Pesa callback DB update failed:", error);
      // A non-2xx response allows the provider to treat this as unsuccessful.
      return new Response("Database update failed", { status: 500 });
    }

    return Response.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    console.error("M-Pesa callback processing error:", error);
    return new Response("Callback processing failed", { status: 500 });
  }
});
