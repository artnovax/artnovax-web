import {
  sendDonationPaidEmails,
  sendOrderPaidEmails,
} from "./email.ts";
import type { PaystackTransaction } from "./paystack.ts";

async function sendOrderConfirmationIfNeeded(
  supabaseAdmin: any,
  order: any,
) {
  if (
    order.payment_confirmation_email_sent_at &&
    order.payment_confirmation_team_email_sent_at
  ) {
    return;
  }

  await supabaseAdmin
    .from("orders")
    .update({
      email_last_attempt_at: new Date().toISOString(),
      email_last_error: null,
    })
    .eq("id", order.id);

  const delivery = await sendOrderPaidEmails(order, {
    sendCustomer: !order.payment_confirmation_email_sent_at,
    sendTeam: !order.payment_confirmation_team_email_sent_at,
  });

  const update: Record<string, unknown> = {
    email_last_error:
      delivery.errors.length > 0
        ? delivery.errors.join(" | ")
        : null,
  };

  const now = new Date().toISOString();

  if (delivery.customerSent) {
    update.payment_confirmation_email_sent_at = now;
  }

  if (delivery.teamSent) {
    update.payment_confirmation_team_email_sent_at = now;
  }

  await supabaseAdmin
    .from("orders")
    .update(update)
    .eq("id", order.id);

  if (delivery.errors.length > 0) {
    console.error(
      "Paystack order payment email errors:",
      delivery.errors,
    );
  }
}

async function sendDonationConfirmationIfNeeded(
  supabaseAdmin: any,
  donation: any,
) {
  if (
    donation.confirmation_email_sent_at &&
    donation.team_email_sent_at
  ) {
    return;
  }

  await supabaseAdmin
    .from("donations")
    .update({
      email_last_attempt_at: new Date().toISOString(),
      email_last_error: null,
    })
    .eq("id", donation.id);

  const delivery = await sendDonationPaidEmails(donation, {
    sendCustomer: !donation.confirmation_email_sent_at,
    sendTeam: !donation.team_email_sent_at,
  });

  const update: Record<string, unknown> = {
    email_last_error:
      delivery.errors.length > 0
        ? delivery.errors.join(" | ")
        : null,
  };

  const now = new Date().toISOString();

  if (delivery.customerSent) {
    update.confirmation_email_sent_at = now;
  }

  if (delivery.teamSent) {
    update.team_email_sent_at = now;
  }

  await supabaseAdmin
    .from("donations")
    .update(update)
    .eq("id", donation.id);

  if (delivery.errors.length > 0) {
    console.error(
      "Paystack donation email errors:",
      delivery.errors,
    );
  }
}

export async function settlePaystackOrder(
  supabaseAdmin: any,
  order: any,
  transaction: PaystackTransaction,
) {
  let currentOrder = order;

  if (order.payment_status !== "paid") {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "paid",
        paystack_transaction_id:
          transaction.id != null ? String(transaction.id) : null,
        paystack_paid_at:
          transaction.paid_at || new Date().toISOString(),
      })
      .eq("id", order.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    currentOrder = data;
  }

  await sendOrderConfirmationIfNeeded(
    supabaseAdmin,
    currentOrder,
  );

  return currentOrder;
}

export async function settlePaystackDonation(
  supabaseAdmin: any,
  donation: any,
  transaction: PaystackTransaction,
) {
  let currentDonation = donation;

  if (donation.status !== "paid") {
    const { data, error } = await supabaseAdmin
      .from("donations")
      .update({
        status: "paid",
        paystack_transaction_id:
          transaction.id != null ? String(transaction.id) : null,
        paystack_paid_at:
          transaction.paid_at || new Date().toISOString(),
      })
      .eq("id", donation.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    currentDonation = data;
  }

  await sendDonationConfirmationIfNeeded(
    supabaseAdmin,
    currentDonation,
  );

  return currentDonation;
}
