import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys["default"],
);

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const body = await req.json();
    const token = String(body?.token || "").trim();
    const answers = body?.answers;

    if (!token) {
      return json({ error: "This feedback link is incomplete." }, 400);
    }

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return json({ error: "Please provide feedback answers." }, 400);
    }

    const { data: registration, error: registrationError } = await supabaseAdmin
      .from("event_registrations")
      .select("id,event_id,name,status,attendance_status,feedback_submitted_at")
      .eq("feedback_token", token)
      .maybeSingle();

    if (registrationError) throw registrationError;
    if (!registration) {
      return json({ error: "This feedback link is not valid." }, 404);
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id,title,ends_at,feedback_enabled,feedback_delay_hours,attendance_finalized_at")
      .eq("id", registration.event_id)
      .single();

    if (eventError) throw eventError;

    if (
      event.feedback_enabled !== true ||
      !event.attendance_finalized_at ||
      registration.status !== "confirmed" ||
      registration.attendance_status !== "attended"
    ) {
      return json({ error: "Feedback is not available for this registration." }, 403);
    }

    if (event.ends_at) {
      const endMs = new Date(event.ends_at).getTime();
      const delayMs = Number(event.feedback_delay_hours || 0) * 60 * 60 * 1000;
      if (Date.now() < endMs + delayMs) {
        return json({ error: "Feedback is not open yet." }, 403);
      }
    }

    if (registration.feedback_submitted_at) {
      return json({ ok: true, already_submitted: true });
    }

    const submittedAt = new Date().toISOString();

    const { data: response, error: feedbackError } = await supabaseAdmin
      .from("event_feedback")
      .insert({
        event_id: event.id,
        registration_id: registration.id,
        answers,
        submitted_at: submittedAt,
      })
      .select("id,submitted_at")
      .single();

    if (feedbackError) {
      if (feedbackError.code === "23505") {
        return json({ ok: true, already_submitted: true });
      }
      throw feedbackError;
    }

    const { error: updateError } = await supabaseAdmin
      .from("event_registrations")
      .update({ feedback_submitted_at: submittedAt })
      .eq("id", registration.id);

    if (updateError) throw updateError;

    return json({
      ok: true,
      id: response.id,
      submitted_at: response.submitted_at,
    });
  } catch (error) {
    console.error("Event feedback submission failed:", error);
    return json(
      {
        error: error instanceof Error ? error.message : "Feedback submission failed.",
      },
      500,
    );
  }
});
