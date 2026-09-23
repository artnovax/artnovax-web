-- MANUAL PAYMENT REFERENCES
--
-- Used while M-Pesa checkout relies on the public KCB Paybill instead of
-- Daraja STK Push. A customer-submitted reference is never authoritative:
-- the order remains pending until ArtNovaX verifies the incoming payment.

alter table public.orders
  add column if not exists manual_payment_reference text,
  add column if not exists manual_payment_reference_submitted_at timestamptz,
  add column if not exists manual_payment_reference_status text,
  add column if not exists manual_payment_verified_at timestamptz,
  add column if not exists manual_payment_verified_by uuid references auth.users(id);

create index if not exists orders_manual_payment_reference_idx
  on public.orders (manual_payment_reference)
  where manual_payment_reference is not null;

create index if not exists orders_manual_payment_reference_status_idx
  on public.orders (manual_payment_reference_status)
  where manual_payment_reference_status is not null;

-- No anon/public RLS policy is added. Public submission happens through the
-- submit-manual-payment-reference Edge Function, which validates the order ID,
-- payment method and customer email before writing via the service role.
