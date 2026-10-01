-- FACTUAL PAST EVENTS FROM THE ARTNOVAX PROJECT REPORT
--
-- starts_at is used only for chronological sorting.
-- date_text is the verified public-facing date/month and is what the updated
-- Events/EventDetail components display for these historical records.

insert into public.events (
  slug,
  title,
  subtitle,
  date_text,
  starts_at,
  timezone,
  location,
  audience,
  tags,
  body,
  image_path,
  image_alt_text,
  status,
  featured,
  partners,
  feedback_enabled,
  reminder_hours,
  questions
)
values
(
  'art-therapy-mental-health-menstrual-wellbeing-2024',
  'Art Therapy for Mental Health and Menstrual Wellbeing',
  'Mental-health education, guided art therapy and menstrual wellbeing',
  'March 16, 2024',
  '2024-03-16 12:00:00+03'::timestamptz,
  'Africa/Nairobi',
  'iHiT Kilimani',
  'University students aged 18–30',
  array['Art Therapy', 'Mental Health', 'Menstrual Wellbeing', 'University Students'],
  E'ArtNovaX’s pilot initiative brought 97 university students together for a psychologist-led suicide-prevention session, an anonymous Q&A, guided watercolor work and reflective sharing.\n\nThe event also included an art sale by members of the Foundation’s executive team, with proceeds directed to a partner organisation supporting access to sanitary products for young girls.',
  null,
  null,
  'past',
  false,
  array['HeyRafiki Ltd', 'One a Month Foundation'],
  false,
  '{}'::integer[],
  '[]'::jsonb
),
(
  'art-therapy-contest-2024',
  'Art Therapy Contest',
  'A five-day Mental Health Awareness Month creative challenge',
  'May 20–24, 2024',
  '2024-05-20 12:00:00+03'::timestamptz,
  'Africa/Nairobi',
  'Online',
  'University of Nairobi Upper Kabete Campus students',
  array['Creative Expression', 'Mental Health Awareness', 'Online'],
  E'For five days, participants created artwork around a different mental-health theme, shared it online and added a short reflection connecting the piece to their emotions or wellbeing.\n\nTwelve participants took part, four winners received ArtNovaX-branded notebooks and badges, and the shared work reached an estimated audience of about 400 people.',
  '/assets/images/events/events-art-contest.webp',
  'ArtNovaX Art Therapy Contest',
  'past',
  false,
  array[
    'University of Nairobi Students’ Association – Faculty of Veterinary Medicine',
    'University of Nairobi Students’ Association – Faculty of Agriculture'
  ],
  false,
  '{}'::integer[],
  '[]'::jsonb
),
(
  'art-therapy-campus-event-upper-kabete-2024',
  'Art Therapy Campus Event',
  'A free-form creative wellbeing session at Upper Kabete',
  'October 2024',
  '2024-10-01 12:00:00+03'::timestamptz,
  'Africa/Nairobi',
  'University of Nairobi Upper Kabete Campus',
  'Students from the Faculties of Veterinary Medicine and Agriculture',
  array['Campus', 'Art Therapy', 'Creative Expression'],
  E'Around 20 students joined a relaxed, free-form art session organised with the Faculty of Veterinary Medicine Student Council.\n\nUnlike a guided session, participants chose what they wanted to create and used painting as a space for self-expression, reflection and stress relief.',
  '/assets/images/community/community-kabete-session.jpg',
  'ArtNovaX community art session at University of Nairobi Upper Kabete Campus',
  'past',
  false,
  array['Student Council, Faculty of Veterinary Medicine – University of Nairobi'],
  false,
  '{}'::integer[],
  '[]'::jsonb
),
(
  'mental-health-webinar-2025',
  'Mental Health Webinar',
  'Suicide prevention and student mental health · Guest speaker: Becky Wanjiru',
  'June 14, 2025',
  '2025-06-14 12:00:00+03'::timestamptz,
  'Africa/Nairobi',
  'Online',
  null,
  array['Mental Health', 'Suicide Prevention', 'Webinar'],
  E'Fifty-three participants joined an online session focused on suicide prevention among university students. The webinar explored risk factors, common triggers, warning signs, underlying mental-health challenges and practical prevention strategies.\n\nThe session concluded with an interactive Q&A, giving participants space to ask questions and engage with professional guidance.',
  null,
  null,
  'past',
  false,
  '{}'::text[],
  false,
  '{}'::integer[],
  '[]'::jsonb
),
(
  'mindful-of-you-campus-of-care-2026',
  'Mindful of You: Campus of Care',
  'Mental-health awareness, creative outreach and student input',
  'March 5, 2026',
  '2026-03-05 12:00:00+03'::timestamptz,
  'Africa/Nairobi',
  'University of Nairobi Main Campus',
  'University of Nairobi students',
  array['Mental Health', 'Campus', 'Art Therapy', 'Digital Innovation'],
  E'ArtNovaX joined a campus mental-health awareness event that reached approximately 300 students. The Foundation’s Founder took part in a panel on student mental wellness, while the ArtNovaX booth introduced visitors to art therapy through hands-on creative activities.\n\nThe team also surveyed students about their knowledge of art therapy and what they would like to see in the developing digital ArtNovaX experience. Photos, videos and event highlights reached an estimated audience of up to 2,000 people online.',
  null,
  null,
  'past',
  true,
  '{}'::text[],
  false,
  '{}'::integer[],
  '[]'::jsonb
)
on conflict (slug)
do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  date_text = excluded.date_text,
  starts_at = excluded.starts_at,
  timezone = excluded.timezone,
  location = excluded.location,
  audience = excluded.audience,
  tags = excluded.tags,
  body = excluded.body,
  image_path = excluded.image_path,
  image_alt_text = excluded.image_alt_text,
  status = excluded.status,
  featured = excluded.featured,
  partners = excluded.partners,
  feedback_enabled = excluded.feedback_enabled,
  reminder_hours = excluded.reminder_hours,
  questions = excluded.questions,
  updated_at = now();

-- The old mock event names were removed from frontend/src/mock_pages.js.
-- If any of those placeholder records were manually copied into your Supabase
-- events table in the past, review them in Admin and delete them there rather
-- than deleting database rows blindly in this migration.
