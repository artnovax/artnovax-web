-- ArtNovaX volunteer application lifecycle management.
-- Safe to run after 02_volunteer.sql and 13_email_workflows.sql.
-- Adds a fuller recruitment pipeline, immutable activity history,
-- communication history, staff assignment, interview metadata, and
-- RPCs used by the Volunteer Operations admin workspace.

begin;

-- ---------------------------------------------------------------------------
-- 1) Expand the application lifecycle while preserving legacy rows.
-- ---------------------------------------------------------------------------

alter table public.volunteer_applications
  drop constraint if exists volunteer_applications_status_check;

-- Legacy "declined" becomes the clearer "rejected" lifecycle state.
update public.volunteer_applications
set status = 'rejected'
where status = 'declined';

alter table public.volunteer_applications
  add constraint volunteer_applications_status_check
  check (
    status in (
      'new',
      'reviewing',
      'shortlisted',
      'interview',
      'accepted',
      'onboarding',
      'onboarded',
      'rejected',
      'withdrawn',
      'archived'
    )
  );

alter table public.volunteer_applications
  add column if not exists updated_at timestamptz,
  add column if not exists last_activity_at timestamptz,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists assigned_to_label text,
  add column if not exists interview_at timestamptz,
  add column if not exists interview_timezone text,
  add column if not exists interview_duration_minutes integer,
  add column if not exists interview_location text,
  add column if not exists interview_notes text,
  add column if not exists decision_notes text,
  add column if not exists shortlisted_at timestamptz,
  add column if not exists interview_stage_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists withdrawn_at timestamptz,
  add column if not exists onboarding_started_at timestamptz,
  add column if not exists onboarded_at timestamptz,
  add column if not exists archived_at timestamptz;

update public.volunteer_applications
set
  updated_at = coalesce(updated_at, created_at, now()),
  last_activity_at = coalesce(last_activity_at, created_at, now()),
  interview_timezone = coalesce(nullif(trim(interview_timezone), ''), 'Africa/Nairobi'),
  interview_duration_minutes = coalesce(interview_duration_minutes, 30);

alter table public.volunteer_applications
  alter column updated_at set default now(),
  alter column updated_at set not null,
  alter column last_activity_at set default now(),
  alter column last_activity_at set not null,
  alter column interview_timezone set default 'Africa/Nairobi',
  alter column interview_duration_minutes set default 30;

alter table public.volunteer_applications
  drop constraint if exists volunteer_applications_interview_duration_check;

alter table public.volunteer_applications
  add constraint volunteer_applications_interview_duration_check
  check (
    interview_duration_minutes is null
    or interview_duration_minutes between 10 and 240
  );

create index if not exists volunteer_applications_status_idx
  on public.volunteer_applications(status);

create index if not exists volunteer_applications_role_status_idx
  on public.volunteer_applications(role_id, status);

create index if not exists volunteer_applications_assigned_to_idx
  on public.volunteer_applications(assigned_to);

create index if not exists volunteer_applications_last_activity_idx
  on public.volunteer_applications(last_activity_at desc);

-- Reuse the project's standard updated_at trigger helper from 00_admin_auth.sql.
drop trigger if exists volunteer_applications_set_updated_at
  on public.volunteer_applications;

create trigger volunteer_applications_set_updated_at
before update on public.volunteer_applications
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) Immutable application activity history.
-- ---------------------------------------------------------------------------

create table if not exists public.volunteer_application_activity (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.volunteer_applications(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_label text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists volunteer_application_activity_application_idx
  on public.volunteer_application_activity(application_id, created_at desc);

alter table public.volunteer_application_activity enable row level security;

drop policy if exists "Site staff can read volunteer application activity"
  on public.volunteer_application_activity;

create policy "Site staff can read volunteer application activity"
on public.volunteer_application_activity for select
to authenticated
using (public.has_site_role(array['admin','editor']));

-- Activity rows are intentionally append-only from the application.
-- The RPCs below and the service-role Edge Function write them.

-- Future submissions automatically receive an initial timeline event.
create or replace function public.log_volunteer_application_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.volunteer_application_activity (
    application_id,
    event_type,
    to_status,
    note,
    metadata,
    created_at
  ) values (
    new.id,
    'application_received',
    new.status,
    'Application received.',
    jsonb_build_object('source', 'website'),
    new.created_at
  );

  return new;
end;
$$;

revoke all on function public.log_volunteer_application_created() from public;

drop trigger if exists volunteer_application_created_activity
  on public.volunteer_applications;

create trigger volunteer_application_created_activity
after insert on public.volunteer_applications
for each row execute function public.log_volunteer_application_created();

-- Backfill an application-received event for pre-existing applications.
insert into public.volunteer_application_activity (
  application_id,
  event_type,
  to_status,
  note,
  metadata,
  created_at
)
select
  a.id,
  'application_received',
  a.status,
  'Application received.',
  jsonb_build_object('imported', true),
  a.created_at
from public.volunteer_applications a
where not exists (
  select 1
  from public.volunteer_application_activity activity
  where activity.application_id = a.id
    and activity.event_type = 'application_received'
);

-- ---------------------------------------------------------------------------
-- 3) Candidate communication log.
-- ---------------------------------------------------------------------------

create table if not exists public.volunteer_application_emails (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.volunteer_applications(id) on delete cascade,
  email_type text not null,
  recipient_email text not null,
  subject text not null,
  body_text text,
  delivery_status text not null default 'sent'
    check (delivery_status in ('sent','failed')),
  resend_email_id text,
  error text,
  sent_by uuid references auth.users(id) on delete set null,
  sent_by_label text,
  idempotency_key text not null unique,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists volunteer_application_emails_application_idx
  on public.volunteer_application_emails(application_id, created_at desc);

create index if not exists volunteer_application_emails_type_idx
  on public.volunteer_application_emails(application_id, email_type, delivery_status);

alter table public.volunteer_application_emails enable row level security;

drop policy if exists "Site staff can read volunteer application emails"
  on public.volunteer_application_emails;

create policy "Site staff can read volunteer application emails"
on public.volunteer_application_emails for select
to authenticated
using (public.has_site_role(array['admin','editor']));

-- Backfill acknowledgements that were already sent before this migration.
insert into public.volunteer_application_emails (
  application_id,
  email_type,
  recipient_email,
  subject,
  body_text,
  delivery_status,
  idempotency_key,
  sent_at,
  created_at
)
select
  a.id,
  'acknowledgement',
  a.email,
  'ArtNovaX volunteer application received',
  'Acknowledgement email sent before volunteer lifecycle tracking was enabled.',
  'sent',
  'legacy-volunteer-ack/' || a.id::text,
  a.acknowledgement_email_sent_at,
  a.acknowledgement_email_sent_at
from public.volunteer_applications a
where a.acknowledgement_email_sent_at is not null
on conflict (idempotency_key) do nothing;

-- Keep the existing public-submission acknowledgement flow unchanged while
-- automatically recording successful acknowledgement delivery in the new log.
create or replace function public.log_volunteer_acknowledgement_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_title text;
begin
  if new.acknowledgement_email_sent_at is not null
     and old.acknowledgement_email_sent_at is null then

    select title into v_role_title
    from public.volunteer_roles
    where id = new.role_id;

    insert into public.volunteer_application_emails (
      application_id,
      email_type,
      recipient_email,
      subject,
      body_text,
      delivery_status,
      idempotency_key,
      sent_at,
      created_at
    ) values (
      new.id,
      'acknowledgement',
      new.email,
      'ArtNovaX volunteer application — ' || coalesce(v_role_title, 'Volunteer role'),
      'Automatic application acknowledgement.',
      'sent',
      'volunteer-ack/' || new.id::text,
      new.acknowledgement_email_sent_at,
      new.acknowledgement_email_sent_at
    )
    on conflict (idempotency_key) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.log_volunteer_acknowledgement_email() from public;

drop trigger if exists volunteer_acknowledgement_email_activity
  on public.volunteer_applications;

create trigger volunteer_acknowledgement_email_activity
after update of acknowledgement_email_sent_at on public.volunteer_applications
for each row execute function public.log_volunteer_acknowledgement_email();

-- ---------------------------------------------------------------------------
-- 4) Staff-only lifecycle RPCs.
-- ---------------------------------------------------------------------------

-- Direct row updates are disabled for ordinary staff sessions. Lifecycle
-- mutation goes through the audited RPCs below instead.
drop policy if exists "Site staff can update volunteer applications"
  on public.volunteer_applications;

create or replace function public.transition_volunteer_application(
  p_application_id uuid,
  p_status text,
  p_note text default null,
  p_actor_label text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status text;
  v_row public.volunteer_applications%rowtype;
  v_now timestamptz := now();
begin
  if not public.has_site_role(array['admin','editor']) then
    raise exception 'Website staff access is required.' using errcode = '42501';
  end if;

  if p_status not in (
    'new','reviewing','shortlisted','interview','accepted','onboarding',
    'onboarded','rejected','withdrawn','archived'
  ) then
    raise exception 'Unsupported volunteer application status: %', p_status
      using errcode = '22023';
  end if;

  select status
  into v_old_status
  from public.volunteer_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Volunteer application not found.' using errcode = 'P0002';
  end if;

  if v_old_status = p_status then
    select * into v_row
    from public.volunteer_applications
    where id = p_application_id;

    return to_jsonb(v_row);
  end if;

  update public.volunteer_applications
  set
    status = p_status,
    last_activity_at = v_now,
    shortlisted_at = case
      when p_status = 'shortlisted' then coalesce(shortlisted_at, v_now)
      else shortlisted_at
    end,
    interview_stage_at = case
      when p_status = 'interview' then coalesce(interview_stage_at, v_now)
      else interview_stage_at
    end,
    accepted_at = case
      when p_status = 'accepted' then coalesce(accepted_at, v_now)
      else accepted_at
    end,
    rejected_at = case
      when p_status = 'rejected' then coalesce(rejected_at, v_now)
      else rejected_at
    end,
    withdrawn_at = case
      when p_status = 'withdrawn' then coalesce(withdrawn_at, v_now)
      else withdrawn_at
    end,
    onboarding_started_at = case
      when p_status = 'onboarding' then coalesce(onboarding_started_at, v_now)
      else onboarding_started_at
    end,
    onboarded_at = case
      when p_status = 'onboarded' then coalesce(onboarded_at, v_now)
      else onboarded_at
    end,
    archived_at = case
      when p_status = 'archived' then coalesce(archived_at, v_now)
      else archived_at
    end
  where id = p_application_id
  returning * into v_row;

  insert into public.volunteer_application_activity (
    application_id,
    event_type,
    from_status,
    to_status,
    actor_user_id,
    actor_label,
    note
  ) values (
    p_application_id,
    'status_changed',
    v_old_status,
    p_status,
    auth.uid(),
    nullif(trim(coalesce(p_actor_label, '')), ''),
    nullif(trim(coalesce(p_note, '')), '')
  );

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.transition_volunteer_application(uuid,text,text,text) from public;
grant execute on function public.transition_volunteer_application(uuid,text,text,text) to authenticated;

create or replace function public.list_volunteer_reviewers()
returns table (
  user_id uuid,
  email text,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_site_role(array['admin','editor']) then
    raise exception 'Website staff access is required.' using errcode = '42501';
  end if;

  return query
  select
    ur.user_id,
    coalesce(u.email::text, ur.user_id::text) as email,
    ur.role
  from public.user_roles ur
  left join auth.users u on u.id = ur.user_id
  where ur.role in ('admin','editor')
  order by lower(coalesce(u.email::text, ur.user_id::text));
end;
$$;

revoke all on function public.list_volunteer_reviewers() from public;
grant execute on function public.list_volunteer_reviewers() to authenticated;

create or replace function public.set_volunteer_application_assignee(
  p_application_id uuid,
  p_assignee_id uuid,
  p_actor_label text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.volunteer_applications%rowtype;
  v_assignee_label text;
begin
  if not public.has_site_role(array['admin','editor']) then
    raise exception 'Website staff access is required.' using errcode = '42501';
  end if;

  if p_assignee_id is not null then
    select coalesce(u.email::text, ur.user_id::text)
    into v_assignee_label
    from public.user_roles ur
    left join auth.users u on u.id = ur.user_id
    where ur.user_id = p_assignee_id
      and ur.role in ('admin','editor');

    if not found then
      raise exception 'The selected reviewer does not have website staff access.' using errcode = '22023';
    end if;
  end if;

  update public.volunteer_applications
  set
    assigned_to = p_assignee_id,
    assigned_to_label = case when p_assignee_id is null then null else v_assignee_label end,
    last_activity_at = now()
  where id = p_application_id
  returning * into v_row;

  if not found then
    raise exception 'Volunteer application not found.' using errcode = 'P0002';
  end if;

  insert into public.volunteer_application_activity (
    application_id,
    event_type,
    actor_user_id,
    actor_label,
    note,
    metadata
  ) values (
    p_application_id,
    'assignment_changed',
    auth.uid(),
    nullif(trim(coalesce(p_actor_label, '')), ''),
    case
      when p_assignee_id is null then 'Application unassigned.'
      else 'Application assigned to ' || v_assignee_label || '.'
    end,
    jsonb_build_object(
      'assigned_to', p_assignee_id,
      'assigned_to_label', v_assignee_label
    )
  );

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.set_volunteer_application_assignee(uuid,uuid,text) from public;
grant execute on function public.set_volunteer_application_assignee(uuid,uuid,text) to authenticated;

create or replace function public.assign_volunteer_application(
  p_application_id uuid,
  p_assign_to_self boolean,
  p_actor_label text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.volunteer_applications%rowtype;
  v_label text := nullif(trim(coalesce(p_actor_label, '')), '');
begin
  if not public.has_site_role(array['admin','editor']) then
    raise exception 'Website staff access is required.' using errcode = '42501';
  end if;

  update public.volunteer_applications
  set
    assigned_to = case when p_assign_to_self then auth.uid() else null end,
    assigned_to_label = case when p_assign_to_self then v_label else null end,
    last_activity_at = now()
  where id = p_application_id
  returning * into v_row;

  if not found then
    raise exception 'Volunteer application not found.' using errcode = 'P0002';
  end if;

  insert into public.volunteer_application_activity (
    application_id,
    event_type,
    actor_user_id,
    actor_label,
    note,
    metadata
  ) values (
    p_application_id,
    'assignment_changed',
    auth.uid(),
    v_label,
    case
      when p_assign_to_self then 'Application assigned to reviewer.'
      else 'Application unassigned.'
    end,
    jsonb_build_object(
      'assigned_to', case when p_assign_to_self then auth.uid()::text else null end,
      'assigned_to_label', case when p_assign_to_self then v_label else null end
    )
  );

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.assign_volunteer_application(uuid,boolean,text) from public;
grant execute on function public.assign_volunteer_application(uuid,boolean,text) to authenticated;

create or replace function public.add_volunteer_application_note(
  p_application_id uuid,
  p_note text,
  p_actor_label text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_note text := trim(coalesce(p_note, ''));
  v_row public.volunteer_applications%rowtype;
begin
  if not public.has_site_role(array['admin','editor']) then
    raise exception 'Website staff access is required.' using errcode = '42501';
  end if;

  if length(v_note) = 0 then
    raise exception 'Add a note before saving.' using errcode = '22023';
  end if;

  if length(v_note) > 5000 then
    raise exception 'Notes must be 5,000 characters or fewer.' using errcode = '22023';
  end if;

  update public.volunteer_applications
  set last_activity_at = now()
  where id = p_application_id
  returning * into v_row;

  if not found then
    raise exception 'Volunteer application not found.' using errcode = 'P0002';
  end if;

  insert into public.volunteer_application_activity (
    application_id,
    event_type,
    actor_user_id,
    actor_label,
    note
  ) values (
    p_application_id,
    'note',
    auth.uid(),
    nullif(trim(coalesce(p_actor_label, '')), ''),
    v_note
  );

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.add_volunteer_application_note(uuid,text,text) from public;
grant execute on function public.add_volunteer_application_note(uuid,text,text) to authenticated;

create or replace function public.save_volunteer_application_details(
  p_application_id uuid,
  p_interview_at timestamptz,
  p_interview_timezone text,
  p_interview_duration_minutes integer,
  p_interview_location text,
  p_interview_notes text,
  p_decision_notes text,
  p_actor_label text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text := coalesce(nullif(trim(coalesce(p_interview_timezone, '')), ''), 'Africa/Nairobi');
  v_duration integer := coalesce(p_interview_duration_minutes, 30);
  v_row public.volunteer_applications%rowtype;
begin
  if not public.has_site_role(array['admin','editor']) then
    raise exception 'Website staff access is required.' using errcode = '42501';
  end if;

  if v_duration < 10 or v_duration > 240 then
    raise exception 'Interview duration must be between 10 and 240 minutes.' using errcode = '22023';
  end if;

  update public.volunteer_applications
  set
    interview_at = p_interview_at,
    interview_timezone = v_timezone,
    interview_duration_minutes = v_duration,
    interview_location = nullif(trim(coalesce(p_interview_location, '')), ''),
    interview_notes = nullif(trim(coalesce(p_interview_notes, '')), ''),
    decision_notes = nullif(trim(coalesce(p_decision_notes, '')), ''),
    last_activity_at = now()
  where id = p_application_id
  returning * into v_row;

  if not found then
    raise exception 'Volunteer application not found.' using errcode = 'P0002';
  end if;

  insert into public.volunteer_application_activity (
    application_id,
    event_type,
    actor_user_id,
    actor_label,
    note,
    metadata
  ) values (
    p_application_id,
    'record_updated',
    auth.uid(),
    nullif(trim(coalesce(p_actor_label, '')), ''),
    'Application workflow details updated.',
    jsonb_build_object(
      'interview_at', p_interview_at,
      'interview_timezone', v_timezone,
      'interview_duration_minutes', v_duration,
      'interview_location', nullif(trim(coalesce(p_interview_location, '')), '')
    )
  );

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.save_volunteer_application_details(uuid,timestamptz,text,integer,text,text,text,text) from public;
grant execute on function public.save_volunteer_application_details(uuid,timestamptz,text,integer,text,text,text,text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) Service-role-only recording helpers used after Resend delivery.
--    These keep email history + stage transitions atomic after the external
--    email side effect has succeeded.
-- ---------------------------------------------------------------------------

create or replace function public.record_volunteer_email_delivery(
  p_application_id uuid,
  p_email_type text,
  p_recipient_email text,
  p_subject text,
  p_body_text text,
  p_resend_email_id text,
  p_idempotency_key text,
  p_actor_user_id uuid,
  p_actor_label text,
  p_transition_status text,
  p_interview_at timestamptz,
  p_interview_timezone text,
  p_interview_duration_minutes integer,
  p_interview_location text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous_delivery text;
  v_old_status text;
  v_email_id uuid;
  v_now timestamptz := now();
  v_transition text := nullif(trim(coalesce(p_transition_status, '')), '');
  v_timezone text := coalesce(nullif(trim(coalesce(p_interview_timezone, '')), ''), 'Africa/Nairobi');
  v_duration integer := coalesce(p_interview_duration_minutes, 30);
begin
  if v_transition is not null and v_transition not in (
    'new','reviewing','shortlisted','interview','accepted','onboarding',
    'onboarded','rejected','withdrawn','archived'
  ) then
    raise exception 'Unsupported volunteer application status: %', v_transition
      using errcode = '22023';
  end if;

  if v_duration < 10 or v_duration > 240 then
    raise exception 'Interview duration must be between 10 and 240 minutes.' using errcode = '22023';
  end if;

  if length(trim(coalesce(p_idempotency_key, ''))) = 0 then
    raise exception 'Email idempotency key is required.' using errcode = '22023';
  end if;

  select delivery_status
  into v_previous_delivery
  from public.volunteer_application_emails
  where idempotency_key = p_idempotency_key;

  select status
  into v_old_status
  from public.volunteer_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Volunteer application not found.' using errcode = 'P0002';
  end if;

  insert into public.volunteer_application_emails (
    application_id,
    email_type,
    recipient_email,
    subject,
    body_text,
    delivery_status,
    resend_email_id,
    error,
    sent_by,
    sent_by_label,
    idempotency_key,
    sent_at,
    created_at
  ) values (
    p_application_id,
    p_email_type,
    p_recipient_email,
    p_subject,
    p_body_text,
    'sent',
    p_resend_email_id,
    null,
    p_actor_user_id,
    nullif(trim(coalesce(p_actor_label, '')), ''),
    p_idempotency_key,
    v_now,
    v_now
  )
  on conflict (idempotency_key) do update
  set
    delivery_status = 'sent',
    resend_email_id = excluded.resend_email_id,
    error = null,
    sent_by = excluded.sent_by,
    sent_by_label = excluded.sent_by_label,
    sent_at = coalesce(public.volunteer_application_emails.sent_at, excluded.sent_at),
    subject = excluded.subject,
    body_text = excluded.body_text
  returning id into v_email_id;

  update public.volunteer_applications
  set
    status = coalesce(v_transition, status),
    interview_at = case
      when p_email_type = 'interview' then coalesce(p_interview_at, interview_at)
      else interview_at
    end,
    interview_timezone = case
      when p_email_type = 'interview' then v_timezone
      else interview_timezone
    end,
    interview_duration_minutes = case
      when p_email_type = 'interview' then v_duration
      else interview_duration_minutes
    end,
    interview_location = case
      when p_email_type = 'interview' then coalesce(nullif(trim(coalesce(p_interview_location, '')), ''), interview_location)
      else interview_location
    end,
    last_activity_at = v_now,
    email_last_attempt_at = v_now,
    email_last_error = null,
    shortlisted_at = case
      when v_transition = 'shortlisted' then coalesce(shortlisted_at, v_now)
      else shortlisted_at
    end,
    interview_stage_at = case
      when v_transition = 'interview' then coalesce(interview_stage_at, v_now)
      else interview_stage_at
    end,
    accepted_at = case
      when v_transition = 'accepted' then coalesce(accepted_at, v_now)
      else accepted_at
    end,
    rejected_at = case
      when v_transition = 'rejected' then coalesce(rejected_at, v_now)
      else rejected_at
    end,
    onboarding_started_at = case
      when v_transition = 'onboarding' then coalesce(onboarding_started_at, v_now)
      else onboarding_started_at
    end
  where id = p_application_id;

  if v_transition is not null and v_transition <> v_old_status then
    insert into public.volunteer_application_activity (
      application_id,
      event_type,
      from_status,
      to_status,
      actor_user_id,
      actor_label,
      note,
      metadata
    ) values (
      p_application_id,
      'status_changed',
      v_old_status,
      v_transition,
      p_actor_user_id,
      nullif(trim(coalesce(p_actor_label, '')), ''),
      'Stage updated when ' || p_email_type || ' email was sent.',
      jsonb_build_object('email_type', p_email_type, 'email_id', v_email_id)
    );
  end if;

  if coalesce(v_previous_delivery, '') <> 'sent' then
    insert into public.volunteer_application_activity (
      application_id,
      event_type,
      actor_user_id,
      actor_label,
      note,
      metadata
    ) values (
      p_application_id,
      'email_sent',
      p_actor_user_id,
      nullif(trim(coalesce(p_actor_label, '')), ''),
      'Sent ' || p_email_type || ' email to applicant.',
      jsonb_build_object(
        'email_type', p_email_type,
        'email_id', v_email_id,
        'recipient', p_recipient_email,
        'subject', p_subject
      )
    );
  end if;

  return jsonb_build_object(
    'application_id', p_application_id,
    'email_id', v_email_id,
    'status', coalesce(v_transition, v_old_status),
    'already_recorded', coalesce(v_previous_delivery, '') = 'sent'
  );
end;
$$;

revoke all on function public.record_volunteer_email_delivery(
  uuid,text,text,text,text,text,text,uuid,text,text,timestamptz,text,integer,text
) from public, anon, authenticated;
grant execute on function public.record_volunteer_email_delivery(
  uuid,text,text,text,text,text,text,uuid,text,text,timestamptz,text,integer,text
) to service_role;

create or replace function public.record_volunteer_email_failure(
  p_application_id uuid,
  p_email_type text,
  p_recipient_email text,
  p_subject text,
  p_body_text text,
  p_error text,
  p_idempotency_key text,
  p_actor_user_id uuid,
  p_actor_label text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  insert into public.volunteer_application_emails (
    application_id,
    email_type,
    recipient_email,
    subject,
    body_text,
    delivery_status,
    error,
    sent_by,
    sent_by_label,
    idempotency_key,
    created_at
  ) values (
    p_application_id,
    p_email_type,
    p_recipient_email,
    p_subject,
    p_body_text,
    'failed',
    p_error,
    p_actor_user_id,
    nullif(trim(coalesce(p_actor_label, '')), ''),
    p_idempotency_key,
    v_now
  )
  on conflict (idempotency_key) do update
  set
    error = excluded.error,
    sent_by = excluded.sent_by,
    sent_by_label = excluded.sent_by_label,
    subject = excluded.subject,
    body_text = excluded.body_text
  where public.volunteer_application_emails.delivery_status <> 'sent';

  update public.volunteer_applications
  set
    email_last_attempt_at = v_now,
    email_last_error = p_error,
    last_activity_at = v_now
  where id = p_application_id;

  insert into public.volunteer_application_activity (
    application_id,
    event_type,
    actor_user_id,
    actor_label,
    note,
    metadata
  ) values (
    p_application_id,
    'email_failed',
    p_actor_user_id,
    nullif(trim(coalesce(p_actor_label, '')), ''),
    'Email delivery failed.',
    jsonb_build_object(
      'email_type', p_email_type,
      'recipient', p_recipient_email,
      'error', p_error
    )
  );
end;
$$;

revoke all on function public.record_volunteer_email_failure(
  uuid,text,text,text,text,text,text,uuid,text
) from public, anon, authenticated;
grant execute on function public.record_volunteer_email_failure(
  uuid,text,text,text,text,text,text,uuid,text
) to service_role;

commit;
