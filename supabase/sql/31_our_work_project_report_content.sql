-- OUR WORK PAGE CONTENT REFRESH
-- Based on the ArtNovaX Project Report.
-- Existing CMS images/media references are preserved.

insert into public.page_sections (page_key, section_key, content)
values
(
  'our_work',
  'hero',
  jsonb_build_object(
    'eyebrow', 'OUR WORK',
    'title', E'Creating space to\nmake, reflect and\nconnect.',
    'body', 'We bring together creative expression, mental-health education, community partnerships and technology to make wellbeing support feel more approachable.',
    'cta', jsonb_build_object(
      'label', 'Explore Our Programs',
      'href', '#programs'
    )
  )
),
(
  'our_work',
  'programs_heading',
  jsonb_build_object(
    'programsEyebrow', 'OUR PROGRAM AREAS',
    'programsTitle', 'What we do'
  )
),
(
  'our_work',
  'program_1',
  jsonb_build_object(
    'icon', 'brush',
    'title', E'Creative\nWellbeing',
    'body', 'Guided and free-form art experiences that create room for expression, reflection and connection.',
    'link', jsonb_build_object(
      'label', 'See our events',
      'href', '/events'
    )
  )
),
(
  'our_work',
  'program_2',
  jsonb_build_object(
    'icon', 'book-open',
    'title', E'Mental Health\nEducation',
    'body', 'Talks, webinars and Q&A sessions that open up practical conversations around mental health and support.',
    'link', jsonb_build_object(
      'label', 'Explore research',
      'href', '/research'
    )
  )
),
(
  'our_work',
  'program_3',
  jsonb_build_object(
    'icon', 'users',
    'title', E'Community &\nInnovation',
    'body', 'Campus partnerships and participant feedback help us shape our programmes and the digital ArtNovaX experience.',
    'link', jsonb_build_object(
      'label', 'Discover the app',
      'href', '/app'
    )
  )
),
(
  'our_work',
  'stats',
  jsonb_build_object(
    'title', E'What we have\ndone so far',
    'body', 'Since 2024, our work has grown across campus events, online programming and digital outreach.',
    'footnote', '*Updated through March 2026',
    'items', jsonb_build_array(
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
        'value', 'Up to 2.9K',
        'label', E'Estimated online\nreach'
      )
    )
  )
),
(
  'our_work',
  'partner_cta',
  jsonb_build_object(
    'body', 'Bring ArtNovaX to your campus or community. If you have an idea for a creative wellbeing programme, we would like to hear it.',
    'button', jsonb_build_object(
      'label', 'Partner With Us',
      'href', '/get-involved/partner'
    )
  )
)
on conflict (page_key, section_key)
do update set
  content = public.page_sections.content || excluded.content,
  updated_at = now();
