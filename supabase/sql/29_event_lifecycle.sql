-- EVENT LIFECYCLE
-- Registration consent, attendance/check-in, walk-ins, feedback delivery state,
-- public feedback context, and explicit attendance finalization.

-- ---------------------------------------------------------------------------
-- Event-level lifecycle settings
-- ---------------------------------------------------------------------------

alter table public.events
  add column if not exists feedback_enabled boolean not null default true,
  add column if not exists feedback_delay_hours integer not null default 24,
  add column if not exists feedback_questions jsonb not null default '[]'::jsonb,
  add column if not exists attendance_finalized_at timestamptz;

alter table public.events
  drop constraint if exists events_feedback_delay_hours_check;

alter table public.events
  add constraint events_feedback_delay_hours_check
  check (feedback_delay_hours >= 0 and feedback_delay_hours <= 720);

-- ---------------------------------------------------------------------------
-- Registration lifecycle state
-- ---------------------------------------------------------------------------

-- Walk-ins may not have an email address. Web registration still requires one
-- in register_for_event().
alter table public.event_registrations
  alter column email drop not null;

alter table public.event_registrations
  add column if not exists evaluation_consent boolean,
  add column if not exists future_contact_consent boolean,
  add column if not exists photo_consent boolean,
  add column if not exists consent_version text,
  add column if not exists attendance_status text not null default 'pending',
  add column if not exists checked_in_at timestamptz,
  add column if not exists registration_source text not null default 'web',
  add column if not exists feedback_token uuid,
  add column if not exists feedback_email_sent_at timestamptz,
  add column if not exists feedback_email_last_attempt_at timestamptz,
  add column if not exists feedback_email_last_error text,
  add column if not exists feedback_submitted_at timestamptz;

update public.event_registrations
set feedback_token = gen_random_uuid()
where feedback_token is null;

alter table public.event_registrations
  alter column feedback_token set default gen_random_uuid(),
  alter column feedback_token set not null;

alter table public.event_registrations
  drop constraint if exists event_registrations_attendance_status_check,
  drop constraint if exists event_registrations_registration_source_check;

alter table public.event_registrations
  add constraint event_registrations_attendance_status_check
  check (attendance_status in ('pending','attended','no_show')),
  add constraint event_registrations_registration_source_check
  check (registration_source in ('web','walk_in','staff'));

create unique index if not exists event_registrations_feedback_token_uidx
  on public.event_registrations(feedback_token);

create index if not exists event_registrations_event_attendance_idx
  on public.event_registrations(event_id, attendance_status);

-- Keep consent in first-class columns while retaining the original submitted
-- answer payload for audit/debugging. EventRegister writes consent under
-- answers._consent so the existing public-submission function remains compatible.
create or replace function public.sync_event_registration_consent()
returns trigger
language plpgsql
as $$
begin
  if jsonb_typeof(new.answers #> '{_consent,evaluation_consent}') = 'boolean' then
    new.evaluation_consent := (new.answers #>> '{_consent,evaluation_consent}')::boolean;
  else
    new.evaluation_consent := null;
  end if;

  if jsonb_typeof(new.answers #> '{_consent,future_contact_consent}') = 'boolean' then
    new.future_contact_consent := (new.answers #>> '{_consent,future_contact_consent}')::boolean;
  else
    new.future_contact_consent := null;
  end if;

  if jsonb_typeof(new.answers #> '{_consent,photo_consent}') = 'boolean' then
    new.photo_consent := (new.answers #>> '{_consent,photo_consent}')::boolean;
  else
    new.photo_consent := null;
  end if;

  new.consent_version := nullif(
    trim(coalesce(new.answers #>> '{_consent,consent_version}', '')),
    ''
  );

  return new;
end;
$$;

drop trigger if exists event_registrations_sync_consent
on public.event_registrations;

create trigger event_registrations_sync_consent
before insert or update of answers
on public.event_registrations
for each row
execute function public.sync_event_registration_consent();

-- Backfill consent columns from existing answer payloads, if any.
update public.event_registrations
set answers = answers
where answers ? '_consent';

-- ---------------------------------------------------------------------------
-- Feedback responses
-- ---------------------------------------------------------------------------

create table if not exists public.event_feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  registration_id uuid not null unique references public.event_registrations(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index if not exists event_feedback_event_id_idx
  on public.event_feedback(event_id);

alter table public.event_feedback enable row level security;

drop policy if exists "Site staff can read event feedback" on public.event_feedback;
create policy "Site staff can read event feedback"
on public.event_feedback for select
to authenticated
using (public.has_site_role(array['admin','editor']));

-- Public writes intentionally go through the event-feedback Edge Function.
-- No anon insert/update policy is created.

-- ---------------------------------------------------------------------------
-- Web registration guard: do not accept registrations after an event ends.
-- Same signature as the existing function, so public-submission remains
-- backwards compatible.
-- ---------------------------------------------------------------------------

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
  if length(trim(coalesce(p_name,''))) = 0
     or position('@' in lower(trim(coalesce(p_email,'')))) = 0 then
    raise exception 'Please provide your name and a valid email.' using errcode = '22023';
  end if;

  select * into e
  from public.events
  where id = p_event_id
    and status <> 'draft'
  for update;

  if not found then
    raise exception 'Event not found.' using errcode = 'P0002';
  end if;

  if e.status <> 'upcoming'
     or (e.ends_at is not null and e.ends_at <= now()) then
    raise exception 'Registration is closed for this event.' using errcode = '22023';
  end if;

  select count(*) into confirmed_count
  from public.event_registrations
  where event_id = e.id and status = 'confirmed';

  registration_status := case
    when e.capacity is not null and confirmed_count >= e.capacity then 'waitlist'
    else 'confirmed'
  end;

  insert into public.event_registrations (
    id,
    event_id,
    event_slug,
    event_title,
    name,
    email,
    phone,
    answers,
    status,
    attendance_status,
    registration_source
  ) values (
    new_id,
    e.id,
    e.slug,
    e.title,
    trim(p_name),
    lower(trim(p_email)),
    nullif(trim(coalesce(p_phone,'')), ''),
    coalesce(p_answers, '{}'::jsonb),
    registration_status,
    'pending',
    'web'
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

grant execute on function public.register_for_event(uuid,text,text,text,jsonb)
to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Staff operations
-- ---------------------------------------------------------------------------

create or replace function public.add_event_walk_in(
  p_event_id uuid,
  p_name text,
  p_email text default null,
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.events%rowtype;
  new_row public.event_registrations%rowtype;
begin
  if not public.has_site_role(array['admin','editor']) then
    raise exception 'Not authorized.' using errcode = '42501';
  end if;

  if length(trim(coalesce(p_name,''))) = 0 then
    raise exception 'Walk-in name is required.' using errcode = '22023';
  end if;

  select * into e
  from public.events
  where id = p_event_id;

  if not found then
    raise exception 'Event not found.' using errcode = 'P0002';
  end if;

  insert into public.event_registrations (
    event_id,
    event_slug,
    event_title,
    name,
    email,
    phone,
    answers,
    status,
    attendance_status,
    checked_in_at,
    registration_source
  ) values (
    e.id,
    e.slug,
    e.title,
    trim(p_name),
    nullif(lower(trim(coalesce(p_email,''))), ''),
    nullif(trim(coalesce(p_phone,'')), ''),
    '{}'::jsonb,
    'confirmed',
    'attended',
    now(),
    'walk_in'
  )
  returning * into new_row;

  return to_jsonb(new_row);
end;
$$;

grant execute on function public.add_event_walk_in(uuid,text,text,text)
to authenticated;

create or replace function public.finalize_event_attendance(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.events%rowtype;
  no_show_count integer;
begin
  if not public.has_site_role(array['admin','editor']) then
    raise exception 'Not authorized.' using errcode = '42501';
  end if;

  select * into e
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found.' using errcode = 'P0002';
  end if;

  if e.status <> 'past'
     and (e.ends_at is null or e.ends_at > now()) then
    raise exception 'Attendance can only be finalized after the event ends.' using errcode = '22023';
  end if;

  update public.event_registrations
  set attendance_status = 'no_show',
      checked_in_at = null
  where event_id = e.id
    and status = 'confirmed'
    and attendance_status = 'pending';

  get diagnostics no_show_count = row_count;

  update public.events
  set attendance_finalized_at = coalesce(attendance_finalized_at, now()),
      status = case
        when status = 'upcoming' and ends_at is not null and ends_at <= now() then 'past'
        else status
      end
  where id = e.id
  returning * into e;

  return jsonb_build_object(
    'event_id', e.id,
    'attendance_finalized_at', e.attendance_finalized_at,
    'new_no_show_count', no_show_count
  );
end;
$$;

grant execute on function public.finalize_event_attendance(uuid)
to authenticated;

-- ---------------------------------------------------------------------------
-- Public feedback context. The UUID token is intentionally the capability
-- required to open the feedback form; no participant PII is exposed by list.
-- ---------------------------------------------------------------------------

create or replace function public.get_event_feedback_context(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.event_registrations%rowtype;
  e public.events%rowtype;
  already_submitted boolean;
begin
  select * into r
  from public.event_registrations
  where feedback_token = p_token
  limit 1;

  if not found then
    return null;
  end if;

  select * into e
  from public.events
  where id = r.event_id
  limit 1;

  if not found
     or e.feedback_enabled is not true
     or e.attendance_finalized_at is null
     or r.status <> 'confirmed'
     or r.attendance_status <> 'attended'
     or e.ends_at is null
     or e.ends_at + make_interval(hours => e.feedback_delay_hours) > now() then
    return null;
  end if;

  select exists(
    select 1
    from public.event_feedback f
    where f.registration_id = r.id
  ) into already_submitted;

  return jsonb_build_object(
    'event_id', e.id,
    'event_slug', e.slug,
    'event_title', e.title,
    'name', r.name,
    'feedback_questions', e.feedback_questions,
    'already_submitted', already_submitted,
    'submitted_at', r.feedback_submitted_at
  );
end;
$$;

grant execute on function public.get_event_feedback_context(uuid)
to anon, authenticated;
