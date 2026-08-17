-- EVENT MEDIA: connect event posters to reusable media-library assets.
-- Run after 15_media_library.sql.

alter table public.events
add column if not exists poster_media_id uuid;

alter table public.events
add column if not exists image_alt_text text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_poster_media_id_fkey'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
    add constraint events_poster_media_id_fkey
    foreign key (poster_media_id)
    references public.media_assets(id)
    on delete restrict;
  end if;
end;
$$;

create index if not exists events_poster_media_id_idx
on public.events(poster_media_id);

comment on column public.events.poster_media_id is
'Media-library asset used as this event poster. RESTRICT prevents deleting an image still in use.';

comment on column public.events.image_alt_text is
'Context-specific accessible description for the event poster.';
