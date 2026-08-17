-- NEWSLETTER ISSUES: draft/published web issues with protected library heroes.
-- Run after 15_media_library.sql. Email delivery remains a separate workflow.

create table if not exists public.newsletter_issues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subject text,
  preheader text,
  excerpt text,
  hero text,
  hero_media_id uuid references public.media_assets(id) on delete restrict,
  hero_alt_text text,
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletter_issues_status_published_at_idx
on public.newsletter_issues(status, published_at desc);

create index if not exists newsletter_issues_hero_media_id_idx
on public.newsletter_issues(hero_media_id);

comment on table public.newsletter_issues is
'Website newsletter archive. Sending an issue to subscribers is intentionally handled separately.';

comment on column public.newsletter_issues.hero_media_id is
'Media-library asset used as the issue hero. RESTRICT prevents deleting an image still in use.';

comment on column public.newsletter_issues.hero_alt_text is
'Context-specific accessible description for the newsletter hero image.';

create or replace function public.set_newsletter_published_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'published' then
    if tg_op = 'INSERT' then
      new.published_at = coalesce(new.published_at, now());
    elsif old.status <> 'published' or new.published_at is null then
      new.published_at = coalesce(new.published_at, now());
    end if;
  else
    new.published_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists newsletter_issues_set_published_at on public.newsletter_issues;
create trigger newsletter_issues_set_published_at
before insert or update of status on public.newsletter_issues
for each row execute function public.set_newsletter_published_at();

drop trigger if exists newsletter_issues_set_updated_at on public.newsletter_issues;
create trigger newsletter_issues_set_updated_at
before update on public.newsletter_issues
for each row execute function public.set_updated_at();

alter table public.newsletter_issues enable row level security;

revoke all on table public.newsletter_issues from anon, authenticated;
grant select on table public.newsletter_issues to anon;
grant select, insert, update, delete on table public.newsletter_issues to authenticated;

drop policy if exists "Public can read published newsletter issues" on public.newsletter_issues;
create policy "Public can read published newsletter issues"
on public.newsletter_issues for select
to anon, authenticated
using (
  status = 'published'
  or public.has_site_role(array['admin', 'editor'])
);

drop policy if exists "Site staff can create newsletter issues" on public.newsletter_issues;
create policy "Site staff can create newsletter issues"
on public.newsletter_issues for insert
to authenticated
with check (public.has_site_role(array['admin', 'editor']));

drop policy if exists "Site staff can update newsletter issues" on public.newsletter_issues;
create policy "Site staff can update newsletter issues"
on public.newsletter_issues for update
to authenticated
using (public.has_site_role(array['admin', 'editor']))
with check (public.has_site_role(array['admin', 'editor']));

drop policy if exists "Site staff can delete newsletter issues" on public.newsletter_issues;
create policy "Site staff can delete newsletter issues"
on public.newsletter_issues for delete
to authenticated
using (public.has_site_role(array['admin', 'editor']));
