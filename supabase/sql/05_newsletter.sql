-- NEWSLETTER FEATURE: public subscription RPC + private staff list.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  subscribed_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
drop policy if exists "Site staff can read newsletter subscribers" on public.newsletter_subscribers;
create policy "Site staff can read newsletter subscribers" on public.newsletter_subscribers for select to authenticated
using (public.has_site_role(array['admin','editor']));
drop policy if exists "Site admins can delete newsletter subscribers" on public.newsletter_subscribers;
create policy "Site admins can delete newsletter subscribers" on public.newsletter_subscribers for delete to authenticated
using (public.has_site_role(array['admin']));

create or replace function public.subscribe_newsletter(p_email text, p_source text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare normalized text := lower(trim(coalesce(p_email,'')));
begin
  if position('@' in normalized) = 0 or position('.' in normalized) = 0 then
    raise exception 'Please provide a valid email address.' using errcode = '22023';
  end if;
  insert into public.newsletter_subscribers(email, source)
  values(normalized, p_source)
  on conflict(email) do nothing;
  if found then
    return jsonb_build_object('status','subscribed','message','Thanks — you are on the list!');
  end if;
  return jsonb_build_object('status','already_subscribed','message','You are already on the list — thank you!');
end;
$$;

grant execute on function public.subscribe_newsletter(text,text) to anon, authenticated;
