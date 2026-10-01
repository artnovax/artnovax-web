-- AUTO-MOVE ENDED EVENTS TO PAST
-- Safe to rerun. Uses events.ends_at, not starts_at.

create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.mark_overdue_events_past()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.events
  set status = 'past'
  where status = 'upcoming'
    and ends_at is not null
    and ends_at <= now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Fix anything already overdue immediately.
select public.mark_overdue_events_past();

-- Keep exactly one copy of the scheduled job.
do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid
    from cron.job
    where jobname = 'mark-overdue-events-past'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'mark-overdue-events-past',
  '*/15 * * * *',
  $$select public.mark_overdue_events_past();$$
);
