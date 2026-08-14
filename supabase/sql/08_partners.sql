-- PARTNERSHIP FEATURE: public inquiry submissions, private staff review.
create table if not exists public.partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  org_name text not null,
  contact_name text not null,
  role text,
  email text not null,
  phone text,
  website text,
  org_type text,
  partnership_type text,
  goals text,
  audience text,
  budget text,
  timeline text,
  message text,
  status text not null default 'new' check (status in ('new','reviewing','contacted','closed','archived')),
  created_at timestamptz not null default now()
);

alter table public.partner_inquiries enable row level security;
drop policy if exists "Anyone can submit partnership inquiries" on public.partner_inquiries;
create policy "Anyone can submit partnership inquiries" on public.partner_inquiries for insert to anon, authenticated
with check (length(trim(org_name)) > 0 and length(trim(contact_name)) > 0 and position('@' in email) > 0 and status = 'new');
drop policy if exists "Site staff can read partnership inquiries" on public.partner_inquiries;
create policy "Site staff can read partnership inquiries" on public.partner_inquiries for select to authenticated
using (public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can update partnership inquiries" on public.partner_inquiries;
create policy "Site staff can update partnership inquiries" on public.partner_inquiries for update to authenticated
using (public.has_site_role(array['admin','editor'])) with check (public.has_site_role(array['admin','editor']));
