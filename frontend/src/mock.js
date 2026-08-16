// Mock data for ArtNovaX Home page (frontend-only)

export const NAV_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Our Work', href: '/our-work' },
  { label: 'Events', href: '/events' },
  { label: 'Research', href: '/research' },
  { label: 'Our App', href: '/app' },
  {
    label: 'Get Involved', href: '/get-involved', hasDropdown: true, children: [
      { label: 'Partner With Us', href: '/get-involved/partner' },
      { label: 'Volunteer', href: '/get-involved/volunteer' },
      { label: 'Support Our Work', href: '/get-involved/support' },
      { label: 'Shop for the Cause', href: '/get-involved/shop' },
    ]
  },

];

export const HERO = {
  eyebrow: ['ART', 'WELLBEING', 'TECHNOLOGY'],
  title: 'Creativity can become a place to breathe.',
  body: 'ArtNovaX creates spaces where art, mental wellbeing and thoughtful technology come together—helping people pause, express, connect and create.',
  primaryCta: { label: 'Explore Our Work', href: '/our-work' },
  secondaryCta: { label: 'Discover ArtNovaX', href: '/app' },
  image: '/assets/images/home/home-art-therapy.webp',
  imageAlt: 'Young person engaged in guided art therapy session with paintbrush and colorful paper',
  bullets: [
    { icon: 'users', label: 'Community programs' },
    { icon: 'book-open', label: 'Research-informed design' },
    { icon: 'smartphone', label: 'Digital innovation' },
  ],
};

export const MISSION_BAND = {
  headline: [
    { text: 'Where ', style: 'normal' },
    { text: 'art', style: 'italic' },
    { text: ' heals, ', style: 'normal' },
    { text: 'tech', style: 'italic' },
    { text: ' empowers, & ', style: 'normal' },
    { text: 'minds', style: 'italic' },
    { text: ' transform.', style: 'normal' },
  ],
  subhead: 'We believe technology should protect meaningful human experiences—not compete with them.',
};

export const WHAT_WE_DO = {
  eyebrow: 'WHAT WE DO',
  title: 'Creativity, care and technology—working together.',
  items: [
    {
      icon: 'brush',
      title: 'Creative Wellbeing',
      body: 'We create guided experiences where people use art, doodling, poetry and other forms of expression as space for reflection and connection.',
      link: { label: 'Explore our programs', href: '/our-work' },
    },
    {
      icon: 'brain',
      title: 'Research & Advocacy',
      body: 'We share accessible mental-health information and explore the evidence behind creative approaches to wellbeing.',
      link: { label: 'Explore research', href: '/research' },
    },
    {
      icon: 'app',
      title: 'Technology for Focus',
      body: 'We are developing ArtNovaX as a distraction-conscious digital experience for guided creative wellbeing.',
      link: { label: 'Discover the app', href: '/app' },
    },
  ],
};

export const FOOTER = {
  tagline: 'Where art heals,\ntech empowers,\n& minds transform.',
  columns: [
    {
      title: 'Explore', links: [
        { label: 'About Us', href: '/about' },
        { label: 'Our Work', href: '/our-work' },
        { label: 'Events', href: '/events' },
        { label: 'Research & Insights', href: '/research' },
        { label: 'Contact Us', href: '/contact' }
      ]
    },
    {
      title: 'ArtNovaX', links: [
        { label: 'ArtNovaX App', href: '/app' },
        { label: 'Our Story', href: '/about#story' },
        { label: 'Founders', href: '/about#founders' },
        { label: 'Careers', href: '/careers' },
      ]
    },
    {
      title: 'Get Involved', links: [
        { label: 'Partner With Us', href: '/get-involved/partner' },
        { label: 'Volunteer', href: '/get-involved/volunteer' },
        { label: 'Support Our Work', href: '/get-involved/support' },
        { label: 'Shop for the Cause', href: '/get-involved/shop' },
      ]
    },
    {
      title: 'Connect', links: [
        {
          label: 'Instagram',
          href: 'https://www.instagram.com/artnova.x?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
          icon: 'instagram'
        },
        {
          label: 'LinkedIn',
          href: 'https://www.linkedin.com/company/artnovax-mental-health-foundation/posts/?feedView=all',
          icon: 'linkedin'
        },
        {
          label: 'Email',
          href: 'mailto:info@artnovax.org',
          icon: 'mail'
        },
        {
          label: 'Nairobi, Kenya',
          href: '#',
          icon: 'map-pin'
        },
      ]
    },
  ],
  newsletter: {
    title: 'Stay Updated',
    body: 'Get the latest updates on events, resources and more.',
    placeholder: 'Enter your email',
  },
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Use', href: '/terms' },
    { label: 'Accessibility', href: '/accessibility' },
  ],
  copyright: '© 2026 ArtNovaX Mental Health Foundation. All rights reserved.'
};
