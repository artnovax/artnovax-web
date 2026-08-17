-- MEDIA LIBRARY: authenticated staff uploads with public image delivery.
-- Run after 00_admin_auth.sql. Content tables are intentionally not changed here.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'site-media',
  'site-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'site-media' check (bucket_id = 'site-media'),
  storage_path text not null,
  original_filename text not null,
  title text,
  alt_text text,
  caption text,
  mime_type text not null check (mime_type like 'image/%'),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  uploaded_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_id, storage_path)
);

create index if not exists media_assets_created_at_idx
on public.media_assets(created_at desc);

alter table public.media_assets enable row level security;

revoke all on table public.media_assets from anon;
grant select, insert, update, delete on table public.media_assets to authenticated;

drop policy if exists "Site staff can read media metadata" on public.media_assets;
create policy "Site staff can read media metadata"
on public.media_assets for select
to authenticated
using (public.has_site_role(array['admin', 'editor']));

drop policy if exists "Site staff can create media metadata" on public.media_assets;
create policy "Site staff can create media metadata"
on public.media_assets for insert
to authenticated
with check (public.has_site_role(array['admin', 'editor']));

drop policy if exists "Site staff can update media metadata" on public.media_assets;
create policy "Site staff can update media metadata"
on public.media_assets for update
to authenticated
using (public.has_site_role(array['admin', 'editor']))
with check (public.has_site_role(array['admin', 'editor']));

drop policy if exists "Site staff can delete media metadata" on public.media_assets;
create policy "Site staff can delete media metadata"
on public.media_assets for delete
to authenticated
using (public.has_site_role(array['admin', 'editor']));

drop trigger if exists media_assets_set_updated_at on public.media_assets;
create trigger media_assets_set_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

-- The bucket is public so published pages can display its images without signed URLs.
-- Object listing and all mutations remain limited to authenticated site staff.
drop policy if exists "Site staff can read media objects" on storage.objects;
create policy "Site staff can read media objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'site-media'
  and public.has_site_role(array['admin', 'editor'])
);

drop policy if exists "Site staff can upload media objects" on storage.objects;
create policy "Site staff can upload media objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'site-media'
  and public.has_site_role(array['admin', 'editor'])
);

drop policy if exists "Site staff can update media objects" on storage.objects;
create policy "Site staff can update media objects"
on storage.objects for update
to authenticated
using (
  bucket_id = 'site-media'
  and public.has_site_role(array['admin', 'editor'])
)
with check (
  bucket_id = 'site-media'
  and public.has_site_role(array['admin', 'editor'])
);

drop policy if exists "Site staff can delete media objects" on storage.objects;
create policy "Site staff can delete media objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'site-media'
  and public.has_site_role(array['admin', 'editor'])
);
