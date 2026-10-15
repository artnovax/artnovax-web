-- ArtNovaX newsletter personalization.
-- Adds optional subscriber first names while preserving existing email-only subscribers.

begin;

alter table public.newsletter_subscribers
  add column if not exists first_name text;

comment on column public.newsletter_subscribers.first_name is
'Optional subscriber first name used for newsletter personalization. Existing subscribers may remain null and use the email fallback greeting.';

-- Replace the old two-argument function with a backwards-compatible function
-- whose third argument is optional. Existing callers that pass only email/source
-- continue to work.
drop function if exists public.subscribe_newsletter(text, text);

create or replace function public.subscribe_newsletter(
  p_email text,
  p_source text default null,
  p_first_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(trim(coalesce(p_email, '')));
  normalized_first_name text := nullif(trim(coalesce(p_first_name, '')), '');
  already_exists boolean;
begin
  if position('@' in normalized) = 0 or position('.' in normalized) = 0 then
    raise exception 'Please provide a valid email address.' using errcode = '22023';
  end if;

  if normalized_first_name is not null and length(normalized_first_name) > 80 then
    raise exception 'First name must be 80 characters or fewer.' using errcode = '22023';
  end if;

  select exists (
    select 1
    from public.newsletter_subscribers
    where email = normalized
  ) into already_exists;

  insert into public.newsletter_subscribers (
    email,
    first_name,
    source,
    subscribed_at,
    resend_sync_error
  )
  values (
    normalized,
    normalized_first_name,
    nullif(trim(coalesce(p_source, '')), ''),
    now(),
    null
  )
  on conflict (email) do update
  set first_name = coalesce(excluded.first_name, newsletter_subscribers.first_name),
      source = coalesce(excluded.source, newsletter_subscribers.source),
      resend_sync_error = null;

  if already_exists then
    return jsonb_build_object(
      'status', 'already_subscribed',
      'message', case
        when normalized_first_name is not null then 'You are already subscribed. Your name has been saved for future newsletters.'
        else 'You are already on the list — thank you!'
      end
    );
  end if;

  return jsonb_build_object(
    'status', 'subscribed',
    'message', 'Thanks — you are on the list!'
  );
end;
$$;

revoke execute on function public.subscribe_newsletter(text, text, text)
from public, anon, authenticated;

grant execute on function public.subscribe_newsletter(text, text, text)
to service_role;

commit;
