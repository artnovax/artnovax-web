// Mock data for Research, App, Get Involved, Contact, Shop pages

export const RESEARCH = {
  eyebrow: 'RESEARCH & INSIGHTS',
  title: 'Evidence.\nExplained.\nEmpowerment.',
  body: 'We explore the science behind creativity and mental wellbeing and translate it into clear, accessible insights for everyone.',
  cta: { label: 'Explore All Insights', href: '#topics' },
  image: null,
  imageAlt: 'Watercolor journal and creative supplies on a wooden table',
  topicsTitle: 'Key Topics We Explore',
  topics: [
    { icon: 'brain', title: 'Art & Emotional\nWellbeing', body: 'How creative expression can help process emotions, reduce stress, and support self-awareness.' },
    { icon: 'sparkles', title: 'Creativity &\nThe Brain', body: 'What neuroscience tells us about focus, flow, and the restorative power of creative activities.' },
    { icon: 'book', title: 'Art Therapy\nExplained', body: 'What art therapy is, how it works, and who it can support—evidence and best practices.' },
    { icon: 'users', title: 'Youth &\nMental Health', body: 'Research and insights on young people’s wellbeing in today’s digital and social environment.' },
    { icon: 'plant', title: 'Culture, Identity &\nWellbeing', body: 'The role of cultural expression, community and identity in mental wellbeing.' },
  ],
  band: {
    quote: 'Art can express the inexpressible, can communicate the unknowable.',
    author: '– Louise Bourgeois',
    integrity: {
      title: 'Evidence with Integrity',
      body: 'We are committed to accuracy, transparency and ethics. We share what the research shows—and what it doesn’t. Because your wellbeing deserves the truth.',
      link: { label: 'Our Research Approach', href: '/research/approach' }
    }
  },
  newsletter: {
    title: 'Stay informed',
    body: 'Get new insights, research summaries and resources straight to your inbox.',
    placeholder: 'Enter your email',
    button: 'Subscribe'
  }
};

export const APP = {
  eyebrow: 'ARTNOVAX APP  ·  COMING SOON',
  title: 'A calmer way\nto create \u2014 soon.',
  body: 'ArtNovaX is a distraction-conscious art therapy app currently in development. When it launches, it will help you express, reflect and reconnect \u2014 anytime, anywhere. Join the waitlist to be the first to try it.',
  primaryCta: { label: 'Join the Waitlist', href: '#waitlist' },
  secondaryCta: { label: 'Preview How It Will Work', href: '#how' },
  bullets: [
    { icon: 'shield', title: 'Distraction-Free', sub: 'Focus Mode' },
    { icon: 'sparkles', title: 'Guided Sessions', sub: 'crafted with therapists' },
    { icon: 'download', title: 'Offline Access', sub: 'Download & go' },
    { icon: 'lock', title: 'Private & Secure', sub: 'Your data, your choice' },
  ],
  featuresTitle: 'What we\u2019re building',
  features: [
    { icon: 'shield', title: 'Distraction-Conscious', body: 'Will silence notifications and keep you immersed.' },
    { icon: 'flower', title: 'Guided Art Therapy', body: 'Science-based exercises tailored to how you feel.' },
    { icon: 'palette', title: 'Express Freely', body: 'Natural, soothing tools that respond to your touch.' },
    { icon: 'download', title: 'Offline & Reliable', body: 'Download sessions and use them anywhere.' },
    { icon: 'lock', title: 'Private by Design', body: 'Your data stays yours \u2014 always.' },
    { icon: 'globe', title: 'Culturally Connected', body: 'Rooted in African stories, values and art.' },
  ],
  howTitle: 'How ArtNovaX will support you',
  steps: [
    { icon: 'download', title: '1. Set Your Space', body: 'You\u2019ll enable Focus Mode and choose how you want to feel.' },
    { icon: 'list', title: '2. Choose a Session', body: 'Pick a guided session that fits your moment.' },
    { icon: 'brush', title: '3. Create & Reflect', body: 'Follow the guidance, create freely, and reflect.' },
    { icon: 'smile', title: '4. Feel the Shift', body: 'Log how you feel and watch your journey unfold.' },
  ],
  journey: {
    title: 'Your journey, your pace',
    body: 'Whether you\u2019ll have 5 minutes or an hour, ArtNovaX will meet you where you are.',
  },
  waitlist: {
    title: 'Be among the first to experience ArtNovaX.',
    body: 'The app is still in the making. Drop your email and we\u2019ll let you know the moment early access opens.',
    placeholder: 'Enter your email',
    button: 'Join Waitlist',
  }
};

export const GET_INVOLVED = {
  eyebrow: 'GET INVOLVED',
  title: 'Be part of the\nchange.',
  body: 'Whether you create with us, collaborate with us, volunteer your time, or support our mission—there is a place for you at ArtNovaX.',
  tagline: 'Together, we can make\ncreative wellbeing accessible to all.',
  image: null,
  imageAlt: 'Community art therapy session — ArtNovaX participants painting together',
  waysTitle: 'Ways to Get Involved',
  ways: [
    { icon: 'calendar', title: 'Attend an Event', body: 'Join our creative sessions, workshops and community events in your area.', link: { label: 'View Events', href: '/events' } },
    { icon: 'handshake', title: 'Partner With Us', body: 'We collaborate with universities, organizations and communities to expand our impact.', link: { label: 'Partner With Us', href: '/get-involved/partner' } },
    { icon: 'heart-hands', title: 'Volunteer', body: 'Share your skills, time and passion to support our programs and events.', link: { label: 'Volunteer With Us', href: '/get-involved/volunteer' } },
    { icon: 'gift', title: 'Support Our Work', body: 'Your contribution helps us create more spaces for creative wellbeing.', link: { label: 'Donate Now', href: '/get-involved/support' } },
    { icon: 'shopping-bag', title: 'Shop for the Cause', body: 'Purchase ArtNovaX merchandise and help fund our programs.', link: { label: 'Shop Now', href: '/shop' } },
  ],
  stronger: {
    title: 'Stronger together.',
    body: 'Every act of support—big or small—helps us build a world where creativity nurtures mental wellness for everyone.',
    cta: { label: 'Get Involved Today', href: '#ways' }
  }
};

export const CONTACT = {
  eyebrow: 'CONTACT US',
  title: 'We’d love to\nhear from you.',
  body: 'Have a question, idea, or want to collaborate? Reach out to us — we’re always happy to connect.',
  image: null,
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
      title: 'Let’s create something meaningful together.',
      body: 'Whether you’re looking to partner, volunteer, or just say hello, we’re excited to connect with you.'
    }
  },
  newsletter: {
    title: 'Stay in the loop',
    body: 'Get updates on our events, resources, research, and more.',
    placeholder: 'Enter your email',
    button: 'Subscribe'
  }
};

export const SHOP = {
  eyebrow: 'SHOP FOR THE CAUSE',
  title: 'Every purchase\ncreates impact.',
  body: 'Our merch spreads creativity—and supports art therapy programs that heal, empower, and transform lives.',
  cta: { label: 'Shop All Products', href: '#products' },
  image: null,
  imageAlt: 'ArtNovaX merchandise collection displayed together',
  bullets: [
    { icon: 'heart', title: 'Support a Cause', sub: '100% of profits go toward our programs.' },
    { icon: 'sparkles', title: 'Made with Care', sub: 'Thoughtfully designed for purpose.' },
    { icon: 'gift', title: 'Spread Kindness', sub: 'Share art. Start conversations.' },
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
    title: 'Thank you for being part of the change.',
    body: 'Your support helps us reach more communities with the power of art.',
    cta: { label: 'Learn More About Our Impact', href: '/our-work' }
  }
};
