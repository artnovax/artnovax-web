-- RESEARCH PAGE CONTENT REFRESH

insert into public.page_sections (page_key, section_key, content)
values
(
  'research',
  'hero',
  jsonb_build_object(
    'eyebrow', 'RESEARCH & INSIGHTS',
    'title', E'Research,\nwithout the jargon.',
    'body', 'We look at research on creativity and mental health, translate it into clear language, and use feedback from our programmes to guide what we explore next.',
    'cta', jsonb_build_object('label', 'Explore Insights', 'href', '#topics')
  )
),
(
  'research',
  'topics',
  jsonb_build_object(
    'topicsTitle', 'What we explore',
    'items', jsonb_build_array(
      jsonb_build_object('icon', 'brain', 'title', E'Art & Emotional\nWellbeing', 'body', 'What research says about creative expression, stress, emotions and self-awareness.'),
      jsonb_build_object('icon', 'sparkles', 'title', E'Creativity &\nThe Brain', 'body', 'What we know about attention, flow and what happens when we become absorbed in making something.'),
      jsonb_build_object('icon', 'book', 'title', E'Art Therapy\nExplained', 'body', 'What art therapy is, how it differs from creative wellbeing activities and where professional care fits in.'),
      jsonb_build_object('icon', 'users', 'title', E'Youth &\nMental Health', 'body', 'Research and practical perspectives on the pressures affecting young people and the support available to them.'),
      jsonb_build_object('icon', 'plant', 'title', E'Learning From\nOur Programmes', 'body', 'How participant feedback, event surveys and community conversations can help us shape future programmes and digital experiences.')
    )
  )
),
(
  'research',
  'band',
  jsonb_build_object(
    'quote', 'Art can express the inexpressible, can communicate the unknowable.',
    'author', '– Louise Bourgeois',
    'integrity', jsonb_build_object(
      'title', 'Learning from the people we serve',
      'body', 'At our March 2026 University of Nairobi event, we asked students about their understanding of art therapy and what they would want from a digital art experience. That feedback is helping shape ArtNovaX as it develops.',
      'link', jsonb_build_object('label', 'See the app in development', 'href', '/app')
    )
  )
),
(
  'research',
  'newsletter',
  jsonb_build_object(
    'title', 'Stay informed',
    'body', 'Get new articles, research notes and updates on what we are learning through our programmes.',
    'placeholder', 'Enter your email',
    'button', 'Subscribe'
  )
)
on conflict (page_key, section_key)
do update set
  content = public.page_sections.content || excluded.content,
  updated_at = now();
