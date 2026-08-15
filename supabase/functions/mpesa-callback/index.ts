import { createClient } from "@supabase/supabase-js";
import {
  sendOrderPaidEmails,
} from "../_shared/email.ts";

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
  return (
    items.find(
      (item) =>
        item.Name === name,
    )?.Value ?? null
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      "Method not allowed",
      {
        status: 405,
      },
    );
  }

  try {
    const payload =
      await req.json();

    const callback =
      payload?.Body
        ?.stkCallback;

    if (
      !callback
        ?.CheckoutRequestID
    ) {
      console.error(
        "Invalid M-Pesa callback:",
        payload,
      );

      return Response.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    const checkoutRequestId =
      String(
        callback.CheckoutRequestID,
      );

    const resultCode =
      Number(
        callback.ResultCode,
      );

    const resultDescription =
      String(
        callback.ResultDesc ||
          "",
      );

    const items:
      CallbackItem[] =
        callback
          .CallbackMetadata
          ?.Item || [];

    const receipt =
      metadataValue(
        items,
        "MpesaReceiptNumber",
      );

    const phone =
      metadataValue(
        items,
        "PhoneNumber",
      );

    const paid =
      resultCode === 0;

    const update:
      Record<string, unknown> = {
        mpesa_result_code:
          resultCode,

        mpesa_result_description:
          resultDescription,

        mpesa_callback_received_at:
          new Date().toISOString(),

        payment_status:
          paid
            ? "paid"
            : "failed",

        status:
          paid
            ? "paid"
            : "payment_failed",
      };

    if (receipt != null) {
      update.mpesa_receipt =
        String(receipt);
    }

    if (phone != null) {
      update.mpesa_phone =
        String(phone);
    }

    const {
      data: order,
      error,
    } = await supabaseAdmin
      .from("orders")
      .update(update)
      .eq(
        "mpesa_checkout_request_id",
        checkoutRequestId,
      )
      .select("*")
      .single();

    if (error) {
      console.error(
        "M-Pesa callback DB update failed:",
        error,
      );

      return new Response(
        "Database update failed",
        {
          status: 500,
        },
      );
    }

    /*
     * Only a successful Daraja callback
     * sends the payment-confirmation email.
     */
    if (paid && order) {
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

      const emailUpdate:
        Record<string, unknown> = {};

      const now =
        new Date().toISOString();

      if (
        delivery.customerSent
      ) {
        emailUpdate.payment_confirmation_email_sent_at =
          now;
      }

      if (
        delivery.teamSent
      ) {
        emailUpdate.payment_confirmation_team_email_sent_at =
          now;
      }

      emailUpdate.email_last_error =
        delivery.errors.length > 0
          ? delivery.errors.join(
            " | ",
          )
          : null;

      await supabaseAdmin
        .from("orders")
        .update(emailUpdate)
        .eq("id", order.id);

      /*
       * Email failure must not undo or
       * invalidate a successful M-Pesa
       * payment callback.
       *
       * Keep the failed email state in
       * Supabase for retry/debugging.
       */
      if (
        delivery.errors.length > 0
      ) {
        console.error(
          "M-Pesa payment email errors:",
          delivery.errors,
        );
      }
    }

    return Response.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    console.error(
      "M-Pesa callback processing error:",
      error,
    );

    return new Response(
      "Callback processing failed",
      {
        status: 500,
      },
    );
  }
});
