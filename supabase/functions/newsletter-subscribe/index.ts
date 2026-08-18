import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import { syncNewsletterContact } from "../_shared/newsletter.ts";

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys["default"],
);

const clean = (value: unknown): string => String(value ?? "").trim();

const validEmail = (value: string): boolean =>
  value.length >= 5 && value.includes("@") && value.includes(".");

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
    const email = clean(body?.email).toLowerCase();
    const source = clean(body?.source) || null;

    if (!validEmail(email)) {
      return json({ error: "Please provide a valid email address." }, 400);
    }

    const { data: subscription, error: subscriptionError } =
      await supabaseAdmin.rpc("subscribe_newsletter", {
        p_email: email,
        p_source: source,
      });

    if (subscriptionError) throw subscriptionError;

    const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
    const segmentId = Deno.env
      .get("RESEND_NEWSLETTER_SEGMENT_ID")
      ?.trim();

    if (!apiKey || !segmentId) {
      const message =
        "Newsletter delivery sync is not configured. Set RESEND_API_KEY and RESEND_NEWSLETTER_SEGMENT_ID.";

      await supabaseAdmin
        .from("newsletter_subscribers")
        .update({ resend_sync_error: message })
        .eq("email", email);

      console.error(message);
      return json({ ...subscription, sync_pending: true });
    }

    try {
      const contactId = await syncNewsletterContact({
        apiKey,
        segmentId,
        email,
        reactivate: true,
      });

      await supabaseAdmin
        .from("newsletter_subscribers")
        .update({
          ...(contactId ? { resend_contact_id: contactId } : {}),
          resend_synced_at: new Date().toISOString(),
          resend_sync_error: null,
        })
        .eq("email", email);
    } catch (syncError) {
      const message = syncError instanceof Error
        ? syncError.message
        : String(syncError);

      await supabaseAdmin
        .from("newsletter_subscribers")
        .update({ resend_sync_error: message })
        .eq("email", email);

      console.error("Newsletter contact sync failed:", message);
      return json({ ...subscription, sync_pending: true });
    }

    return json(subscription);
  } catch (error) {
    console.error("Newsletter subscription failed:", error);
    return json(
      {
        error: error instanceof Error
          ? error.message
          : "Subscription failed.",
      },
      500,
    );
  }
});
