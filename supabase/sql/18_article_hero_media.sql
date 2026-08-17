-- ARTICLE HERO MEDIA: connect article heroes to reusable media-library assets.
-- Run after 15_media_library.sql.

alter table public.articles
add column if not exists hero_media_id uuid;

alter table public.articles
add column if not exists hero_alt_text text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'articles_hero_media_id_fkey'
      and conrelid = 'public.articles'::regclass
  ) then
    alter table public.articles
    add constraint articles_hero_media_id_fkey
    foreign key (hero_media_id)
    references public.media_assets(id)
    on delete restrict;
  end if;
end;
$$;

create index if not exists articles_hero_media_id_idx
on public.articles(hero_media_id);

comment on column public.articles.hero_media_id is
'Media-library asset used as this article hero. RESTRICT prevents deleting an image still in use.';

comment on column public.articles.hero_alt_text is
'Context-specific accessible description for the article hero image.';
