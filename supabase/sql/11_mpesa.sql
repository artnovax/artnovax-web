-- M-PESA PAYMENT FEATURE
-- Extends the existing orders table created in 10_payments.sql.
-- No public RLS policies are added: Edge Functions own payment mutations.

alter table public.orders
  add column if not exists mpesa_result_code integer,
  add column if not exists mpesa_result_description text,
  add column if not exists mpesa_callback_received_at timestamptz;

create index if not exists orders_mpesa_checkout_request_id_idx
  on public.orders (mpesa_checkout_request_id);

create index if not exists orders_payment_status_idx
  on public.orders (payment_status);

create index if not exists orders_status_idx
  on public.orders (status);
