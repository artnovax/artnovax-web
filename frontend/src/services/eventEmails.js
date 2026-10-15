import { supabase } from '@/lib/supabase';

const functionErrorMessage = async (error, fallback) => {
  let message = error?.message || fallback;

  try {
    const payload = await error?.context?.json?.();
    message = payload?.error || message;
  } catch {
    // Keep the Functions client error when no JSON body is available.
  }

  return message;
};

export async function getEventEmailCampaigns(eventId) {
  if (!eventId) return [];

  const { data, error } = await supabase
    .from('event_email_campaigns')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function sendEventRegistrantEmail({
  eventId,
  registrationIds,
  subject,
  bodyText,
  requestId,
}) {
  const { data, error } = await supabase.functions.invoke(
    'send-event-registrant-email',
    {
      body: {
        event_id: eventId,
        registration_ids: registrationIds,
        subject,
        body_text: bodyText,
        request_id: requestId,
      },
    },
  );

  if (error) {
    throw new Error(
      await functionErrorMessage(error, 'Event email delivery failed.'),
    );
  }

  if (data?.error) throw new Error(data.error);
  return data;
}
