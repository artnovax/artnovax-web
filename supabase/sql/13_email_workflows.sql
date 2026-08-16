-- Transactional email delivery state for non-payment workflows.

alter table public.contact_messages
  add column if not exists acknowledgement_email_sent_at timestamptz,
  add column if not exists team_email_sent_at timestamptz,
  add column if not exists email_last_attempt_at timestamptz,
  add column if not exists email_last_error text;

alter table public.partner_inquiries
  add column if not exists acknowledgement_email_sent_at timestamptz,
  add column if not exists team_email_sent_at timestamptz,
  add column if not exists email_last_attempt_at timestamptz,
  add column if not exists email_last_error text;

alter table public.volunteer_applications
  add column if not exists acknowledgement_email_sent_at timestamptz,
  add column if not exists team_email_sent_at timestamptz,
  add column if not exists email_last_attempt_at timestamptz,
  add column if not exists email_last_error text;

alter table public.event_registrations
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists team_email_sent_at timestamptz,
  add column if not exists reminders_sent_hours integer[] not null default '{}',
  add column if not exists email_last_attempt_at timestamptz,
  add column if not exists email_last_error text;
