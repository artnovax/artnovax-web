// Extended mock data for About, Our Work, Events pages

export const ABOUT = {
  eyebrow: 'ABOUT US',
  title: 'Our story is\nrooted in creativity,\ncare and community.',
  body: 'ArtNovaX began with a belief that everyone deserves spaces to express, reflect and heal—and that technology should protect those spaces, not distract from them.',
  image: 'https://images.pexels.com/photos/7859206/pexels-photo-7859206.jpeg',
  imageAlt: 'Close-up of hands painting with colorful watercolors',
  pillars: [
    { icon: 'target', title: 'Our Mission', body: 'To promote mental wellbeing through creative expression, community programs, research and innovative technology that makes support more accessible.' },
    { icon: 'eye', title: 'Our Vision', body: 'A world where creativity is recognized as essential to mental health, and where everyone—especially young people—can access spaces that nurture their minds.' },
    { icon: 'values', title: 'Our Values', list: ['Compassion', 'Creativity', 'Community', 'Integrity', 'Inclusivity'] },
  ],
  founders: {
    eyebrow: 'MEET THE TEAM',
    title: 'The people behind ArtNovaX',
    people: [
      { slug: 'marion-yego', name: 'Marion Yego', role: 'Founder & Executive Director', short: 'Veterinarian and creative who founded ArtNovaX to make art a genuine route to mental wellness.', bio: 'Marion founded ArtNovaX in 2023 out of a deeply personal place — art had been her way through her own mental-health struggles, and she wanted others to have that door too. As a veterinarian she brings scientific rigour to our research work; as a creative she keeps our programs open, curious and human. Pencil art is where she finds herself.', img: '/assets/images/team/team-marion-yego.webp', linkedin: null, funfact: 'Would happily live on potatoes in every form — from viazi karai to mashed.', medium: 'Pencil art', why_art: 'She believes every human is intrinsically artistic — and that when used well, art is a real form of healing.' },
      { slug: 'ray-simbiri', name: 'Ray Simbiri', role: 'Chief Technology Officer', short: 'CS student at UChicago building ArtNovaX\u2019s calm, distraction-conscious platform.', bio: 'Ray joined ArtNovaX in August 2025, curious about what becomes possible when the healing side of creativity meets thoughtful technology. He leads the platform and its guided art-therapy sessions, using his background in machine learning and software to build tools that feel calm, accessible and human. To him, mental health is about staying connected to yourself — even when life is overwhelming.', img: '/assets/images/team/team-ray-simbiri.png', linkedin: 'https://www.linkedin.com/in/simbiriisaacray/', funfact: 'Firmly (and passionately) believes Messi is overrated.', medium: 'Poetry \u2014 and sometimes a guitar', why_art: 'Because art reaches what words cannot: poetry has often helped him understand a feeling long before he could describe it.' },
      { slug: 'purity-mutua', name: 'Purity Mutua', role: 'Partnerships Lead', short: 'Veterinary surgeon and artist mobilising partners for youth mental health.', bio: 'Purity joined ArtNovaX after seeing first-hand the impact of our art-therapy sessions with young people. As Partnerships Lead she brings fundraising know-how, an artist\u2019s eye and a deep belief that mental wellness is one of the most important conversations to have — especially with young people. Her medium is ink and paper.', img: '/assets/images/team/team-purity-mutua.jpeg', linkedin: 'https://www.linkedin.com/in/purity-mutua/', funfact: 'Loves coffee, Pingu and Mørda\u2019s BLE55ING5.', medium: 'Ink and paper', why_art: 'Creating gives you somewhere to put your mind while it settles.' },
      { slug: 'sherlyn-cheredi', name: 'Sherlyn Cheredi', role: 'Research Lead', short: 'Financial analyst helping ArtNovaX measure what really moves youth wellbeing.', bio: 'Sherlyn joined ArtNovaX in May 2025. She loves that we re-imagine what\u2019s possible in mental health, and as an analyst she\u2019s passionate about helping more Africans reach the point where asking for help feels okay. She brings the numbers so our programs stay honest about impact.', img: '/assets/images/team/team-sherlyn-cheredi.jpg', linkedin: null, funfact: 'Can spend 30 minutes picking what to watch\u2026 then rewatch her comfort show for the 100th time.', medium: 'Adult colouring books', why_art: 'Art is expression itself. When words fail, creating still says enough.' },
      { slug: 'ivy-maithya', name: 'Ivy Ndanu Maithya', role: 'Lead Psychologist', short: 'CPB-registered counselling psychologist grounding our work in safety and evidence.', bio: 'Ivy joined ArtNovaX in 2026 as Lead Psychologist. She believes deeply in making mental health support accessible, creative and non-intimidating for young Kenyans — especially the many who never ask for help because of stigma. She brings counselling psychology, trauma-informed art / play / dance therapy design and basic KSL to make our spaces truly safe.', img: '/assets/images/team/team-ivy-ndanu-maithya.webp', linkedin: null, funfact: 'Has a playlist for every mood \u2014 and will sing anywhere like it\u2019s a full concert.', medium: 'Plasticine \u2014 soft, colourful, endlessly re-shapeable, just like our stories.', why_art: 'Art bypasses stigma. Many young Kenyans won\u2019t say \u201cI\u2019m anxious\u201d, but they will paint it.' },
    ]
  },
  stats: {
    title: 'We are growing a movement\nof minds, hearts and hands.',
    items: [
      { icon: 'users', value: '80+', label: 'Participants\nengaged' },
      { icon: 'calendar', value: '15+', label: 'Creative sessions\nhosted' },
      { icon: 'landmark', value: '5+', label: 'Campuses & community\npartners' },
      { icon: 'globe', value: '3', label: 'Cities across\nKenya' },
    ]
  },
  cta: {
    title: 'Be part of our story.',
    body: 'Whether you create with us, collaborate with us, or support the mission, there is a place for you at ArtNovaX.',
    button: { label: 'Get Involved', href: '/get-involved' }
  }
};

export const OUR_WORK = {
  eyebrow: 'OUR WORK',
  title: 'Creating spaces that\nnurture minds, build\ncommunity and inspire\nchange.',
  body: 'We design and deliver creative, evidence-informed programs that support mental wellbeing for individuals and communities—across campuses, schools and public spaces.',
  cta: { label: 'Explore Our Programs', href: '#programs' },
  image: null,
  imageAlt: 'Colorful paintbrushes and vibrant paint — an artist\u2019s working still life',
  programsEyebrow: 'OUR PROGRAM AREAS',
  programsTitle: 'How we create impact',
  programs: [
    {
      icon: 'brush',
      title: 'Creative Wellbeing\nExperiences',
      body: 'Guided art making, doodling, poetry and reflective activities that help participants express emotions, reduce stress and build self-awareness.',
      link: { label: 'See upcoming events', href: '/events' },
      img: 'https://images.unsplash.com/photo-1461344577544-4e5dc9487184'
    },
    {
      icon: 'users',
      title: 'Community &\nPartnerships',
      body: 'We collaborate with universities, schools, youth groups and organizations to co-create sessions that are inclusive, accessible and meaningful.',
      link: { label: 'Partner with us', href: '/get-involved/partner' },
      img: '/assets/images/community/community-kabete-session.jpg'
    },
    {
      icon: 'book-open',
      title: 'Research &\nKnowledge Sharing',
      body: 'We explore the connection between art, creativity and mental health and share practical, easy-to-understand resources from the evidence.',
      link: { label: 'Learn more', href: '/research' },
      img: 'https://images.unsplash.com/photo-1579017308347-e53e0d2fc5e9'
    },
  ],
  stats: {
    title: 'Working toward\nmeasurable wellbeing',
    body: 'Our work is driven by compassion and informed by data. We listen, learn and continuously improve.',
    footnote: '*Numbers updated as of May 2026',
    items: [
      { icon: 'users', value: '80+', label: 'Participants\nengaged' },
      { icon: 'calendar', value: '15+', label: 'Creative sessions\nhosted' },
      { icon: 'landmark', value: '5+', label: 'Campuses &\ncommunity partners' },
      { icon: 'globe', value: '3', label: 'Cities across\nKenya' },
    ]
  },
  partnerCta: {
    body: 'Every workshop, every conversation, every artwork contributes to a culture that values mental health, creativity and connection.',
    button: { label: 'Partner With Us', href: '/get-involved/partner' }
  }
};

export const EVENTS = {
  eyebrow: 'EVENTS',
  title: 'Creating together.\nHealing together.',
  body: 'Our events bring people together to express, reflect, learn and connect through creative experiences that support mental wellbeing.',
  primaryCta: { label: 'View Upcoming Events', href: '#upcoming' },
  secondaryCta: { label: 'See Past Events', href: '#past' },
  image: '/assets/images/events/events-art-contest.webp',
  imageAlt: 'Group of young people painting together at an ArtNovaX event',
  featured: {
    tag: 'UPCOMING',
    title: 'Mental Health\nAwareness 2026',
    theme: 'Mindful of You: Campus of Care',
    date: 'Wednesday, 4th March 2026',
    location: 'University of Nairobi',
    audience: 'Open to all students',
    tags: 'Creative Expression • Mindfulness • Community',
    body: 'Join us for a day of creative activities, conversations and resources focused on mental wellbeing and building a supportive campus community.',
    posterTitle: 'Mental\nHealth',
    posterSubtitle: 'AWARENESS 2026',
    partners: ['ZURI HEALTH', 'ArtNovaX', 'NACADA']
  },
  upcoming: [
    {
      dateMonth: 'MAY', dateDay: '17', day: 'SAT',
      title: 'Doodling Together',
      subtitle: 'Creative expression session',
      location: 'Nairobi, Kenya',
      body: 'A guided doodling and reflection session exploring emotions through art.',
      img: 'https://images.unsplash.com/photo-1560831340-b9679dc9e9f0'
    },
    {
      dateMonth: 'JUN', dateDay: '21', day: 'SAT',
      title: 'Art & Mind Workshop',
      subtitle: 'Exploring art for wellbeing',
      location: 'Nairobi, Kenya',
      body: 'A hands-on workshop using art to reduce stress and spark joy.',
      img: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca'
    }
  ],
  past: [
    { title: 'Creative Circle – UoN', when: 'Feb 2026', img: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389' },
    { title: 'CD Art Therapy Session', when: 'Jan 2026', img: 'https://images.unsplash.com/photo-1510832842230-87253f48d74f' },
    { title: 'Colours of Connection', when: 'Dec 2025', img: 'https://images.pexels.com/photos/2559741/pexels-photo-2559741.jpeg' },
    { title: 'Mindful Art Sunday', when: 'Nov 2025', img: null },
  ],
  testimonials: [
    { quote: 'For once, I wasn’t worried about making something perfect. I could just create.', author: 'Participant, Doodling Together' },
    { quote: 'ArtNovaX gave me a space to breathe. I left lighter than I came.', author: 'Participant, Mindful Art Sunday' },
    { quote: 'It felt like therapy without the pressure. Just paint, people and honesty.', author: 'Participant, Creative Circle' },
  ],
  ideaCta: {
    title: 'Have an idea for an event?',
    body: "Whether you're an individual, student group, organization or community, we'd love to hear ideas for meaningful creative experiences.",
    button: {
      label: 'Share Your Idea',
      href: '/contact?topic=event-idea'
    }
  }
};
