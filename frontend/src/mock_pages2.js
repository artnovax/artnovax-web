// Mock data for Research, App, Get Involved, Contact, Shop pages

export const RESEARCH = {
  eyebrow: 'RESEARCH & INSIGHTS',
  title: 'Research,\nwithout the jargon.',
  body: 'We look at research on creativity and mental health, translate it into clear language, and use feedback from our programmes to guide what we explore next.',
  cta: { label: 'Explore Insights', href: '#topics' },
  image: 'https://bgforwdcdkqzqelunmzr.supabase.co/storage/v1/object/public/site-media/2026/08/837a00fd-e656-4ced-bfa3-f12126171da2-research-mental-health.jpg',
  imageAlt: 'Watercolor journal and creative supplies on a wooden table',
  topicsTitle: 'What we explore',
  topics: [
    { icon: 'brain', title: 'Art & Emotional\nWellbeing', body: 'What research says about creative expression, stress, emotions and self-awareness.' },
    { icon: 'sparkles', title: 'Creativity &\nThe Brain', body: 'What we know about attention, flow and what happens when we become absorbed in making something.' },
    { icon: 'book', title: 'Art Therapy\nExplained', body: 'What art therapy is, how it differs from creative wellbeing activities and where professional care fits in.' },
    { icon: 'users', title: 'Youth &\nMental Health', body: 'Research and practical perspectives on the pressures affecting young people and the support available to them.' },
    { icon: 'plant', title: 'Learning From\nOur Programmes', body: 'How participant feedback, event surveys and community conversations can help us shape future programmes and digital experiences.' },
  ],
  band: {
    quote: 'Art can express the inexpressible, can communicate the unknowable.',
    author: '– Louise Bourgeois',
    integrity: {
      title: 'Learning from the people we serve',
      body: 'At our March 2026 University of Nairobi event, we asked students about their understanding of art therapy and what they would want from a digital art experience. That feedback is helping shape ArtNovaX as it develops.',
      link: { label: 'See the app in development', href: '/app' }
    }
  },
  newsletter: {
    title: 'Stay informed',
    body: 'Get new articles, research notes and updates on what we are learning through our programmes.',
    placeholder: 'Enter your email',
    button: 'Subscribe'
  }
};

export const APP = {
  eyebrow: 'ARTNOVAX APP',
  title: 'A calmer space\nto create and reflect.',
  body: 'We are building ArtNovaX as a distraction-conscious creative wellbeing app — a focused place for guided sessions, in-app drawing and reflection without the usual noise of your screen.',
  primaryCta: { label: 'Join the Waitlist', href: '#waitlist' },
  secondaryCta: { label: 'See How It Will Work', href: '#how' },
  bullets: [
    { icon: 'shield', title: 'Focused Experience', sub: 'Fewer distractions' },
    { icon: 'sparkles', title: 'Guided Sessions', sub: 'Step-by-step prompts' },
    { icon: 'download', title: 'Draw & Paint', sub: 'Create inside the app' },
    { icon: 'lock', title: 'Private by Design', sub: 'You choose what to keep' },
  ],
  featuresTitle: 'What we’re building',
  features: [
    { icon: 'shield', title: 'Distraction-Conscious', body: 'A focused experience designed to keep unnecessary prompts and interruptions out of the way.' },
    { icon: 'flower', title: 'Guided Creative Sessions', body: 'Structured exercises that give you a clear place to begin, create and reflect.' },
    { icon: 'palette', title: 'Draw & Paint', body: 'Simple in-app tools for drawing, painting and responding directly to creative prompts.' },
    { icon: 'smile', title: 'Emotion Check-ins', body: 'Space to notice how you feel before and after a session and reflect on changes over time.' },
    { icon: 'lock', title: 'Private by Design', body: 'Clear choices around what you save, what you revisit and what remains private.' },
    { icon: 'globe', title: 'Shaped by Community', body: 'Student input and real-world programme experience are helping us shape the digital experience.' },
  ],
  howTitle: 'How ArtNovaX will work',
  steps: [
    { icon: 'smile', title: '1. Check In', body: 'Pause for a moment and notice how you are feeling.' },
    { icon: 'list', title: '2. Choose a Session', body: 'Pick a guided creative exercise that fits your time and energy.' },
    { icon: 'brush', title: '3. Create', body: 'Follow the prompt and use the in-app canvas to draw or paint.' },
    { icon: 'sparkles', title: '4. Reflect', body: 'Check in again, add a reflection and notice what changed.' },
  ],
  journey: {
    title: 'Shaped with student input',
    body: 'At our March 2026 University of Nairobi event, students shared what they knew about art therapy and what they wanted from a digital art experience. That feedback is helping shape development.',
  },
  waitlist: {
    title: 'Want to try ArtNovaX when early testing opens?',
    body: 'Join the waitlist and we will let you know when there is a version ready to explore.',
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
    { icon: 'handshake', title: 'Partner With Us', body: 'Work with us to create programmes with universities, student groups, organisations or communities.', link: { label: 'Partner With Us', href: '/get-involved/partner' } },
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
  image: 'assets/images/events/events-art-contest.webp',
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
