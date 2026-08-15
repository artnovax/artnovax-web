create table if not exists public.donations (
    id uuid primary key default gen_random_uuid(),

    amount_kes integer not null
        check (amount_kes >= 100),

    name text,
    email text,
    message text,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'paid',
                'failed',
                'expired',
                'cancelled'
            )
        ),

    stripe_session_id text unique,
    stripe_payment_intent_id text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.donations enable row level security;

drop policy if exists
    "Staff can read donations"
on public.donations;

create policy
    "Staff can read donations"
on public.donations
for select
to authenticated
using (
    public.has_site_role(array['admin', 'editor'])
);

drop policy if exists
    "Staff can update donations"
on public.donations;

create policy
    "Staff can update donations"
on public.donations
for update
to authenticated
using (
    public.has_site_role(array['admin', 'editor'])
)
with check (
    public.has_site_role(array['admin', 'editor'])
);

drop trigger if exists
    donations_set_updated_at
on public.donations;

create trigger donations_set_updated_at
before update on public.donations
for each row
execute function public.set_updated_at();


create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),

    customer jsonb not null,
    items jsonb not null,

    subtotal numeric(12,2) not null
        check (subtotal >= 0),

    shipping numeric(12,2) not null default 0
        check (shipping >= 0),

    total numeric(12,2) not null
        check (total >= 0),

    currency text not null default 'KES',

    payment_method text,

    payment_status text not null default 'pending',

    status text not null default 'pending',

    stripe_session_id text unique,
    stripe_payment_intent_id text,

    mpesa_phone text,
    mpesa_checkout_request_id text,
    mpesa_merchant_request_id text,
    mpesa_receipt text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists
    "Staff can read orders"
on public.orders;

create policy
    "Staff can read orders"
on public.orders
for select
to authenticated
using (
    public.has_site_role(array['admin', 'editor'])
);

drop policy if exists
    "Staff can update orders"
on public.orders;

create policy
    "Staff can update orders"
on public.orders
for update
to authenticated
using (
    public.has_site_role(array['admin', 'editor'])
)
with check (
    public.has_site_role(array['admin', 'editor'])
);

drop trigger if exists
    orders_set_updated_at
on public.orders;

create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();