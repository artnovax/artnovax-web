-- EVENT SCHEDULING
-- Adds timezone, duration, and automatically calculated end time.

alter table public.events
  add column if not exists timezone text not null default 'Africa/Nairobi';

alter table public.events
  add column if not exists duration_minutes integer not null default 180;

alter table public.events
  add column if not exists ends_at timestamptz;

alter table public.events
  drop constraint if exists events_duration_minutes_check;

alter table public.events
  add constraint events_duration_minutes_check
  check (
    duration_minutes > 0
    and duration_minutes <= 1440
  );

create or replace function public.set_event_ends_at()
returns trigger
language plpgsql
as $$
begin
  if new.starts_at is null then
    new.ends_at := null;
  else
    new.ends_at :=
      new.starts_at
      + make_interval(mins => new.duration_minutes);
  end if;

  return new;
end;
$$;

drop trigger if exists events_set_ends_at
on public.events;

create trigger events_set_ends_at
before insert or update of starts_at, duration_minutes
on public.events
for each row
execute function public.set_event_ends_at();

-- Backfill existing events.
update public.events
set ends_at =
  starts_at + make_interval(mins => duration_minutes)
where starts_at is not null;