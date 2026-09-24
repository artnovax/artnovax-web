-- PAYSTACK CARD PAYMENTS
--
-- Keeps legacy Stripe columns intact for historical data while new card
-- checkouts use Paystack. References are generated server-side and unique.

alter table public.orders
  add column if not exists paystack_reference text,
  add column if not exists paystack_transaction_id text,
  add column if not exists paystack_paid_at timestamptz;

alter table public.donations
  add column if not exists paystack_reference text,
  add column if not exists paystack_transaction_id text,
  add column if not exists paystack_paid_at timestamptz;

create unique index if not exists orders_paystack_reference_uidx
  on public.orders (paystack_reference)
  where paystack_reference is not null;

create unique index if not exists donations_paystack_reference_uidx
  on public.donations (paystack_reference)
  where paystack_reference is not null;
