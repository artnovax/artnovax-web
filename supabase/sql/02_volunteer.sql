-- VOLUNTEER FEATURE: public roles, applications, and staff CRUD/review.
create table if not exists public.volunteer_roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  department text,
  commitment text,
  location text,
  description text,
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  questions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.volunteer_roles(id) on delete restrict,
  name text not null,
  email text not null,
  phone text,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','reviewing','accepted','declined','archived')),
  created_at timestamptz not null default now()
);

alter table public.volunteer_roles enable row level security;
alter table public.volunteer_applications enable row level security;

drop policy if exists "Public can read active volunteer roles" on public.volunteer_roles;
create policy "Public can read active volunteer roles"
on public.volunteer_roles for select
to anon, authenticated
using (active or public.has_site_role(array['admin','editor']));

drop policy if exists "Site staff can create volunteer roles" on public.volunteer_roles;
create policy "Site staff can create volunteer roles" on public.volunteer_roles for insert to authenticated
with check (public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can update volunteer roles" on public.volunteer_roles;
create policy "Site staff can update volunteer roles" on public.volunteer_roles for update to authenticated
using (public.has_site_role(array['admin','editor'])) with check (public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can delete volunteer roles" on public.volunteer_roles;
create policy "Site staff can delete volunteer roles" on public.volunteer_roles for delete to authenticated
using (public.has_site_role(array['admin','editor']));

drop policy if exists "Anyone can submit volunteer applications" on public.volunteer_applications;
create policy "Anyone can submit volunteer applications" on public.volunteer_applications for insert to anon, authenticated
with check (length(trim(name)) > 0 and position('@' in email) > 0 and status = 'new');
drop policy if exists "Site staff can read volunteer applications" on public.volunteer_applications;
create policy "Site staff can read volunteer applications" on public.volunteer_applications for select to authenticated
using (public.has_site_role(array['admin','editor']));
drop policy if exists "Site staff can update volunteer applications" on public.volunteer_applications;
create policy "Site staff can update volunteer applications" on public.volunteer_applications for update to authenticated
using (public.has_site_role(array['admin','editor'])) with check (public.has_site_role(array['admin','editor']));

drop trigger if exists volunteer_roles_set_updated_at on public.volunteer_roles;
create trigger volunteer_roles_set_updated_at before update on public.volunteer_roles
for each row execute function public.set_updated_at();
