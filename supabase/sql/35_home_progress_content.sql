-- HOMEPAGE CONTENT REFRESH
-- Aligns the homepage language with current ArtNovaX activity and app development.

insert into public.page_sections (page_key, section_key, content)
values
(
  'home',
  'hero',
  jsonb_build_object(
    'eyebrow', jsonb_build_array('ART', 'WELLBEING', 'TECHNOLOGY'),
    'title', 'Creativity can become a place to breathe.',
    'body', 'We create spaces where art, mental wellbeing and thoughtful technology come together to help people slow down, express themselves, connect with others and make something of their own.',
    'primaryCta', jsonb_build_object(
      'label', 'Explore Our Work',
      'href', '/our-work'
    ),
    'secondaryCta', jsonb_build_object(
      'label', 'Discover ArtNovaX',
      'href', '/app'
    ),
    'bullets', jsonb_build_array(
      jsonb_build_object('icon', 'users', 'label', 'Creative wellbeing'),
      jsonb_build_object('icon', 'book-open', 'label', 'Mental-health education'),
      jsonb_build_object('icon', 'smartphone', 'label', 'Digital innovation')
    )
  )
),
(
  'home',
  'mission',
  jsonb_build_object(
    'subhead', 'From creative sessions and open mental-health conversations to a digital experience in development, we are building more ways for people to create and reflect.'
  )
),
(
  'home',
  'what_we_do',
  jsonb_build_object(
    'eyebrow', 'WHAT WE DO',
    'title', 'Creativity, conversation and technology—working together.',
    'items', jsonb_build_array(
      jsonb_build_object(
        'icon', 'brush',
        'title', 'Creative Wellbeing',
        'body', 'We create guided and free-form art experiences that give people room to express themselves, reflect and connect with others.',
        'link', jsonb_build_object('label', 'Explore our programs', 'href', '/our-work')
      ),
      jsonb_build_object(
        'icon', 'brain',
        'title', 'Mental Health Education',
        'body', 'Through talks, webinars and open Q&A sessions, we create space for practical conversations about mental health and support.',
        'link', jsonb_build_object('label', 'See our events', 'href', '/events')
      ),
      jsonb_build_object(
        'icon', 'app',
        'title', 'Digital Innovation',
        'body', 'We are developing ArtNovaX as a focused digital experience for guided creativity, reflection and in-app art making.',
        'link', jsonb_build_object('label', 'Discover the app', 'href', '/app')
      )
    )
  )
)
on conflict (page_key, section_key)
do update set
  content = public.page_sections.content || excluded.content,
  updated_at = now();
