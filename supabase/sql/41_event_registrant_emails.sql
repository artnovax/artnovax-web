-- Manual event registrant emails from Event Operations.
-- Run after 40_staff_access_control.sql.
-- Sending is intentionally admin-only; the Edge Function rechecks recipients
-- against current confirmed registration status immediately before delivery.

begin;

insert into public.site_permissions (
  key,
  category,
  name,
  description,
  admin_only,
  sort_order
) values (
  'event_emails.send',
  'Events',
  'Email event registrants',
  'Send manual operational emails to selected currently confirmed event registrants.',
  true,
  80
)
on conflict (key) do update
set category = excluded.category,
    name = excluded.name,
    description = excluded.description,
    admin_only = excluded.admin_only,
    sort_order = excluded.sort_order;

-- 40_staff_access_control.sql installs a trigger that grants every new
-- permission to the admin role. Keep an explicit upsert here as well so this
-- migration is safe if that trigger was temporarily disabled during setup.
insert into public.site_role_permissions (role_key, permission_key)
values ('admin', 'event_emails.send')
on conflict do nothing;

create table if not exists public.event_email_campaigns (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  request_id text not null,
  subject text not null check (char_length(subject) between 1 and 200),
  body_text text not null check (char_length(body_text) between 1 and 12000),
  created_by uuid references auth.users(id) on delete set null,
  created_by_email text,
  requested_recipient_count integer not null default 0 check (requested_recipient_count >= 0),
  eligible_recipient_count integer not null default 0 check (eligible_recipient_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  status text not null default 'sending'
    check (status in ('sending','sent','partial','failed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, request_id)
);

create index if not exists event_email_campaigns_event_created_idx
on public.event_email_campaigns(event_id, created_at desc);

create table if not exists public.event_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.event_email_campaigns(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  registration_id uuid references public.event_registrations(id) on delete set null,
  recipient_name text,
  recipient_email text not null,
  delivery_status text not null check (delivery_status in ('sent','failed')),
  resend_email_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, registration_id)
);

create index if not exists event_email_deliveries_campaign_idx
on public.event_email_deliveries(campaign_id, created_at);

create index if not exists event_email_deliveries_event_idx
on public.event_email_deliveries(event_id, created_at desc);

alter table public.event_email_campaigns enable row level security;
alter table public.event_email_deliveries enable row level security;

drop policy if exists "Admins can read event email campaigns" on public.event_email_campaigns;
create policy "Admins can read event email campaigns"
on public.event_email_campaigns for select
to authenticated
using (public.has_site_permission('event_emails.send'));

drop policy if exists "Admins can read event email deliveries" on public.event_email_deliveries;
create policy "Admins can read event email deliveries"
on public.event_email_deliveries for select
to authenticated
using (public.has_site_permission('event_emails.send'));

-- Browser clients only need read access for history. Writes go through the
-- service-role Edge Function after its own permission check.
revoke insert, update, delete on public.event_email_campaigns from anon, authenticated;
revoke insert, update, delete on public.event_email_deliveries from anon, authenticated;
grant select on public.event_email_campaigns to authenticated;
grant select on public.event_email_deliveries to authenticated;

commit;
