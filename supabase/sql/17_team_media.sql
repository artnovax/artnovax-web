-- TEAM MEDIA: connect team photographs to reusable media-library assets.
-- Run after 15_media_library.sql.

alter table public.founders
add column if not exists photo_media_id uuid;

alter table public.founders
add column if not exists image_alt_text text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'founders_photo_media_id_fkey'
      and conrelid = 'public.founders'::regclass
  ) then
    alter table public.founders
    add constraint founders_photo_media_id_fkey
    foreign key (photo_media_id)
    references public.media_assets(id)
    on delete restrict;
  end if;
end;
$$;

create index if not exists founders_photo_media_id_idx
on public.founders(photo_media_id);

comment on column public.founders.photo_media_id is
'Media-library asset used for this team photograph. RESTRICT prevents deleting an image still in use.';

comment on column public.founders.image_alt_text is
'Context-specific accessible description for the team photograph.';
