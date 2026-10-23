-- ArtNovaX event waitlist management
-- Adds explicit waitlist open/closed state, secure promotion, and promotion-email audit fields.

alter table public.events
  add column if not exists waitlist_open boolean not null default true,
  add column if not exists waitlist_closed_at timestamptz,
  add column if not exists waitlist_closed_by uuid references auth.users(id) on delete set null;

alter table public.event_registrations
  add column if not exists promoted_from_waitlist_at timestamptz,
  add column if not exists promoted_from_waitlist_by uuid references auth.users(id) on delete set null,
  add column if not exists waitlist_promotion_email_sent_at timestamptz,
  add column if not exists waitlist_promotion_email_last_error text;

comment on column public.events.waitlist_open is
  'When false, new waitlist registrations are rejected once an event is full. Existing waitlisted registrations remain intact.';

comment on column public.event_registrations.promoted_from_waitlist_at is
  'Time a waitlisted registration was moved to confirmed.';

-- Public read helper used only to decide whether the full-event registration page
-- should show the waitlist form or the closed message.
create or replace function public.get_event_waitlist_open(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select e.waitlist_open from public.events e where e.id = p_event_id),
    false
  );
$$;

revoke all on function public.get_event_waitlist_open(uuid) from public;
grant execute on function public.get_event_waitlist_open(uuid) to anon, authenticated;

-- Enforce waitlist closure in the database as well as the UI. This protects
-- against direct requests and the capacity race where an event becomes full
-- between the browser loading and the registration RPC running.
create or replace function public.enforce_event_waitlist_open()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_open boolean;
begin
  if new.status = 'waitlist' then
    if tg_op = 'INSERT'
       or (tg_op = 'UPDATE' and old.status is distinct from 'waitlist') then
      select e.waitlist_open
        into v_open
        from public.events e
       where e.id = new.event_id;

      if coalesce(v_open, false) = false then
        raise exception using
          errcode = 'P0001',
          message = 'The waitlist for this event is closed.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists event_registrations_waitlist_open_guard
  on public.event_registrations;

create trigger event_registrations_waitlist_open_guard
before insert or update of status
on public.event_registrations
for each row
execute function public.enforce_event_waitlist_open();

-- Service-role-only promotion RPC. The event row is locked while capacity is
-- checked and registrations are promoted, preventing concurrent staff actions
-- from overfilling a capacity-limited event.
create or replace function public.promote_event_waitlist_registrations(
  p_event_id uuid,
  p_registration_ids uuid[],
  p_promoted_by uuid
)
returns setof public.event_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_status text;
  v_starts_at timestamptz;
  v_confirmed integer;
  v_waitlisted_selected integer;
begin
  if p_event_id is null then
    raise exception 'Event ID is required.';
  end if;

  if coalesce(array_length(p_registration_ids, 1), 0) = 0 then
    return;
  end if;

  select e.capacity, e.status, e.starts_at
    into v_capacity, v_status, v_starts_at
    from public.events e
   where e.id = p_event_id
   for update;

  if not found then
    raise exception 'Event not found.';
  end if;

  if v_status = 'past'
     or (v_starts_at is not null and v_starts_at <= now()) then
    raise exception 'Waitlisted participants cannot be promoted after the event has started.';
  end if;

  select count(*)
    into v_waitlisted_selected
    from public.event_registrations r
   where r.event_id = p_event_id
     and r.id = any(p_registration_ids)
     and r.status = 'waitlist';

  if v_waitlisted_selected = 0 then
    return;
  end if;

  if v_capacity is not null then
    select count(*)
      into v_confirmed
      from public.event_registrations r
     where r.event_id = p_event_id
       and r.status = 'confirmed';

    if v_confirmed + v_waitlisted_selected > v_capacity then
      raise exception
        'Only % confirmed spot(s) remain for this event.',
        greatest(v_capacity - v_confirmed, 0);
    end if;
  end if;

  return query
  update public.event_registrations r
     set status = 'confirmed',
         promoted_from_waitlist_at = now(),
         promoted_from_waitlist_by = p_promoted_by,
         attendance_status = 'pending',
         checked_in_at = null,
         reminders_sent_hours = '{}'::integer[],
         reminder_sent = false,
         reminder_sent_at = null,
         email_last_error = null
   where r.event_id = p_event_id
     and r.id = any(p_registration_ids)
     and r.status = 'waitlist'
  returning r.*;
end;
$$;

revoke all on function public.promote_event_waitlist_registrations(uuid, uuid[], uuid)
  from public, anon, authenticated;
grant execute on function public.promote_event_waitlist_registrations(uuid, uuid[], uuid)
  to service_role;
