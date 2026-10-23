import { supabase } from '@/lib/supabase';
import {
  DEFAULT_EVENT_REGISTRATION_QUESTIONS,
  DEFAULT_EVENT_FEEDBACK_QUESTIONS,
  cloneQuestionSet,
} from '../config/eventQuestionDefaults';

const DEFAULT_TIMEZONE = 'Africa/Nairobi';
const DEFAULT_DURATION_MINUTES = 180;

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value).split(',').map((v) => v.trim()).filter(Boolean);
};

const normalizeReminderHours = (value) => {
  if (!Array.isArray(value)) return [48];
  return Array.from(
    new Set(
      value
        .map(Number)
        .filter((hours) => Number.isFinite(hours) && hours > 0),
    ),
  ).sort((a, b) => b - a);
};

const slugify = (value = '') => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export function isEventEnded(event, now = new Date()) {
  const endValue = event?.ends_at ?? event?.endsAt;
  if (!endValue) return false;

  const end = new Date(endValue);
  return !Number.isNaN(end.getTime()) && end.getTime() <= now.getTime();
}

export function toFrontendEvent(row) {
  if (!row) return null;

  const ended = isEventEnded(row);
  const effectiveStatus = row.status === 'upcoming' && ended ? 'past' : row.status;

  return {
    ...row,
    status: effectiveStatus,

    date:
      row.date_text ??
      row.date ??
      '',

    img:
      row.image_path ??
      row.img ??
      null,

    imgAlt:
      row.image_alt_text ??
      row.imgAlt ??
      '',

    posterMediaId:
      row.poster_media_id ??
      row.posterMediaId ??
      null,

    timezone:
      row.timezone ||
      DEFAULT_TIMEZONE,

    durationMinutes:
      row.duration_minutes ??
      DEFAULT_DURATION_MINUTES,

    endsAt:
      row.ends_at ??
      null,

    reminderHours: Array.isArray(row.reminder_hours)
      ? row.reminder_hours
      : [48],

    feedbackEnabled:
      row.feedback_enabled !== false,

    feedbackDelayHours:
      row.feedback_delay_hours ??
      24,

    feedbackQuestions:
      row.feedback_questions || [],

    attendanceFinalizedAt:
      row.attendance_finalized_at ??
      null,
  };
}

function toDatabaseEvent(event) {
  return {
    slug:
      event.slug ||
      slugify(event.title),

    title: event.title,

    subtitle:
      event.subtitle || null,

    theme:
      event.theme || null,

    date_text:
      event.date ??
      event.date_text ??
      null,

    starts_at:
      event.starts_at || null,

    timezone:
      event.timezone ||
      DEFAULT_TIMEZONE,

    duration_minutes:
      event.durationMinutes ??
      event.duration_minutes ??
      DEFAULT_DURATION_MINUTES,

    location:
      event.location || null,

    audience:
      event.audience || null,

    tags:
      normalizeList(event.tags),

    body:
      event.body || null,

    image_path:
      event.img ??
      event.image_path ??
      null,

    image_alt_text:
      event.imgAlt ??
      event.image_alt_text ??
      null,

    poster_media_id:
      event.posterMediaId ??
      event.poster_media_id ??
      null,

    status:
      event.status ||
      'draft',

    featured:
      !!event.featured,

    partners:
      normalizeList(event.partners),

    poster:
      event.poster || null,

    capacity:
      event.capacity === '' || event.capacity == null
        ? null
        : Number(event.capacity),

    // IMPORTANT: [] means reminders are intentionally disabled.
    reminder_hours:
      event.reminder_hours !== undefined
        ? normalizeReminderHours(event.reminder_hours)
        : event.reminderHours !== undefined
          ? normalizeReminderHours(event.reminderHours)
          : [48],

    questions:
      Array.isArray(event.questions)
        ? event.questions
        : cloneQuestionSet(DEFAULT_EVENT_REGISTRATION_QUESTIONS),

    feedback_enabled:
      event.feedback_enabled ??
      event.feedbackEnabled ??
      true,

    feedback_delay_hours:
      Number(
        event.feedback_delay_hours ??
        event.feedbackDelayHours ??
        24,
      ),

    feedback_questions:
      Array.isArray(event.feedback_questions)
        ? event.feedback_questions
        : Array.isArray(event.feedbackQuestions)
          ? event.feedbackQuestions
          : cloneQuestionSet(DEFAULT_EVENT_FEEDBACK_QUESTIONS),
  };
}

function sortEventsForCms(events) {
  const timestamp = (event) => {
    const raw = event?.starts_at || event?.created_at || 0;
    const value = new Date(raw).getTime();
    return Number.isNaN(value) ? 0 : value;
  };

  const rank = (event) => {
    if (event?.status === 'upcoming') return 0;
    if (event?.status === 'past') return 1;
    return 2; // Drafts remain available, but published lifecycle comes first.
  };

  return [...events].sort((a, b) => {
    const rankDifference = rank(a) - rank(b);
    if (rankDifference !== 0) return rankDifference;

    // Upcoming events: next event first. Past and draft events: newest first.
    const timeDifference =
      rank(a) === 0
        ? timestamp(a) - timestamp(b)
        : timestamp(b) - timestamp(a);

    if (timeDifference !== 0) return timeDifference;
    return String(a?.title || '').localeCompare(String(b?.title || ''));
  });
}

export async function getEvents({ includeDrafts = false } = {}) {
  let query = supabase
    .from('events')
    .select('*')
    .order('starts_at', {
      ascending: true,
      nullsFirst: false,
    });

  if (!includeDrafts) {
    query = query.neq('status', 'draft');
  }

  const { data, error } = await query;

  if (error) throw error;

  const mapped = (data ?? []).map(toFrontendEvent);

  // CMS views ask for drafts too. Keep the next upcoming event first, then
  // the most recent past events through the oldest, followed by drafts.
  return includeDrafts ? sortEventsForCms(mapped) : mapped;
}

export async function getEventBySlug(slug) {
  const { data, error } = await supabase.rpc('get_public_event', { p_slug: slug });
  if (error) throw error;
  if (!data) throw new Error('Event not found');

  let waitlistOpen = data.waitlist_open;
  if (data.id) {
    const { data: waitlistState, error: waitlistError } = await supabase.rpc(
      'get_event_waitlist_open',
      { p_event_id: data.id },
    );
    if (!waitlistError && typeof waitlistState === 'boolean') {
      waitlistOpen = waitlistState;
    }
  }

  return toFrontendEvent({ ...data, waitlist_open: waitlistOpen });
}

export async function registerForEvent({
  eventId,
  name,
  email,
  phone,
  answers,
  evaluationConsent = null,
  futureContactConsent = null,
  photoConsent = null,
  consentVersion = '2026-09',
}) {
  const lifecycleAnswers = {
    ...(answers || {}),
    _consent: {
      evaluation_consent: evaluationConsent,
      future_contact_consent: futureContactConsent,
      photo_consent: photoConsent,
      consent_version: consentVersion,
    },
  };

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
            answers: lifecycleAnswers,
          },
        },
      },
    );

  if (error) {
    let message = error.message || 'Registration failed.';
    try {
      const body = await error?.context?.json?.();
      message = body?.error || message;
    } catch {}
    throw new Error(message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function createEvent(event) {
  const { data, error } = await supabase
    .from('events')
    .insert(toDatabaseEvent(event))
    .select()
    .single();
  if (error) throw error;
  return toFrontendEvent(data);
}

export async function updateEvent(id, event) {
  const payload = toDatabaseEvent(event);
  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toFrontendEvent(data);
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

export async function getEventRegistrations(eventId) {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function invokeWaitlistManagement(body) {
  const { data, error } = await supabase.functions.invoke('manage-event-waitlist', {
    body,
  });

  if (error) {
    let message = error.message || 'Event waitlist update failed.';
    try {
      const response = await error?.context?.json?.();
      message = response?.error || message;
    } catch {}
    throw new Error(message);
  }

  if (data?.error) throw new Error(data.error);
  return data;
}

export async function setEventWaitlistOpen(eventId, open) {
  const expected = !!open;
  const result = await invokeWaitlistManagement({
    action: 'set_open',
    event_id: eventId,
    open: expected,
  });

  if (result?.waitlist_open !== expected) {
    throw new Error(
      `Waitlist state did not persist. Expected ${expected ? 'open' : 'closed'} but the server returned ${String(result?.waitlist_open)}.`,
    );
  }

  return result;
}

export async function promoteEventWaitlist(eventId, registrationIds) {
  return invokeWaitlistManagement({
    action: 'promote',
    event_id: eventId,
    registration_ids: Array.from(new Set(registrationIds || [])),
  });
}

export async function saveEventOperationsSettings(eventId, event) {
  const reminderHours = Array.isArray(event.reminder_hours)
    ? event.reminder_hours
    : Array.isArray(event.reminderHours)
      ? event.reminderHours
      : [];

  const { data, error } = await supabase.rpc('save_event_operations_settings', {
    p_event_id: eventId,
    p_capacity: event.capacity === '' || event.capacity == null ? null : Number(event.capacity),
    p_reminder_hours: normalizeReminderHours(reminderHours),
    p_questions: Array.isArray(event.questions) ? event.questions : [],
    p_feedback_enabled: event.feedback_enabled ?? event.feedbackEnabled ?? true,
    p_feedback_delay_hours: Number(event.feedback_delay_hours ?? event.feedbackDelayHours ?? 24),
    p_feedback_questions: Array.isArray(event.feedback_questions)
      ? event.feedback_questions
      : Array.isArray(event.feedbackQuestions)
        ? event.feedbackQuestions
        : [],
  });
  if (error) throw error;
  return toFrontendEvent(data);
}

export async function getEventFeedback(eventId) {
  const { data, error } = await supabase
    .from('event_feedback')
    .select('*')
    .eq('event_id', eventId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function setRegistrationAttendance(
  registrationId,
  attendanceStatus,
) {
  const allowed = ['pending', 'attended', 'no_show'];
  if (!allowed.includes(attendanceStatus)) {
    throw new Error('Invalid attendance status.');
  }

  const patch = {
    attendance_status: attendanceStatus,
    checked_in_at: attendanceStatus === 'attended'
      ? new Date().toISOString()
      : null,
  };

  const { data, error } = await supabase
    .from('event_registrations')
    .update(patch)
    .eq('id', registrationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addEventWalkIn({
  eventId,
  name,
  email = null,
  phone = null,
}) {
  const { data, error } = await supabase.rpc('add_event_walk_in', {
    p_event_id: eventId,
    p_name: name,
    p_email: email || null,
    p_phone: phone || null,
  });
  if (error) throw error;
  return data;
}

export async function finalizeEventAttendance(eventId) {
  const { data, error } = await supabase.rpc('finalize_event_attendance', {
    p_event_id: eventId,
  });
  if (error) throw error;
  return data;
}

export async function getEventFeedbackContext(token) {
  const { data, error } = await supabase.rpc('get_event_feedback_context', {
    p_token: token,
  });
  if (error) throw error;
  if (!data) throw new Error('This feedback link is not available.');
  return data;
}

export async function submitEventFeedback({ token, answers }) {
  const { data, error } = await supabase.functions.invoke('event-feedback', {
    body: { token, answers },
  });

  if (error) {
    let message = error.message || 'Feedback submission failed.';
    try {
      const body = await error?.context?.json?.();
      message = body?.error || message;
    } catch {}
    throw new Error(message);
  }

  if (data?.error) throw new Error(data.error);
  return data;
}
