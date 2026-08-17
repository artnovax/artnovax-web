-- ARTICLE INLINE MEDIA: protect media-library images embedded in article blocks.
-- Run after 18_article_hero_media.sql.

create table if not exists public.article_inline_media (
  article_id uuid not null references public.articles(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (article_id, media_asset_id)
);

create index if not exists article_inline_media_asset_id_idx
on public.article_inline_media(media_asset_id);

alter table public.article_inline_media enable row level security;

revoke all on table public.article_inline_media from anon, authenticated;
grant select on table public.article_inline_media to authenticated;

drop policy if exists "Site staff can read article inline media links" on public.article_inline_media;
create policy "Site staff can read article inline media links"
on public.article_inline_media for select
to authenticated
using (public.has_site_role(array['admin', 'editor']));

create or replace function public.sync_article_inline_media_links()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from jsonb_array_elements(coalesce(new.blocks, '[]'::jsonb)) as block
    where block->>'type' = 'img'
      and nullif(coalesce(block->>'media_asset_id', block->>'mediaAssetId'), '') is not null
      and not exists (
        select 1
        from public.media_assets as asset
        where asset.id::text = coalesce(block->>'media_asset_id', block->>'mediaAssetId')
      )
  ) then
    raise exception 'An inline article image no longer exists in the media library.'
      using errcode = '23503';
  end if;

  delete from public.article_inline_media
  where article_id = new.id;

  insert into public.article_inline_media (article_id, media_asset_id)
  select distinct new.id, asset.id
  from jsonb_array_elements(coalesce(new.blocks, '[]'::jsonb)) as block
  join public.media_assets as asset
    on asset.id::text = coalesce(block->>'media_asset_id', block->>'mediaAssetId')
  where block->>'type' = 'img';

  return new;
end;
$$;

revoke all on function public.sync_article_inline_media_links() from public;

drop trigger if exists articles_sync_inline_media on public.articles;
create trigger articles_sync_inline_media
after insert or update of blocks on public.articles
for each row execute function public.sync_article_inline_media_links();

-- Backfill links if protected inline blocks were created before this migration ran.
insert into public.article_inline_media (article_id, media_asset_id)
select distinct article.id, asset.id
from public.articles as article
cross join lateral jsonb_array_elements(coalesce(article.blocks, '[]'::jsonb)) as block
join public.media_assets as asset
  on asset.id::text = coalesce(block->>'media_asset_id', block->>'mediaAssetId')
where block->>'type' = 'img'
on conflict do nothing;

comment on table public.article_inline_media is
'Trigger-maintained deletion guards for media-library assets embedded in article blocks.';
