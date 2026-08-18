import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createNewsletterBroadcast,
  sendNewsletterBroadcast,
  syncNewsletterContact,
} from "../_shared/newsletter.ts";

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys["default"],
);

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: corsHeaders });

const clean = (value: unknown): string => String(value ?? "").trim();

const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function requireStaff(req: Request): Promise<string> {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    throw new Error("Sign in before sending a newsletter.");
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    throw new Error("Your admin session is invalid or has expired.");
  }

  const { data: role, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (roleError || !["admin", "editor"].includes(role?.role)) {
    throw new Error("Website staff access is required.");
  }

  return userData.user.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  let issueId = "";
  let claimed = false;

  try {
    await requireStaff(req);
    const body = await req.json();
    issueId = clean(body?.issue_id);

    if (!issueId) {
      return json({ error: "Choose a newsletter issue to send." }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
    const segmentId = Deno.env
      .get("RESEND_NEWSLETTER_SEGMENT_ID")
      ?.trim();
    const from = Deno.env.get("FROM_EMAIL")?.trim();
    const siteUrl = Deno.env.get("PUBLIC_SITE_URL")?.trim();

    if (!apiKey || !segmentId || !from || !siteUrl) {
      return json(
        {
          error:
            "Newsletter delivery requires RESEND_API_KEY, RESEND_NEWSLETTER_SEGMENT_ID, FROM_EMAIL, and PUBLIC_SITE_URL.",
        },
        500,
      );
    }

    const { data: issue, error: claimError } = await supabaseAdmin.rpc(
      "claim_newsletter_send",
      { p_issue_id: issueId },
    );

    if (claimError || !issue) {
      return json(
        {
          error: claimError?.message ||
            "This newsletter cannot be sent in its current state.",
        },
        409,
      );
    }

    claimed = true;

    if (!clean(issue.body)) {
      throw new Error("Add newsletter body content before sending this issue.");
    }

    const { data: subscribers, error: subscriberError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id,email,resend_contact_id")
      .order("subscribed_at", { ascending: true });

    if (subscriberError) throw subscriberError;

    if (!subscribers?.length) {
      throw new Error("There are no newsletter subscribers to send to.");
    }

    const syncErrors: string[] = [];

    for (const subscriber of subscribers) {
      try {
        const contactId = await syncNewsletterContact({
          apiKey,
          segmentId,
          email: subscriber.email,
          reactivate: false,
        });

        await supabaseAdmin
          .from("newsletter_subscribers")
          .update({
            ...(contactId ? { resend_contact_id: contactId } : {}),
            resend_synced_at: new Date().toISOString(),
            resend_sync_error: null,
          })
          .eq("id", subscriber.id);
      } catch (syncError) {
        const message = syncError instanceof Error
          ? syncError.message
          : String(syncError);
        syncErrors.push(`${subscriber.email}: ${message}`);

        await supabaseAdmin
          .from("newsletter_subscribers")
          .update({ resend_sync_error: message })
          .eq("id", subscriber.id);
      }

      // Keep contact synchronization below common provider rate limits.
      await pause(550);
    }

    if (syncErrors.length > 0) {
      throw new Error(
        `Could not synchronize ${syncErrors.length} subscriber(s): ${
          syncErrors.slice(0, 3).join(" | ")
        }`,
      );
    }

    let broadcastId = clean(issue.resend_broadcast_id);

    if (!broadcastId) {
      broadcastId = await createNewsletterBroadcast({
        apiKey,
        segmentId,
        from,
        issue,
        siteUrl,
      });

      const { error: broadcastUpdateError } = await supabaseAdmin
        .from("newsletter_issues")
        .update({ resend_broadcast_id: broadcastId })
        .eq("id", issueId);

      if (broadcastUpdateError) throw broadcastUpdateError;
    }

    await sendNewsletterBroadcast({ apiKey, broadcastId });

    const queuedAt = new Date().toISOString();
    const { error: completionError } = await supabaseAdmin
      .from("newsletter_issues")
      .update({
        email_send_status: "queued",
        email_queued_at: queuedAt,
        email_recipient_count: subscribers.length,
        email_last_error: null,
      })
      .eq("id", issueId);

    if (completionError) throw completionError;

    return json({
      status: "queued",
      broadcast_id: broadcastId,
      recipient_count: subscribers.length,
      message: `Newsletter queued for ${subscribers.length} subscriber(s).`,
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Newsletter delivery failed.";

    console.error("Newsletter delivery failed:", error);

    if (claimed && issueId) {
      await supabaseAdmin
        .from("newsletter_issues")
        .update({
          email_send_status: "failed",
          email_last_error: message,
        })
        .eq("id", issueId);
    }

    return json({ error: message }, 500);
  }
});
