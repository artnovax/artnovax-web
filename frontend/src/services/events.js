import { supabase } from '@/lib/supabase';

function toFrontendEvent(row) {
  if (!row) return null;
  return {
    ...row,
    date: row.date_text ?? row.date ?? '',
    img: row.image_path ?? row.img ?? null,
    imgAlt: row.image_alt_text ?? row.imgAlt ?? '',
    posterMediaId: row.poster_media_id ?? row.posterMediaId ?? null,
  };
}

function toDatabaseEvent(event) {
  return {
    slug: event.slug || slugify(event.title),
    title: event.title,
    subtitle: event.subtitle || null,
    theme: event.theme || null,
    date_text: event.date ?? event.date_text ?? null,
    starts_at: event.starts_at || null,
    location: event.location || null,
    audience: event.audience || null,
    tags: normalizeList(event.tags),
    body: event.body || null,
    image_path: event.img ?? event.image_path ?? null,
    image_alt_text: event.imgAlt ?? event.image_alt_text ?? null,
    poster_media_id: event.posterMediaId ?? event.poster_media_id ?? null,
    status: event.status || 'upcoming',
    featured: !!event.featured,
    partners: normalizeList(event.partners),
    poster: event.poster || null,
    capacity: event.capacity === '' || event.capacity == null ? null : Number(event.capacity),
    reminder_hours: event.reminder_hours || [48],
    questions: event.questions || [],
  };
}

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value).split(',').map((v) => v.trim()).filter(Boolean);
};

const slugify = (value = '') => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export async function getEvents({ includeDrafts = false } = {}) {
  let query = supabase.from('events').select('*').order('created_at', { ascending: false });
  if (!includeDrafts) query = query.neq('status', 'draft');
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toFrontendEvent);
}

export async function getEventBySlug(slug) {
  const { data, error } = await supabase.rpc('get_public_event', { p_slug: slug });
  if (error) throw error;
  if (!data) throw new Error('Event not found');
  return toFrontendEvent(data);
}

export async function registerForEvent({
  eventId,
  name,
  email,
  phone,
  answers,
}) {
  const { data, error } =
    await supabase.functions.invoke(
      'public-submission',
      {
        body: {
          type: 'event_registration',
          payload: {
            event_id: eventId,
            name,
            email,
            phone,
            answers,
          },
        },
      },
    );

  if (error) throw error;

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function createEvent(event) {
  const { data, error } = await supabase.from('events').insert(toDatabaseEvent(event)).select().single();
  if (error) throw error;
  return toFrontendEvent(data);
}

export async function updateEvent(id, event) {
  const payload = toDatabaseEvent(event);
  const { data, error } = await supabase.from('events').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return toFrontendEvent(data);
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
