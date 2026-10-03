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

const EMAIL_TYPES = new Set([
  "interview",
  "acceptance",
  "rejection",
  "onboarding",
  "custom",
]);

const TRANSITION_BY_TYPE: Record<string, string | null> = {
  interview: "interview",
  acceptance: "accepted",
  rejection: "rejected",
  onboarding: "onboarding",
  custom: null,
};

type StaffUser = {
  id: string;
  email: string;
  role: string;
};

async function requireStaff(req: Request): Promise<StaffUser> {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    throw new HttpError("Sign in before managing volunteer applications.", 401);
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    throw new HttpError("Your admin session is invalid or has expired.", 401);
  }

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (roleError || !["admin", "editor"].includes(roleRow?.role)) {
    throw new HttpError("Website staff access is required.", 403);
  }

  return {
    id: userData.user.id,
    email: userData.user.email || "ArtNovaX staff",
    role: roleRow.role,
  };
}

function firstName(name: string): string {
  return clean(name).split(/\s+/)[0] || "there";
}

function validTimezone(timezone: string): string {
  const fallback = "Africa/Nairobi";
  const candidate = clean(timezone) || fallback;

  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return fallback;
  }
}

function formatInterviewDate(value: string, timezone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "To be confirmed";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: validTimezone(timezone),
  }).format(date);
}

function defaultCopy({
  type,
  applicantName,
  roleTitle,
  interviewAt,
  interviewTimezone,
  interviewLocation,
}: {
  type: string;
  applicantName: string;
  roleTitle: string;
  interviewAt: string;
  interviewTimezone: string;
  interviewLocation: string;
}) {
  const name = firstName(applicantName);
  const when = interviewAt
    ? formatInterviewDate(interviewAt, interviewTimezone)
    : "To be confirmed";
  const where = interviewLocation || "Meeting details will be shared separately.";

  if (type === "interview") {
    return {
      subject: `Interview invitation — ${roleTitle}`,
      bodyText:
        `Hi ${name},\n\n` +
        `Thank you for your application to volunteer with ArtNovaX as ${roleTitle}. ` +
        `We enjoyed learning more about you and would like to invite you to an interview.\n\n` +
        `Interview: ${when} (${validTimezone(interviewTimezone)})\n` +
        `Location / meeting details: ${where}\n\n` +
        `If this timing does not work for you, reply to this email and we can coordinate another time.\n\n` +
        `Warmly,\nArtNovaX Mental Health Foundation`,
    };
  }

  if (type === "acceptance") {
    return {
      subject: `Welcome to ArtNovaX — ${roleTitle}`,
      bodyText:
        `Hi ${name},\n\n` +
        `We’re pleased to let you know that we would love to welcome you to ArtNovaX as ${roleTitle}. ` +
        `Thank you for the time and thought you put into the application process.\n\n` +
        `We’ll follow up with your onboarding details and next steps. We’re looking forward to having you with us.\n\n` +
        `Warmly,\nArtNovaX Mental Health Foundation`,
    };
  }

  if (type === "rejection") {
    return {
      subject: `Update on your ArtNovaX volunteer application — ${roleTitle}`,
      bodyText:
        `Hi ${name},\n\n` +
        `Thank you for taking the time to apply to volunteer with ArtNovaX as ${roleTitle}. ` +
        `After reviewing your application, we won’t be moving forward with it at this time.\n\n` +
        `We genuinely appreciate your interest in our work and the time you invested in applying. ` +
        `We hope you’ll stay connected with ArtNovaX and consider future opportunities that may be a better fit.\n\n` +
        `Warmly,\nArtNovaX Mental Health Foundation`,
    };
  }

  if (type === "onboarding") {
    return {
      subject: `Your ArtNovaX onboarding — ${roleTitle}`,
      bodyText:
        `Hi ${name},\n\n` +
        `We’re excited to get you started with ArtNovaX as ${roleTitle}. ` +
        `Your application has now moved into onboarding.\n\n` +
        `We’ll use this stage to make sure you have the information, access and introductions you need before getting started. ` +
        `Please reply to this email if anything is unclear along the way.\n\n` +
        `Warmly,\nArtNovaX Mental Health Foundation`,
    };
  }

  return {
    subject: `Update on your ArtNovaX volunteer application — ${roleTitle}`,
    bodyText:
      `Hi ${name},\n\n` +
      `We’re getting in touch with an update about your application to volunteer with ArtNovaX as ${roleTitle}.\n\n` +
      `Warmly,\nArtNovaX Mental Health Foundation`,
  };
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

function escapeIcs(value: unknown): string {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r?\n/g, "\\n");
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function interviewAttachment({
  applicationId,
  roleTitle,
  interviewAt,
  durationMinutes,
  interviewLocation,
}: {
  applicationId: string;
  roleTitle: string;
  interviewAt: string;
  durationMinutes: number;
  interviewLocation: string;
}) {
  const start = new Date(interviewAt);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ArtNovaX//Volunteer Interviews//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:volunteer-interview-${escapeIcs(applicationId)}@artnovax.org`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${escapeIcs(`ArtNovaX interview — ${roleTitle}`)}`,
    `DESCRIPTION:${escapeIcs("Volunteer interview with ArtNovaX Mental Health Foundation")}`,
    `LOCATION:${escapeIcs(interviewLocation || "To be confirmed")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return {
    filename: "artnovax-volunteer-interview.ics",
    content: base64Utf8(ics),
  };
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
    staff = await requireStaff(req);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 401;
    return json(
      { error: error instanceof Error ? error.message : "Staff authentication failed." },
      status,
    );
  }

  try {
    const body = await req.json();
    const applicationId = clean(body?.application_id);
    const type = clean(body?.type).toLowerCase();
    const preview = body?.preview === true;
    const allowResend = body?.allow_resend === true;
    const requestId = clean(body?.request_id) || crypto.randomUUID();

    if (!applicationId) {
      return json({ error: "Application ID is required." }, 400);
    }

    if (!EMAIL_TYPES.has(type)) {
      return json({ error: "Choose a supported volunteer email type." }, 400);
    }

    const { data: application, error: applicationError } = await supabaseAdmin
      .from("volunteer_applications")
      .select("*, volunteer_roles(title,slug)")
      .eq("id", applicationId)
      .single();

    if (applicationError || !application) {
      return json({ error: "Volunteer application not found." }, 404);
    }

    if (["archived", "onboarded"].includes(application.status) && type !== "custom") {
      return json(
        {
          error:
            `This application is ${application.status}. Reopen it before sending another lifecycle email.`,
        },
        409,
      );
    }

    const roleTitle = clean(application.volunteer_roles?.title) || "Volunteer role";
    const interviewAt = clean(body?.interview_at || application.interview_at);
    const interviewTimezone = validTimezone(
      clean(body?.interview_timezone || application.interview_timezone || "Africa/Nairobi"),
    );
    const durationRaw = Number(
      body?.interview_duration_minutes ?? application.interview_duration_minutes ?? 30,
    );
    const interviewDuration = Number.isFinite(durationRaw)
      ? Math.min(240, Math.max(10, Math.round(durationRaw)))
      : 30;
    const interviewLocation = clean(
      body?.interview_location ?? application.interview_location,
    );

    if (type === "interview" && !interviewAt) {
      return json(
        { error: "Choose an interview date and time before sending the invitation." },
        400,
      );
    }

    const defaults = defaultCopy({
      type,
      applicantName: application.name,
      roleTitle,
      interviewAt,
      interviewTimezone,
      interviewLocation,
    });

    const subject = clean(body?.subject) || defaults.subject;
    const bodyText = clean(body?.body_text) || defaults.bodyText;

    if (!subject || subject.length > 200) {
      return json({ error: "Email subject must be between 1 and 200 characters." }, 400);
    }

    if (!bodyText || bodyText.length > 12000) {
      return json({ error: "Email body must be between 1 and 12,000 characters." }, 400);
    }

    const transitionStatus = TRANSITION_BY_TYPE[type] || null;

    if (preview) {
      return json({
        ok: true,
        preview: true,
        subject,
        body_text: bodyText,
        transition_status: transitionStatus,
        interview_at: interviewAt || null,
        interview_timezone: interviewTimezone,
        interview_duration_minutes: interviewDuration,
        interview_location: interviewLocation || null,
      });
    }

    const idempotencyKey = `volunteer-application/${applicationId}/${requestId}`;

    const { data: existingRequest } = await supabaseAdmin
      .from("volunteer_application_emails")
      .select("id,delivery_status,sent_at")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingRequest?.delivery_status === "sent") {
      return json({
        ok: true,
        already_sent: true,
        email_id: existingRequest.id,
        sent_at: existingRequest.sent_at,
        status: transitionStatus || application.status,
      });
    }

    if (!allowResend && type !== "custom") {
      const { data: priorSent } = await supabaseAdmin
        .from("volunteer_application_emails")
        .select("id,sent_at")
        .eq("application_id", applicationId)
        .eq("email_type", type)
        .eq("delivery_status", "sent")
        .limit(1)
        .maybeSingle();

      if (priorSent) {
        return json(
          {
            error: `A ${type} email has already been sent for this application. Confirm a resend to send it again.`,
            code: "EMAIL_ALREADY_SENT",
            sent_at: priorSent.sent_at,
          },
          409,
        );
      }
    }

    const emailHtml = renderTransactionalEmail(
      subject,
      bodyTextToHtml(bodyText),
    );

    const attachments = [];
    if (type === "interview" && interviewAt) {
      const attachment = interviewAttachment({
        applicationId,
        roleTitle,
        interviewAt,
        durationMinutes: interviewDuration,
        interviewLocation,
      });
      if (attachment) attachments.push(attachment);
    }

    let resendEmailId: string | null = null;

    try {
      resendEmailId = await sendTransactionalEmail({
        to: application.email,
        subject,
        html: emailHtml,
        idempotencyKey,
        attachments,
      });
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : String(sendError);

      const { error: recordFailureError } = await supabaseAdmin.rpc(
        "record_volunteer_email_failure",
        {
          p_application_id: applicationId,
          p_email_type: type,
          p_recipient_email: application.email,
          p_subject: subject,
          p_body_text: bodyText,
          p_error: message,
          p_idempotency_key: idempotencyKey,
          p_actor_user_id: staff.id,
          p_actor_label: staff.email,
        },
      );

      if (recordFailureError) {
        console.error("Could not record volunteer email failure:", recordFailureError);
      }

      console.error("Volunteer application email failed:", message);
      return json({ error: "Email delivery failed.", detail: message }, 502);
    }

    const { data: recordResult, error: recordError } = await supabaseAdmin.rpc(
      "record_volunteer_email_delivery",
      {
        p_application_id: applicationId,
        p_email_type: type,
        p_recipient_email: application.email,
        p_subject: subject,
        p_body_text: bodyText,
        p_resend_email_id: resendEmailId,
        p_idempotency_key: idempotencyKey,
        p_actor_user_id: staff.id,
        p_actor_label: staff.email,
        p_transition_status: transitionStatus,
        p_interview_at: interviewAt || null,
        p_interview_timezone: interviewTimezone,
        p_interview_duration_minutes: interviewDuration,
        p_interview_location: interviewLocation || null,
      },
    );

    if (recordError) {
      console.error(
        "Volunteer email sent but lifecycle recording failed:",
        recordError,
      );

      return json(
        {
          error:
            "The email was sent, but ArtNovaX could not record the lifecycle update. Retry with the same request before sending anything again.",
          sent_but_not_recorded: true,
          request_id: requestId,
        },
        500,
      );
    }

    return json({
      ok: true,
      request_id: requestId,
      email_id: recordResult?.email_id || null,
      status: recordResult?.status || transitionStatus || application.status,
      resend_email_id: resendEmailId,
    });
  } catch (error) {
    console.error("Volunteer application email action failed:", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process this volunteer application email.",
      },
      500,
    );
  }
});
