-- PARTNER PAGE CONTENT REFRESH

insert into public.page_sections (page_key, section_key, content)
values
(
  'partner',
  'intro',
  jsonb_build_object(
    'eyebrow', 'PARTNER WITH US',
    'title', 'Let’s build something meaningful together.',
    'body', 'We work with universities, student groups, nonprofits and organisations to create art-based wellbeing experiences, mental-health conversations and community programmes. If you have a clear idea for something we could build together, tell us about it.'
  )
),
(
  'partner',
  'form',
  jsonb_build_object(
    'organisationHeading', 'ORGANISATION',
    'orgNamePlaceholder', 'Organisation name *',
    'websitePlaceholder', 'Website',
    'orgTypePlaceholder', 'Organisation type…',
    'orgTypeOptions', jsonb_build_array(
      'University / School',
      'NGO / Non-profit',
      'Corporate / Brand',
      'Government',
      'Community group',
      'Other'
    ),
    'partnershipTypePlaceholder', 'Partnership type…',
    'partnershipTypeOptions', jsonb_build_array(
      'Program collaboration',
      'Event / Workshop',
      'Sponsorship',
      'Research collaboration',
      'Content / Media',
      'Other'
    ),
    'contactHeading', 'POINT OF CONTACT',
    'contactNamePlaceholder', 'Contact name *',
    'rolePlaceholder', 'Role at your organisation',
    'emailPlaceholder', 'Work email *',
    'phonePlaceholder', 'Phone',
    'detailsHeading', 'PARTNERSHIP DETAILS',
    'goalsPlaceholder', 'What would you like to create or achieve with ArtNovaX?',
    'audiencePlaceholder', 'Who is the programme for? (e.g. students, staff, community members)',
    'timelinePlaceholder', 'Preferred timing (e.g. next semester / preferred month)',
    'budgetPlaceholder', 'Indicative budget (optional)',
    'messagePlaceholder', 'Anything else that would help us understand the idea',
    'responseNote', 'Include as much detail as you can about the idea, audience and timing.',
    'submitLabel', 'Submit inquiry',
    'submittingLabel', 'Sending…'
  )
),
(
  'partner',
  'success',
  jsonb_build_object(
    'title', 'Thanks — we received your inquiry.',
    'body', 'We’ll review what you shared and follow up if we need more detail or there is a clear next step.',
    'button', jsonb_build_object('label', 'Back to home', 'href', '/')
  )
)
on conflict (page_key, section_key)
do update set
  content = public.page_sections.content || excluded.content,
  updated_at = now();
