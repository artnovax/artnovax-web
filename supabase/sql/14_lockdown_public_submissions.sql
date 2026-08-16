-- Public form submissions now go through the
-- public-submission Edge Function.

drop policy if exists
  "Anyone can submit contact messages"
on public.contact_messages;

drop policy if exists
  "Anyone can submit partnership inquiries"
on public.partner_inquiries;

drop policy if exists
  "Anyone can submit volunteer applications"
on public.volunteer_applications;
