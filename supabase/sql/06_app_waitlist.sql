-- APP WAITLIST FEATURE: standalone early-access list, separate from newsletter subscriptions.
create table if not exists public.app_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'waiting' check (status in ('waiting','invited','joined','removed')),
  source text default 'website',
  notes text,
  created_at timestamptz not null default now()
);

alter table public.app_waitlist enable row level security;
drop policy if exists "Site staff can read app waitlist" on public.app_waitlist;
create policy "Site staff can read app waitlist" on public.app_waitlist for select to authenticated
using (public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can update app waitlist" on public.app_waitlist;
create policy "Site staff can update app waitlist" on public.app_waitlist for update to authenticated
using (public.has_site_role(array['admin','editor'])) with check (public.has_site_role(array['admin','editor']));

drop policy if exists "Site admins can delete app waitlist" on public.app_waitlist;
create policy "Site admins can delete app waitlist" on public.app_waitlist for delete to authenticated
using (public.has_site_role(array['admin']));

create or replace function public.join_app_waitlist(p_email text)
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
  insert into public.app_waitlist(email) values(normalized) on conflict(email) do nothing;
  if found then
    return jsonb_build_object('status','joined','message','You are on the ArtNovaX early-access waitlist.');
  end if;
  return jsonb_build_object('status','already_joined','message','You are already on the ArtNovaX waitlist.');
end;
$$;

grant execute on function public.join_app_waitlist(text) to anon, authenticated;
