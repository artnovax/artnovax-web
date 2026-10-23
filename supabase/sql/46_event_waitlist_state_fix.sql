-- 46_event_waitlist_state_fix.sql
-- Harden the open/close write so the backend must return the persisted event row.

create or replace function public.set_event_waitlist_open(
  p_event_id uuid,
  p_open boolean,
  p_changed_by uuid
)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events;
begin
  if p_event_id is null then
    raise exception 'Event ID is required.';
  end if;

  if p_open is null then
    raise exception 'Waitlist state is required.';
  end if;

  update public.events
     set waitlist_open = p_open,
         waitlist_closed_at = case
           when p_open then null
           else now()
         end,
         waitlist_closed_by = case
           when p_open then null
           else p_changed_by
         end
   where id = p_event_id
  returning * into v_event;

  if v_event.id is null then
    raise exception 'Event not found or waitlist state could not be updated.';
  end if;

  if v_event.waitlist_open is distinct from p_open then
    raise exception
      'Waitlist state verification failed. Expected %, persisted %.',
      p_open,
      v_event.waitlist_open;
  end if;

  return v_event;
end;
$$;

revoke all on function public.set_event_waitlist_open(uuid, boolean, uuid)
  from public, anon, authenticated;

grant execute on function public.set_event_waitlist_open(uuid, boolean, uuid)
  to service_role;
