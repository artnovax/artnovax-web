-- PAGE SECTIONS: reusable CMS content rows for public website pages.
-- This slice connects the homepage hero, mission band, and What We Do content.
-- Run after 15_media_library.sql.

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null check (page_key ~ '^[a-z0-9_-]+$'),
  section_key text not null check (section_key ~ '^[a-z0-9_-]+$'),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  image text,
  image_media_id uuid references public.media_assets(id) on delete restrict,
  image_alt_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_key, section_key)
);

create index if not exists page_sections_page_key_idx
on public.page_sections(page_key);

create index if not exists page_sections_image_media_id_idx
on public.page_sections(image_media_id);

comment on table public.page_sections is
'Editable public website sections. Missing rows intentionally fall back to the frontend defaults.';

comment on column public.page_sections.image_media_id is
'Media-library asset used by this page section. RESTRICT prevents deleting an image still in use.';

drop trigger if exists page_sections_set_updated_at on public.page_sections;
create trigger page_sections_set_updated_at
before update on public.page_sections
for each row execute function public.set_updated_at();

alter table public.page_sections enable row level security;

revoke all on table public.page_sections from anon, authenticated;
grant select on table public.page_sections to anon;
grant select, insert, update, delete on table public.page_sections to authenticated;

drop policy if exists "Public can read page sections" on public.page_sections;
create policy "Public can read page sections"
on public.page_sections for select
to anon, authenticated
using (true);

drop policy if exists "Site staff can create page sections" on public.page_sections;
create policy "Site staff can create page sections"
on public.page_sections for insert
to authenticated
with check (public.has_site_role(array['admin', 'editor']));

drop policy if exists "Site staff can update page sections" on public.page_sections;
create policy "Site staff can update page sections"
on public.page_sections for update
to authenticated
using (public.has_site_role(array['admin', 'editor']))
with check (public.has_site_role(array['admin', 'editor']));

drop policy if exists "Site staff can delete page sections" on public.page_sections;
create policy "Site staff can delete page sections"
on public.page_sections for delete
to authenticated
using (public.has_site_role(array['admin', 'editor']));
