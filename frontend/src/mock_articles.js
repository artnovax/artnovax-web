// Bundled Research & Insights articles.
//
// These are intentionally written as plain-language educational pieces rather
// than as substitutes for clinical advice. Claims are kept close to the
// evidence listed in each article's Sources block.

export const ARTICLES = {
  'art-and-emotional-wellbeing': {
    slug: 'art-and-emotional-wellbeing',
    topic: 'Art & Emotional Wellbeing',
    tags: ['Emotions', 'Practice', 'Everyday'],
    title: 'What creative expression can — and can’t — do for wellbeing.',
    excerpt: 'Making art can be useful, absorbing and calming. That does not make every creative activity therapy.',
    read: '7 min read',
    updated: 'September 2026',
    hero: 'https://images.unsplash.com/photo-1470635824525-7f1f1e5a4ebc',
    lead: 'A lot of claims are made about art and mental health. Some are supported by a broad research base; others come from small studies or are simply repeated because they sound right. The useful question is not whether art is “good for you” in the abstract, but what kind of creative activity may help, for whom, and how strong the evidence actually is.',
    blocks: [
      { type: 'h2', text: 'There is real evidence, but it covers very different kinds of art' },
      { type: 'p', text: 'A major World Health Organization scoping review brought together more than 3,000 studies on the arts and health. It found evidence across prevention, health promotion and the management or treatment of illness. That is a large body of work, but it also includes very different activities, populations and study designs. A museum visit, choir, drawing exercise and clinical art-therapy session are not interchangeable interventions.' },
      { type: 'p', text: 'That distinction matters. “Creative activity” is a broad category. “Art therapy” is a mental-health profession carried out within a therapeutic relationship. Research on one should not automatically be used to make claims about the other.' },

      { type: 'h2', text: 'What about stress?' },
      { type: 'p', text: 'One often-cited study asked 39 healthy adults to spend 45 minutes making art and measured salivary cortisol before and after. Cortisol was lower afterwards for most participants. It is an interesting finding, but it was a small quasi-experimental study, so it should be treated as suggestive rather than proof that drawing reliably lowers stress for everyone.' },
      { type: 'img', src: 'https://images.unsplash.com/photo-1461344577544-4e5dc9487184', alt: 'Hands making colorful art with paint on paper', caption: 'A creative activity can be worthwhile without needing to promise a clinical outcome.' },

      { type: 'h2', text: 'Clinical art therapy has a different evidence base' },
      { type: 'p', text: 'A 2024 systematic review and meta-analysis of visual art therapy for adults with depressive symptoms found an improvement compared with control conditions, but the authors rated the overall evidence as low quality and called for larger, stronger studies. That is a much more useful conclusion than saying art “heals depression”: there is promising evidence for a structured clinical intervention, alongside important limitations.' },

      { type: 'h2', text: 'So where does everyday creativity fit?' },
      { type: 'p', text: 'You do not need a clinical claim for a creative practice to be valuable. Drawing can give you something concrete to focus on. Journaling can help you slow down long enough to notice what is on your mind. Making something with other people can also be social, playful and restorative. Those are worthwhile experiences even when we cannot attach a medical outcome to them.' },
      { type: 'p', text: 'At ArtNovaX, this is the line we want to keep clear: a creative wellbeing session can support reflection, expression and connection. It should not be described as treatment unless it is actually being delivered as clinical care by an appropriately trained professional.' },

      { type: 'h2', text: 'Try this as a wellbeing exercise' },
      { type: 'p', text: 'Set aside ten minutes and choose one simple material: a pen, pencil, paint or whatever you already have. Instead of trying to make something “good”, respond to one prompt: What did today feel like? When the time is up, look at what you made and write down one thing you notice. You do not have to interpret it. The point is to create a small pause in your day.' },
      { type: 'p', text: 'If a creative exercise brings up distress that feels difficult to manage, stop and seek support from someone qualified to help. A self-guided activity is not a substitute for mental-health care.' },

      {
        type: 'sources',
        items: [
          {
            title: 'World Health Organization — What is the evidence on the role of the arts in improving health and well-being? (2019)',
            detail: 'Large scoping review covering more than 3,000 studies across arts and health.',
            url: 'https://www.who.int/europe/publications/i/item/9789289054553'
          },
          {
            title: 'Kaimal, Ray & Muniz — Reduction of Cortisol Levels and Participants’ Responses Following Art Making (2016)',
            detail: 'Small quasi-experimental study of 39 healthy adults.',
            url: 'https://www.tandfonline.com/doi/full/10.1080/07421656.2016.1166832'
          },
          {
            title: 'Han et al. — The effects of visual art therapy on adults with depressive symptoms: a systematic review and meta-analysis (2024)',
            detail: 'Meta-analysis reporting promising results while rating the evidence as low quality.',
            url: 'https://onlinelibrary.wiley.com/doi/full/10.1111/inm.13331'
          }
        ]
      }
    ],
    takeaways: [
      'Arts-and-health research is broad; different activities should not be treated as the same intervention.',
      'Small studies can be useful without proving a universal effect.',
      'Clinical art therapy and everyday creative wellbeing activities are not the same thing.',
      'Creative practice can still be worthwhile without making medical claims.'
    ],
  },

  'creativity-and-the-brain': {
    slug: 'creativity-and-the-brain',
    topic: 'Creativity & The Brain',
    tags: ['Neuroscience', 'Focus', 'Flow'],
    title: 'Flow is real. The brain story is still being worked out.',
    excerpt: 'Why getting absorbed in a task feels distinctive — and why neuroscience has not reduced flow to one neat brain mechanism.',
    read: '7 min read',
    updated: 'September 2026',
    hero: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
    lead: 'People often describe flow as the point where they become deeply absorbed in what they are doing: attention narrows, self-consciousness recedes and time can feel different. Psychology has studied the experience for decades. The neuroscience is newer, smaller and less settled than many popular explanations make it sound.',
    blocks: [
      { type: 'h2', text: 'What researchers mean by flow' },
      { type: 'p', text: 'Flow is generally described as a subjective state of deep task engagement in which the activity feels rewarding and performance can feel unusually smooth. It is often associated with a balance between challenge and skill, clear goals and immediate feedback. You can experience versions of it while painting, coding, playing music, solving a problem or practising a sport.' },

      { type: 'h2', text: 'There is no single “flow circuit”' },
      { type: 'p', text: 'A 2022 systematic review looked at studies of the neural correlates of flow. The research points to several brain regions and networks that may be involved, but the studies use different tasks, definitions and methods. The authors describe the field as promising but still developing.' },
      { type: 'p', text: 'That is why simple claims such as “flow switches off the default mode network” should be treated cautiously. Some studies are consistent with changes in self-referential processing and attentional control, but the evidence does not support one universal brain signature that appears every time someone enters flow.' },
      { type: 'img', src: 'https://images.unsplash.com/photo-1578941838877-141265f3a898', alt: 'A serene art journal open on a wooden table with brushes', caption: 'The practical lesson is simpler than the neuroscience: make it easier to stay with one task for a while.' },

      { type: 'h2', text: 'Why creative work can be a good setting for deep focus' },
      { type: 'p', text: 'Creative tasks can offer several conditions that make sustained engagement easier: a visible next step, feedback from the material itself, room for experimentation and a challenge that can be adjusted as you go. That does not guarantee flow, but it can create a useful environment for focused attention.' },
      { type: 'p', text: 'The most helpful design choice may be ordinary rather than neurological: reduce interruptions. Put the phone out of reach, choose one task, gather your materials before you begin and give yourself enough time to get past the first few restless minutes.' },

      { type: 'h2', text: 'Do not turn flow into another performance target' },
      { type: 'p', text: 'Trying to force flow can defeat the point. Some sessions will feel absorbing; others will feel awkward or distracted. Both can still be worthwhile. A ten-minute sketch that never becomes immersive can still give your attention somewhere to go.' },

      { type: 'h2', text: 'A simple way to set up for focus' },
      { type: 'p', text: 'Choose a task that is a little more demanding than autopilot but not so difficult that you immediately want to stop. Decide what “done for today” means, remove one obvious source of interruption and work for fifteen to twenty minutes before judging the session. If you get absorbed, great. If not, you still practised giving one thing your attention.' },

      {
        type: 'sources',
        items: [
          {
            title: 'Alameda, Sanabria & Ciria — The brain in flow: A systematic review on the neural basis of the flow state (2022)',
            detail: 'Systematic review of the developing neuroscience literature on flow.',
            url: 'https://www.sciencedirect.com/science/article/abs/pii/S0010945222001836'
          },
          {
            title: 'World Health Organization — What is the evidence on the role of the arts in improving health and well-being? (2019)',
            detail: 'Broad review of arts participation and health evidence.',
            url: 'https://www.who.int/europe/publications/i/item/9789289054553'
          }
        ]
      }
    ],
    takeaways: [
      'Flow describes an experience of deep engagement, not one proven brain switch.',
      'The neuroscience of flow is still developing and should not be oversimplified.',
      'Creative tasks can offer useful conditions for sustained attention.',
      'Reducing interruptions is a more practical goal than trying to force a flow state.'
    ],
  },

  'art-therapy-explained': {
    slug: 'art-therapy-explained',
    topic: 'Art Therapy Explained',
    tags: ['Clinical', 'Therapy', 'Guide'],
    title: 'Art therapy is a profession, not just art that feels therapeutic.',
    excerpt: 'A practical distinction between clinical art therapy, creative wellbeing activities and ordinary art making.',
    read: '8 min read',
    updated: 'September 2026',
    hero: 'https://images.unsplash.com/photo-1510832842230-87253f48d74f',
    lead: 'People often use “art therapy” to describe colouring, painting or any creative activity that helps them relax. In everyday conversation that is understandable. Professionally, though, art therapy has a much more specific meaning, and keeping that distinction clear protects both participants and practitioners.',
    blocks: [
      { type: 'h2', text: 'What the profession means by art therapy' },
      { type: 'p', text: 'The American Art Therapy Association defines art therapy as a mental-health profession that combines active art-making and the creative process with psychological theory inside a psychotherapeutic relationship. In the United States, art therapists are trained clinicians with graduate-level education. Credentialing and regulation differ by country, so local professional requirements also matter.' },
      { type: 'p', text: 'The key point is the therapeutic relationship and the practitioner’s training. A colouring book may feel therapeutic. A painting workshop may support wellbeing. Neither automatically becomes art therapy because art materials are involved.' },

      { type: 'h2', text: 'Why the distinction matters' },
      { type: 'p', text: 'Clinical work involves responsibilities that go beyond choosing a prompt. A practitioner needs to understand assessment, boundaries, safeguarding, confidentiality, risk, referral and what to do when a session brings up material that needs more support. Those responsibilities are part of why professional training matters.' },
      { type: 'img', src: 'https://images.unsplash.com/photo-1470635824525-7f1f1e5a4ebc', alt: 'A person making art in a quiet setting', caption: 'The presence of art materials does not, by itself, make an activity art therapy.' },

      { type: 'h2', text: 'What does the evidence say?' },
      { type: 'p', text: 'Research on clinical visual art therapy is promising in several areas, but the evidence is not equally strong for every condition or population. A 2024 meta-analysis of adults with depressive symptoms found an improvement compared with control groups, while also rating the evidence as low quality and calling for larger, better-designed studies.' },
      { type: 'p', text: 'That is a useful example of how to read this field: positive findings can be encouraging without becoming a promise that art therapy will work for every person or replace other forms of care.' },

      { type: 'h2', text: 'Where ArtNovaX fits' },
      { type: 'p', text: 'Many ArtNovaX activities are best described as creative wellbeing experiences: structured opportunities to make, reflect and connect. They can draw on principles such as choice, gentle pacing and psychological safety without being clinical treatment.' },
      { type: 'p', text: 'When a programme is genuinely being delivered as art therapy, that should be explicit: who the qualified professional is, what their role is, what the session is designed to do and what safeguards apply. Clear language is better than blurring the boundary because “art therapy” sounds more compelling.' },

      { type: 'h2', text: 'Questions to ask a practitioner' },
      { type: 'p', text: 'If you are looking for clinical art therapy, ask about the practitioner’s professional training, registration or credentialing where applicable, supervision, confidentiality, safeguarding and referral process. A qualified professional should be comfortable explaining their scope in plain language.' },
      { type: 'p', text: 'If what you want is simply a creative space to slow down and make something, that is valid too. It just deserves an accurate name.' },

      {
        type: 'sources',
        items: [
          {
            title: 'American Art Therapy Association — What is Art Therapy?',
            detail: 'Professional definition and description of art-therapist training in the U.S. context.',
            url: 'https://arttherapy.org/what-is-art-therapy/'
          },
          {
            title: 'American Art Therapy Association — About Art Therapy',
            detail: 'Includes guidance on distinguishing art therapy from non-clinical creative activities.',
            url: 'https://arttherapy.org/about-art-therapy/'
          },
          {
            title: 'Han et al. — The effects of visual art therapy on adults with depressive symptoms: a systematic review and meta-analysis (2024)',
            detail: 'Reports promising findings alongside low-quality evidence and a need for stronger studies.',
            url: 'https://onlinelibrary.wiley.com/doi/full/10.1111/inm.13331'
          },
          {
            title: 'World Health Organization — What is the evidence on the role of the arts in improving health and well-being? (2019)',
            detail: 'Broad evidence review across arts, health and wellbeing.',
            url: 'https://www.who.int/europe/publications/i/item/9789289054553'
          }
        ]
      }
    ],
    takeaways: [
      'Art therapy is a mental-health profession, not a synonym for any relaxing art activity.',
      'Training, therapeutic responsibility and the clinical relationship are central to the distinction.',
      'The evidence is promising in some areas but should not be overstated.',
      'Creative wellbeing sessions can be valuable without being described as clinical treatment.'
    ],
  },

  'youth-and-mental-health': {
    slug: 'youth-and-mental-health',
    topic: 'Youth & Mental Health',
    tags: ['Youth', 'Campus', 'Digital'],
    title: 'Young people’s mental health: what the evidence says, and what it doesn’t.',
    excerpt: 'A grounded look at stress, social media, connection and the temptation to blame one thing for a complicated problem.',
    read: '8 min read',
    updated: 'September 2026',
    hero: 'https://images.unsplash.com/photo-1632215861513-130b66fe97f4',
    lead: 'Young people are dealing with academic pressure, money, relationships, uncertainty, online life and the ordinary difficulty of growing into adulthood. It is tempting to find one explanation for rising concern about youth mental health. The evidence points to something more complicated.',
    blocks: [
      { type: 'h2', text: 'The scale of the issue is not small' },
      { type: 'p', text: 'The World Health Organization estimates that about one in seven people aged 10 to 19 experiences a mental disorder globally. Depression, anxiety and behavioural disorders are among the leading causes of illness and disability in adolescence. Those global numbers do not tell us exactly what any one campus or Kenyan community is experiencing, but they make clear that adolescent mental health is not a niche issue.' },
      { type: 'p', text: 'For local context, UNICEF’s Situation of Adolescents in Kenya 2024 brings together government data on health, wellbeing, education, technology use and other conditions affecting adolescents. It is a useful reminder that mental health sits inside a wider social and economic environment.' },

      { type: 'h2', text: 'Social media matters, but “phones are causing the crisis” is too simple' },
      { type: 'p', text: 'A 2024 systematic review and meta-analysis covering 182 studies examined social-media use, mental health and sleep in young people. The literature shows associations, especially around problematic patterns of use, sleep and poorer mental-health outcomes, but findings vary and the research does not support treating all social-media use as equally harmful.' },
      { type: 'p', text: 'That distinction matters because a correlation is not the same as a simple one-way cause. A young person who is already anxious, lonely or sleeping badly may also use social media differently. The platform, the content, the time of day, the reason for using it and what it replaces in someone’s life can all matter.' },
      { type: 'img', src: 'https://images.unsplash.com/photo-1579017308347-e53e0d2fc5e9', alt: 'A hand writing thoughtfully in a notebook', caption: 'A useful digital-wellbeing question is not only “How many hours?” but “What is this use replacing or helping me avoid?”' },

      { type: 'h2', text: 'Connection is one of the more consistent protective factors' },
      { type: 'p', text: 'A systematic review of adolescents experiencing social isolation found that family connection, school connection, social support, self-esteem and prosocial behaviour appeared repeatedly as protective factors. The studies were mostly from the United States, Australia and Europe, so we should be cautious about assuming the exact same patterns everywhere. Still, the broader importance of social connection is also reflected in current WHO work on loneliness and health.' },

      { type: 'h2', text: 'What can a campus or community actually do?' },
      { type: 'p', text: 'The answer is unlikely to be one campaign or one app. Practical support can include making it easier to find professional help, protecting sleep and downtime, creating low-pressure ways for people to meet in person, training staff and peers to recognise when someone needs more support, and making mental-health information easy to understand without turning every difficult emotion into a diagnosis.' },
      { type: 'p', text: 'Creative sessions can fit into that picture as one form of connection and reflection. They should be offered as an option, not sold as a cure.' },

      { type: 'h2', text: 'The question we want to keep asking' },
      { type: 'p', text: 'Instead of asking whether young people need to become more “resilient”, it can be more useful to ask what their environment is demanding of them and what makes support easier to reach. Individual coping skills matter. So do workload, money, safety, belonging, access to care and the design of the digital spaces people spend time in.' },

      {
        type: 'sources',
        items: [
          {
            title: 'World Health Organization — Mental health of adolescents (2025)',
            detail: 'Global overview of adolescent mental-health prevalence, risks and priorities.',
            url: 'https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health'
          },
          {
            title: 'UNICEF Kenya — Situation of Adolescents in Kenya 2024',
            detail: 'Kenya-specific snapshot covering health, wellbeing, education, technology use and other adolescent indicators.',
            url: 'https://www.unicef.org/kenya/reports/situation-adolescents-kenya-2024'
          },
          {
            title: 'Social media use, mental health and sleep: A systematic review with meta-analyses (2024)',
            detail: 'Large review of associations between social-media use, mental health and sleep in young people.',
            url: 'https://www.sciencedirect.com/science/article/pii/S0165032724014265'
          },
          {
            title: 'Preston & Rew — Connectedness, Self-Esteem, and Prosocial Behaviors Protect Adolescent Mental Health Following Social Isolation (2022)',
            detail: 'Systematic review of protective factors in adolescents following social isolation.',
            url: 'https://www.tandfonline.com/doi/abs/10.1080/01612840.2021.1948642'
          }
        ]
      }
    ],
    takeaways: [
      'Youth mental health is shaped by multiple social, personal and environmental factors.',
      'Social-media research is important, but simple cause-and-effect claims go beyond the evidence.',
      'Connection and social support repeatedly appear as protective factors.',
      'Creative programmes can support reflection and connection without pretending to replace clinical care.'
    ],
  },

  'culture-identity-and-wellbeing': {
    slug: 'culture-identity-and-wellbeing',
    topic: 'Culture, Identity & Wellbeing',
    tags: ['Culture', 'Community', 'Context'],
    title: 'Culture changes how mental-health support lands.',
    excerpt: 'Why language, relationships, local meaning and lived experience matter — without pretending there is one “African” way to heal.',
    read: '7 min read',
    updated: 'September 2026',
    hero: 'https://images.unsplash.com/photo-1552710307-537199cd41c0',
    lead: 'Mental-health support never arrives in a cultural vacuum. The words people use for distress, who they trust, how families are involved, what counts as acceptable help and what a person expects from a practitioner can all shape whether an intervention feels relevant or alien.',
    blocks: [
      { type: 'h2', text: 'Cultural relevance is more than translation' },
      { type: 'p', text: 'A systematic review of mental-health interventions in sub-Saharan Africa looked at how well published interventions reflected local cultural context. Only 29 studies met the review criteria, and the authors found that treatment concepts and goals were among the areas most likely to lack culturally sensitive elements. That is an important finding, but it also shows how limited the evidence base still is.' },
      { type: 'p', text: 'Changing a few words or adding local imagery is not the same as cultural adaptation. Language matters, but so do the assumptions behind the intervention: what “getting better” means, who should be involved, how distress is explained, what kind of relationship people expect with a helper and what practical barriers affect participation.' },

      { type: 'h2', text: 'Africa is not one cultural setting' },
      { type: 'p', text: 'It is easy for wellbeing projects to replace one broad Western template with an equally broad idea of “African culture”. That creates a different version of the same problem. Nairobi university students, rural families, different ethnic communities, faith communities and diaspora groups can have very different experiences and preferences.' },
      { type: 'img', src: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389', alt: 'Community members crafting together around a shared table', caption: 'The safest starting point is to ask people what feels familiar, useful and respectful rather than assuming in advance.' },

      { type: 'h2', text: 'What adaptation can look like' },
      { type: 'p', text: 'A review of psychological interventions delivered by lay health workers in Africa found that the interventions studied had been adapted in different ways to local settings and provider roles. The authors described promising results while also noting that the evidence base is small and that implementation research is still needed.' },
      { type: 'p', text: 'In practice, adaptation can mean changing examples and metaphors, using language people actually use, involving families or community structures when appropriate, adjusting the format around daily realities, and testing whether the goals of an intervention make sense to the people expected to use it.' },

      { type: 'h2', text: 'What this means for ArtNovaX' },
      { type: 'p', text: 'For us, “culturally connected” should not mean decorating a universal programme with African references. It should mean asking participants and partners what fits, testing prompts before scaling them, listening when something does not translate and being willing to change the programme.' },
      { type: 'p', text: 'It also means being precise about whose experience shaped a design. A session co-designed with university students in Nairobi may be useful elsewhere, but it should not automatically be presented as representative of young people across Kenya or Africa.' },

      { type: 'h2', text: 'A better standard than “culturally appropriate”' },
      { type: 'p', text: 'The useful question is not whether a programme has passed a one-time cultural checklist. It is whether the people using it can recognise themselves in the language, choices, relationships and assumptions built into it — and whether they have a real way to tell us when they cannot.' },

      {
        type: 'sources',
        items: [
          {
            title: 'Anakwenze — The cultural sensitivity continuum of mental health interventions in Sub-Saharan Africa: A systematic review (2022)',
            detail: 'Review of published interventions and the extent to which they reflected local cultural context.',
            url: 'https://www.sciencedirect.com/science/article/pii/S0277953622004300'
          },
          {
            title: 'Mabunda et al. — Cultural adaptation of psychological interventions delivered by lay health workers in Africa (2022)',
            detail: 'Scoping review and expert consultation on culturally adapted psychological interventions in African settings.',
            url: 'https://link.springer.com/article/10.1186/s13033-022-00526-x'
          },
          {
            title: 'Cultural adaptation of internet- and mobile-based interventions for mental disorders: a systematic review (2021)',
            detail: 'Review of how digital mental-health interventions have been culturally adapted across different populations.',
            url: 'https://www.nature.com/articles/s41746-021-00498-1'
          }
        ]
      }
    ],
    takeaways: [
      'Cultural adaptation involves goals, language, relationships and context — not just visual branding.',
      'Evidence from sub-Saharan Africa is growing but still limited.',
      'There is no single African cultural template that fits every community.',
      'Co-design should be an ongoing process, not a one-time consultation.'
    ],
  }
};

export const ARTICLE_SLUGS = Object.keys(ARTICLES);

export const ARTICLES_LIST = ARTICLE_SLUGS.map((slug) => {
  const a = ARTICLES[slug];
  return {
    slug,
    topic: a.topic,
    title: a.title,
    excerpt: a.excerpt,
    read: a.read,
    updated: a.updated,
    hero: a.hero,
    tags: a.tags,
  };
});

export const ALL_TAGS = Array.from(
  new Set(ARTICLES_LIST.flatMap((a) => a.tags)),
).sort();
