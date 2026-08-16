import { supabase } from '@/lib/supabase';

const friendlyError = (error, fallback) => {
  if (!error) return fallback;
  if (error.code === '23505') {
    return 'You are already on this list.';
  }
  return error.message || fallback;
};

async function invokeSubmission(type, payload) {
  const { data, error } =
    await supabase.functions.invoke(
      'public-submission',
      {
        body: {
          type,
          payload,
        },
      },
    );

  if (error) {
    throw new Error(
      friendlyError(
        error,
        'Submission failed.',
      ),
    );
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function subscribeNewsletter(
  email,
  source,
) {
  const { data, error } =
    await supabase.rpc(
      'subscribe_newsletter',
      {
        p_email: email,
        p_source: source || null,
      },
    );

  if (error) {
    throw new Error(
      friendlyError(
        error,
        'Subscription failed.',
      ),
    );
  }

  return data;
}

export async function joinAppWaitlist(email) {
  const { data, error } =
    await supabase.rpc(
      'join_app_waitlist',
      {
        p_email: email,
      },
    );

  if (error) {
    throw new Error(
      friendlyError(
        error,
        'Waitlist signup failed.',
      ),
    );
  }

  return data;
}

export async function submitContact(form) {
  return invokeSubmission(
    'contact',
    form,
  );
}

export async function submitPartnerInquiry(
  form,
) {
  return invokeSubmission(
    'partner',
    form,
  );
}
