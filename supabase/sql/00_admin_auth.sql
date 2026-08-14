-- ArtNovaX website admin authentication + reusable authorization helpers.
-- Run this once before the feature scripts.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

drop policy if exists "Users can read their own role" on public.user_roles;
drop policy if exists "Users can read their own site role" on public.user_roles;
create policy "Users can read their own site role"
on public.user_roles for select
to authenticated
using (user_id = auth.uid());

create or replace function public.has_site_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = any(required_roles)
  );
$$;

revoke all on function public.has_site_role(text[]) from public;
grant execute on function public.has_site_role(text[]) to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- After creating your first user in Authentication > Users, promote that user with:
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'YOUR_ADMIN_EMAIL'
-- on conflict (user_id) do update set role = excluded.role;
