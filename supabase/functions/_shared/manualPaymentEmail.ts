const RESEND_ENDPOINT = "https://api.resend.com/emails";

const MPESA_PAYBILL = "522533";
const MPESA_ACCOUNT_NUMBER = "8109391";
const MPESA_BUSINESS_NAME = "ARTNOVAX FOUNDATION";

type Customer = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type OrderItem = {
  name?: string | null;
  qty?: number | null;
  line_total?: number | string | null;
  unit_price?: number | string | null;
};

export type ManualPaymentOrder = {
  id: string;
  customer: Customer;
  items?: OrderItem[] | null;
  subtotal?: number | string | null;
  shipping?: number | string | null;
  total: number | string;
  payment_method?: string | null;
};

type DeliveryResult = {
  customerSent: boolean;
  teamSent: boolean;
  errors: string[];
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function shell(title: string, content: string): string {
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#FBF3E8;color:#2A1B1C;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #E5D3BC;border-radius:20px;overflow:hidden;">
        <div style="background:#5C1519;color:#FBF3E8;padding:24px 28px;">
          <div style="font-size:24px;font-weight:700;letter-spacing:-0.02em;">ArtNovaX</div>
          <div style="font-size:12px;margin-top:4px;opacity:.85;">Where art heals, tech empowers, and minds transform.</div>
        </div>
        <div style="padding:28px;">
          <h1 style="margin:0 0 18px;color:#5C1519;font-size:26px;line-height:1.2;">${title}</h1>
          ${content}
        </div>
      </div>
      <div style="text-align:center;color:#6B5A55;font-size:11px;line-height:1.5;padding:18px;">ArtNovaX Mental Health Foundation</div>
    </div>
  </body>
</html>`;
}

function orderItems(order: ManualPaymentOrder): string {
  const rows = (order.items || [])
    .map((item) => {
      const qty = Number(item.qty ?? 1);
      const lineTotal =
        item.line_total ?? Number(item.unit_price ?? 0) * qty;

      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #F1DFC7;">
            ${escapeHtml(item.name || "Item")}
            <span style="color:#6B5A55;">× ${qty}</span>
          </td>
          <td style="padding:10px 0;text-align:right;border-bottom:1px solid #F1DFC7;">${money(lineTotal)}</td>
        </tr>`;
    })
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;">
      ${rows}
      <tr>
        <td style="padding-top:12px;color:#6B5A55;">Subtotal</td>
        <td style="padding-top:12px;text-align:right;color:#6B5A55;">${money(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding-top:6px;color:#6B5A55;">Shipping</td>
        <td style="padding-top:6px;text-align:right;color:#6B5A55;">${Number(order.shipping) > 0 ? money(order.shipping) : "Free"}</td>
      </tr>
      <tr>
        <td style="padding-top:12px;color:#5C1519;font-weight:700;font-size:16px;">Total</td>
        <td style="padding-top:12px;text-align:right;color:#5C1519;font-weight:700;font-size:16px;">${money(order.total)}</td>
      </tr>
    </table>`;
}

async function sendEmail({
  to,
  subject,
  html,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("FROM_EMAIL");
  const replyTo = Deno.env.get("REPLY_TO_EMAIL")?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!from) {
    throw new Error("FROM_EMAIL is not configured.");
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${raw}`);
  }
}

export async function sendMpesaOrderReceivedEmails(
  order: ManualPaymentOrder,
): Promise<DeliveryResult> {
  const result: DeliveryResult = {
    customerSent: false,
    teamSent: false,
    errors: [],
  };

  const customerEmail = order.customer?.email?.trim();
  const teamEmail = Deno.env.get("TEAM_EMAIL")?.trim();
  const name = order.customer?.name?.trim() || "there";
  const orderNumber = shortId(order.id);

  const customerHtml = shell(
    "Complete your M-Pesa payment",
    `
      <p style="font-size:15px;line-height:1.7;">Hi ${escapeHtml(name)},</p>
      <p style="font-size:15px;line-height:1.7;">
        Your ArtNovaX order <strong>#${orderNumber}</strong> has been created and is awaiting payment verification.
      </p>
      ${orderItems(order)}
      <div style="margin-top:22px;padding:18px;background:#FBF3E8;border-radius:12px;font-size:14px;line-height:1.7;">
        <strong style="color:#5C1519;">M-Pesa Paybill instructions</strong><br />
        Paybill: <strong>${MPESA_PAYBILL}</strong><br />
        Account number: <strong>${MPESA_ACCOUNT_NUMBER}</strong><br />
        Amount: <strong>${money(order.total)}</strong><br />
        Receiving business: <strong>${MPESA_BUSINESS_NAME}</strong>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#6B5A55;">
        After paying, submit the M-Pesa transaction code on the checkout confirmation page. If you have already left that page, reply to this email with your Order ID and transaction code. We verify the incoming payment before marking the order paid.
      </p>
      <p style="font-size:13px;line-height:1.6;color:#6B5A55;">
        ArtNovaX will never ask you to enter your M-Pesa PIN on our website or by email.
      </p>`,
  );

  const teamHtml = shell(
    `New M-Pesa Paybill order #${orderNumber}`,
    `
      <p style="font-size:14px;line-height:1.7;">A new manual M-Pesa order has been created and is still unpaid.</p>
      <p style="font-size:14px;line-height:1.7;">
        <strong>Customer:</strong> ${escapeHtml(order.customer?.name)}<br />
        <strong>Email:</strong> ${escapeHtml(order.customer?.email)}<br />
        <strong>Phone:</strong> ${escapeHtml(order.customer?.phone)}<br />
        <strong>Order ID:</strong> ${escapeHtml(order.id)}<br />
        <strong>Total:</strong> ${money(order.total)}
      </p>
      ${orderItems(order)}
      <p style="font-size:13px;color:#6B5A55;line-height:1.6;">
        Do not fulfil this order until the incoming Paybill payment has been independently verified.
      </p>`,
  );

  if (customerEmail) {
    try {
      await sendEmail({
        to: customerEmail,
        subject: `ArtNovaX M-Pesa payment instructions — #${orderNumber}`,
        html: customerHtml,
        idempotencyKey: `mpesa-order-received-customer/${order.id}`,
      });
      result.customerSent = true;
    } catch (error) {
      result.errors.push(
        `Customer email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } else {
    result.errors.push("Order has no customer email address.");
  }

  if (teamEmail) {
    try {
      await sendEmail({
        to: teamEmail,
        subject: `[New M-Pesa order] #${orderNumber}`,
        html: teamHtml,
        idempotencyKey: `mpesa-order-received-team/${order.id}`,
      });
      result.teamSent = true;
    } catch (error) {
      result.errors.push(
        `Team email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return result;
}

export async function sendManualPaymentReferenceEmails(
  order: ManualPaymentOrder,
  reference: string,
): Promise<DeliveryResult> {
  const result: DeliveryResult = {
    customerSent: false,
    teamSent: false,
    errors: [],
  };

  const customerEmail = order.customer?.email?.trim();
  const teamEmail = Deno.env.get("TEAM_EMAIL")?.trim();
  const name = order.customer?.name?.trim() || "there";
  const orderNumber = shortId(order.id);

  const customerHtml = shell(
    "Payment reference received",
    `
      <p style="font-size:15px;line-height:1.7;">Hi ${escapeHtml(name)},</p>
      <p style="font-size:15px;line-height:1.7;">
        We received the M-Pesa transaction code you submitted for order <strong>#${orderNumber}</strong>.
      </p>
      <div style="margin:18px 0;padding:16px;background:#FBF3E8;border-radius:12px;font-size:14px;line-height:1.6;">
        Submitted reference: <strong>${escapeHtml(reference)}</strong>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#6B5A55;">
        This is not yet a payment confirmation. Our team will compare the reference and amount against the ArtNovaX receiving account. We will only treat the order as paid after that verification.
      </p>`,
  );

  const teamHtml = shell(
    `Verify M-Pesa payment — order #${orderNumber}`,
    `
      <p style="font-size:14px;line-height:1.7;">
        A customer submitted an M-Pesa transaction code. Verify it independently against the KCB/M-Pesa receiving account before marking the order paid.
      </p>
      <p style="font-size:14px;line-height:1.7;">
        <strong>Order ID:</strong> ${escapeHtml(order.id)}<br />
        <strong>Customer:</strong> ${escapeHtml(order.customer?.name)}<br />
        <strong>Email:</strong> ${escapeHtml(order.customer?.email)}<br />
        <strong>Phone:</strong> ${escapeHtml(order.customer?.phone)}<br />
        <strong>Expected amount:</strong> ${money(order.total)}<br />
        <strong>Submitted reference:</strong> ${escapeHtml(reference)}
      </p>
      <p style="font-size:13px;color:#6B5A55;line-height:1.6;">
        A customer-submitted reference is evidence to investigate, not proof of payment.
      </p>`,
  );

  if (customerEmail) {
    try {
      await sendEmail({
        to: customerEmail,
        subject: `M-Pesa reference received — ArtNovaX order #${orderNumber}`,
        html: customerHtml,
        idempotencyKey: `manual-reference-customer/${order.id}/${reference}`,
      });
      result.customerSent = true;
    } catch (error) {
      result.errors.push(
        `Customer email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (teamEmail) {
    try {
      await sendEmail({
        to: teamEmail,
        subject: `[Verify M-Pesa] Order #${orderNumber}`,
        html: teamHtml,
        idempotencyKey: `manual-reference-team/${order.id}/${reference}`,
      });
      result.teamSent = true;
    } catch (error) {
      result.errors.push(
        `Team email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return result;
}
