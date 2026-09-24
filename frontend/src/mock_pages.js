// Extended mock data for About, Our Work, Events pages

export const ABOUT = {
  eyebrow: 'ABOUT US',
  title: 'Our story is\nrooted in creativity,\ncare and community.',
  body: 'We began with a simple belief: everyone deserves spaces to express, reflect and heal. Technology should help protect those spaces, not compete for our attention.',
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
      {
        slug: 'marion-yego',
        name: 'Marion Yego',
        role: 'Founder & Executive Director',
        short: 'Veterinarian and creative who founded ArtNovaX to make art a genuine route to mental wellness.',
        bio: 'Marion founded ArtNovaX in 2023 from a very personal place. Art had helped her through some difficult periods with her own mental health, and she wanted more people to have access to that kind of outlet. Her veterinary background brings a strong scientific lens to the work we do, while her creative side keeps the organisation grounded in curiosity, experimentation and people.',
        img: '/assets/images/team/team-marion-yego.webp',
        linkedin: 'https://www.linkedin.com/in/marion-yego-5b3a46259/',
        funfact: 'Would happily live on potatoes in every form, from viazi karai to mashed.',
        medium: 'Pencil art',
        why_art: 'She has always seen art as something deeply human. For her, it can be a real place to process, express and heal.'
      },

      {
        slug: 'ray-simbiri',
        name: 'Ray Simbiri',
        role: 'Chief Technology Officer',
        short: 'Computer science student building the technology behind ArtNovaX.',
        bio: 'Ray joined ArtNovaX in August 2025 and leads the technology side of the organisation. He works on the platform, the guided art-therapy experience and the systems that support it. With a background in software and machine learning, he is especially interested in building technology that stays out of the way when it needs to and helps people focus on the experience itself. His interest in mental health comes from the idea of staying connected to yourself, especially when life gets noisy.',
        img: '/assets/images/team/team-ray-simbiri.png',
        linkedin: 'https://www.linkedin.com/in/simbiriisaacray/',
        funfact: 'Has a twin brother who is also a tech founder.',
        medium: 'Poetry, and sometimes a guitar',
        why_art: 'Poetry has often helped him understand a feeling before he knew how to explain it.'
      },

      {
        slug: 'purity-mutua',
        name: 'Purity Mutua',
        role: 'Partnerships Lead',
        short: 'Veterinary surgeon and artist helping grow the partnerships behind our work.',
        bio: 'Purity joined ArtNovaX after seeing the effect our art-therapy sessions were having on young people. She now leads partnerships and helps build the relationships that make our programmes possible. She brings experience in fundraising, a strong creative instinct and a real interest in opening up more honest conversations around mental health, especially among young people.',
        img: '/assets/images/team/team-purity-mutua.jpeg',
        linkedin: 'https://www.linkedin.com/in/purity-mutua/',
        funfact: 'Loves coffee, Pingu and Mørda’s BLE55ING5.',
        medium: 'Ink and paper',
        why_art: 'Creating gives your mind somewhere to go while things settle.'
      },

      {
        slug: 'sherlyn-cheredi',
        name: 'Sherlyn Cheredi',
        role: 'Research Lead',
        short: 'Analyst helping us understand what is working, what is not and where we can do better.',
        bio: 'Sherlyn joined ArtNovaX in May 2025 and leads our research work. She is interested in what it takes to make mental-health support feel more normal and more accessible across African communities. Her analytical background helps us look past good intentions and ask harder questions about impact, reach and what our programmes are actually changing.',
        img: '/assets/images/team/team-sherlyn-cheredi.jpg',
        linkedin: 'https://www.linkedin.com/in/sherlyn-cheredi-8354aa227/',
        funfact: 'Can spend 30 minutes choosing what to watch, then rewatch her comfort show for the 100th time.',
        medium: 'Adult colouring books',
        why_art: 'Sometimes creating says enough when words do not.'
      },

      {
        slug: 'ivy-maithya',
        name: 'Ivy Ndanu Maithya',
        role: 'Lead Psychologist',
        short: 'Counselling psychologist making sure our work stays safe, thoughtful and clinically grounded.',
        bio: 'Ivy joined ArtNovaX in 2026 as Lead Psychologist. Her work focuses on making mental-health support feel less intimidating and easier to access, particularly for young Kenyans who may never reach out because of stigma. She brings counselling psychology, trauma-informed practice and experience designing art, play and dance-based approaches. She also uses basic KSL, which helps us think more carefully about accessibility in the spaces we create.',
        img: '/assets/images/team/team-ivy-ndanu-maithya.webp',
        linkedin: null,
        funfact: 'Has a playlist for every mood and will sing anywhere like it is a full concert.',
        medium: 'Plasticine: soft, colourful and easy to reshape.',
        why_art: 'A young person may not say “I’m anxious”, but they might draw or paint something that gives you a way into that conversation.'
      },
      {
        slug: 'manuella-mirembe',
        name: 'Manuella Mirembe',
        role: 'Communications & Creative Advocacy Team Lead',
        short: 'Veterinary student and photographer helping tell ArtNovaX’s story through visual work and creative advocacy.',
        bio: 'Manuella joined ArtNovaX in 2026 because she wanted to help capture and share the work happening across the organisation. As a veterinary student and photographer, she is especially interested in the parts of mental health that often go unnoticed or unspoken. She leads our communications and creative advocacy work, using photography, film and storytelling to make our work easier to understand and more visible to the people it is meant to reach.',
        img: '/assets/images/team/team-manuella-mirembe.webp',
        linkedin: null,
        funfact: 'An ice cream lover, especially soft serve.',
        medium: 'Film and photography',
        why_art: 'She sees art as a language of its own. It can communicate something clearly even when words are difficult to find.'
      }
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
  image: 'https://images.unsplash.com/photo-1459908676235-d5f02a50184b',
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
