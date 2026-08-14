-- CONTACT FEATURE: public submissions, private staff inbox.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved','archived')),
  submitted_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
drop policy if exists "Anyone can submit contact messages" on public.contact_messages;
create policy "Anyone can submit contact messages" on public.contact_messages for insert to anon, authenticated
with check (length(trim(name)) > 0 and position('@' in email) > 0 and length(trim(message)) >= 5 and status = 'new');
drop policy if exists "Site staff can read contact messages" on public.contact_messages;
create policy "Site staff can read contact messages" on public.contact_messages for select to authenticated
using (public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can update contact messages" on public.contact_messages;
create policy "Site staff can update contact messages" on public.contact_messages for update to authenticated
using (public.has_site_role(array['admin','editor'])) with check (public.has_site_role(array['admin','editor']));
