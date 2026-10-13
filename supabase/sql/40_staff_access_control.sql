-- ArtNovaX staff RBAC, temporary permission overrides, and admin access controls.
-- Run after the existing 00-39 SQL files.
--
-- Design principles:
--   * Roles are templates; per-user overrides can temporarily allow/deny non-admin permissions.
--   * Publishing, sending, and destructive content actions are admin-only permissions.
--   * Blocking a user or expiring their global access immediately disables all staff permissions.
--   * Existing admin/editor rows are preserved.

begin;

-- ---------------------------------------------------------------------------
-- 1) Role and permission catalog
-- ---------------------------------------------------------------------------

create table if not exists public.site_roles (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  name text not null,
  description text not null default '',
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.site_permissions (
  key text primary key check (key ~ '^[a-z0-9_.]+$'),
  category text not null,
  name text not null,
  description text not null default '',
  admin_only boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.site_role_permissions (
  role_key text not null references public.site_roles(key) on delete cascade,
  permission_key text not null references public.site_permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);

insert into public.site_roles (key, name, description, sort_order) values
  ('admin', 'Administrator', 'Full website administration. Publishing, sending, destructive actions and staff access management.', 10),
  ('editor', 'Editor', 'Broad draft-content and operations access without publishing or destructive privileges.', 20),
  ('content_editor', 'Content editor', 'Draft articles, newsletters, events and volunteer-role content plus media, without publishing.', 30),
  ('event_manager', 'Event manager', 'Draft event content and run event operations, registrations, attendance and feedback.', 40),
  ('recruitment_manager', 'Recruitment manager', 'Draft volunteer roles and manage the volunteer application lifecycle.', 50),
  ('operations', 'Operations', 'Combined event and volunteer operations access without publishing.', 60),
  ('community_manager', 'Community manager', 'Manage the waitlist, contact inbox and partnership enquiries.', 70),
  ('finance', 'Finance', 'Review and manage payment and order records without website publishing access.', 80),
  ('reviewer', 'Reviewer', 'Read-only access to editorial drafts for review; no publishing or operational changes.', 90)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.site_permissions (key, category, name, description, admin_only, sort_order) values
  ('cms.access', 'General', 'CMS access', 'Sign in to the ArtNovaX website CMS.', false, 10),
  ('access.manage', 'General', 'Manage staff access', 'Assign roles, block access and manage permission overrides.', true, 20),

  ('media.read', 'Media', 'View media library', 'Browse and select images from the media library.', false, 10),
  ('media.write', 'Media', 'Upload and edit media', 'Upload images and edit image metadata.', false, 20),
  ('media.delete', 'Media', 'Delete media', 'Permanently delete media-library assets.', true, 30),

  ('events.read', 'Events', 'View events and drafts', 'View event records including drafts.', false, 10),
  ('events.write', 'Events', 'Create and edit event drafts', 'Create draft events and edit draft event content.', false, 20),
  ('events.publish', 'Events', 'Publish events', 'Make event content public, unpublish it, or edit already-public event content.', true, 30),
  ('events.delete', 'Events', 'Delete events', 'Permanently delete events.', true, 40),
  ('events.operations', 'Events', 'Event operations', 'Manage reminders, questions, feedback settings and attendance workflows.', false, 50),
  ('registrations.read', 'Events', 'View registrations', 'View event registrations and event feedback.', false, 60),
  ('registrations.manage', 'Events', 'Manage registrations', 'Update attendance, add walk-ins and finalize attendance.', false, 70),

  ('volunteer_roles.read', 'Volunteers', 'View volunteer roles', 'View active and draft volunteer roles.', false, 10),
  ('volunteer_roles.write', 'Volunteers', 'Create and edit role drafts', 'Create hidden volunteer roles and edit hidden role content.', false, 20),
  ('volunteer_roles.publish', 'Volunteers', 'Publish volunteer roles', 'Make roles visible to applicants or edit already-visible roles.', true, 30),
  ('volunteer_roles.delete', 'Volunteers', 'Delete volunteer roles', 'Permanently delete volunteer roles.', true, 40),
  ('volunteer_applications.read', 'Volunteers', 'View volunteer applications', 'View applications, notes, activity and communication history.', false, 50),
  ('volunteer_applications.manage', 'Volunteers', 'Manage volunteer applications', 'Change stages, assign reviewers, add notes, schedule interviews and send lifecycle emails.', false, 60),

  ('articles.read', 'Articles', 'View article drafts', 'View published and draft research/articles.', false, 10),
  ('articles.write', 'Articles', 'Create and edit article drafts', 'Create drafts and edit unpublished article content.', false, 20),
  ('articles.publish', 'Articles', 'Publish articles', 'Publish/unpublish articles or edit already-published article content.', true, 30),
  ('articles.delete', 'Articles', 'Delete articles', 'Permanently delete articles.', true, 40),

  ('newsletters.read', 'Newsletters', 'View newsletter drafts', 'View published and draft newsletter issues.', false, 10),
  ('newsletters.write', 'Newsletters', 'Create and edit newsletter drafts', 'Create drafts and edit unpublished newsletter content.', false, 20),
  ('newsletters.publish', 'Newsletters', 'Publish newsletters', 'Publish/unpublish newsletter issues or edit already-published issues.', true, 30),
  ('newsletters.send', 'Newsletters', 'Send newsletter broadcasts', 'Send a published issue to the subscriber audience.', true, 40),
  ('newsletters.delete', 'Newsletters', 'Delete newsletter issues', 'Permanently delete newsletter issues.', true, 50),
  ('newsletter_subscribers.read', 'Newsletters', 'View subscribers', 'View newsletter subscriber email addresses.', false, 60),

  ('waitlist.read', 'Operations', 'View app waitlist', 'View early-access waitlist records.', false, 10),
  ('waitlist.manage', 'Operations', 'Manage app waitlist', 'Update or remove waitlist records.', false, 20),
  ('messages.read', 'Operations', 'View contact messages', 'View website contact messages.', false, 30),
  ('messages.manage', 'Operations', 'Manage contact messages', 'Update contact-message workflow status.', false, 40),
  ('partners.read', 'Operations', 'View partner enquiries', 'View partnership enquiries.', false, 50),
  ('partners.manage', 'Operations', 'Manage partner enquiries', 'Update partnership enquiry workflow status.', false, 60),
  ('payments.read', 'Operations', 'View payments and orders', 'View donation/order payment records.', false, 70),
  ('payments.manage', 'Operations', 'Manage payments and orders', 'Update payment/order records and confirm manual payments.', false, 80),

  ('team.publish', 'Public website', 'Manage public team profiles', 'Create, edit or delete public team profiles. Changes are immediately public.', true, 10),
  ('products.publish', 'Public website', 'Manage public products', 'Create, edit or delete public shop products. Changes are immediately public.', true, 20),
  ('pages.home.publish', 'Public website', 'Publish Home page changes', 'Edit public Home page CMS content.', true, 30),
  ('pages.about.publish', 'Public website', 'Publish About page changes', 'Edit public About page CMS content.', true, 31),
  ('pages.our_work.publish', 'Public website', 'Publish Our Work page changes', 'Edit public Our Work page CMS content.', true, 32),
  ('pages.events.publish', 'Public website', 'Publish Events page changes', 'Edit public Events landing-page CMS content.', true, 33),
  ('pages.research.publish', 'Public website', 'Publish Research page changes', 'Edit public Research page CMS content.', true, 34),
  ('pages.app.publish', 'Public website', 'Publish App page changes', 'Edit public App page CMS content.', true, 35),
  ('pages.get_involved.publish', 'Public website', 'Publish Get Involved page changes', 'Edit public Get Involved page CMS content.', true, 36),
  ('pages.contact.publish', 'Public website', 'Publish Contact page changes', 'Edit public Contact page CMS content.', true, 37),
  ('pages.shop.publish', 'Public website', 'Publish Shop page changes', 'Edit public Shop page CMS content.', true, 38),
  ('pages.support.publish', 'Public website', 'Publish Support page changes', 'Edit public Support page CMS content.', true, 39),
  ('pages.volunteer.publish', 'Public website', 'Publish Volunteer page changes', 'Edit public Volunteer page CMS content.', true, 40),
  ('pages.partner.publish', 'Public website', 'Publish Partner page changes', 'Edit public Partner page CMS content.', true, 41),
  ('pages.information.publish', 'Public website', 'Publish information-page changes', 'Edit Privacy, Terms, Accessibility and similar public information pages.', true, 42)
on conflict (key) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  admin_only = excluded.admin_only,
  sort_order = excluded.sort_order;

-- Existing user_roles becomes the user's primary role + global access switch.
alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add column if not exists is_active boolean not null default true;
alter table public.user_roles add column if not exists access_expires_at timestamptz;
alter table public.user_roles add column if not exists blocked_reason text;
alter table public.user_roles add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_roles_role_fkey'
      and conrelid = 'public.user_roles'::regclass
  ) then
    alter table public.user_roles
      add constraint user_roles_role_fkey
      foreign key (role) references public.site_roles(key);
  end if;
end;
$$;

create table if not exists public.user_permission_overrides (
  user_id uuid not null references auth.users(id) on delete cascade,
  permission_key text not null references public.site_permissions(key) on delete cascade,
  allowed boolean not null,
  expires_at timestamptz,
  note text,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, permission_key)
);

create index if not exists user_permission_overrides_expiry_idx
on public.user_permission_overrides(expires_at)
where expires_at is not null;

-- Role templates are deliberately conservative. Admin is populated from the
-- complete permission catalog so future permissions default to admin-only
-- until deliberately assigned to another role.
delete from public.site_role_permissions
where role_key in ('admin','editor','content_editor','event_manager','recruitment_manager','operations','community_manager','finance','reviewer');

insert into public.site_role_permissions (role_key, permission_key)
select 'admin', key from public.site_permissions
on conflict do nothing;

insert into public.site_role_permissions (role_key, permission_key) values
  ('editor','cms.access'),
  ('editor','media.read'),('editor','media.write'),
  ('editor','events.read'),('editor','events.write'),('editor','events.operations'),
  ('editor','registrations.read'),('editor','registrations.manage'),
  ('editor','volunteer_roles.read'),('editor','volunteer_roles.write'),
  ('editor','volunteer_applications.read'),('editor','volunteer_applications.manage'),
  ('editor','articles.read'),('editor','articles.write'),
  ('editor','newsletters.read'),('editor','newsletters.write'),

  ('content_editor','cms.access'),
  ('content_editor','media.read'),('content_editor','media.write'),
  ('content_editor','events.read'),('content_editor','events.write'),
  ('content_editor','volunteer_roles.read'),('content_editor','volunteer_roles.write'),
  ('content_editor','articles.read'),('content_editor','articles.write'),
  ('content_editor','newsletters.read'),('content_editor','newsletters.write'),

  ('event_manager','cms.access'),
  ('event_manager','media.read'),('event_manager','media.write'),
  ('event_manager','events.read'),('event_manager','events.write'),('event_manager','events.operations'),
  ('event_manager','registrations.read'),('event_manager','registrations.manage'),

  ('recruitment_manager','cms.access'),
  ('recruitment_manager','volunteer_roles.read'),('recruitment_manager','volunteer_roles.write'),
  ('recruitment_manager','volunteer_applications.read'),('recruitment_manager','volunteer_applications.manage'),

  ('operations','cms.access'),
  ('operations','events.read'),('operations','events.operations'),
  ('operations','registrations.read'),('operations','registrations.manage'),
  ('operations','volunteer_roles.read'),
  ('operations','volunteer_applications.read'),('operations','volunteer_applications.manage'),

  ('community_manager','cms.access'),
  ('community_manager','waitlist.read'),('community_manager','waitlist.manage'),
  ('community_manager','messages.read'),('community_manager','messages.manage'),
  ('community_manager','partners.read'),('community_manager','partners.manage'),

  ('finance','cms.access'),
  ('finance','payments.read'),('finance','payments.manage'),

  ('reviewer','cms.access'),
  ('reviewer','media.read'),
  ('reviewer','events.read'),('reviewer','volunteer_roles.read'),
  ('reviewer','articles.read'),('reviewer','newsletters.read')
on conflict do nothing;

-- New permissions automatically belong to administrators. Role mappings are
-- also guarded so an admin-only permission can never be attached to a
-- non-admin role by application code or a future migration mistake.
create or replace function public.grant_new_site_permission_to_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_role_permissions (role_key, permission_key)
  values ('admin', new.key)
  on conflict do nothing;
  return new;
end;
$$;

revoke all on function public.grant_new_site_permission_to_admin() from public;

drop trigger if exists site_permissions_grant_admin on public.site_permissions;
create trigger site_permissions_grant_admin
after insert on public.site_permissions
for each row execute function public.grant_new_site_permission_to_admin();

create or replace function public.guard_admin_only_role_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_admin_only boolean;
begin
  select admin_only into v_admin_only
  from public.site_permissions
  where key = new.permission_key;

  if coalesce(v_admin_only, false) and new.role_key <> 'admin' then
    raise exception 'Admin-only permissions cannot be assigned to non-admin role templates.' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_admin_only_role_permission() from public;

drop trigger if exists site_role_permissions_admin_only_guard on public.site_role_permissions;
create trigger site_role_permissions_admin_only_guard
before insert or update on public.site_role_permissions
for each row execute function public.guard_admin_only_role_permission();

-- ---------------------------------------------------------------------------
-- 2) Permission evaluation
-- ---------------------------------------------------------------------------

create or replace function public.user_has_site_permission_internal(
  p_user_id uuid,
  p_permission text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_override boolean;
  v_admin_only boolean;
begin
  select role into v_role
  from public.user_roles
  where user_id = p_user_id
    and is_active
    and (access_expires_at is null or access_expires_at > now());

  if not found then
    return false;
  end if;

  select admin_only into v_admin_only
  from public.site_permissions
  where key = p_permission;

  if not found then
    return false;
  end if;

  -- Publication/destructive permissions are an invariant, not just a UI rule.
  -- A non-admin can never receive an admin-only permission through a role or override.
  if v_admin_only and v_role <> 'admin' then
    return false;
  end if;

  select allowed into v_override
  from public.user_permission_overrides
  where user_id = p_user_id
    and permission_key = p_permission
    and (expires_at is null or expires_at > now());

  if found then
    return v_override;
  end if;

  return exists (
    select 1
    from public.site_role_permissions
    where role_key = v_role
      and permission_key = p_permission
  );
end;
$$;

revoke all on function public.user_has_site_permission_internal(uuid,text) from public;

create or replace function public.user_effective_permissions_internal(p_user_id uuid)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(p.key order by p.category, p.sort_order, p.key), '{}'::text[])
  from public.site_permissions p
  where public.user_has_site_permission_internal(p_user_id, p.key);
$$;

revoke all on function public.user_effective_permissions_internal(uuid) from public;

create or replace function public.has_site_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_site_permission_internal(auth.uid(), p_permission);
$$;

revoke all on function public.has_site_permission(text) from public;
grant execute on function public.has_site_permission(text) to anon, authenticated;

create or replace function public.has_any_site_permission(p_permissions text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from unnest(coalesce(p_permissions, '{}'::text[])) p
    where public.user_has_site_permission_internal(auth.uid(), p)
  );
$$;

revoke all on function public.has_any_site_permission(text[]) from public;
grant execute on function public.has_any_site_permission(text[]) to anon, authenticated;

-- Service-role helper for Edge Functions. Ordinary browser sessions cannot call it.
create or replace function public.user_has_site_permission(p_user_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_site_permission_internal(p_user_id, p_permission);
$$;

revoke all on function public.user_has_site_permission(uuid,text) from public, anon, authenticated;
grant execute on function public.user_has_site_permission(uuid,text) to service_role;

-- Keep legacy SQL/RPCs block-aware while the new policies use permissions.
create or replace function public.has_site_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and is_active
      and (access_expires_at is null or access_expires_at > now())
      and role = any(required_roles)
  );
$$;

revoke all on function public.has_site_role(text[]) from public;
grant execute on function public.has_site_role(text[]) to anon, authenticated;

create or replace function public.get_my_site_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role public.user_roles%rowtype;
  v_role_name text;
  v_effective_active boolean;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'active', false,
      'role', null,
      'roleName', null,
      'accessExpiresAt', null,
      'permissions', '[]'::jsonb
    );
  end if;

  select * into v_role
  from public.user_roles
  where user_id = auth.uid();

  if not found then
    return jsonb_build_object(
      'active', false,
      'role', null,
      'roleName', null,
      'accessExpiresAt', null,
      'permissions', '[]'::jsonb
    );
  end if;

  select name into v_role_name from public.site_roles where key = v_role.role;
  v_effective_active := v_role.is_active
    and (v_role.access_expires_at is null or v_role.access_expires_at > now());

  return jsonb_build_object(
    'active', v_effective_active,
    'role', v_role.role,
    'roleName', v_role_name,
    'accessExpiresAt', v_role.access_expires_at,
    'blockedReason', v_role.blocked_reason,
    'permissions', to_jsonb(
      case when v_effective_active
        then public.user_effective_permissions_internal(auth.uid())
        else '{}'::text[]
      end
    )
  );
end;
$$;

revoke all on function public.get_my_site_access() from public;
grant execute on function public.get_my_site_access() to authenticated;

-- Prevent a direct override from bypassing the admin-only invariant.
create or replace function public.guard_admin_only_permission_override()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_only boolean;
  v_role text;
begin
  select admin_only into v_admin_only
  from public.site_permissions
  where key = new.permission_key;

  select role into v_role
  from public.user_roles
  where user_id = new.user_id;

  if new.allowed and coalesce(v_admin_only, false) and v_role <> 'admin' then
    raise exception 'This permission is restricted to administrators.' using errcode = '42501';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.guard_admin_only_permission_override() from public;

drop trigger if exists user_permission_overrides_guard on public.user_permission_overrides;
create trigger user_permission_overrides_guard
before insert or update on public.user_permission_overrides
for each row execute function public.guard_admin_only_permission_override();

-- ---------------------------------------------------------------------------
-- 3) Admin-only staff access RPCs
-- ---------------------------------------------------------------------------

create or replace function public.admin_get_access_catalog()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role_permissions jsonb;
begin
  if not public.has_site_permission('access.manage') then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;

  select coalesce(jsonb_object_agg(x.key, x.permissions), '{}'::jsonb)
  into v_role_permissions
  from (
    select
      r.key,
      coalesce(to_jsonb(array_agg(rp.permission_key order by p.category, p.sort_order, rp.permission_key)
        filter (where rp.permission_key is not null)), '[]'::jsonb) as permissions
    from public.site_roles r
    left join public.site_role_permissions rp on rp.role_key = r.key
    left join public.site_permissions p on p.key = rp.permission_key
    group by r.key
  ) x;

  return jsonb_build_object(
    'roles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', key,
        'name', name,
        'description', description,
        'sortOrder', sort_order
      ) order by sort_order, name)
      from public.site_roles
    ), '[]'::jsonb),
    'permissions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', key,
        'category', category,
        'name', name,
        'description', description,
        'admin_only', admin_only,
        'sortOrder', sort_order
      ) order by category, sort_order, name)
      from public.site_permissions
    ), '[]'::jsonb),
    'rolePermissions', v_role_permissions
  );
end;
$$;

revoke all on function public.admin_get_access_catalog() from public;
grant execute on function public.admin_get_access_catalog() to authenticated;

create or replace function public.admin_list_staff_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.has_site_permission('access.manage') then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'user_id', ur.user_id,
      'email', coalesce(u.email::text, ur.user_id::text),
      'role', ur.role,
      'role_name', sr.name,
      'active', ur.is_active and (ur.access_expires_at is null or ur.access_expires_at > now()),
      'configured_active', ur.is_active,
      'access_expires_at', ur.access_expires_at,
      'blocked_reason', ur.blocked_reason,
      'created_at', ur.created_at,
      'last_sign_in_at', u.last_sign_in_at,
      'effective_permissions', to_jsonb(public.user_effective_permissions_internal(ur.user_id)),
      'overrides', coalesce((
        select jsonb_agg(jsonb_build_object(
          'permission', o.permission_key,
          'allowed', o.allowed,
          'expires_at', o.expires_at,
          'note', o.note,
          'granted_by', o.granted_by
        ) order by o.permission_key)
        from public.user_permission_overrides o
        where o.user_id = ur.user_id
          and (o.expires_at is null or o.expires_at > now())
      ), '[]'::jsonb)
    ) order by lower(coalesce(u.email::text, ur.user_id::text))
  ), '[]'::jsonb)
  into v_result
  from public.user_roles ur
  join public.site_roles sr on sr.key = ur.role
  left join auth.users u on u.id = ur.user_id;

  return v_result;
end;
$$;

revoke all on function public.admin_list_staff_access() from public;
grant execute on function public.admin_list_staff_access() to authenticated;

create or replace function public.admin_add_staff_access(
  p_email text,
  p_role text,
  p_access_expires_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_row public.user_roles%rowtype;
begin
  if not public.has_site_permission('access.manage') then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.site_roles where key = p_role) then
    raise exception 'Unknown role: %', p_role using errcode = '22023';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email::text) = lower(trim(coalesce(p_email, '')))
  limit 1;

  if v_user_id is null then
    raise exception 'No Supabase Authentication user exists for that email. Invite the user first.' using errcode = 'P0002';
  end if;

  insert into public.user_roles (user_id, role, is_active, access_expires_at, blocked_reason, updated_at)
  values (v_user_id, p_role, true, p_access_expires_at, null, now())
  on conflict (user_id) do update
  set role = excluded.role,
      is_active = true,
      access_expires_at = excluded.access_expires_at,
      blocked_reason = null,
      updated_at = now()
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.admin_add_staff_access(text,text,timestamptz) from public;
grant execute on function public.admin_add_staff_access(text,text,timestamptz) to authenticated;

create or replace function public.admin_set_staff_role(p_user_id uuid, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.user_roles%rowtype;
begin
  if not public.has_site_permission('access.manage') then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own administrator role from this screen.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.site_roles where key = p_role) then
    raise exception 'Unknown role: %', p_role using errcode = '22023';
  end if;

  update public.user_roles
  set role = p_role, updated_at = now()
  where user_id = p_user_id
  returning * into v_row;

  if not found then raise exception 'Staff user not found.' using errcode = 'P0002'; end if;

  -- Remove stale admin-only positive overrides when demoting a user.
  if p_role <> 'admin' then
    delete from public.user_permission_overrides o
    using public.site_permissions p
    where o.user_id = p_user_id
      and o.permission_key = p.key
      and o.allowed
      and p.admin_only;
  end if;

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.admin_set_staff_role(uuid,text) from public;
grant execute on function public.admin_set_staff_role(uuid,text) to authenticated;

create or replace function public.admin_set_staff_active(
  p_user_id uuid,
  p_active boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.user_roles%rowtype;
begin
  if not public.has_site_permission('access.manage') then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() and not p_active then
    raise exception 'You cannot block your own administrator access.' using errcode = '42501';
  end if;

  update public.user_roles
  set is_active = p_active,
      blocked_reason = case when p_active then null else nullif(trim(coalesce(p_reason, '')), '') end,
      updated_at = now()
  where user_id = p_user_id
  returning * into v_row;

  if not found then raise exception 'Staff user not found.' using errcode = 'P0002'; end if;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.admin_set_staff_active(uuid,boolean,text) from public;
grant execute on function public.admin_set_staff_active(uuid,boolean,text) to authenticated;

create or replace function public.admin_set_staff_access_expiry(
  p_user_id uuid,
  p_access_expires_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.user_roles%rowtype;
begin
  if not public.has_site_permission('access.manage') then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Change another administrator''s expiry, not your own.' using errcode = '42501';
  end if;

  update public.user_roles
  set access_expires_at = p_access_expires_at, updated_at = now()
  where user_id = p_user_id
  returning * into v_row;

  if not found then raise exception 'Staff user not found.' using errcode = 'P0002'; end if;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.admin_set_staff_access_expiry(uuid,timestamptz) from public;
grant execute on function public.admin_set_staff_access_expiry(uuid,timestamptz) to authenticated;

create or replace function public.admin_set_permission_override(
  p_user_id uuid,
  p_permission text,
  p_allowed boolean,
  p_expires_at timestamptz default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_permission public.site_permissions%rowtype;
  v_target_role text;
  v_row public.user_permission_overrides%rowtype;
begin
  if not public.has_site_permission('access.manage') then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;

  select * into v_permission from public.site_permissions where key = p_permission;
  if not found then raise exception 'Unknown permission: %', p_permission using errcode = '22023'; end if;

  select role into v_target_role from public.user_roles where user_id = p_user_id;
  if not found then raise exception 'Staff user not found.' using errcode = 'P0002'; end if;

  if p_allowed and v_permission.admin_only and v_target_role <> 'admin' then
    raise exception 'Publishing/destructive administrator permissions cannot be granted to non-admin roles.' using errcode = '42501';
  end if;

  if p_user_id = auth.uid()
     and p_permission in ('access.manage', 'cms.access')
     and not p_allowed then
    raise exception 'You cannot remove your own CMS/access-management permission.' using errcode = '42501';
  end if;

  insert into public.user_permission_overrides (
    user_id, permission_key, allowed, expires_at, note, granted_by, updated_at
  ) values (
    p_user_id, p_permission, p_allowed, p_expires_at,
    nullif(trim(coalesce(p_note, '')), ''), auth.uid(), now()
  )
  on conflict (user_id, permission_key) do update
  set allowed = excluded.allowed,
      expires_at = excluded.expires_at,
      note = excluded.note,
      granted_by = auth.uid(),
      updated_at = now()
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.admin_set_permission_override(uuid,text,boolean,timestamptz,text) from public;
grant execute on function public.admin_set_permission_override(uuid,text,boolean,timestamptz,text) to authenticated;

create or replace function public.admin_clear_permission_override(p_user_id uuid, p_permission text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_site_permission('access.manage') then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;
  delete from public.user_permission_overrides
  where user_id = p_user_id and permission_key = p_permission;
  return true;
end;
$$;

revoke all on function public.admin_clear_permission_override(uuid,text) from public;
grant execute on function public.admin_clear_permission_override(uuid,text) to authenticated;

-- Access catalog tables are administered only through the RPCs above.
alter table public.site_roles enable row level security;
alter table public.site_permissions enable row level security;
alter table public.site_role_permissions enable row level security;
alter table public.user_permission_overrides enable row level security;
revoke all on public.site_roles, public.site_permissions, public.site_role_permissions, public.user_permission_overrides from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Replace broad editor policies with permission-scoped policies
-- ---------------------------------------------------------------------------

-- Events: non-admin writers may only work on drafts. Published event content
-- can only be changed through events.publish (admin-only).
drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events" on public.events for select to anon, authenticated
using (status <> 'draft' or public.has_site_permission('events.read'));

drop policy if exists "Site staff can create events" on public.events;
create policy "Site staff can create events" on public.events for insert to authenticated
with check (
  public.has_site_permission('events.publish')
  or (public.has_site_permission('events.write') and status = 'draft')
);

drop policy if exists "Site staff can update events" on public.events;
create policy "Site staff can update events" on public.events for update to authenticated
using (
  public.has_site_permission('events.publish')
  or (public.has_site_permission('events.write') and status = 'draft')
)
with check (
  public.has_site_permission('events.publish')
  or (public.has_site_permission('events.write') and status = 'draft')
);

drop policy if exists "Site staff can delete events" on public.events;
create policy "Site staff can delete events" on public.events for delete to authenticated
using (public.has_site_permission('events.delete'));

drop policy if exists "Site staff can read registrations" on public.event_registrations;
create policy "Site staff can read registrations" on public.event_registrations for select to authenticated
using (public.has_site_permission('registrations.read'));

drop policy if exists "Site staff can update registrations" on public.event_registrations;
create policy "Site staff can update registrations" on public.event_registrations for update to authenticated
using (public.has_site_permission('registrations.manage'))
with check (public.has_site_permission('registrations.manage'));

drop policy if exists "Site staff can delete registrations" on public.event_registrations;
create policy "Site staff can delete registrations" on public.event_registrations for delete to authenticated
using (public.has_site_permission('events.delete'));

-- Event feedback is operational data.
drop policy if exists "Site staff can read event feedback" on public.event_feedback;
create policy "Site staff can read event feedback" on public.event_feedback for select to authenticated
using (public.has_any_site_permission(array['events.operations','registrations.read']));

-- Volunteer roles: active=true is publication.
drop policy if exists "Public can read active volunteer roles" on public.volunteer_roles;
create policy "Public can read active volunteer roles" on public.volunteer_roles for select to anon, authenticated
using (active or public.has_site_permission('volunteer_roles.read'));

drop policy if exists "Site staff can create volunteer roles" on public.volunteer_roles;
create policy "Site staff can create volunteer roles" on public.volunteer_roles for insert to authenticated
with check (
  public.has_site_permission('volunteer_roles.publish')
  or (public.has_site_permission('volunteer_roles.write') and active = false)
);

drop policy if exists "Site staff can update volunteer roles" on public.volunteer_roles;
create policy "Site staff can update volunteer roles" on public.volunteer_roles for update to authenticated
using (
  public.has_site_permission('volunteer_roles.publish')
  or (public.has_site_permission('volunteer_roles.write') and active = false)
)
with check (
  public.has_site_permission('volunteer_roles.publish')
  or (public.has_site_permission('volunteer_roles.write') and active = false)
);

drop policy if exists "Site staff can delete volunteer roles" on public.volunteer_roles;
create policy "Site staff can delete volunteer roles" on public.volunteer_roles for delete to authenticated
using (public.has_site_permission('volunteer_roles.delete'));

drop policy if exists "Site staff can read volunteer applications" on public.volunteer_applications;
create policy "Site staff can read volunteer applications" on public.volunteer_applications for select to authenticated
using (public.has_site_permission('volunteer_applications.read'));

drop policy if exists "Site staff can update volunteer applications" on public.volunteer_applications;

-- Volunteer audit data.
drop policy if exists "Site staff can read volunteer application activity" on public.volunteer_application_activity;
create policy "Site staff can read volunteer application activity" on public.volunteer_application_activity for select to authenticated
using (public.has_site_permission('volunteer_applications.read'));

drop policy if exists "Site staff can read volunteer application emails" on public.volunteer_application_emails;
create policy "Site staff can read volunteer application emails" on public.volunteer_application_emails for select to authenticated
using (public.has_site_permission('volunteer_applications.read'));

-- Articles: non-admin writers may only work on drafts.
drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles" on public.articles for select to anon, authenticated
using (status = 'published' or public.has_site_permission('articles.read'));

drop policy if exists "Site staff can create articles" on public.articles;
create policy "Site staff can create articles" on public.articles for insert to authenticated
with check (
  public.has_site_permission('articles.publish')
  or (public.has_site_permission('articles.write') and status = 'draft')
);

drop policy if exists "Site staff can update articles" on public.articles;
create policy "Site staff can update articles" on public.articles for update to authenticated
using (
  public.has_site_permission('articles.publish')
  or (public.has_site_permission('articles.write') and status = 'draft')
)
with check (
  public.has_site_permission('articles.publish')
  or (public.has_site_permission('articles.write') and status = 'draft')
);

drop policy if exists "Site staff can delete articles" on public.articles;
create policy "Site staff can delete articles" on public.articles for delete to authenticated
using (public.has_site_permission('articles.delete'));

drop policy if exists "Site staff can read article inline media links" on public.article_inline_media;
create policy "Site staff can read article inline media links" on public.article_inline_media for select to authenticated
using (public.has_any_site_permission(array['articles.read','media.read']));

-- Newsletters: non-admin writers may only work on drafts.
drop policy if exists "Public can read published newsletter issues" on public.newsletter_issues;
create policy "Public can read published newsletter issues" on public.newsletter_issues for select to anon, authenticated
using (status = 'published' or public.has_site_permission('newsletters.read'));

drop policy if exists "Site staff can create newsletter issues" on public.newsletter_issues;
create policy "Site staff can create newsletter issues" on public.newsletter_issues for insert to authenticated
with check (
  public.has_site_permission('newsletters.publish')
  or (public.has_site_permission('newsletters.write') and status = 'draft')
);

drop policy if exists "Site staff can update newsletter issues" on public.newsletter_issues;
create policy "Site staff can update newsletter issues" on public.newsletter_issues for update to authenticated
using (
  public.has_site_permission('newsletters.publish')
  or (public.has_site_permission('newsletters.write') and status = 'draft')
)
with check (
  public.has_site_permission('newsletters.publish')
  or (public.has_site_permission('newsletters.write') and status = 'draft')
);

drop policy if exists "Site staff can delete newsletter issues" on public.newsletter_issues;
create policy "Site staff can delete newsletter issues" on public.newsletter_issues for delete to authenticated
using (public.has_site_permission('newsletters.delete'));

drop policy if exists "Site staff can read newsletter subscribers" on public.newsletter_subscribers;
create policy "Site staff can read newsletter subscribers" on public.newsletter_subscribers for select to authenticated
using (public.has_site_permission('newsletter_subscribers.read'));

drop policy if exists "Site admins can delete newsletter subscribers" on public.newsletter_subscribers;
create policy "Site admins can delete newsletter subscribers" on public.newsletter_subscribers for delete to authenticated
using (public.has_site_permission('newsletters.delete'));

-- Media library.
drop policy if exists "Site staff can read media metadata" on public.media_assets;
create policy "Site staff can read media metadata" on public.media_assets for select to authenticated
using (public.has_site_permission('media.read'));

drop policy if exists "Site staff can create media metadata" on public.media_assets;
create policy "Site staff can create media metadata" on public.media_assets for insert to authenticated
with check (public.has_site_permission('media.write'));

drop policy if exists "Site staff can update media metadata" on public.media_assets;
create policy "Site staff can update media metadata" on public.media_assets for update to authenticated
using (public.has_site_permission('media.write')) with check (public.has_site_permission('media.write'));

drop policy if exists "Site staff can delete media metadata" on public.media_assets;
create policy "Site staff can delete media metadata" on public.media_assets for delete to authenticated
using (public.has_site_permission('media.delete'));

drop policy if exists "Site staff can read media objects" on storage.objects;
create policy "Site staff can read media objects" on storage.objects for select to authenticated
using (bucket_id = 'site-media' and public.has_site_permission('media.read'));

drop policy if exists "Site staff can upload media objects" on storage.objects;
create policy "Site staff can upload media objects" on storage.objects for insert to authenticated
with check (bucket_id = 'site-media' and public.has_site_permission('media.write'));

drop policy if exists "Site staff can update media objects" on storage.objects;
create policy "Site staff can update media objects" on storage.objects for update to authenticated
using (bucket_id = 'site-media' and public.has_site_permission('media.write'))
with check (bucket_id = 'site-media' and public.has_site_permission('media.write'));

drop policy if exists "Site staff can delete media objects" on storage.objects;
create policy "Site staff can delete media objects" on storage.objects for delete to authenticated
using (bucket_id = 'site-media' and public.has_site_permission('media.delete'));

-- Public-site content that is instantly visible is admin-only by design.
drop policy if exists "Site staff can create founders" on public.founders;
create policy "Site staff can create founders" on public.founders for insert to authenticated
with check (public.has_site_permission('team.publish'));
drop policy if exists "Site staff can update founders" on public.founders;
create policy "Site staff can update founders" on public.founders for update to authenticated
using (public.has_site_permission('team.publish')) with check (public.has_site_permission('team.publish'));
drop policy if exists "Site staff can delete founders" on public.founders;
create policy "Site staff can delete founders" on public.founders for delete to authenticated
using (public.has_site_permission('team.publish'));

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select to anon, authenticated
using (active or public.has_site_permission('products.publish'));
drop policy if exists "Site staff can create products" on public.products;
create policy "Site staff can create products" on public.products for insert to authenticated
with check (public.has_site_permission('products.publish'));
drop policy if exists "Site staff can update products" on public.products;
create policy "Site staff can update products" on public.products for update to authenticated
using (public.has_site_permission('products.publish')) with check (public.has_site_permission('products.publish'));
drop policy if exists "Site staff can delete products" on public.products;
create policy "Site staff can delete products" on public.products for delete to authenticated
using (public.has_site_permission('products.publish'));

drop policy if exists "Site staff can read product media links" on public.product_media_links;
create policy "Site staff can read product media links" on public.product_media_links for select to authenticated
using (public.has_site_permission('products.publish'));

-- Public page-section edits are publication actions. Information pages share
-- one admin-only permission; ordinary page keys map directly to their permission.
drop policy if exists "Site staff can create page sections" on public.page_sections;
create policy "Site staff can create page sections" on public.page_sections for insert to authenticated
with check (
  public.has_site_permission(
    case
      when page_key in ('privacy','terms','accessibility','research_approach')
        then 'pages.information.publish'
      else 'pages.' || page_key || '.publish'
    end
  )
);
drop policy if exists "Site staff can update page sections" on public.page_sections;
create policy "Site staff can update page sections" on public.page_sections for update to authenticated
using (
  public.has_site_permission(
    case
      when page_key in ('privacy','terms','accessibility','research_approach')
        then 'pages.information.publish'
      else 'pages.' || page_key || '.publish'
    end
  )
)
with check (
  public.has_site_permission(
    case
      when page_key in ('privacy','terms','accessibility','research_approach')
        then 'pages.information.publish'
      else 'pages.' || page_key || '.publish'
    end
  )
);
drop policy if exists "Site staff can delete page sections" on public.page_sections;
create policy "Site staff can delete page sections" on public.page_sections for delete to authenticated
using (
  public.has_site_permission(
    case
      when page_key in ('privacy','terms','accessibility','research_approach')
        then 'pages.information.publish'
      else 'pages.' || page_key || '.publish'
    end
  )
);

-- Operational/sensitive inboxes are grantable but not included in the editor template.
drop policy if exists "Site staff can read app waitlist" on public.app_waitlist;
create policy "Site staff can read app waitlist" on public.app_waitlist for select to authenticated
using (public.has_site_permission('waitlist.read'));
drop policy if exists "Site staff can update app waitlist" on public.app_waitlist;
create policy "Site staff can update app waitlist" on public.app_waitlist for update to authenticated
using (public.has_site_permission('waitlist.manage')) with check (public.has_site_permission('waitlist.manage'));
drop policy if exists "Site admins can delete app waitlist" on public.app_waitlist;
create policy "Site admins can delete app waitlist" on public.app_waitlist for delete to authenticated
using (public.has_site_permission('waitlist.manage'));

drop policy if exists "Site staff can read contact messages" on public.contact_messages;
create policy "Site staff can read contact messages" on public.contact_messages for select to authenticated
using (public.has_site_permission('messages.read'));
drop policy if exists "Site staff can update contact messages" on public.contact_messages;
create policy "Site staff can update contact messages" on public.contact_messages for update to authenticated
using (public.has_site_permission('messages.manage')) with check (public.has_site_permission('messages.manage'));

drop policy if exists "Site staff can read partnership inquiries" on public.partner_inquiries;
create policy "Site staff can read partnership inquiries" on public.partner_inquiries for select to authenticated
using (public.has_site_permission('partners.read'));
drop policy if exists "Site staff can update partnership inquiries" on public.partner_inquiries;
create policy "Site staff can update partnership inquiries" on public.partner_inquiries for update to authenticated
using (public.has_site_permission('partners.manage')) with check (public.has_site_permission('partners.manage'));

drop policy if exists "Staff can read donations" on public.donations;
create policy "Staff can read donations" on public.donations for select to authenticated
using (public.has_site_permission('payments.read'));
drop policy if exists "Staff can update donations" on public.donations;
create policy "Staff can update donations" on public.donations for update to authenticated
using (public.has_site_permission('payments.manage')) with check (public.has_site_permission('payments.manage'));
drop policy if exists "Staff can read orders" on public.orders;
create policy "Staff can read orders" on public.orders for select to authenticated
using (public.has_site_permission('payments.read'));
drop policy if exists "Staff can update orders" on public.orders;
create policy "Staff can update orders" on public.orders for update to authenticated
using (public.has_site_permission('payments.manage')) with check (public.has_site_permission('payments.manage'));

-- ---------------------------------------------------------------------------
-- 5) Permission-aware operational RPCs
-- ---------------------------------------------------------------------------

-- Event Operations saves only operational fields; it cannot alter published
-- event copy, schedule, location, status, poster or featured state.
create or replace function public.save_event_operations_settings(
  p_event_id uuid,
  p_capacity integer,
  p_reminder_hours integer[],
  p_questions jsonb,
  p_feedback_enabled boolean,
  p_feedback_delay_hours integer,
  p_feedback_questions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.events%rowtype;
begin
  if not public.has_site_permission('events.operations') then
    raise exception 'Event operations access is required.' using errcode = '42501';
  end if;
  if p_capacity is not null and p_capacity < 0 then
    raise exception 'Capacity cannot be negative.' using errcode = '22023';
  end if;
  if coalesce(p_feedback_delay_hours, 0) < 0 or coalesce(p_feedback_delay_hours, 0) > 720 then
    raise exception 'Feedback delay must be between 0 and 720 hours.' using errcode = '22023';
  end if;

  update public.events
  set capacity = p_capacity,
      reminder_hours = coalesce(p_reminder_hours, '{}'::integer[]),
      questions = coalesce(p_questions, '[]'::jsonb),
      feedback_enabled = coalesce(p_feedback_enabled, true),
      feedback_delay_hours = coalesce(p_feedback_delay_hours, 24),
      feedback_questions = coalesce(p_feedback_questions, '[]'::jsonb)
  where id = p_event_id
  returning * into v_row;

  if not found then raise exception 'Event not found.' using errcode = 'P0002'; end if;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.save_event_operations_settings(uuid,integer,integer[],jsonb,boolean,integer,jsonb) from public;
grant execute on function public.save_event_operations_settings(uuid,integer,integer[],jsonb,boolean,integer,jsonb) to authenticated;

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
  if not public.has_site_permission('registrations.manage') then
    raise exception 'Registration management access is required.' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_name,''))) = 0 then
    raise exception 'Walk-in name is required.' using errcode = '22023';
  end if;
  select * into e from public.events where id = p_event_id;
  if not found then raise exception 'Event not found.' using errcode = 'P0002'; end if;

  insert into public.event_registrations (
    event_id,event_slug,event_title,name,email,phone,answers,status,
    attendance_status,checked_in_at,registration_source
  ) values (
    e.id,e.slug,e.title,trim(p_name),nullif(lower(trim(coalesce(p_email,''))), ''),
    nullif(trim(coalesce(p_phone,'')), ''),'{}'::jsonb,'confirmed','attended',now(),'walk_in'
  ) returning * into new_row;
  return to_jsonb(new_row);
end;
$$;

grant execute on function public.add_event_walk_in(uuid,text,text,text) to authenticated;

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
  if not public.has_site_permission('registrations.manage') then
    raise exception 'Registration management access is required.' using errcode = '42501';
  end if;
  select * into e from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found.' using errcode = 'P0002'; end if;
  if e.status <> 'past' and (e.ends_at is null or e.ends_at > now()) then
    raise exception 'Attendance can only be finalized after the event ends.' using errcode = '22023';
  end if;

  update public.event_registrations
  set attendance_status = 'no_show', checked_in_at = null
  where event_id = e.id and status = 'confirmed' and attendance_status = 'pending';
  get diagnostics no_show_count = row_count;

  -- Finalization may mark an ended event past as part of the operational lifecycle.
  update public.events
  set attendance_finalized_at = coalesce(attendance_finalized_at, now()),
      status = case when status = 'upcoming' and ends_at is not null and ends_at <= now() then 'past' else status end
  where id = e.id
  returning * into e;

  return jsonb_build_object(
    'event_id', e.id,
    'attendance_finalized_at', e.attendance_finalized_at,
    'new_no_show_count', no_show_count
  );
end;
$$;

grant execute on function public.finalize_event_attendance(uuid) to authenticated;

-- Volunteer workflow RPCs are redefined below only to replace role checks with
-- explicit volunteer_applications.manage permission checks.
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
  if not public.has_site_permission('volunteer_applications.manage') then
    raise exception 'Volunteer application management access is required.' using errcode = '42501';
  end if;
  if p_status not in ('new','reviewing','shortlisted','interview','accepted','onboarding','onboarded','rejected','withdrawn','archived') then
    raise exception 'Unsupported volunteer application status: %', p_status using errcode = '22023';
  end if;
  select status into v_old_status from public.volunteer_applications where id = p_application_id for update;
  if not found then raise exception 'Volunteer application not found.' using errcode = 'P0002'; end if;
  if v_old_status = p_status then
    select * into v_row from public.volunteer_applications where id = p_application_id;
    return to_jsonb(v_row);
  end if;
  update public.volunteer_applications
  set status = p_status,
      last_activity_at = v_now,
      shortlisted_at = case when p_status='shortlisted' then coalesce(shortlisted_at,v_now) else shortlisted_at end,
      interview_stage_at = case when p_status='interview' then coalesce(interview_stage_at,v_now) else interview_stage_at end,
      accepted_at = case when p_status='accepted' then coalesce(accepted_at,v_now) else accepted_at end,
      rejected_at = case when p_status='rejected' then coalesce(rejected_at,v_now) else rejected_at end,
      withdrawn_at = case when p_status='withdrawn' then coalesce(withdrawn_at,v_now) else withdrawn_at end,
      onboarding_started_at = case when p_status='onboarding' then coalesce(onboarding_started_at,v_now) else onboarding_started_at end,
      onboarded_at = case when p_status='onboarded' then coalesce(onboarded_at,v_now) else onboarded_at end,
      archived_at = case when p_status='archived' then coalesce(archived_at,v_now) else archived_at end
  where id = p_application_id returning * into v_row;
  insert into public.volunteer_application_activity (
    application_id,event_type,from_status,to_status,actor_user_id,actor_label,note
  ) values (
    p_application_id,'status_changed',v_old_status,p_status,auth.uid(),
    nullif(trim(coalesce(p_actor_label,'')),''),nullif(trim(coalesce(p_note,'')),'')
  );
  return to_jsonb(v_row);
end;
$$;

grant execute on function public.transition_volunteer_application(uuid,text,text,text) to authenticated;

create or replace function public.list_volunteer_reviewers()
returns table (user_id uuid, email text, role text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_site_permission('volunteer_applications.read') then
    raise exception 'Volunteer application access is required.' using errcode = '42501';
  end if;
  return query
  select ur.user_id, coalesce(u.email::text, ur.user_id::text), ur.role
  from public.user_roles ur
  left join auth.users u on u.id = ur.user_id
  where public.user_has_site_permission_internal(ur.user_id, 'volunteer_applications.manage')
  order by lower(coalesce(u.email::text, ur.user_id::text));
end;
$$;

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
  if not public.has_site_permission('volunteer_applications.manage') then
    raise exception 'Volunteer application management access is required.' using errcode = '42501';
  end if;
  if p_assignee_id is not null then
    if not public.user_has_site_permission_internal(p_assignee_id, 'volunteer_applications.manage') then
      raise exception 'The selected reviewer does not have volunteer application management access.' using errcode = '22023';
    end if;
    select coalesce(u.email::text, p_assignee_id::text) into v_assignee_label
    from auth.users u where u.id = p_assignee_id;
    v_assignee_label := coalesce(v_assignee_label, p_assignee_id::text);
  end if;
  update public.volunteer_applications
  set assigned_to = p_assignee_id,
      assigned_to_label = case when p_assignee_id is null then null else v_assignee_label end,
      last_activity_at = now()
  where id = p_application_id returning * into v_row;
  if not found then raise exception 'Volunteer application not found.' using errcode = 'P0002'; end if;
  insert into public.volunteer_application_activity (
    application_id,event_type,actor_user_id,actor_label,note,metadata
  ) values (
    p_application_id,'assignment_changed',auth.uid(),nullif(trim(coalesce(p_actor_label,'')),''),
    case when p_assignee_id is null then 'Application unassigned.' else 'Application assigned to '||v_assignee_label||'.' end,
    jsonb_build_object('assigned_to',p_assignee_id,'assigned_to_label',v_assignee_label)
  );
  return to_jsonb(v_row);
end;
$$;

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
  v_label text := nullif(trim(coalesce(p_actor_label,'')),'');
begin
  if not public.has_site_permission('volunteer_applications.manage') then
    raise exception 'Volunteer application management access is required.' using errcode = '42501';
  end if;
  update public.volunteer_applications
  set assigned_to = case when p_assign_to_self then auth.uid() else null end,
      assigned_to_label = case when p_assign_to_self then v_label else null end,
      last_activity_at = now()
  where id = p_application_id returning * into v_row;
  if not found then raise exception 'Volunteer application not found.' using errcode = 'P0002'; end if;
  insert into public.volunteer_application_activity (
    application_id,event_type,actor_user_id,actor_label,note,metadata
  ) values (
    p_application_id,'assignment_changed',auth.uid(),v_label,
    case when p_assign_to_self then 'Application assigned to reviewer.' else 'Application unassigned.' end,
    jsonb_build_object('assigned_to',case when p_assign_to_self then auth.uid()::text else null end,'assigned_to_label',case when p_assign_to_self then v_label else null end)
  );
  return to_jsonb(v_row);
end;
$$;

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
  v_note text := trim(coalesce(p_note,''));
  v_row public.volunteer_applications%rowtype;
begin
  if not public.has_site_permission('volunteer_applications.manage') then
    raise exception 'Volunteer application management access is required.' using errcode = '42501';
  end if;
  if length(v_note)=0 then raise exception 'Add a note before saving.' using errcode='22023'; end if;
  if length(v_note)>5000 then raise exception 'Notes must be 5,000 characters or fewer.' using errcode='22023'; end if;
  update public.volunteer_applications set last_activity_at=now() where id=p_application_id returning * into v_row;
  if not found then raise exception 'Volunteer application not found.' using errcode='P0002'; end if;
  insert into public.volunteer_application_activity(application_id,event_type,actor_user_id,actor_label,note)
  values(p_application_id,'note',auth.uid(),nullif(trim(coalesce(p_actor_label,'')),''),v_note);
  return to_jsonb(v_row);
end;
$$;

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
  v_timezone text := coalesce(nullif(trim(coalesce(p_interview_timezone,'')),''),'Africa/Nairobi');
  v_duration integer := coalesce(p_interview_duration_minutes,30);
  v_row public.volunteer_applications%rowtype;
begin
  if not public.has_site_permission('volunteer_applications.manage') then
    raise exception 'Volunteer application management access is required.' using errcode='42501';
  end if;
  if v_duration < 10 or v_duration > 240 then
    raise exception 'Interview duration must be between 10 and 240 minutes.' using errcode='22023';
  end if;
  update public.volunteer_applications
  set interview_at=p_interview_at,
      interview_timezone=v_timezone,
      interview_duration_minutes=v_duration,
      interview_location=nullif(trim(coalesce(p_interview_location,'')),''),
      interview_notes=nullif(trim(coalesce(p_interview_notes,'')),''),
      decision_notes=nullif(trim(coalesce(p_decision_notes,'')),''),
      last_activity_at=now()
  where id=p_application_id returning * into v_row;
  if not found then raise exception 'Volunteer application not found.' using errcode='P0002'; end if;
  insert into public.volunteer_application_activity(application_id,event_type,actor_user_id,actor_label,note,metadata)
  values(
    p_application_id,'record_updated',auth.uid(),nullif(trim(coalesce(p_actor_label,'')),''),
    'Application workflow details updated.',
    jsonb_build_object('interview_at',p_interview_at,'interview_timezone',v_timezone,'interview_duration_minutes',v_duration,'interview_location',nullif(trim(coalesce(p_interview_location,'')),''))
  );
  return to_jsonb(v_row);
end;
$$;

grant execute on function public.save_volunteer_application_details(uuid,timestamptz,text,integer,text,text,text,text) to authenticated;

commit;
