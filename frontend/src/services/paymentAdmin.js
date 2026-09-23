import { supabase } from '@/lib/supabase';

export async function getOrdersForPaymentReview() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function confirmManualPayment(orderId) {
  const { data, error } = await supabase.functions.invoke(
    'confirm-manual-payment',
    {
      body: {
        order_id: orderId,
      },
    },
  );

  if (error) {
    let message = error.message || 'Payment confirmation failed.';

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
