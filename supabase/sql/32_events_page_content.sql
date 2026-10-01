-- EVENTS PAGE CMS CONTENT REFRESH
-- Keeps the landing page engaging without hardcoded fictional event/testimonial content.
-- Existing hero image/media-library references are preserved.

insert into public.page_sections (page_key, section_key, content)
values
(
  'events',
  'hero',
  jsonb_build_object(
    'eyebrow', 'EVENTS',
    'title', E'Create together.\nReflect together.\nConnect.',
    'body', 'From campus art sessions to online creative challenges and mental-health webinars, our events bring people together to make, learn and talk openly about wellbeing.',
    'primaryCta', jsonb_build_object(
      'label', 'Explore Events',
      'href', '#events'
    ),
    'secondaryCta', jsonb_build_object(
      'label', 'See Past Events',
      'href', '#events'
    )
  )
),
(
  'events',
  'testimonials',
  jsonb_build_object('items', jsonb_build_array())
),
(
  'events',
  'idea_cta',
  jsonb_build_object(
    'title', 'Have an idea for an event?',
    'body', 'If there is a creative activity, conversation or campus programme you would like to run with us, tell us what you have in mind.',
    'button', jsonb_build_object(
      'label', 'Share Your Idea',
      'href', '/contact?topic=event-idea'
    )
  )
)
on conflict (page_key, section_key)
do update set
  content = public.page_sections.content || excluded.content,
  updated_at = now();
