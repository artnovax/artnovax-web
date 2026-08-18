import { createClient } from "@supabase/supabase-js";
import {
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

const CRON_SECRET =
  Deno.env.get("CRON_SECRET") || "";

function formatWhen(
  startsAt: string,
  timezone = "Africa/Nairobi",
): string {
  return new Intl.DateTimeFormat(
    "en-KE",
    {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timezone,
    },
  ).format(new Date(startsAt));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      "Method not allowed",
      { status: 405 },
    );
  }

  if (
    !CRON_SECRET ||
    req.headers.get("x-cron-secret") !==
      CRON_SECRET
  ) {
    return new Response(
      "Unauthorized",
      { status: 401 },
    );
  }

  try {
    const now =
      new Date();

    const { data: events, error } =
      await supabaseAdmin
        .from("events")
        .select(
          "id,title,starts_at,timezone,location,reminder_hours",
        )
        .eq("status", "upcoming")
        .not("starts_at", "is", null)
        .gt(
          "starts_at",
          now.toISOString(),
        );

    if (error) throw error;

    let sent = 0;
    let failed = 0;

    for (const event of events ?? []) {
      if (!event.starts_at) continue;

      const start =
        new Date(event.starts_at);

      const configuredHours =
        Array.isArray(
          event.reminder_hours,
        ) &&
        event.reminder_hours.length
          ? event.reminder_hours
          : [48];

      const { data: registrations, error: regError } =
        await supabaseAdmin
          .from("event_registrations")
          .select(
            "id,name,email,reminders_sent_hours",
          )
          .eq("event_id", event.id)
          .eq("status", "confirmed");

      if (regError) {
        console.error(
          "Registration lookup failed:",
          regError,
        );
        continue;
      }

      for (
        const registration
        of registrations ?? []
      ) {
        const alreadySent =
          registration
            .reminders_sent_hours || [];

        const dueHours =
          configuredHours.filter(
            (hours: number) => {
              if (
                alreadySent.includes(hours)
              ) {
                return false;
              }

              const reminderAt =
                new Date(
                  start.getTime() -
                    Number(hours) *
                      60 *
                      60 *
                      1000,
                );

              return (
                now >= reminderAt &&
                now < start
              );
            },
          );

        if (!dueHours.length) {
          continue;
        }

        /*
         * If cron was unavailable and several
         * reminder windows are overdue, send one
         * reminder rather than several emails.
         */
        const hoursForMessage =
          Math.min(...dueHours);

        const html =
          renderTransactionalEmail(
            `Reminder — ${event.title}`,
            `
              <p style="font-size:15px;line-height:1.7;">
                Hi ${escapeEmailHtml(
                  registration.name,
                )},
              </p>

              <p style="font-size:15px;line-height:1.7;">
                This is a reminder that
                <strong>${escapeEmailHtml(
                  event.title,
                )}</strong>
                is coming up.
              </p>

              <p style="font-size:14px;line-height:1.7;">
                <strong>When:</strong>
                ${escapeEmailHtml(
                  formatWhen(
                    event.starts_at,
                      event.timezone || "Africa/Nairobi"
                  ),
                )}
                <br />

                <strong>Where:</strong>
                ${escapeEmailHtml(
                  event.location ||
                    "Location to be confirmed",
                )}
              </p>

              <p style="font-size:14px;color:#6B5A55;">
                We look forward to seeing you.
              </p>
            `,
          );

        try {
          await sendTransactionalEmail({
            to: registration.email,
            subject:
              `Reminder — ${event.title}`,
            html,
            idempotencyKey:
              `event-reminder/${registration.id}/${hoursForMessage}h`,
          });

          const nextSent =
            Array.from(
              new Set([
                ...alreadySent,
                ...dueHours,
              ]),
            );

          const { error: updateError } =
            await supabaseAdmin
              .from(
                "event_registrations",
              )
              .update({
                reminders_sent_hours:
                  nextSent,
                reminder_sent: true,
                reminder_sent_at:
                  new Date()
                    .toISOString(),
                email_last_error: null,
              })
              .eq(
                "id",
                registration.id,
              );

          if (updateError) {
            throw updateError;
          }

          sent++;
        } catch (emailError) {
          failed++;

          console.error(
            "Reminder delivery failed:",
            emailError,
          );

          await supabaseAdmin
            .from(
              "event_registrations",
            )
            .update({
              email_last_attempt_at:
                new Date()
                  .toISOString(),

              email_last_error:
                emailError instanceof Error
                  ? emailError.message
                  : String(emailError),
            })
            .eq(
              "id",
              registration.id,
            );
        }
      }
    }

    return Response.json({
      ok: true,
      sent,
      failed,
    });
  } catch (error) {
    console.error(
      "Reminder cron failed:",
      error,
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Reminder job failed.",
      },
      {
        status: 500,
      },
    );
  }
});
