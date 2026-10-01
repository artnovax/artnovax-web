-- ABOUT PAGE CONTENT REFRESH (concise version)
-- Based on the ArtNovaX Project Report.
-- Existing About-page images/media references are preserved.

insert into public.page_sections (page_key, section_key, content)
values
(
  'about',
  'hero',
  jsonb_build_object(
    'eyebrow', 'ABOUT US',
    'title', E'Our story is\nrooted in creativity,\ncare and community.',
    'body', 'Since 2024, ArtNovaX has brought art, mental wellbeing, community and technology together through creative programmes, campus outreach and a growing digital vision.'
  )
),
(
  'about',
  'pillars',
  jsonb_build_object(
    'items',
    jsonb_build_array(
      jsonb_build_object(
        'icon', 'target',
        'title', 'Our Mission',
        'body', 'To make creative approaches to mental wellbeing more accessible, engaging and relevant to young people.'
      ),
      jsonb_build_object(
        'icon', 'eye',
        'title', 'Our Approach',
        'body', 'We combine creative expression, mental-health education, community partnerships and thoughtful technology.'
      ),
      jsonb_build_object(
        'icon', 'values',
        'title', 'Our Direction',
        'body', 'We are growing from in-person experiences into digital tools designed to make creative wellbeing easier to access.'
      )
    )
  )
),
(
  'about',
  'stats',
  jsonb_build_object(
    'title', E'Growing the work,\none project at a time.',
    'items',
    jsonb_build_array(
      jsonb_build_object(
        'icon', 'users',
        'value', '480+',
        'label', E'Direct\nengagements'
      ),
      jsonb_build_object(
        'icon', 'calendar',
        'value', '5',
        'label', E'Projects\ndelivered'
      ),
      jsonb_build_object(
        'icon', 'globe',
        'value', '2.9K',
        'label', E'Estimated online\nreach'
      )
    )
  )
)
on conflict (page_key, section_key)
do update set
  content = public.page_sections.content || excluded.content,
  updated_at = now();
