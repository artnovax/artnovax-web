import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const secretKeys = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS") || "{}",
);

const serviceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ||
  String(secretKeys?.default || "").trim();

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEYS.default is required.",
  );
}

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
);

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: corsHeaders });

const clean = (value: unknown): string => String(value ?? "").trim();

const validEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const inviteRedirectUrl = (): string => {
  const explicit = Deno.env.get("STAFF_INVITE_REDIRECT_URL")?.trim();
  if (explicit) return explicit;

  const siteUrl = Deno.env.get("PUBLIC_SITE_URL")?.trim();
  if (!siteUrl) {
    throw new Error(
      "Set PUBLIC_SITE_URL or STAFF_INVITE_REDIRECT_URL before inviting staff.",
    );
  }

  return `${siteUrl.replace(/\/+$/, "")}/admin/setup-password`;
};

async function requireAccessAdmin(req: Request) {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return {
      user: null,
      response: json({ error: "Administrator sign-in is required." }, 401),
    };
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    return {
      user: null,
      response: json(
        { error: "Your administrator session is invalid or has expired." },
        401,
      ),
    };
  }

  const { data: allowed, error: permissionError } = await supabaseAdmin.rpc(
    "user_has_site_permission",
    {
      p_user_id: userData.user.id,
      p_permission: "access.manage",
    },
  );

  if (permissionError || allowed !== true) {
    return {
      user: null,
      response: json(
        { error: "Administrator access is required to invite staff." },
        403,
      ),
    };
  }

  return { user: userData.user, response: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const auth = await requireAccessAdmin(req);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const email = clean(body?.email).toLowerCase();
    const role = clean(body?.role) || "editor";
    const rawExpiry = clean(body?.access_expires_at);
    const accessExpiresAt = rawExpiry || null;

    if (!validEmail(email)) {
      return json({ error: "Enter a valid staff email address." }, 400);
    }

    if (accessExpiresAt && Number.isNaN(new Date(accessExpiresAt).getTime())) {
      return json({ error: "Access expiry is not a valid date/time." }, 400);
    }

    const { data: roleRow, error: roleError } = await supabaseAdmin
      .from("site_roles")
      .select("key,name")
      .eq("key", role)
      .maybeSingle();

    if (roleError) throw roleError;
    if (!roleRow) {
      return json({ error: `Unknown staff role: ${role}` }, 400);
    }

    const redirectTo = inviteRedirectUrl();

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          artnovax_staff_invite: true,
          invited_role: role,
        },
      });

    if (inviteError || !inviteData.user) {
      const message = inviteError?.message || "Could not create the staff invitation.";
      const lower = message.toLowerCase();
      const alreadyExists =
        lower.includes("already") ||
        lower.includes("registered") ||
        lower.includes("exists");

      return json(
        {
          error: alreadyExists
            ? "A Supabase Authentication account already exists for this email. Use ‘Add an existing Supabase user’ in Access Control instead."
            : message,
        },
        alreadyExists ? 409 : 400,
      );
    }

    const { error: accessError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        {
          user_id: inviteData.user.id,
          role,
          is_active: true,
          access_expires_at: accessExpiresAt,
          blocked_reason: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (accessError) {
      console.error(
        "Staff invitation was created but role assignment failed:",
        accessError,
      );
      return json(
        {
          error:
            "The invitation email was created, but the website role could not be assigned. Add this user from Access Control before they sign in.",
          invitation_sent: true,
          user_id: inviteData.user.id,
        },
        500,
      );
    }

    return json({
      ok: true,
      user_id: inviteData.user.id,
      email,
      role,
      role_name: roleRow.name,
      access_expires_at: accessExpiresAt,
      redirect_to: redirectTo,
      message: `Invitation sent to ${email}.`,
    });
  } catch (error) {
    console.error("Staff invitation failed:", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not invite this staff member.",
      },
      500,
    );
  }
});
