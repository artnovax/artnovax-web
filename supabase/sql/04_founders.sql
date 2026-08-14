-- FOUNDERS/TEAM FEATURE: public team profiles and staff CRUD.
create table if not exists public.founders (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  role text,
  short text,
  bio text,
  img text,
  linkedin text,
  funfact text,
  medium text,
  why_art text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.founders enable row level security;
drop policy if exists "Public can read founders" on public.founders;
create policy "Public can read founders" on public.founders for select to anon, authenticated using (true);
drop policy if exists "Site staff can create founders" on public.founders;
create policy "Site staff can create founders" on public.founders for insert to authenticated
with check (public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can update founders" on public.founders;
create policy "Site staff can update founders" on public.founders for update to authenticated
using (public.has_site_role(array['admin','editor'])) with check (public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can delete founders" on public.founders;
create policy "Site staff can delete founders" on public.founders for delete to authenticated
using (public.has_site_role(array['admin','editor']));

drop trigger if exists founders_set_updated_at on public.founders;
create trigger founders_set_updated_at before update on public.founders
for each row execute function public.set_updated_at();
