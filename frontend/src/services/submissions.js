import { supabase } from '@/lib/supabase';

const friendlyError = (error, fallback) => {
  if (!error) return fallback;
  if (error.code === '23505') return 'You are already on this list.';
  return error.message || fallback;
};

export async function subscribeNewsletter(email, source) {
  const { data, error } = await supabase.rpc('subscribe_newsletter', { p_email: email, p_source: source || null });
  if (error) throw new Error(friendlyError(error, 'Subscription failed.'));
  return data;
}

export async function joinAppWaitlist(email) {
  const { data, error } = await supabase.rpc('join_app_waitlist', { p_email: email });
  if (error) throw new Error(friendlyError(error, 'Waitlist signup failed.'));
  return data;
}

export async function submitContact(form) {
  const { error } = await supabase.from('contact_messages').insert({
    name: form.name.trim(), email: form.email.trim().toLowerCase(), subject: form.subject.trim(), message: form.message.trim(),
  });
  if (error) throw new Error(friendlyError(error, 'Message failed to send.'));
  return { status: 'sent' };
}

export async function submitPartnerInquiry(form) {
  const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() || null : v]));
  payload.email = (form.email || '').trim().toLowerCase();
  const { error } = await supabase.from('partner_inquiries').insert(payload);
  if (error) throw new Error(friendlyError(error, 'Partnership inquiry failed.'));
  return { status: 'submitted' };
}
