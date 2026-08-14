-- EVENTS FEATURE: public event content, registrations, admin CRUD, capacity/waitlist RPCs.
-- Safe to run after an earlier version of the events table: it uses IF NOT EXISTS where possible.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  theme text,
  date_text text,
  starts_at timestamptz,
  location text,
  audience text,
  tags text[] not null default '{}',
  body text,
  image_path text,
  status text not null default 'upcoming' check (status in ('upcoming','past','draft')),
  featured boolean not null default false,
  partners text[] not null default '{}',
  poster jsonb,
  capacity integer check (capacity is null or capacity >= 0),
  reminder_hours integer[] not null default '{48}',
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events add column if not exists starts_at timestamptz;
alter table public.events add column if not exists questions jsonb not null default '[]'::jsonb;
alter table public.events add column if not exists updated_at timestamptz not null default now();

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  event_slug text,
  event_title text,
  name text not null,
  email text not null,
  phone text,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'confirmed' check (status in ('confirmed','waitlist','cancelled')),
  reminder_sent boolean not null default false,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists event_registrations_event_id_idx on public.event_registrations(event_id);
create index if not exists event_registrations_created_at_idx on public.event_registrations(created_at desc);

alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

drop policy if exists "Public can read events" on public.events;
drop policy if exists "Admins and editors can create events" on public.events;
drop policy if exists "Admins and editors can update events" on public.events;
drop policy if exists "Admins and editors can delete events" on public.events;
drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events"
on public.events for select
to anon, authenticated
using (status <> 'draft' or public.has_site_role(array['admin','editor']));

drop policy if exists "Site staff can create events" on public.events;
create policy "Site staff can create events"
on public.events for insert
to authenticated
with check (public.has_site_role(array['admin','editor']));

drop policy if exists "Site staff can update events" on public.events;
create policy "Site staff can update events"
on public.events for update
to authenticated
using (public.has_site_role(array['admin','editor']))
with check (public.has_site_role(array['admin','editor']));

drop policy if exists "Site staff can delete events" on public.events;
create policy "Site staff can delete events"
on public.events for delete
to authenticated
using (public.has_site_role(array['admin','editor']));

drop policy if exists "Site staff can read registrations" on public.event_registrations;
create policy "Site staff can read registrations"
on public.event_registrations for select
to authenticated
using (public.has_site_role(array['admin','editor']));

drop policy if exists "Site staff can update registrations" on public.event_registrations;
create policy "Site staff can update registrations"
on public.event_registrations for update
to authenticated
using (public.has_site_role(array['admin','editor']))
with check (public.has_site_role(array['admin','editor']));

drop policy if exists "Site staff can delete registrations" on public.event_registrations;
create policy "Site staff can delete registrations"
on public.event_registrations for delete
to authenticated
using (public.has_site_role(array['admin','editor']));

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create or replace function public.get_public_event(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  e public.events%rowtype;
  confirmed_count integer;
  waitlist_count integer;
begin
  select * into e
  from public.events
  where (slug = p_slug or id::text = p_slug)
    and status <> 'draft'
  limit 1;

  if not found then
    return null;
  end if;

  select count(*) filter (where status = 'confirmed'),
         count(*) filter (where status = 'waitlist')
    into confirmed_count, waitlist_count
  from public.event_registrations
  where event_id = e.id;

  return to_jsonb(e) || jsonb_build_object(
    'registered_count', confirmed_count,
    'waitlist_count', waitlist_count,
    'spots_left', case when e.capacity is null then null else greatest(e.capacity - confirmed_count, 0) end,
    'is_full', case when e.capacity is null then false else confirmed_count >= e.capacity end
  );
end;
$$;

grant execute on function public.get_public_event(text) to anon, authenticated;

create or replace function public.register_for_event(
  p_event_id uuid,
  p_name text,
  p_email text,
  p_phone text default null,
  p_answers jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.events%rowtype;
  confirmed_count integer;
  registration_status text;
  new_id uuid := gen_random_uuid();
begin
  if length(trim(coalesce(p_name,''))) = 0 or position('@' in lower(trim(coalesce(p_email,'')))) = 0 then
    raise exception 'Please provide your name and a valid email.' using errcode = '22023';
  end if;

  select * into e from public.events where id = p_event_id and status <> 'draft' for update;
  if not found then
    raise exception 'Event not found.' using errcode = 'P0002';
  end if;

  select count(*) into confirmed_count
  from public.event_registrations
  where event_id = e.id and status = 'confirmed';

  registration_status := case
    when e.capacity is not null and confirmed_count >= e.capacity then 'waitlist'
    else 'confirmed'
  end;

  insert into public.event_registrations (
    id, event_id, event_slug, event_title, name, email, phone, answers, status
  ) values (
    new_id, e.id, e.slug, e.title, trim(p_name), lower(trim(p_email)), nullif(trim(coalesce(p_phone,'')), ''), coalesce(p_answers, '{}'::jsonb), registration_status
  );

  return jsonb_build_object(
    'id', new_id,
    'status', registration_status,
    'message', case when registration_status = 'confirmed'
      then 'You are registered.'
      else 'The event is full. You are on the waitlist.'
    end
  );
end;
$$;

grant execute on function public.register_for_event(uuid,text,text,text,jsonb) to anon, authenticated;
