import { createClient } from "npm:@supabase/supabase-js@2";
import {
  escapeEmailHtml,
  renderTransactionalEmail,
  sendTransactionalEmail,
} from "../_shared/email.ts";

const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys["default"],
);

const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";
const PUBLIC_SITE_URL = (Deno.env.get("PUBLIC_SITE_URL") || "https://artnovax.org").replace(/\/$/, "");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();

    const { data: events, error: eventsError } = await supabaseAdmin
      .from("events")
      .select("id,slug,title,ends_at,feedback_delay_hours,attendance_finalized_at")
      .eq("feedback_enabled", true)
      .not("attendance_finalized_at", "is", null)
      .not("ends_at", "is", null)
      .lte("ends_at", now.toISOString());

    if (eventsError) throw eventsError;

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const event of events ?? []) {
      if (!event.ends_at || !event.attendance_finalized_at) continue;

      const end = new Date(event.ends_at);
      const eligibleAt = new Date(
        end.getTime() + Number(event.feedback_delay_hours || 0) * 60 * 60 * 1000,
      );

      if (now < eligibleAt) {
        skipped++;
        continue;
      }

      const { data: registrations, error: registrationsError } = await supabaseAdmin
        .from("event_registrations")
        .select("id,name,email,feedback_token,feedback_email_sent_at,feedback_submitted_at")
        .eq("event_id", event.id)
        .eq("status", "confirmed")
        .eq("attendance_status", "attended")
        .not("email", "is", null)
        .is("feedback_email_sent_at", null);

      if (registrationsError) {
        console.error("Feedback registration lookup failed:", registrationsError);
        failed++;
        continue;
      }

      for (const registration of registrations ?? []) {
        if (!registration.email || !registration.feedback_token) continue;

        // A response may have been entered by staff/test flow before the email job.
        if (registration.feedback_submitted_at) {
          skipped++;
          continue;
        }

        const feedbackUrl =
          `${PUBLIC_SITE_URL}/events/${encodeURIComponent(event.slug)}/feedback?token=${encodeURIComponent(registration.feedback_token)}`;

        const html = renderTransactionalEmail(
          `How was ${event.title}?`,
          `
            <p style="font-size:15px;line-height:1.7;">
              Hi ${escapeEmailHtml(registration.name)},
            </p>

            <p style="font-size:15px;line-height:1.7;">
              Thank you for joining <strong>${escapeEmailHtml(event.title)}</strong>.
              We would appreciate your feedback so we can improve future ArtNovaX activities.
            </p>

            <p style="margin:22px 0 12px;">
              <a
                href="${escapeEmailHtml(feedbackUrl)}"
                style="display:inline-block;padding:11px 18px;border-radius:999px;background:#5C1519;color:#FBF3E8;text-decoration:none;font-size:14px;font-weight:700;"
              >
                Share feedback
              </a>
            </p>

            <p style="font-size:13px;line-height:1.6;color:#6B5A55;">
              This link is unique to your registration. Please do not forward it.
            </p>
          `,
        );

        try {
          await sendTransactionalEmail({
            to: registration.email,
            subject: `Feedback — ${event.title}`,
            html,
            idempotencyKey: `event-feedback/${registration.id}`,
          });

          const sentAt = new Date().toISOString();
          const { error: updateError } = await supabaseAdmin
            .from("event_registrations")
            .update({
              feedback_email_sent_at: sentAt,
              feedback_email_last_attempt_at: sentAt,
              feedback_email_last_error: null,
            })
            .eq("id", registration.id);

          if (updateError) throw updateError;
          sent++;
        } catch (emailError) {
          failed++;
          const attemptedAt = new Date().toISOString();
          const message = emailError instanceof Error ? emailError.message : String(emailError);
          console.error("Feedback delivery failed:", message);

          await supabaseAdmin
            .from("event_registrations")
            .update({
              feedback_email_last_attempt_at: attemptedAt,
              feedback_email_last_error: message,
            })
            .eq("id", registration.id);
        }
      }
    }

    return Response.json({ ok: true, sent, failed, skipped });
  } catch (error) {
    console.error("Feedback cron failed:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Feedback job failed.",
      },
      { status: 500 },
    );
  }
});
