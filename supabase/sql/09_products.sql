-- SHOP CATALOG FEATURE: public active products + staff CRUD.
-- Checkout/payment execution remains server-side for now.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'KES',
  category text not null default 'All Products',
  img text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select to anon, authenticated
using (active or public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can create products" on public.products;
create policy "Site staff can create products" on public.products for insert to authenticated
with check (public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can update products" on public.products;
create policy "Site staff can update products" on public.products for update to authenticated
using (public.has_site_role(array['admin','editor'])) with check (public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can delete products" on public.products;
create policy "Site staff can delete products" on public.products for delete to authenticated
using (public.has_site_role(array['admin','editor']));

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
