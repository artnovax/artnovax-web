import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  escapeEmailHtml,
  renderTransactionalEmail,
  sendTransactionalEmail,
} from "../_shared/email.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

function serviceRoleKey(): string {
  const direct = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (direct) return direct;

  const raw = Deno.env.get("SUPABASE_SECRET_KEYS")?.trim();
  if (!raw) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEYS is required.",
    );
  }

  const parsed = JSON.parse(raw);
  const key = String(parsed?.default || "").trim();
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEYS does not contain a default key.");
  }
  return key;
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey());

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: corsHeaders });

const clean = (value: unknown): string => String(value ?? "").trim();

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

type StaffUser = {
  id: string;
  email: string;
};

type Registration = {
  id: string;
  name: string;
  email: string;
  status: string;
};

type EventRecord = {
  id: string;
  title: string;
  status: string;
  starts_at: string | null;
  date_text: string | null;
  timezone: string | null;
  location: string | null;
};

async function requireEventEmailAdmin(req: Request): Promise<StaffUser> {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    throw new HttpError("Administrator sign-in is required.", 401);
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    throw new HttpError(
      "Your administrator session is invalid or has expired.",
      401,
    );
  }

  const { data: allowed, error: permissionError } = await supabaseAdmin.rpc(
    "user_has_site_permission",
    {
      p_user_id: userData.user.id,
      p_permission: "event_emails.send",
    },
  );

  if (permissionError || allowed !== true) {
    throw new HttpError(
      "Administrator permission is required to email event registrants.",
      403,
    );
  }

  return {
    id: userData.user.id,
    email: userData.user.email || "ArtNovaX administrator",
  };
}

function validUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function bodyTextToHtml(bodyText: string): string {
  return bodyText
    .split(/\n{2,}/)
    .map((paragraph) => {
      const escaped = escapeEmailHtml(paragraph).replaceAll("\n", "<br />");
      return `<p style="font-size:15px;line-height:1.7;">${escaped}</p>`;
    })
    .join("\n");
}

function firstName(name: string): string {
  return clean(name).split(/\s+/)[0] || "there";
}

function formatEventDate(event: EventRecord): string {
  if (!event.starts_at) return clean(event.date_text) || "Date to be confirmed";

  try {
    return new Intl.DateTimeFormat("en-KE", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: clean(event.timezone) || "Africa/Nairobi",
    }).format(new Date(event.starts_at));
  } catch {
    return clean(event.date_text) || event.starts_at;
  }
}

function personalizeTemplate(
  value: string,
  registration: Registration,
  event: EventRecord,
): string {
  const replacements: Record<string, string> = {
    "{{first_name}}": firstName(registration.name),
    "{{full_name}}": clean(registration.name) || "there",
    "{{event_title}}": clean(event.title),
    "{{event_date}}": formatEventDate(event),
    "{{event_location}}": clean(event.location) || "Location to be confirmed",
  };

  let rendered = value;
  for (const [token, replacement] of Object.entries(replacements)) {
    rendered = rendered.replaceAll(token, replacement);
  }
  return rendered;
}

async function saveDelivery({
  campaignId,
  eventId,
  registration,
  status,
  resendEmailId = null,
  errorMessage = null,
}: {
  campaignId: string;
  eventId: string;
  registration: Registration;
  status: "sent" | "failed";
  resendEmailId?: string | null;
  errorMessage?: string | null;
}) {
  const { error } = await supabaseAdmin.from("event_email_deliveries").upsert(
    {
      campaign_id: campaignId,
      event_id: eventId,
      registration_id: registration.id,
      recipient_name: registration.name,
      recipient_email: registration.email,
      delivery_status: status,
      resend_email_id: resendEmailId,
      error_message: errorMessage,
      sent_at: status === "sent" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "campaign_id,registration_id" },
  );

  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  let staff: StaffUser;

  try {
    staff = await requireEventEmailAdmin(req);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 401;
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Administrator authentication failed.",
      },
      status,
    );
  }

  try {
    const body = await req.json();
    const eventId = clean(body?.event_id);
    const subject = clean(body?.subject);
    const bodyText = clean(body?.body_text);
    const requestId = clean(body?.request_id) || crypto.randomUUID();

    const registrationIds = Array.from(
      new Set(
        (Array.isArray(body?.registration_ids) ? body.registration_ids : [])
          .map(clean)
          .filter(Boolean),
      ),
    );

    if (!validUuid(eventId)) {
      return json({ error: "A valid event ID is required." }, 400);
    }

    if (registrationIds.length === 0) {
      return json({ error: "Select at least one registrant." }, 400);
    }

    if (registrationIds.length > 500) {
      return json(
        { error: "A single event email can include at most 500 recipients." },
        400,
      );
    }

    if (registrationIds.some((id) => !validUuid(id))) {
      return json({ error: "One or more registration IDs are invalid." }, 400);
    }

    if (!subject || subject.length > 200) {
      return json(
        { error: "Email subject must be between 1 and 200 characters." },
        400,
      );
    }

    if (!bodyText || bodyText.length > 12000) {
      return json(
        { error: "Email message must be between 1 and 12,000 characters." },
        400,
      );
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id,title,status,starts_at,date_text,timezone,location")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) {
      return json({ error: "Event not found." }, 404);
    }

    const { data: existingCampaign, error: existingError } = await supabaseAdmin
      .from("event_email_campaigns")
      .select("*")
      .eq("event_id", eventId)
      .eq("request_id", requestId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (
      existingCampaign &&
      ["sent", "partial", "failed"].includes(existingCampaign.status)
    ) {
      return json({
        ok: true,
        already_processed: true,
        campaign_id: existingCampaign.id,
        sent: existingCampaign.sent_count || 0,
        failed: existingCampaign.failed_count || 0,
        skipped: existingCampaign.skipped_count || 0,
      });
    }

    const { data: registrations, error: registrationError } = await supabaseAdmin
      .from("event_registrations")
      .select("id,name,email,status")
      .eq("event_id", eventId)
      .eq("status", "confirmed")
      .not("email", "is", null)
      .in("id", registrationIds);

    if (registrationError) throw registrationError;

    const eligible = (registrations || []).filter(
      (registration) => clean(registration.email).length > 0,
    ) as Registration[];

    const skipped = registrationIds.length - eligible.length;

    let campaign = existingCampaign;

    if (!campaign) {
      const { data: created, error: campaignError } = await supabaseAdmin
        .from("event_email_campaigns")
        .insert({
          event_id: eventId,
          request_id: requestId,
          subject,
          body_text: bodyText,
          created_by: staff.id,
          created_by_email: staff.email,
          requested_recipient_count: registrationIds.length,
          eligible_recipient_count: eligible.length,
          skipped_count: skipped,
          status: "sending",
        })
        .select()
        .single();

      if (campaignError) throw campaignError;
      campaign = created;
    }

    if (eligible.length === 0) {
      await supabaseAdmin
        .from("event_email_campaigns")
        .update({
          status: "failed",
          sent_count: 0,
          failed_count: 0,
          skipped_count: skipped,
          completed_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);

      return json(
        {
          error:
            "None of the selected registrations are currently confirmed with an email address.",
          campaign_id: campaign.id,
          sent: 0,
          failed: 0,
          skipped,
        },
        409,
      );
    }

    let sent = 0;
    let failed = 0;

    // Send in small batches. Each registrant receives a separate Resend request,
    // which keeps recipient addresses private and allows per-recipient auditing.
    const batchSize = 6;

    for (let offset = 0; offset < eligible.length; offset += batchSize) {
      const batch = eligible.slice(offset, offset + batchSize);

      const results = await Promise.all(
        batch.map(async (registration) => {
          const personalizedSubject = personalizeTemplate(
            subject,
            registration,
            event as EventRecord,
          );
          const personalizedBody = personalizeTemplate(
            bodyText,
            registration,
            event as EventRecord,
          );
          const html = renderTransactionalEmail(
            personalizedSubject,
            bodyTextToHtml(personalizedBody),
          );

          try {
            const resendEmailId = await sendTransactionalEmail({
              to: registration.email,
              subject: personalizedSubject,
              html,
              idempotencyKey: `event-registrant-email/${campaign.id}/${registration.id}`,
            });

            await saveDelivery({
              campaignId: campaign.id,
              eventId,
              registration,
              status: "sent",
              resendEmailId,
            });

            await supabaseAdmin
              .from("event_registrations")
              .update({
                email_last_attempt_at: new Date().toISOString(),
                email_last_error: null,
              })
              .eq("id", registration.id);

            return { ok: true };
          } catch (sendError) {
            const message =
              sendError instanceof Error ? sendError.message : String(sendError);

            console.error(
              `Event email delivery failed for registration ${registration.id}:`,
              sendError,
            );

            try {
              await saveDelivery({
                campaignId: campaign.id,
                eventId,
                registration,
                status: "failed",
                errorMessage: message,
              });
            } catch (deliveryLogError) {
              console.error("Unable to persist failed delivery log:", deliveryLogError);
            }

            await supabaseAdmin
              .from("event_registrations")
              .update({
                email_last_attempt_at: new Date().toISOString(),
                email_last_error: message,
              })
              .eq("id", registration.id);

            return { ok: false };
          }
        }),
      );

      sent += results.filter((result) => result.ok).length;
      failed += results.filter((result) => !result.ok).length;
    }

    const status =
      failed === 0 ? "sent" : sent === 0 ? "failed" : "partial";

    const { error: finishError } = await supabaseAdmin
      .from("event_email_campaigns")
      .update({
        status,
        sent_count: sent,
        failed_count: failed,
        skipped_count: skipped,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    if (finishError) throw finishError;

    return json({
      ok: failed === 0,
      campaign_id: campaign.id,
      event_id: event.id,
      event_title: event.title,
      event_status: event.status,
      requested: registrationIds.length,
      eligible: eligible.length,
      sent,
      failed,
      skipped,
      status,
    });
  } catch (error) {
    console.error("Event registrant email failed:", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not send the event registrant email.",
      },
      500,
    );
  }
});
