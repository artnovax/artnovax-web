type Customer = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
};

type OrderItem = {
  product_id?: string;
  name?: string;
  unit_price?: number;
  price?: number;
  qty?: number;
  line_total?: number;
};

export type OrderForEmail = {
  id: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number | string;
  shipping: number | string;
  total: number | string;
  currency?: string | null;
  payment_method?: string | null;
  mpesa_receipt?: string | null;
};

export type DonationForEmail = {
  id: string;
  amount_kes: number;
  name?: string | null;
  email?: string | null;
  message?: string | null;
};

type DeliveryOptions = {
  sendCustomer?: boolean;
  sendTeam?: boolean;
};

export type DeliveryResult = {
  customerSent: boolean;
  teamSent: boolean;
  errors: string[];
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

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

function paymentLabel(method?: string | null): string {
  switch ((method || "").toLowerCase()) {
    case "card":
      return "Card";
    case "mpesa":
      return "M-Pesa";
    case "bank":
      return "Bank transfer";
    default:
      return method || "Payment";
  }
}

function shell(title: string, content: string): string {
  return `
<!doctype html>
<html>
  <body style="
    margin:0;
    padding:0;
    background:#FBF3E8;
    color:#2A1B1C;
    font-family:Inter,Arial,sans-serif;
  ">
    <div style="
      max-width:640px;
      margin:0 auto;
      padding:32px 20px;
    ">
      <div style="
        background:#ffffff;
        border:1px solid #E5D3BC;
        border-radius:20px;
        overflow:hidden;
      ">
        <div style="
          background:#5C1519;
          color:#FBF3E8;
          padding:24px 28px;
        ">
          <div style="
            font-size:24px;
            font-weight:700;
            letter-spacing:-0.02em;
          ">
            ArtNovaX
          </div>

          <div style="
            font-size:12px;
            margin-top:4px;
            opacity:.85;
          ">
            Where art heals, tech empowers, and minds transform.
          </div>
        </div>

        <div style="padding:28px;">
          <h1 style="
            margin:0 0 18px;
            color:#5C1519;
            font-size:26px;
            line-height:1.2;
          ">
            ${title}
          </h1>

          ${content}
        </div>
      </div>

      <div style="
        text-align:center;
        color:#6B5A55;
        font-size:11px;
        line-height:1.5;
        padding:18px;
      ">
        ArtNovaX Mental Health Foundation
      </div>
    </div>
  </body>
</html>
`;
}

function orderItems(order: OrderForEmail): string {
  const rows = (order.items || [])
    .map((item) => {
      const qty = Number(item.qty ?? 1);

      const lineTotal =
        item.line_total ??
        Number(item.unit_price ?? item.price ?? 0) * qty;

      return `
        <tr>
          <td style="
            padding:10px 0;
            border-bottom:1px solid #F1DFC7;
          ">
            ${escapeHtml(item.name || "Item")}
            <span style="color:#6B5A55;">
              × ${qty}
            </span>
          </td>

          <td style="
            padding:10px 0;
            text-align:right;
            border-bottom:1px solid #F1DFC7;
          ">
            ${money(lineTotal)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <table style="
      width:100%;
      border-collapse:collapse;
      font-size:14px;
      margin:20px 0;
    ">
      ${rows}

      <tr>
        <td style="padding-top:12px;color:#6B5A55;">
          Subtotal
        </td>
        <td style="
          padding-top:12px;
          text-align:right;
          color:#6B5A55;
        ">
          ${money(order.subtotal)}
        </td>
      </tr>

      <tr>
        <td style="padding-top:6px;color:#6B5A55;">
          Shipping
        </td>
        <td style="
          padding-top:6px;
          text-align:right;
          color:#6B5A55;
        ">
          ${Number(order.shipping) > 0
            ? money(order.shipping)
            : "Free"}
        </td>
      </tr>

      <tr>
        <td style="
          padding-top:12px;
          color:#5C1519;
          font-weight:700;
          font-size:16px;
        ">
          Total
        </td>
        <td style="
          padding-top:12px;
          text-align:right;
          color:#5C1519;
          font-weight:700;
          font-size:16px;
        ">
          ${money(order.total)}
        </td>
      </tr>
    </table>
  `;
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
}): Promise<string | null> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("FROM_EMAIL");

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
    }),
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      `Resend request failed (${response.status}): ${raw}`,
    );
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
}

export async function sendOrderReceivedEmails(
  order: OrderForEmail,
  options: DeliveryOptions = {},
): Promise<DeliveryResult> {
  const sendCustomer = options.sendCustomer !== false;
  const sendTeam = options.sendTeam !== false;

  const result: DeliveryResult = {
    customerSent: false,
    teamSent: false,
    errors: [],
  };

  const name =
    order.customer?.name?.trim() || "there";

  const customerEmail =
    order.customer?.email?.trim();

  const teamEmail =
    Deno.env.get("TEAM_EMAIL")?.trim();

  const orderNumber = shortId(order.id);

  const customerHtml = shell(
    "We received your order",
    `
      <p style="font-size:15px;line-height:1.7;">
        Hi ${escapeHtml(name)},
      </p>

      <p style="font-size:15px;line-height:1.7;">
        Thank you for supporting ArtNovaX.
        Your order
        <strong>#${orderNumber}</strong>
        has been received and is awaiting bank-transfer confirmation.
      </p>

      ${orderItems(order)}

      <p style="
        margin-top:22px;
        padding:16px;
        background:#FBF3E8;
        border-radius:12px;
        font-size:14px;
        line-height:1.6;
      ">
        Please complete your bank transfer using the
        payment instructions shown during checkout.
        We will confirm your payment once it has been received.
      </p>

      <p style="font-size:14px;color:#6B5A55;">
        Keep order ID
        <strong>${escapeHtml(order.id)}</strong>
        for your records.
      </p>
    `,
  );

  const teamHtml = shell(
    `New bank-transfer order #${orderNumber}`,
    `
      <p style="font-size:14px;line-height:1.7;">
        A new ArtNovaX shop order has been created.
      </p>

      <p style="font-size:14px;line-height:1.7;">
        <strong>Customer:</strong>
        ${escapeHtml(order.customer?.name)}
        <br />

        <strong>Email:</strong>
        ${escapeHtml(order.customer?.email)}
        <br />

        <strong>Order ID:</strong>
        ${escapeHtml(order.id)}
        <br />

        <strong>Payment:</strong>
        Bank transfer
      </p>

      ${orderItems(order)}
    `,
  );

  if (sendCustomer) {
    if (!customerEmail) {
      result.errors.push(
        "Order has no customer email address.",
      );
    } else {
      try {
        await sendEmail({
          to: customerEmail,
          subject:
            `ArtNovaX order received — #${orderNumber}`,
          html: customerHtml,
          idempotencyKey:
            `order-received-customer/${order.id}`,
        });

        result.customerSent = true;
      } catch (error) {
        result.errors.push(
          `Customer email: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
        );
      }
    }
  }

  if (sendTeam && teamEmail) {
    try {
      await sendEmail({
        to: teamEmail,
        subject:
          `[New order] Bank transfer #${orderNumber}`,
        html: teamHtml,
        idempotencyKey:
          `order-received-team/${order.id}`,
      });

      result.teamSent = true;
    } catch (error) {
      result.errors.push(
        `Team email: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  return result;
}

export async function sendOrderPaidEmails(
  order: OrderForEmail,
  options: DeliveryOptions = {},
): Promise<DeliveryResult> {
  const sendCustomer = options.sendCustomer !== false;
  const sendTeam = options.sendTeam !== false;

  const result: DeliveryResult = {
    customerSent: false,
    teamSent: false,
    errors: [],
  };

  const customerEmail =
    order.customer?.email?.trim();

  const teamEmail =
    Deno.env.get("TEAM_EMAIL")?.trim();

  const name =
    order.customer?.name?.trim() || "there";

  const orderNumber = shortId(order.id);

  const receipt =
    order.payment_method === "mpesa" &&
    order.mpesa_receipt
      ? `
        <p style="font-size:14px;color:#6B5A55;">
          M-Pesa receipt:
          <strong>
            ${escapeHtml(order.mpesa_receipt)}
          </strong>
        </p>
      `
      : "";

  const customerHtml = shell(
    "Payment confirmed",
    `
      <p style="font-size:15px;line-height:1.7;">
        Hi ${escapeHtml(name)},
      </p>

      <p style="font-size:15px;line-height:1.7;">
        Your payment for ArtNovaX order
        <strong>#${orderNumber}</strong>
        has been confirmed.
      </p>

      <p style="font-size:14px;color:#6B5A55;">
        Payment method:
        <strong>
          ${escapeHtml(paymentLabel(order.payment_method))}
        </strong>
      </p>

      ${receipt}

      ${orderItems(order)}

      <p style="font-size:15px;line-height:1.7;">
        Thank you for supporting our work.
      </p>

      <p style="font-size:14px;color:#6B5A55;">
        Order ID:
        <strong>${escapeHtml(order.id)}</strong>
      </p>
    `,
  );

  const teamHtml = shell(
    `Payment received — order #${orderNumber}`,
    `
      <p style="font-size:14px;line-height:1.7;">
        Payment has been confirmed for an ArtNovaX order.
      </p>

      <p style="font-size:14px;line-height:1.7;">
        <strong>Customer:</strong>
        ${escapeHtml(order.customer?.name)}
        <br />

        <strong>Email:</strong>
        ${escapeHtml(order.customer?.email)}
        <br />

        <strong>Order ID:</strong>
        ${escapeHtml(order.id)}
        <br />

        <strong>Payment:</strong>
        ${escapeHtml(paymentLabel(order.payment_method))}
        <br />

        ${
          order.mpesa_receipt
            ? `<strong>M-Pesa receipt:</strong>
               ${escapeHtml(order.mpesa_receipt)}
               <br />`
            : ""
        }
      </p>

      ${orderItems(order)}
    `,
  );

  if (sendCustomer) {
    if (!customerEmail) {
      result.errors.push(
        "Order has no customer email address.",
      );
    } else {
      try {
        await sendEmail({
          to: customerEmail,
          subject:
            `Payment confirmed — ArtNovaX order #${orderNumber}`,
          html: customerHtml,
          idempotencyKey:
            `order-paid-customer/${order.id}`,
        });

        result.customerSent = true;
      } catch (error) {
        result.errors.push(
          `Customer email: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
        );
      }
    }
  }

  if (sendTeam && teamEmail) {
    try {
      await sendEmail({
        to: teamEmail,
        subject:
          `[Paid order] #${orderNumber}`,
        html: teamHtml,
        idempotencyKey:
          `order-paid-team/${order.id}`,
      });

      result.teamSent = true;
    } catch (error) {
      result.errors.push(
        `Team email: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  return result;
}

export async function sendDonationPaidEmails(
  donation: DonationForEmail,
  options: DeliveryOptions = {},
): Promise<DeliveryResult> {
  const sendCustomer = options.sendCustomer !== false;
  const sendTeam = options.sendTeam !== false;

  const result: DeliveryResult = {
    customerSent: false,
    teamSent: false,
    errors: [],
  };

  const donorEmail =
    donation.email?.trim();

  const teamEmail =
    Deno.env.get("TEAM_EMAIL")?.trim();

  const donorName =
    donation.name?.trim() || "Friend of ArtNovaX";

  const customerHtml = shell(
    "Thank you for supporting ArtNovaX",
    `
      <p style="font-size:15px;line-height:1.7;">
        Hi ${escapeHtml(donorName)},
      </p>

      <p style="font-size:15px;line-height:1.7;">
        Thank you for your generous contribution of
        <strong>${money(donation.amount_kes)}</strong>.
      </p>

      <p style="font-size:15px;line-height:1.7;">
        Your support helps ArtNovaX continue creating
        spaces where art, mental wellbeing and thoughtful
        technology can come together.
      </p>

      <p style="
        margin-top:22px;
        color:#6B5A55;
        font-size:13px;
      ">
        Donation reference:
        ${escapeHtml(donation.id)}
      </p>
    `,
  );

  const teamHtml = shell(
    "New ArtNovaX donation",
    `
      <p style="font-size:14px;line-height:1.7;">
        A donation has been successfully paid.
      </p>

      <p style="font-size:14px;line-height:1.7;">
        <strong>Name:</strong>
        ${escapeHtml(donation.name || "Anonymous")}
        <br />

        <strong>Email:</strong>
        ${escapeHtml(donation.email || "Not provided")}
        <br />

        <strong>Amount:</strong>
        ${money(donation.amount_kes)}
        <br />

        <strong>Donation ID:</strong>
        ${escapeHtml(donation.id)}
      </p>

      ${
        donation.message
          ? `
            <div style="
              margin-top:18px;
              padding:16px;
              background:#FBF3E8;
              border-radius:12px;
              font-size:14px;
            ">
              ${escapeHtml(donation.message)}
            </div>
          `
          : ""
      }
    `,
  );

  if (sendCustomer && donorEmail) {
    try {
      await sendEmail({
        to: donorEmail,
        subject: "Thank you for supporting ArtNovaX",
        html: customerHtml,
        idempotencyKey:
          `donation-paid-customer/${donation.id}`,
      });

      result.customerSent = true;
    } catch (error) {
      result.errors.push(
        `Donor email: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  if (sendTeam && teamEmail) {
    try {
      await sendEmail({
        to: teamEmail,
        subject:
          `[Donation received] ${money(donation.amount_kes)}`,
        html: teamHtml,
        idempotencyKey:
          `donation-paid-team/${donation.id}`,
      });

      result.teamSent = true;
    } catch (error) {
      result.errors.push(
        `Team email: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  return result;
}

export function escapeEmailHtml(
  value: unknown,
): string {
  return escapeHtml(value);
}

export function renderTransactionalEmail(
  title: string,
  content: string,
): string {
  return shell(title, content);
}

export async function sendTransactionalEmail({
  to,
  subject,
  html,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}): Promise<string | null> {
  return await sendEmail({
    to,
    subject,
    html,
    idempotencyKey,
  });
}
