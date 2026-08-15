-- EMAIL DELIVERY
-- Tracks transactional payment email delivery so webhook retries
-- do not repeatedly send the same messages.

alter table public.orders
  add column if not exists order_received_email_sent_at timestamptz,
  add column if not exists order_received_team_email_sent_at timestamptz,
  add column if not exists payment_confirmation_email_sent_at timestamptz,
  add column if not exists payment_confirmation_team_email_sent_at timestamptz,
  add column if not exists email_last_attempt_at timestamptz,
  add column if not exists email_last_error text;

alter table public.donations
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists team_email_sent_at timestamptz,
  add column if not exists email_last_attempt_at timestamptz,
  add column if not exists email_last_error text;
  