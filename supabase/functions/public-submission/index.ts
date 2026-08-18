import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import {
  type EmailAttachment,
  escapeEmailHtml,
  renderTransactionalEmail,
  sendTransactionalEmail,
} from "../_shared/email.ts";

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys["default"],
);

const TEAM_EMAIL =
  Deno.env.get("TEAM_EMAIL")?.trim() || "";

const clean = (value: unknown): string =>
  String(value ?? "").trim();

const optional = (
  value: unknown,
): string | null => {
  const result = clean(value);
  return result || null;
};

const validEmail = (value: unknown): boolean => {
  const email = clean(value).toLowerCase();

  return (
    email.length >= 5 &&
    email.includes("@") &&
    email.includes(".")
  );
};

function json(
  body: Record<string, unknown>,
  status = 200,
) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

function eventWhen(event: {
  date_text?: string | null;
  starts_at?: string | null;
  timezone?: string | null;
}): string {
  if (!event.starts_at) {
    return (
      event.date_text ||
      "Date to be confirmed"
    );
  }

  try {
    return new Intl.DateTimeFormat(
      "en-KE",
      {
        dateStyle: "full",
        timeStyle: "short",

        timeZone:
          event.timezone ||
          "Africa/Nairobi",
      },
    ).format(
      new Date(event.starts_at),
    );
  } catch {
    return (
      event.date_text ||
      event.starts_at
    );
  }
}

function eventCalendarDetails(event: {
  title?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  duration_minutes?: number | null;
  timezone?: string | null;
  location?: string | null;
  body?: string | null;
}) {
  if (!event.starts_at) return null;

  const start =
    new Date(event.starts_at);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = event.ends_at
    ? new Date(event.ends_at)
    : new Date(
        start.getTime() +
          (event.duration_minutes || 180) *
            60 *
            1000,
      );

  const stamp = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const params =
    new URLSearchParams({
      action: "TEMPLATE",

      text:
        event.title ||
        "ArtNovaX Event",

      dates:
        `${stamp(start)}/${stamp(end)}`,

      location:
        event.location || "",

      details:
        `${event.body || ""}\n\nRegistered via ArtNovaX`,
    });

  return {
    start,
    end,
    googleUrl:
      `https://calendar.google.com/calendar/render?${params.toString()}`,
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

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function eventCalendarAttachment(
  event: {
    id: string;
    slug?: string | null;
    title?: string | null;
    starts_at?: string | null;
    location?: string | null;
    body?: string | null;
  },
  registration: { id: string },
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

async function deliverTrackedEmails({
  table,
  id,
  recipientEmail,
  customerSubject,
  customerHtml,
  customerColumn,
  teamSubject,
  teamHtml,
  teamColumn,
  customerAttachments = [],
}: {
  table: string;
  id: string;
  recipientEmail: string | null;
  customerSubject: string;
  customerHtml: string;
  customerColumn: string;
  teamSubject: string;
  teamHtml: string;
  teamColumn: string;
  customerAttachments?: EmailAttachment[];
}) {
  const errors: string[] = [];

  let customerSent = false;
  let teamSent = false;

  if (recipientEmail) {
    try {
      await sendTransactionalEmail({
        to: recipientEmail,
        subject: customerSubject,
        html: customerHtml,
        idempotencyKey:
          `${table}-customer/${id}`,
        attachments: customerAttachments,
      });

      customerSent = true;
    } catch (error) {
      errors.push(
        `Customer email: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  if (TEAM_EMAIL) {
    try {
      await sendTransactionalEmail({
        to: TEAM_EMAIL,
        subject: teamSubject,
        html: teamHtml,
        idempotencyKey:
          `${table}-team/${id}`,
      });

      teamSent = true;
    } catch (error) {
      errors.push(
        `Team email: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  const now =
    new Date().toISOString();

  const update: Record<string, unknown> = {
    email_last_attempt_at: now,
    email_last_error:
      errors.length > 0
        ? errors.join(" | ")
        : null,
  };

  if (customerSent) {
    update[customerColumn] = now;
  }

  if (teamSent) {
    update[teamColumn] = now;
  }

  const { error: updateError } =
    await supabaseAdmin
      .from(table)
      .update(update)
      .eq("id", id);

  if (updateError) {
    console.error(
      `Unable to save email state for ${table}:`,
      updateError,
    );
  }

  if (errors.length) {
    console.error(
      `Email delivery errors for ${table}/${id}:`,
      errors,
    );
  }
}

async function submitContact(payload: any) {
  const name = clean(payload?.name);
  const email =
    clean(payload?.email).toLowerCase();
  const subject = clean(payload?.subject);
  const message = clean(payload?.message);

  if (
    !name ||
    !validEmail(email) ||
    !subject ||
    message.length < 5
  ) {
    return json(
      {
        error:
          "Please complete all required contact fields.",
      },
      400,
    );
  }

  const { data: entry, error } =
    await supabaseAdmin
      .from("contact_messages")
      .insert({
        name,
        email,
        subject,
        message,
        status: "new",
      })
      .select("*")
      .single();

  if (error) throw error;

  const customerHtml =
    renderTransactionalEmail(
      "We received your message",
      `
        <p style="font-size:15px;line-height:1.7;">
          Hi ${escapeEmailHtml(name)},
        </p>

        <p style="font-size:15px;line-height:1.7;">
          Thank you for reaching out to ArtNovaX.
          We received your message about
          <strong>${escapeEmailHtml(subject)}</strong>
          and a member of our team will follow up.
        </p>

        <p style="font-size:14px;color:#6B5A55;">
          Your message reference is
          ${escapeEmailHtml(entry.id)}.
        </p>
      `,
    );

  const teamHtml =
    renderTransactionalEmail(
      "New contact message",
      `
        <p><strong>Name:</strong>
          ${escapeEmailHtml(name)}
        </p>

        <p><strong>Email:</strong>
          ${escapeEmailHtml(email)}
        </p>

        <p><strong>Subject:</strong>
          ${escapeEmailHtml(subject)}
        </p>

        <div style="
          margin-top:18px;
          padding:16px;
          background:#FBF3E8;
          border-radius:12px;
          line-height:1.7;
        ">
          ${escapeEmailHtml(message)}
        </div>
      `,
    );

  await deliverTrackedEmails({
    table: "contact_messages",
    id: entry.id,
    recipientEmail: email,
    customerSubject:
      "We received your ArtNovaX message",
    customerHtml,
    customerColumn:
      "acknowledgement_email_sent_at",
    teamSubject:
      `[Contact] ${subject}`,
    teamHtml,
    teamColumn:
      "team_email_sent_at",
  });

  return json({
    status: "sent",
    id: entry.id,
  });
}

async function submitPartner(payload: any) {
  const orgName =
    clean(payload?.org_name);
  const contactName =
    clean(payload?.contact_name);
  const email =
    clean(payload?.email).toLowerCase();

  if (
    !orgName ||
    !contactName ||
    !validEmail(email)
  ) {
    return json(
      {
        error:
          "Please provide the organization, contact name and a valid email.",
      },
      400,
    );
  }

  const record = {
    org_name: orgName,
    contact_name: contactName,
    role: optional(payload?.role),
    email,
    phone: optional(payload?.phone),
    website: optional(payload?.website),
    org_type: optional(payload?.org_type),
    partnership_type:
      optional(payload?.partnership_type),
    goals: optional(payload?.goals),
    audience: optional(payload?.audience),
    budget: optional(payload?.budget),
    timeline: optional(payload?.timeline),
    message: optional(payload?.message),
    status: "new",
  };

  const { data: entry, error } =
    await supabaseAdmin
      .from("partner_inquiries")
      .insert(record)
      .select("*")
      .single();

  if (error) throw error;

  const customerHtml =
    renderTransactionalEmail(
      "Thank you for reaching out",
      `
        <p style="font-size:15px;line-height:1.7;">
          Hi ${escapeEmailHtml(contactName)},
        </p>

        <p style="font-size:15px;line-height:1.7;">
          We received your partnership inquiry
          on behalf of
          <strong>${escapeEmailHtml(orgName)}</strong>.
          The ArtNovaX team will review it and get
          back to you.
        </p>
      `,
    );

  const teamHtml =
    renderTransactionalEmail(
      "New partnership inquiry",
      `
        <p><strong>Organization:</strong>
          ${escapeEmailHtml(orgName)}
        </p>

        <p><strong>Contact:</strong>
          ${escapeEmailHtml(contactName)}
        </p>

        <p><strong>Email:</strong>
          ${escapeEmailHtml(email)}
        </p>

        <p><strong>Partnership type:</strong>
          ${escapeEmailHtml(
            record.partnership_type || "Not specified",
          )}
        </p>

        ${
          record.message
            ? `
              <div style="
                margin-top:18px;
                padding:16px;
                background:#FBF3E8;
                border-radius:12px;
              ">
                ${escapeEmailHtml(record.message)}
              </div>
            `
            : ""
        }
      `,
    );

  await deliverTrackedEmails({
    table: "partner_inquiries",
    id: entry.id,
    recipientEmail: email,
    customerSubject:
      "ArtNovaX partnership inquiry received",
    customerHtml,
    customerColumn:
      "acknowledgement_email_sent_at",
    teamSubject:
      `[Partnership] ${orgName}`,
    teamHtml,
    teamColumn:
      "team_email_sent_at",
  });

  return json({
    status: "submitted",
    id: entry.id,
  });
}

async function submitVolunteer(payload: any) {
  const roleId =
    clean(payload?.role_id);
  const name =
    clean(payload?.name);
  const email =
    clean(payload?.email).toLowerCase();

  if (
    !roleId ||
    !name ||
    !validEmail(email)
  ) {
    return json(
      {
        error:
          "Please provide the role, your name and a valid email.",
      },
      400,
    );
  }

  const { data: role, error: roleError } =
    await supabaseAdmin
      .from("volunteer_roles")
      .select("id,title,active")
      .eq("id", roleId)
      .eq("active", true)
      .single();

  if (roleError || !role) {
    return json(
      {
        error:
          "This volunteer role is no longer available.",
      },
      404,
    );
  }

  const { data: entry, error } =
    await supabaseAdmin
      .from("volunteer_applications")
      .insert({
        role_id: role.id,
        name,
        email,
        phone:
          optional(payload?.phone),
        answers:
          payload?.answers || {},
        status: "new",
      })
      .select("*")
      .single();

  if (error) throw error;

  const customerHtml =
    renderTransactionalEmail(
      "We received your application",
      `
        <p style="font-size:15px;line-height:1.7;">
          Hi ${escapeEmailHtml(name)},
        </p>

        <p style="font-size:15px;line-height:1.7;">
          Thank you for applying to volunteer with
          ArtNovaX as
          <strong>${escapeEmailHtml(role.title)}</strong>.
          Our team will review your application and
          contact you if there is a next step.
        </p>
      `,
    );

  const teamHtml =
    renderTransactionalEmail(
      "New volunteer application",
      `
        <p><strong>Applicant:</strong>
          ${escapeEmailHtml(name)}
        </p>

        <p><strong>Email:</strong>
          ${escapeEmailHtml(email)}
        </p>

        <p><strong>Role:</strong>
          ${escapeEmailHtml(role.title)}
        </p>

        <p><strong>Application ID:</strong>
          ${escapeEmailHtml(entry.id)}
        </p>
      `,
    );

  await deliverTrackedEmails({
    table: "volunteer_applications",
    id: entry.id,
    recipientEmail: email,
    customerSubject:
      `ArtNovaX volunteer application — ${role.title}`,
    customerHtml,
    customerColumn:
      "acknowledgement_email_sent_at",
    teamSubject:
      `[Volunteer] ${role.title} — ${name}`,
    teamHtml,
    teamColumn:
      "team_email_sent_at",
  });

  return json({
    status: "submitted",
    id: entry.id,
  });
}

async function registerEvent(payload: any) {
  const eventId =
    clean(payload?.event_id);
  const name =
    clean(payload?.name);
  const email =
    clean(payload?.email).toLowerCase();

  if (
    !eventId ||
    !name ||
    !validEmail(email)
  ) {
    return json(
      {
        error:
          "Please provide the event, your name and a valid email.",
      },
      400,
    );
  }

  const {
    data: registrationResult,
    error: registrationError,
  } = await supabaseAdmin.rpc(
    "register_for_event",
    {
      p_event_id: eventId,
      p_name: name,
      p_email: email,
      p_phone:
        optional(payload?.phone),
      p_answers:
        payload?.answers || {},
    },
  );

  if (registrationError) {
    throw registrationError;
  }

  const registrationId =
    registrationResult?.id;

  if (!registrationId) {
    throw new Error(
      "Registration was created without an ID.",
    );
  }

  const { data: registration, error: regError } =
    await supabaseAdmin
      .from("event_registrations")
      .select("*")
      .eq("id", registrationId)
      .single();

  if (regError) throw regError;

  const { data: event, error: eventError } =
    await supabaseAdmin
      .from("events")
      .select(
        "id,slug,title,date_text,starts_at,ends_at,duration_minutes,timezone,location,body",
      )
      .eq("id", eventId)
      .single();

  if (eventError) throw eventError;

  const waitlisted =
    registration.status === "waitlist";
  const calendar = !waitlisted
    ? eventCalendarDetails(event)
    : null;
  const calendarAttachment = !waitlisted
    ? eventCalendarAttachment(event, registration)
    : null;

  const customerHtml =
    renderTransactionalEmail(
      waitlisted
        ? "You’re on the waitlist"
        : "Your registration is confirmed",
      `
        <p style="font-size:15px;line-height:1.7;">
          Hi ${escapeEmailHtml(name)},
        </p>

        <p style="font-size:15px;line-height:1.7;">
          ${
            waitlisted
              ? `The session is currently full,
                 but we saved your place on the
                 waitlist for
                 <strong>${escapeEmailHtml(
                   event.title,
                 )}</strong>.`
              : `You’re registered for
                 <strong>${escapeEmailHtml(
                   event.title,
                 )}</strong>.`
          }
        </p>

        <p style="font-size:14px;line-height:1.7;">
          <strong>When:</strong>
          ${escapeEmailHtml(eventWhen(event))}
          <br />

          <strong>Where:</strong>
          ${escapeEmailHtml(
            event.location ||
              "Location to be confirmed",
          )}
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
      `,
    );

  const teamHtml =
    renderTransactionalEmail(
      waitlisted
        ? "New event waitlist registration"
        : "New event registration",
      `
        <p><strong>Event:</strong>
          ${escapeEmailHtml(event.title)}
        </p>

        <p><strong>Name:</strong>
          ${escapeEmailHtml(name)}
        </p>

        <p><strong>Email:</strong>
          ${escapeEmailHtml(email)}
        </p>

        <p><strong>Status:</strong>
          ${escapeEmailHtml(registration.status)}
        </p>
      `,
    );

  await deliverTrackedEmails({
    table: "event_registrations",
    id: registration.id,
    recipientEmail: email,
    customerSubject:
      waitlisted
        ? `Waitlist — ${event.title}`
        : `Registration confirmed — ${event.title}`,
    customerHtml,
    customerColumn:
      "confirmation_email_sent_at",
    teamSubject:
      `[Event ${registration.status}] ${event.title}`,
    teamHtml,
    teamColumn:
      "team_email_sent_at",
    customerAttachments:
      calendarAttachment
        ? [calendarAttachment]
        : [],
  });

  return json({
    ...registrationResult,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return json(
      { error: "Method not allowed." },
      405,
    );
  }

  try {
    const body =
      await req.json();

    const type =
      clean(body?.type);

    const payload =
      body?.payload || {};

    switch (type) {
      case "contact":
        return await submitContact(payload);

      case "partner":
        return await submitPartner(payload);

      case "volunteer":
        return await submitVolunteer(payload);

      case "event_registration":
        return await registerEvent(payload);

      default:
        return json(
          {
            error:
              "Unsupported submission type.",
          },
          400,
        );
    }
  } catch (error) {
    console.error(
      "Public submission error:",
      error,
    );

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Submission failed.",
      },
      500,
    );
  }
});
