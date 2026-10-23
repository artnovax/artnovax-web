import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  type EmailAttachment,
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

const clean = (value: unknown): string => String(value ?? "").trim();

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: corsHeaders });

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

type EventRecord = {
  id: string;
  slug: string | null;
  title: string;
  status: string;
  date_text: string | null;
  starts_at: string | null;
  ends_at: string | null;
  duration_minutes: number | null;
  timezone: string | null;
  location: string | null;
  body: string | null;
  capacity: number | null;
  waitlist_open: boolean;
};

type Registration = {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  status: string;
  promoted_from_waitlist_at: string | null;
  waitlist_promotion_email_sent_at: string | null;
};

function validUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function requireEventOperator(req: Request): Promise<StaffUser> {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    throw new HttpError("Staff sign-in is required.", 401);
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    throw new HttpError("Your staff session is invalid or has expired.", 401);
  }

  const { data: allowed, error: permissionError } = await supabaseAdmin.rpc(
    "user_has_site_permission",
    {
      p_user_id: userData.user.id,
      p_permission: "events.operations",
    },
  );

  if (permissionError || allowed !== true) {
    throw new HttpError(
      "Event operations permission is required to manage the waitlist.",
      403,
    );
  }

  return {
    id: userData.user.id,
    email: userData.user.email || "ArtNovaX staff",
  };
}

function eventWhen(event: EventRecord): string {
  if (!event.starts_at) {
    return event.date_text || "Date to be confirmed";
  }

  try {
    return new Intl.DateTimeFormat("en-KE", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: event.timezone || "Africa/Nairobi",
    }).format(new Date(event.starts_at));
  } catch {
    return event.date_text || event.starts_at;
  }
}

function eventCalendarDetails(event: EventRecord) {
  if (!event.starts_at) return null;

  const start = new Date(event.starts_at);
  if (Number.isNaN(start.getTime())) return null;

  const end = event.ends_at
    ? new Date(event.ends_at)
    : new Date(
        start.getTime() + (event.duration_minutes || 180) * 60 * 1000,
      );

  const stamp = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title || "ArtNovaX Event",
    dates: `${stamp(start)}/${stamp(end)}`,
    location: event.location || "",
    details: `${event.body || ""}\n\nRegistered via ArtNovaX`,
  });

  return {
    start,
    end,
    googleUrl: `https://calendar.google.com/calendar/render?${params.toString()}`,
  };
}

const escapeIcs = (value: unknown): string =>
  String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("\r\n", "\\n")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function eventCalendarAttachment(
  event: EventRecord,
  registration: Registration,
): EmailAttachment | null {
  const calendar = eventCalendarDetails(event);
  if (!calendar) return null;

  const stamp = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ArtNovaX//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(registration.id)}@artnovax.org`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(calendar.start)}`,
    `DTEND:${stamp(calendar.end)}`,
    `SUMMARY:${escapeIcs(event.title || "ArtNovaX Event")}`,
    `DESCRIPTION:${escapeIcs(event.body || "Registered via ArtNovaX")}`,
    `LOCATION:${escapeIcs(event.location || "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  const fileSlug = String(event.slug || event.id || "event")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "event";

  return {
    filename: `artnovax-${fileSlug}.ics`,
    content: base64Utf8(ics),
  };
}

async function loadEvent(eventId: string): Promise<EventRecord> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(
      "id,slug,title,status,date_text,starts_at,ends_at,duration_minutes,timezone,location,body,capacity,waitlist_open",
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new HttpError("Event not found.", 404);
  return data as EventRecord;
}

function assertEventCanBeManaged(event: EventRecord) {
  if (
    event.status === "past" ||
    (event.starts_at && new Date(event.starts_at).getTime() <= Date.now())
  ) {
    throw new HttpError(
      "The waitlist cannot be changed after the event has started.",
      409,
    );
  }
}

async function sendPromotionEmail(
  event: EventRecord,
  registration: Registration,
): Promise<{ ok: boolean; error?: string }> {
  if (!clean(registration.email)) {
    return { ok: false, error: "Registration has no email address." };
  }

  const calendar = eventCalendarDetails(event);
  const attachment = eventCalendarAttachment(event, registration);

  const html = renderTransactionalEmail(
    "Your place is confirmed",
    `
      <p style="font-size:15px;line-height:1.7;">
        Hi ${escapeEmailHtml(registration.name || "there")},
      </p>

      <p style="font-size:15px;line-height:1.7;">
        Good news — a place opened up for
        <strong>${escapeEmailHtml(event.title)}</strong>
        and you have been moved from the waitlist to the confirmed guest list.
      </p>

      <p style="font-size:14px;line-height:1.7;">
        <strong>When:</strong>
        ${escapeEmailHtml(eventWhen(event))}
        <br />
        <strong>Where:</strong>
        ${escapeEmailHtml(event.location || "Location to be confirmed")}
      </p>

      ${
        calendar
          ? `
            <p style="margin:22px 0 12px;">
              <a
                href="${escapeEmailHtml(calendar.googleUrl)}"
                style="display:inline-block;padding:11px 18px;border-radius:999px;background:#5C1519;color:#FBF3E8;text-decoration:none;font-size:14px;font-weight:700;"
              >
                Add to Google Calendar
              </a>
            </p>
            <p style="font-size:13px;line-height:1.6;color:#6B5A55;">
              Prefer Apple Calendar or Outlook? Open the attached .ics calendar file.
            </p>
          `
          : ""
      }

      <p style="font-size:13px;line-height:1.6;color:#6B5A55;">
        You are now a confirmed registrant, so you will also receive any remaining ArtNovaX event reminders that apply before the event.
      </p>
    `,
  );

  const attemptedAt = new Date().toISOString();

  try {
    await sendTransactionalEmail({
      to: clean(registration.email),
      subject: `Your place is confirmed — ${event.title}`,
      html,
      idempotencyKey: `event-waitlist-promotion/${registration.id}`,
      attachments: attachment ? [attachment] : [],
    });

    const { error } = await supabaseAdmin
      .from("event_registrations")
      .update({
        waitlist_promotion_email_sent_at: attemptedAt,
        waitlist_promotion_email_last_error: null,
        email_last_attempt_at: attemptedAt,
        email_last_error: null,
      })
      .eq("id", registration.id);

    if (error) throw error;
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await supabaseAdmin
      .from("event_registrations")
      .update({
        waitlist_promotion_email_last_error: message,
        email_last_attempt_at: attemptedAt,
        email_last_error: message,
      })
      .eq("id", registration.id);

    return { ok: false, error: message };
  }
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
    staff = await requireEventOperator(req);
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Authentication failed.",
      },
      error instanceof HttpError ? error.status : 401,
    );
  }

  try {
    const body = await req.json();
    const action = clean(body?.action);
    const eventId = clean(body?.event_id);

    if (!validUuid(eventId)) {
      return json({ error: "A valid event ID is required." }, 400);
    }

    const event = await loadEvent(eventId);
    assertEventCanBeManaged(event);

    if (action === "set_open") {
      if (typeof body?.open !== "boolean") {
        return json({ error: "The waitlist open state is required." }, 400);
      }

      const open = body.open;

      const { error } = await supabaseAdmin
        .from("events")
        .update({
          waitlist_open: open,
          waitlist_closed_at: open ? null : new Date().toISOString(),
          waitlist_closed_by: open ? null : staff.id,
        })
        .eq("id", eventId);

      if (error) throw error;

      return json({
        ok: true,
        event_id: eventId,
        waitlist_open: open,
      });
    }

    if (action === "promote") {
      const registrationIds = Array.from(
        new Set(
          (Array.isArray(body?.registration_ids) ? body.registration_ids : [])
            .map(clean)
            .filter(Boolean),
        ),
      );

      if (registrationIds.length === 0) {
        return json({ error: "Select at least one waitlisted participant." }, 400);
      }

      if (registrationIds.length > 500) {
        return json({ error: "At most 500 people can be promoted at once." }, 400);
      }

      if (registrationIds.some((id) => !validUuid(id))) {
        return json({ error: "One or more registration IDs are invalid." }, 400);
      }

      const { data: promotedRows, error: promotionError } =
        await supabaseAdmin.rpc("promote_event_waitlist_registrations", {
          p_event_id: eventId,
          p_registration_ids: registrationIds,
          p_promoted_by: staff.id,
        });

      if (promotionError) throw promotionError;

      // Query the selected IDs again so an interrupted/retried request can still
      // send a promotion email if the DB promotion succeeded previously but the
      // email did not.
      const { data: selectedRows, error: selectedError } = await supabaseAdmin
        .from("event_registrations")
        .select(
          "id,event_id,name,email,status,promoted_from_waitlist_at,waitlist_promotion_email_sent_at",
        )
        .eq("event_id", eventId)
        .in("id", registrationIds)
        .eq("status", "confirmed")
        .not("promoted_from_waitlist_at", "is", null);

      if (selectedError) throw selectedError;

      const emailCandidates = (selectedRows || []).filter(
        (registration) => !registration.waitlist_promotion_email_sent_at,
      ) as Registration[];

      let emailsSent = 0;
      let emailFailed = 0;

      const batchSize = 6;
      for (let offset = 0; offset < emailCandidates.length; offset += batchSize) {
        const batch = emailCandidates.slice(offset, offset + batchSize);
        const results = await Promise.all(
          batch.map((registration) => sendPromotionEmail(event, registration)),
        );
        emailsSent += results.filter((result) => result.ok).length;
        emailFailed += results.filter((result) => !result.ok).length;
      }

      return json({
        ok: emailFailed === 0,
        event_id: eventId,
        promoted: Array.isArray(promotedRows) ? promotedRows.length : 0,
        emails_sent: emailsSent,
        email_failed: emailFailed,
      });
    }

    return json({ error: "Unsupported waitlist action." }, 400);
  } catch (error) {
    console.error("Event waitlist management failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Could not update the event waitlist.";

    const status = error instanceof HttpError ? error.status : 500;
    return json({ error: message }, status);
  }
});
