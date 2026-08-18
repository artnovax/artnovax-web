-- NEWSLETTER DELIVERY: Resend contact sync and one-time broadcast tracking.
-- Run after 21_newsletter_issues.sql.

alter table public.newsletter_subscribers
  add column if not exists resend_contact_id text,
  add column if not exists resend_synced_at timestamptz,
  add column if not exists resend_sync_error text;

alter table public.newsletter_issues
  add column if not exists email_send_status text not null default 'not_sent'
    check (email_send_status in ('not_sent', 'syncing', 'queued', 'failed')),
  add column if not exists email_send_started_at timestamptz,
  add column if not exists email_queued_at timestamptz,
  add column if not exists email_recipient_count integer,
  add column if not exists email_last_error text,
  add column if not exists resend_broadcast_id text;

create unique index if not exists newsletter_issues_resend_broadcast_id_key
on public.newsletter_issues(resend_broadcast_id)
where resend_broadcast_id is not null;

comment on column public.newsletter_issues.email_send_status is
'One-time Resend Broadcast workflow state. queued means Resend accepted the campaign.';

comment on column public.newsletter_issues.resend_broadcast_id is
'Resend Broadcast identifier. Once populated, the issue cannot be sent again.';

-- Public subscription writes now go through the newsletter-subscribe Edge Function,
-- which keeps Supabase and the Resend newsletter segment in sync.
create or replace function public.subscribe_newsletter(
  p_email text,
  p_source text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(trim(coalesce(p_email, '')));
  already_exists boolean;
begin
  if position('@' in normalized) = 0 or position('.' in normalized) = 0 then
    raise exception 'Please provide a valid email address.' using errcode = '22023';
  end if;

  select exists (
    select 1
    from public.newsletter_subscribers
    where email = normalized
  ) into already_exists;

  insert into public.newsletter_subscribers (
    email,
    source,
    subscribed_at,
    resend_sync_error
  )
  values (
    normalized,
    nullif(trim(coalesce(p_source, '')), ''),
    now(),
    null
  )
  on conflict (email) do update
  set source = coalesce(excluded.source, newsletter_subscribers.source),
      resend_sync_error = null;

  if already_exists then
    return jsonb_build_object(
      'status', 'already_subscribed',
      'message', 'You are already on the list — thank you!'
    );
  end if;

  return jsonb_build_object(
    'status', 'subscribed',
    'message', 'Thanks — you are on the list!'
  );
end;
$$;

revoke execute on function public.subscribe_newsletter(text, text)
from public, anon, authenticated;

grant execute on function public.subscribe_newsletter(text, text)
to service_role;

-- Atomically reserve a published issue for sending. Only one request can win.
create or replace function public.claim_newsletter_send(p_issue_id uuid)
returns public.newsletter_issues
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.newsletter_issues;
begin
  update public.newsletter_issues
  set email_send_status = 'syncing',
      email_send_started_at = now(),
      email_last_error = null
  where id = p_issue_id
    and status = 'published'
    and email_send_status in ('not_sent', 'failed')
  returning * into claimed;

  if claimed.id is null then
    raise exception
      'This issue is not published, is already being sent, or has already been sent.'
      using errcode = '55000';
  end if;

  return claimed;
end;
$$;

revoke all on function public.claim_newsletter_send(uuid) from public;
grant execute on function public.claim_newsletter_send(uuid) to service_role;
