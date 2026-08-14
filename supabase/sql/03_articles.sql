-- ARTICLES FEATURE: research/insight articles with staff CRUD.
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  topic text not null,
  title text not null,
  excerpt text,
  read text default '6 min read',
  updated text,
  hero text,
  lead text,
  blocks jsonb not null default '[]'::jsonb,
  takeaways text[] not null default '{}',
  tags text[] not null default '{}',
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.articles enable row level security;

drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles" on public.articles for select to anon, authenticated
using (status = 'published' or public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can create articles" on public.articles;
create policy "Site staff can create articles" on public.articles for insert to authenticated
with check (public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can update articles" on public.articles;
create policy "Site staff can update articles" on public.articles for update to authenticated
using (public.has_site_role(array['admin','editor'])) with check (public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can delete articles" on public.articles;
create policy "Site staff can delete articles" on public.articles for delete to authenticated
using (public.has_site_role(array['admin','editor']));

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at before update on public.articles
for each row execute function public.set_updated_at();
