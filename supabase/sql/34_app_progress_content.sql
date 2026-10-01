-- APP PAGE CONTENT REFRESH
-- Keeps the page aspirational while clearly reflecting the current development stage.

insert into public.page_sections (page_key, section_key, content)
values
(
  'app',
  'hero',
  jsonb_build_object(
    'eyebrow', 'ARTNOVAX APP',
    'statusLabel', 'In development',
    'title', E'A calmer space\nto create and reflect.',
    'body', 'We are building ArtNovaX as a distraction-conscious creative wellbeing app — a focused place for guided sessions, in-app drawing and reflection without the usual noise of your screen.',
    'primaryCta', jsonb_build_object(
      'label', 'Join the Waitlist',
      'href', '#waitlist'
    ),
    'secondaryCta', jsonb_build_object(
      'label', 'See How It Will Work',
      'href', '#how'
    ),
    'bullets', jsonb_build_array(
      jsonb_build_object(
        'icon', 'shield',
        'title', 'Focused Experience',
        'sub', 'Fewer distractions'
      ),
      jsonb_build_object(
        'icon', 'sparkles',
        'title', 'Guided Sessions',
        'sub', 'Step-by-step prompts'
      ),
      jsonb_build_object(
        'icon', 'download',
        'title', 'Draw & Paint',
        'sub', 'Create inside the app'
      ),
      jsonb_build_object(
        'icon', 'lock',
        'title', 'Private by Design',
        'sub', 'You choose what to keep'
      )
    )
  )
),
(
  'app',
  'features',
  jsonb_build_object(
    'featuresTitle', 'What we’re building',
    'items', jsonb_build_array(
      jsonb_build_object(
        'icon', 'shield',
        'title', 'Distraction-Conscious',
        'body', 'A focused experience designed to keep unnecessary prompts and interruptions out of the way.'
      ),
      jsonb_build_object(
        'icon', 'flower',
        'title', 'Guided Creative Sessions',
        'body', 'Structured exercises that give you a clear place to begin, create and reflect.'
      ),
      jsonb_build_object(
        'icon', 'palette',
        'title', 'Draw & Paint',
        'body', 'Simple in-app tools for drawing, painting and responding directly to creative prompts.'
      ),
      jsonb_build_object(
        'icon', 'smile',
        'title', 'Emotion Check-ins',
        'body', 'Space to notice how you feel before and after a session and reflect on changes over time.'
      ),
      jsonb_build_object(
        'icon', 'lock',
        'title', 'Private by Design',
        'body', 'Clear choices around what you save, what you revisit and what remains private.'
      ),
      jsonb_build_object(
        'icon', 'globe',
        'title', 'Shaped by Community',
        'body', 'Student input and real-world programme experience are helping us shape the digital experience.'
      )
    )
  )
),
(
  'app',
  'how_it_works',
  jsonb_build_object(
    'howTitle', 'How ArtNovaX will work',
    'steps', jsonb_build_array(
      jsonb_build_object(
        'icon', 'smile',
        'title', '1. Check In',
        'body', 'Pause for a moment and notice how you are feeling.'
      ),
      jsonb_build_object(
        'icon', 'list',
        'title', '2. Choose a Session',
        'body', 'Pick a guided creative exercise that fits your time and energy.'
      ),
      jsonb_build_object(
        'icon', 'brush',
        'title', '3. Create',
        'body', 'Follow the prompt and use the in-app canvas to draw or paint.'
      ),
      jsonb_build_object(
        'icon', 'sparkles',
        'title', '4. Reflect',
        'body', 'Check in again, add a reflection and notice what changed.'
      )
    ),
    'journey', jsonb_build_object(
      'title', 'Shaped with student input',
      'body', 'At our March 2026 University of Nairobi event, students shared what they knew about art therapy and what they wanted from a digital art experience. That feedback is helping shape development.'
    )
  )
),
(
  'app',
  'waitlist',
  jsonb_build_object(
    'title', 'Want to try ArtNovaX when early testing opens?',
    'body', 'Join the waitlist and we will let you know when there is a version ready to explore.',
    'placeholder', 'Enter your email',
    'button', 'Join Waitlist'
  )
)
on conflict (page_key, section_key)
do update set
  content = public.page_sections.content || excluded.content,
  updated_at = now();
