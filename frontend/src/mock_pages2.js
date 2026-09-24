// Mock data for Research, App, Get Involved, Contact, Shop pages

export const RESEARCH = {
  eyebrow: 'RESEARCH & INSIGHTS',
  title: 'Research,\nwithout the jargon.',
  body: 'We look at research on creativity and mental health and explain what it means in clear, practical language.',
  cta: { label: 'Explore All Insights', href: '#topics' },
  image: 'https://bgforwdcdkqzqelunmzr.supabase.co/storage/v1/object/public/site-media/2026/08/837a00fd-e656-4ced-bfa3-f12126171da2-research-mental-health.jpg',
  imageAlt: 'Watercolor journal and creative supplies on a wooden table',
  topicsTitle: 'What We Read About',
  topics: [
    { icon: 'brain', title: 'Art & Emotional\nWellbeing', body: 'What research says about creative expression, stress, emotions and self-awareness.' },
    { icon: 'sparkles', title: 'Creativity &\nThe Brain', body: 'What we know about attention, flow and what happens when we become absorbed in making something.' },
    { icon: 'book', title: 'Art Therapy\nExplained', body: 'What art therapy is, how it differs from creative wellbeing activities and where professional care fits in.' },
    { icon: 'users', title: 'Youth &\nMental Health', body: 'Research and observations on the pressures affecting young people at school, online and in their communities.' },
    { icon: 'plant', title: 'Culture, Identity &\nWellbeing', body: 'How culture, community and identity shape the way people understand and care for their mental health.' },
  ],
  band: {
    quote: 'Art can express the inexpressible, can communicate the unknowable.',
    author: '– Louise Bourgeois',
    integrity: {
      title: 'Evidence with Integrity',
      body: 'We try to be clear about what research supports, what is still uncertain and where our own observations end.',
      link: { label: 'Our Research Approach', href: '/research/approach' }
    }
  },
  newsletter: {
    title: 'Stay informed',
    body: 'Get new articles, research summaries and practical resources in your inbox.',
    placeholder: 'Enter your email',
    button: 'Subscribe'
  }
};

export const APP = {
  eyebrow: 'ARTNOVAX APP  ·  COMING SOON',
  title: 'A calmer way\nto create \u2014 soon.',
  body: 'We are building ArtNovaX as a distraction-conscious art therapy app. It will guide you through creative exercises, give you space to reflect and help you check in with how you are feeling without adding more noise to your screen.',
  primaryCta: { label: 'Join the Waitlist', href: '#waitlist' },
  secondaryCta: { label: 'Preview How It Will Work', href: '#how' },
  bullets: [
    { icon: 'shield', title: 'Distraction-Free', sub: 'Focus Mode' },
    { icon: 'sparkles', title: 'Guided Sessions', sub: 'Developed with therapists' },
    { icon: 'download', title: 'Offline Access', sub: 'Use downloaded sessions anywhere' },
    { icon: 'lock', title: 'Private & Secure', sub: 'You choose what to keep' },
  ],
  featuresTitle: 'What we\u2019re building',
  features: [
    { icon: 'shield', title: 'Distraction-Conscious', body: 'A focused experience designed to keep notifications and unnecessary prompts out of the way.' },
    { icon: 'flower', title: 'Guided Art Therapy', body: 'Structured creative exercises developed with mental-health professionals.' },
    { icon: 'palette', title: 'Draw & Paint', body: 'Simple in-app tools for drawing, painting and responding to prompts.' },
    { icon: 'download', title: 'Offline & Reliable', body: 'Download sessions ahead of time and use them without staying connected.' },
    { icon: 'lock', title: 'Private by Design', body: 'Clear choices about what you save and what stays private.' },
    { icon: 'globe', title: 'Culturally Connected', body: 'Designed with African contexts, stories and creative traditions in mind.' },
  ],
  howTitle: 'How ArtNovaX will work',
  steps: [
    { icon: 'download', title: '1. Set Your Space', body: 'Turn on Focus Mode and choose how you want to check in.' },
    { icon: 'list', title: '2. Choose a Session', body: 'Pick a guided exercise that fits the time and energy you have.' },
    { icon: 'brush', title: '3. Create & Reflect', body: 'Follow the prompt, make something and pause to notice what comes up.' },
    { icon: 'smile', title: '4. Check In Again', body: 'Record how you feel afterwards and, over time, notice your own patterns.' },
  ],
  journey: {
    title: 'Short sessions or longer ones',
    body: 'Sessions will range from quick creative check-ins to longer guided activities, so you can choose what fits the moment.',
  },
  waitlist: {
    title: 'Want to try it when early access opens?',
    body: 'Leave your email and we will let you know when the first test version is ready.',
    placeholder: 'Enter your email',
    button: 'Join Waitlist',
  }
};

export const GET_INVOLVED = {
  eyebrow: 'GET INVOLVED',
  title: 'There are a few ways\nto get involved.',
  body: 'Come to an event, work with us, volunteer, donate or pick up something from the shop. Choose what makes sense for you.',
  tagline: 'Attend. Partner. Volunteer.\nSupport the work.',
  image: '/assets/images/get-involved/get-involved-community-art.jpg',
  imageAlt: 'Community art therapy session — ArtNovaX participants painting together',
  waysTitle: 'Ways to Get Involved',
  ways: [
    { icon: 'calendar', title: 'Attend an Event', body: 'Join a creative session, workshop or community event near you.', link: { label: 'View Events', href: '/events' } },
    { icon: 'handshake', title: 'Partner With Us', body: 'Work with us to run programmes with universities, schools, organisations or community groups.', link: { label: 'Partner With Us', href: '/get-involved/partner' } },
    { icon: 'heart-hands', title: 'Volunteer', body: 'See where we currently need help and whether your skills are a good fit.', link: { label: 'Volunteer With Us', href: '/get-involved/volunteer' } },
    { icon: 'gift', title: 'Support Our Work', body: 'Donations help cover materials, events, research and the everyday cost of running our programmes.', link: { label: 'Donate Now', href: '/get-involved/support' } },
    { icon: 'shopping-bag', title: 'Shop for the Cause', body: 'Buy ArtNovaX merchandise and help fund the work behind our programmes.', link: { label: 'Shop Now', href: '/shop' } },
  ],
  stronger: {
    title: 'Choose what works for you.',
    body: 'You do not have to make a huge commitment. Coming to one event, sharing a skill or supporting a session all help us keep the work moving.',
    cta: { label: 'See the Options', href: '#ways' }
  }
};

export const CONTACT = {
  eyebrow: 'CONTACT US',
  title: 'We’d love to\nhear from you.',
  body: 'Have a question, an idea or something you would like to work on with us? Send us a message.',
  image: 'https://bgforwdcdkqzqelunmzr.supabase.co/storage/v1/object/public/site-media/2026/08/5e6789c2-052d-42f3-98df-6ad64ef6766c-contact-us.png',
  imageAlt: 'Two friends chatting warmly over coffee in soft sunlight',
  quickInfo: [
    { icon: 'mail', label: 'Email', value: 'info@artnovax.org' },
    { icon: 'phone', label: 'Phone', value: '+254 796 454 368' },
    { icon: 'map-pin', label: 'Location', value: 'Nairobi, Kenya' },
  ],
  formTitle: 'Send Us a Message',
  form: [
    { name: 'name', placeholder: 'Your Name *', type: 'text', span: 1 },
    { name: 'email', placeholder: 'Email Address *', type: 'email', span: 1 },
    { name: 'subject', placeholder: 'Subject *', type: 'text', span: 2 },
    { name: 'message', placeholder: 'Your Message *', type: 'textarea', span: 2 },
  ],
  sidebar: {
    responseTitle: 'We typically respond\nwithin 1–2 business days',
    details: [
      { icon: 'mail', label: 'Email', value: 'info@artnovax.org' },
      { icon: 'phone', label: 'Phone', value: '+254 796 454 368' },
      { icon: 'map-pin', label: 'Location', value: 'Nairobi, Kenya' },
      { icon: 'clock', label: 'Hours', value: 'Mon – Fri, 9:00 AM – 5:00 PM EAT' },
    ],
    quote: {
      title: 'Want to work with us?',
      body: 'Tell us what you have in mind. If it is something we can help with, the right person on our team will follow up.'
    }
  },
  newsletter: {
    title: 'Stay in the loop',
    body: 'Get updates on events, new resources, research and what we are working on.',
    placeholder: 'Enter your email',
    button: 'Subscribe'
  }
};

export const SHOP = {
  eyebrow: 'SHOP FOR THE CAUSE',
  title: 'Merch that helps\nfund the work.',
  body: 'Sales from the shop help cover the cost of our creative wellbeing programmes, events and activities.',
  cta: { label: 'Shop All Products', href: '#products' },
  image: 'https://bgforwdcdkqzqelunmzr.supabase.co/storage/v1/object/public/site-media/2026/08/d0ea9232-5534-480a-9d87-452a1a71ac4a-artnovax-shop-hero.png',
  imageAlt: 'ArtNovaX merchandise collection displayed together',
  bullets: [
    { icon: 'heart', title: 'Support the Work', sub: 'Proceeds help fund our programmes.' },
    { icon: 'sparkles', title: 'Made with Care', sub: 'Designed by and for the ArtNovaX community.' },
    { icon: 'gift', title: 'Start a Conversation', sub: 'Wear it, share it and tell someone what we do.' },
  ],
  collectionTitle: 'Shop Our Collection',
  categories: ['All Products', 'Stickers', 'Book Cards', 'Apparel', 'Accessories', 'Bundles'],
  products: [
    { name: 'Sticker Pack', price: 'KES 300', img: null, category: 'Stickers' },
    { name: 'Book Cards (Set of 5)', price: 'KES 600', img: null, category: 'Book Cards' },
    { name: 'ArtNovaX Hoodie', price: 'KES 2,500', img: null, category: 'Apparel' },
    { name: 'Canvas Tote Bag', price: 'KES 1,200', img: null, category: 'Accessories' },
    { name: 'Enamel Pin', price: 'KES 400', img: null, category: 'Accessories' },
    { name: 'Ceramic Mug', price: 'KES 900', img: null, category: 'Accessories' },
  ],
  thanks: {
    title: 'Thanks for supporting the work.',
    body: 'Your purchase helps us cover the cost of programmes, materials and community activities.',
    cta: { label: 'See What We Do', href: '/our-work' }
  }
};
