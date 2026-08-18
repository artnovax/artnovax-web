const RESEND_API = "https://api.resend.com";

export type NewsletterIssueForEmail = {
  id: string;
  slug: string;
  title: string;
  subject?: string | null;
  preheader?: string | null;
  excerpt?: string | null;
  hero?: string | null;
  hero_alt_text?: string | null;
  body: string;
};

type ResendResponse = {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
};

const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export function escapeNewsletterHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const normalizeSiteUrl = (value: string): string =>
  value.trim().replace(/\/+$/, "");

export function renderNewsletterBody(body = ""): string {
  return body
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section) => {
      if (section.startsWith("### ")) {
        return `<h3 style="margin:28px 0 10px;color:#2A1B1C;font-size:21px;line-height:1.3;">${
          escapeNewsletterHtml(section.slice(4).trim())
        }</h3>`;
      }

      if (section.startsWith("## ")) {
        return `<h2 style="margin:34px 0 12px;color:#5C1519;font-size:26px;line-height:1.25;">${
          escapeNewsletterHtml(section.slice(3).trim())
        }</h2>`;
      }

      if (section.startsWith("> ")) {
        return `<blockquote style="margin:26px 0;padding:4px 0 4px 18px;border-left:4px solid #5C1519;color:#5C1519;font-family:Georgia,serif;font-size:20px;font-style:italic;line-height:1.6;">${
          escapeNewsletterHtml(section.slice(2).trim())
        }</blockquote>`;
      }

      return `<p style="margin:0 0 18px;color:#2A1B1C;font-size:15px;line-height:1.8;">${
        escapeNewsletterHtml(section).replaceAll("\n", "<br />")
      }</p>`;
    })
    .join("");
}

export function renderNewsletterEmail(
  issue: NewsletterIssueForEmail,
  siteUrl: string,
): string {
  const archiveUrl = `${normalizeSiteUrl(siteUrl)}/newsletters/${
    encodeURIComponent(issue.slug)
  }`;
  const preheader = issue.preheader || issue.excerpt || "";
  const hero = issue.hero
    ? `
      <img
        src="${escapeNewsletterHtml(issue.hero)}"
        alt="${escapeNewsletterHtml(issue.hero_alt_text || issue.title)}"
        style="display:block;width:100%;max-height:360px;object-fit:cover;"
      />
    `
    : "";

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#FBF3E8;color:#2A1B1C;font-family:Inter,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeNewsletterHtml(preheader)}
    </div>
    <div style="max-width:680px;margin:0 auto;padding:32px 18px;">
      <div style="overflow:hidden;background:#FFFFFF;border:1px solid #E5D3BC;border-radius:20px;">
        <div style="padding:24px 28px;background:#5C1519;color:#FBF3E8;">
          <div style="font-size:25px;font-weight:700;letter-spacing:-0.02em;">ArtNovaX</div>
          <div style="margin-top:4px;font-size:12px;opacity:.86;">
            Where art heals, tech empowers, and minds transform.
          </div>
        </div>
        ${hero}
        <div style="padding:30px 28px;">
          <div style="margin-bottom:8px;color:#5C1519;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">
            ArtNovaX Newsletter
          </div>
          <h1 style="margin:0 0 14px;color:#5C1519;font-family:Georgia,serif;font-size:32px;line-height:1.2;">
            ${escapeNewsletterHtml(issue.title)}
          </h1>
          ${
            issue.excerpt
              ? `<p style="margin:0 0 24px;color:#6B5A55;font-size:16px;line-height:1.7;">${escapeNewsletterHtml(issue.excerpt)}</p>`
              : ""
          }
          ${renderNewsletterBody(issue.body)}
          <p style="margin:28px 0 0;">
            <a href="${escapeNewsletterHtml(archiveUrl)}" style="display:inline-block;padding:11px 19px;border-radius:999px;background:#5C1519;color:#FBF3E8;text-decoration:none;font-size:14px;font-weight:700;">
              Read this issue online
            </a>
          </p>
        </div>
      </div>
      <div style="padding:18px;text-align:center;color:#6B5A55;font-size:11px;line-height:1.6;">
        You received this because you subscribed to ArtNovaX updates.<br />
        <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#5C1519;">Unsubscribe</a>
      </div>
    </div>
  </body>
</html>`;
}

async function resendRequest(
  apiKey: string,
  path: string,
  init: RequestInit,
  attempts = 3,
): Promise<ResendResponse> {
  let lastResponse: ResendResponse | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(`${RESEND_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    const raw = await response.text();
    let body: Record<string, unknown> = {};

    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = { message: raw };
    }

    lastResponse = { ok: response.ok, status: response.status, body };

    if (response.ok || (response.status !== 429 && response.status < 500)) {
      return lastResponse;
    }

    const retryAfter = Number(response.headers.get("retry-after") || 0);
    await pause(Math.max(retryAfter * 1000, 600 * (attempt + 1)));
  }

  return lastResponse || {
    ok: false,
    status: 500,
    body: { message: "Resend request failed before receiving a response." },
  };
}

const resendError = (result: ResendResponse): string =>
  String(
    result.body?.message ||
      result.body?.error ||
      `Resend request failed (${result.status}).`,
  );

export async function syncNewsletterContact({
  apiKey,
  segmentId,
  email,
  reactivate = false,
}: {
  apiKey: string;
  segmentId: string;
  email: string;
  reactivate?: boolean;
}): Promise<string | null> {
  const create = await resendRequest(apiKey, "/contacts", {
    method: "POST",
    body: JSON.stringify({
      email,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    }),
  });

  if (create.ok) {
    return typeof create.body.id === "string" ? create.body.id : null;
  }

  const encodedEmail = encodeURIComponent(email);

  if (reactivate) {
    const update = await resendRequest(apiKey, `/contacts/${encodedEmail}`, {
      method: "PATCH",
      body: JSON.stringify({ unsubscribed: false }),
    });

    if (!update.ok) {
      throw new Error(resendError(update));
    }
  }

  const addToSegment = await resendRequest(
    apiKey,
    `/contacts/${encodedEmail}/segments/${encodeURIComponent(segmentId)}`,
    { method: "POST", body: "{}" },
  );

  if (!addToSegment.ok && addToSegment.status !== 409) {
    throw new Error(
      `${resendError(create)} Contact segment sync also failed: ${
        resendError(addToSegment)
      }`,
    );
  }

  return null;
}

export async function createNewsletterBroadcast({
  apiKey,
  segmentId,
  from,
  issue,
  siteUrl,
}: {
  apiKey: string;
  segmentId: string;
  from: string;
  issue: NewsletterIssueForEmail;
  siteUrl: string;
}): Promise<string> {
  const result = await resendRequest(apiKey, "/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      segment_id: segmentId,
      from,
      subject: issue.subject || issue.title,
      name: `ArtNovaX — ${issue.title}`,
      html: renderNewsletterEmail(issue, siteUrl),
    }),
  });

  if (!result.ok || typeof result.body.id !== "string") {
    throw new Error(resendError(result));
  }

  return result.body.id;
}

export async function sendNewsletterBroadcast({
  apiKey,
  broadcastId,
}: {
  apiKey: string;
  broadcastId: string;
}): Promise<void> {
  const result = await resendRequest(
    apiKey,
    `/broadcasts/${encodeURIComponent(broadcastId)}/send`,
    { method: "POST", body: "{}" },
  );

  if (!result.ok) {
    const existing = await resendRequest(
      apiKey,
      `/broadcasts/${encodeURIComponent(broadcastId)}`,
      { method: "GET" },
      1,
    );
    const status = String(existing.body?.status || "").toLowerCase();

    if (existing.ok && ["queued", "sent", "scheduled"].includes(status)) {
      return;
    }

    throw new Error(resendError(result));
  }
}
