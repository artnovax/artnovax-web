-- PRODUCT GALLERY: ordered, reusable media-library images with one primary image.
-- Run after 15_media_library.sql.

alter table public.products
add column if not exists images jsonb not null default '[]'::jsonb;

create table if not exists public.product_media_links (
  product_id uuid not null references public.products(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (product_id, media_asset_id)
);

create index if not exists product_media_links_asset_id_idx
on public.product_media_links(media_asset_id);

alter table public.product_media_links enable row level security;

revoke all on table public.product_media_links from anon, authenticated;
grant select on table public.product_media_links to authenticated;

drop policy if exists "Site staff can read product media links" on public.product_media_links;
create policy "Site staff can read product media links"
on public.product_media_links for select
to authenticated
using (public.has_site_role(array['admin', 'editor']));

create or replace function public.prepare_product_gallery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  image_count integer;
  distinct_media_count integer;
  primary_count integer;
  primary_image jsonb;
begin
  new.images := coalesce(new.images, '[]'::jsonb);

  if jsonb_typeof(new.images) <> 'array' then
    raise exception 'Product images must be a JSON array.' using errcode = '22023';
  end if;

  image_count := jsonb_array_length(new.images);
  if image_count = 0 then
    return new;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.images) as image
    where nullif(coalesce(image->>'media_asset_id', image->>'mediaAssetId'), '') is null
      or nullif(coalesce(image->>'src', image->>'publicUrl'), '') is null
  ) then
    raise exception 'Every product gallery image must come from the media library.'
      using errcode = '23502';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.images) as image
    where not exists (
      select 1
      from public.media_assets as asset
      where asset.id::text = coalesce(image->>'media_asset_id', image->>'mediaAssetId')
    )
  ) then
    raise exception 'A product gallery image no longer exists in the media library.'
      using errcode = '23503';
  end if;

  select count(distinct coalesce(image->>'media_asset_id', image->>'mediaAssetId'))
  into distinct_media_count
  from jsonb_array_elements(new.images) as image;

  if distinct_media_count <> image_count then
    raise exception 'A product gallery cannot contain the same image twice.'
      using errcode = '23505';
  end if;

  select count(*)
  into primary_count
  from jsonb_array_elements(new.images) as image
  where coalesce((image->>'is_primary')::boolean, (image->>'isPrimary')::boolean, false);

  if primary_count <> 1 then
    raise exception 'A product gallery must have exactly one primary image.'
      using errcode = '23514';
  end if;

  select image
  into primary_image
  from jsonb_array_elements(new.images) as image
  where coalesce((image->>'is_primary')::boolean, (image->>'isPrimary')::boolean, false)
  limit 1;

  new.img := coalesce(primary_image->>'src', primary_image->>'publicUrl');
  return new;
end;
$$;

revoke all on function public.prepare_product_gallery() from public;

drop trigger if exists products_prepare_gallery on public.products;
create trigger products_prepare_gallery
before insert or update of images on public.products
for each row execute function public.prepare_product_gallery();

create or replace function public.sync_product_media_links()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.product_media_links
  where product_id = new.id;

  insert into public.product_media_links (product_id, media_asset_id)
  select distinct new.id, asset.id
  from jsonb_array_elements(coalesce(new.images, '[]'::jsonb)) as image
  join public.media_assets as asset
    on asset.id::text = coalesce(image->>'media_asset_id', image->>'mediaAssetId');

  return new;
end;
$$;

revoke all on function public.sync_product_media_links() from public;

drop trigger if exists products_sync_media_links on public.products;
create trigger products_sync_media_links
after insert or update of images on public.products
for each row execute function public.sync_product_media_links();

insert into public.product_media_links (product_id, media_asset_id)
select distinct product.id, asset.id
from public.products as product
cross join lateral jsonb_array_elements(coalesce(product.images, '[]'::jsonb)) as image
join public.media_assets as asset
  on asset.id::text = coalesce(image->>'media_asset_id', image->>'mediaAssetId')
on conflict do nothing;

comment on column public.products.images is
'Ordered gallery objects containing media_asset_id, src, alt, display_order, and is_primary.';

comment on table public.product_media_links is
'Trigger-maintained deletion guards for media-library assets used by product galleries.';
