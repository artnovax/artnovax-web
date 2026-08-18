import { supabase } from '@/lib/supabase';
import { HERO, MISSION_BAND, WHAT_WE_DO } from '../mock';
import { ABOUT, EVENTS, OUR_WORK } from '../mock_pages';
import { APP, CONTACT, GET_INVOLVED, RESEARCH, SHOP } from '../mock_pages2';

const clone = (value) => JSON.parse(JSON.stringify(value));

export const formatMissionHeadline = (segments = []) => segments
  .map((segment) => segment.style === 'italic' ? `_${segment.text}_` : segment.text)
  .join('');

export const parseMissionHeadline = (value = '') => {
  const segments = [];
  const pattern = /_([^_]+)_/g;
  let cursor = 0;
  let match;
  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) {
      segments.push({ text: value.slice(cursor, match.index), style: 'normal' });
    }
    segments.push({ text: match[1], style: 'italic' });
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) {
    segments.push({ text: value.slice(cursor), style: 'normal' });
  }
  return segments.length ? segments : [{ text: value, style: 'normal' }];
};

export const defaultHomePageContent = () => ({
  hero: {
    ...clone(HERO),
    title: 'Creativity can\nbecome a place\nto breathe.',
  },
  mission: {
    ...clone(MISSION_BAND),
    headlineMarkup: formatMissionHeadline(MISSION_BAND.headline),
  },
  whatWeDo: clone(WHAT_WE_DO),
});

export const defaultAboutPageContent = () => clone(ABOUT);

export const defaultOurWorkPageContent = () => ({
  ...clone(OUR_WORK),
  imageMediaId: null,
  programs: clone(OUR_WORK.programs).map((program) => ({
    ...program,
    imgAlt: program.imgAlt || program.title.replace(/\n/g, ' '),
    imageMediaId: null,
  })),
});

export const defaultEventsPageContent = () => ({
  ...clone(EVENTS),
  imageMediaId: null,
});

export const defaultResearchPageContent = () => ({
  ...clone(RESEARCH),
  imageMediaId: null,
  libraryEyebrow: 'INSIGHTS LIBRARY',
  libraryTitle: 'Read the full articles',
  searchPlaceholder: 'Search insights…',
});

export const defaultAppPageContent = () => ({
  ...clone(APP),
  statusLabel: 'In development · Launching later this year',
});

export const defaultGetInvolvedPageContent = () => ({
  ...clone(GET_INVOLVED),
  imageMediaId: null,
});

export const defaultContactPageContent = () => ({
  ...clone(CONTACT),
  imageMediaId: null,
  sendButton: 'Send Message',
});

export const defaultShopPageContent = () => ({
  ...clone(SHOP),
  imageMediaId: null,
  allProductsLabel: 'All Products',
});

export const defaultSupportPageContent = () => ({
  eyebrow: 'SUPPORT OUR WORK',
  title: 'Your gift makes creative wellbeing possible.',
  body: 'Every shilling helps us bring guided art sessions, research and community care to young people across Kenya. You can give once today, or reach out to set up a longer-term commitment.',
  impactItems: [
    'KES 15,000 helps stock materials for one campus session.',
    'KES 25,000 sponsors a small circle of care for a term.',
    'Any amount goes 100% to program delivery and research.',
  ],
  formTitle: 'Give today',
  presets: [500, 1000, 2500, 5000, 15000, 25000],
  customAmountLabel: 'Or custom amount (KES)',
  customAmountPlaceholder: 'e.g. 750',
  namePlaceholder: 'Your name (optional)',
  emailPlaceholder: 'Email (for receipt)',
  messagePlaceholder: 'A note (optional)',
  donateButtonLabel: 'Donate',
  loadingLabel: 'Redirecting…',
  securityPrefix: 'Secured by Stripe. We also welcome bank transfers and pledges: ',
  contactLabel: 'contact us',
  contactHref: '/contact',
  securitySuffix: '.',
  thanks: {
    title: "Thank you — we're moved.",
    body: 'Your checkout was completed. Stripe is securely confirming the payment with ArtNovaX, and your gift will help us reach more young people through art.',
    button: { label: 'Back to home', href: '/' },
  },
});

export const defaultVolunteerPageContent = () => ({
  landing: {
    eyebrow: 'VOLUNTEER WITH US',
    title: 'Bring your care.\nBring your craft.',
    body: 'Explore open volunteer roles at ArtNovaX. Every role is designed so you can contribute meaningfully in just a few hours a week.',
    loadingText: 'Loading roles…',
    emptyPrefix: 'No open roles right now. Check back soon or send us a note via ',
    emptyContactLabel: 'Contact',
    emptyContactHref: '/contact',
    emptySuffix: '.',
    defaultDepartmentLabel: 'Volunteer',
    applyLabel: 'Apply',
    detailsLabel: 'View details',
  },
  application: {
    loadingText: 'Loading…',
    notFoundTitle: 'Role not found',
    backLabel: 'All roles',
    responsibilitiesLabel: 'RESPONSIBILITIES',
    requirementsLabel: 'REQUIREMENTS',
    formTitle: 'Application',
    namePlaceholder: 'Full name *',
    emailPlaceholder: 'Email *',
    phonePlaceholder: 'Phone (optional)',
    selectPlaceholder: 'Select…',
    submitLabel: 'Submit application',
    submittingLabel: 'Submitting…',
    successTitle: 'Thank you — we’ve got your application.',
    successBody: 'Our team reviews applications every week and will be in touch.',
    successButtonLabel: 'See other roles',
  },
});

export const defaultPartnerPageContent = () => ({
  eyebrow: 'PARTNER WITH US',
  title: 'Let’s build something meaningful together.',
  body: 'We collaborate with universities, community groups, mental-health organisations and mission-aligned brands. Tell us a little about your organisation and how you’d like to partner — our Partnerships & Mobilisation Lead will reach out.',
  organisationHeading: 'ORGANISATION',
  orgNamePlaceholder: 'Organisation name *',
  websitePlaceholder: 'Website',
  orgTypePlaceholder: 'Organisation type…',
  orgTypeOptions: [
    'University / School',
    'NGO / Non-profit',
    'Corporate / Brand',
    'Government',
    'Community group',
    'Other',
  ],
  partnershipTypePlaceholder: 'Partnership type…',
  partnershipTypeOptions: [
    'Program collaboration',
    'Event / Workshop',
    'Sponsorship',
    'Research collaboration',
    'Content / Media',
    'Other',
  ],
  contactHeading: 'POINT OF CONTACT',
  contactNamePlaceholder: 'Contact name *',
  rolePlaceholder: 'Role at your organisation',
  emailPlaceholder: 'Work email *',
  phonePlaceholder: 'Phone',
  detailsHeading: 'PARTNERSHIP DETAILS',
  goalsPlaceholder: 'What do you hope to achieve with ArtNovaX?',
  audiencePlaceholder: 'Audience (e.g. university students, staff, community)',
  timelinePlaceholder: 'Timeline (e.g. Q2 2026)',
  budgetPlaceholder: 'Indicative budget (optional)',
  messagePlaceholder: 'Anything else you’d like us to know',
  responseNote: 'We reply to every serious inquiry within 5 business days.',
  submitLabel: 'Submit inquiry',
  submittingLabel: 'Sending…',
  success: {
    title: 'Thank you — we’ll be in touch.',
    body: 'Purity, our Partnerships Lead, personally reviews every inquiry.',
    button: { label: 'Back to home', href: '/' },
  },
});

export const INFORMATION_PAGE_KEYS = [
  'privacy',
  'terms',
  'accessibility',
  'research_approach',
];

const INFORMATION_PAGE_DEFAULTS = {
  privacy: {
    eyebrow: 'LEGAL & TRUST',
    title: 'Privacy Policy',
    intro: 'This policy explains what information ArtNovaX collects through this website, why we use it, and the choices available to you.',
    updatedLabel: 'Last updated: August 2026',
    sections: [
      {
        title: 'Information we collect',
        body: 'We collect information you choose to provide when you register for events, apply to volunteer, contact us, join a waitlist or newsletter, partner with us, purchase an item, or make a donation. This may include your name, contact details, responses, order information, and payment references.',
      },
      {
        title: 'How we use information',
        body: 'We use information to deliver requested services, respond to enquiries, manage events and applications, process transactions, communicate relevant updates, improve our programmes, and protect the security of our services.',
      },
      {
        title: 'Service providers and sharing',
        body: 'We may use trusted service providers for hosting, email, payments, analytics, and other operational needs. We do not sell personal information. We only share information when needed to provide a service, meet a legal obligation, or protect people and our organisation.',
      },
      {
        title: 'Retention and security',
        body: 'We retain information only for as long as reasonably necessary for the purpose it was collected, including legal, accounting, and safeguarding needs. We use appropriate technical and organisational safeguards, while recognising that no online system can guarantee absolute security.',
      },
      {
        title: 'Your choices and contact',
        body: 'You may ask to access, correct, or delete information we hold about you, subject to applicable requirements. You may also unsubscribe from newsletter emails at any time. Contact info@artnovax.org with a privacy question or request.',
      },
    ],
  },
  terms: {
    eyebrow: 'LEGAL & TRUST',
    title: 'Terms of Use',
    intro: 'These terms describe the conditions for using the ArtNovaX website and its public services.',
    updatedLabel: 'Last updated: August 2026',
    sections: [
      {
        title: 'Using this website',
        body: 'You may use this website for lawful personal and organisational purposes. You agree not to interfere with the site, attempt unauthorised access, submit harmful material, impersonate another person, or use our services in a way that harms others.',
      },
      {
        title: 'Wellbeing information',
        body: 'ArtNovaX provides creative-wellbeing education and non-clinical community experiences. Website content is not medical advice, diagnosis, emergency support, or a replacement for care from a qualified professional. If you are in immediate danger or crisis, contact local emergency or crisis services.',
      },
      {
        title: 'Registrations, purchases, and donations',
        body: 'Availability, pricing, event details, and programme details may change. Payments are handled through the payment methods shown at checkout. Additional terms or refund information may be presented during a registration, purchase, or donation process.',
      },
      {
        title: 'Content and intellectual property',
        body: 'Unless stated otherwise, ArtNovaX owns or is authorised to use the website design, text, graphics, and programme materials. You may not reproduce or commercially reuse them without permission, except as allowed by law.',
      },
      {
        title: 'Changes and contact',
        body: 'We may update the website or these terms as our services develop. Continued use after an update means the revised terms apply. Contact info@artnovax.org with questions about these terms.',
      },
    ],
  },
  accessibility: {
    eyebrow: 'ACCESSIBILITY',
    title: 'Accessibility at ArtNovaX',
    intro: 'We want our digital experiences and creative-wellbeing resources to be usable by as many people as possible.',
    updatedLabel: 'Last reviewed: August 2026',
    sections: [
      {
        title: 'Our commitment',
        body: 'We aim to design clear, calm, and inclusive experiences that work across devices and support different ways of navigating, reading, and understanding content.',
      },
      {
        title: 'What we work toward',
        body: 'Our ongoing work includes keyboard-friendly navigation, meaningful headings and labels, useful alternative text, readable contrast, responsive layouts, and content written in plain language where possible.',
      },
      {
        title: 'Ongoing improvement',
        body: 'Accessibility is an ongoing practice. We review new features and content, address reported barriers, and improve the website as standards, technology, and community needs evolve.',
      },
      {
        title: 'Tell us about a barrier',
        body: 'If you cannot access part of this website or need information in another format, email info@artnovax.org. Please include the page or task involved and the assistive technology or device you were using, if you are comfortable sharing it.',
      },
    ],
  },
  research_approach: {
    eyebrow: 'RESEARCH & INSIGHTS',
    title: 'Our Research Approach',
    intro: 'We translate evidence about creativity and wellbeing into clear, responsible information without overstating what research can prove.',
    updatedLabel: 'Last reviewed: August 2026',
    sections: [
      {
        title: 'Evidence before certainty',
        body: 'We look for credible, relevant research and pay attention to study quality, sample size, limitations, and whether findings have been repeated. We distinguish early findings from stronger bodies of evidence.',
      },
      {
        title: 'Clear and accessible communication',
        body: 'We explain technical ideas in plain language while preserving important nuance. When evidence is mixed, limited, or changing, we say so.',
      },
      {
        title: 'Culture and lived experience',
        body: 'Evidence does not exist outside culture. We consider whose experiences were represented, where research took place, and how local knowledge and lived experience can inform responsible interpretation.',
      },
      {
        title: 'Boundaries and safety',
        body: 'Creative-wellbeing activities can support reflection and connection, but they are not automatically art therapy or clinical treatment. We clearly distinguish non-clinical programmes from services delivered by qualified health professionals.',
      },
      {
        title: 'Transparency and corrections',
        body: 'We aim to name sources, conflicts, and limitations where relevant. If we identify a meaningful error or better evidence becomes available, we update the material and its review date.',
      },
    ],
  },
};

export const defaultInformationPagesContent = () => clone(INFORMATION_PAGE_DEFAULTS);

const mergeHomePageContent = (rows = []) => {
  const defaults = defaultHomePageContent();
  const bySection = Object.fromEntries(rows.map((row) => [row.section_key, row]));
  const heroRow = bySection.hero;
  const missionRow = bySection.mission;
  const whatWeDoRow = bySection.what_we_do;

  const heroContent = heroRow?.content || {};
  const hero = {
    ...defaults.hero,
    ...heroContent,
    primaryCta: { ...defaults.hero.primaryCta, ...(heroContent.primaryCta || {}) },
    secondaryCta: { ...defaults.hero.secondaryCta, ...(heroContent.secondaryCta || {}) },
    bullets: defaults.hero.bullets.map((item, index) => ({
      ...item,
      ...(heroContent.bullets?.[index] || {}),
    })),
    image: heroRow?.image || defaults.hero.image,
    imageAlt: heroRow?.image_alt_text || defaults.hero.imageAlt,
    imageMediaId: heroRow?.image_media_id || null,
  };

  const missionContent = missionRow?.content || {};
  const headlineMarkup = missionContent.headlineMarkup || defaults.mission.headlineMarkup;
  const mission = {
    ...defaults.mission,
    ...missionContent,
    headlineMarkup,
    headline: parseMissionHeadline(headlineMarkup),
  };

  const whatContent = whatWeDoRow?.content || {};
  const whatWeDo = {
    ...defaults.whatWeDo,
    ...whatContent,
    items: defaults.whatWeDo.items.map((item, index) => ({
      ...item,
      ...(whatContent.items?.[index] || {}),
      link: {
        ...item.link,
        ...(whatContent.items?.[index]?.link || {}),
      },
    })),
  };

  return { hero, mission, whatWeDo };
};

export async function getPageSections(pageKey) {
  const { data, error } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page_key', pageKey)
    .order('section_key', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getHomePageContent() {
  return mergeHomePageContent(await getPageSections('home'));
}

const mergeAboutPageContent = (rows = []) => {
  const defaults = defaultAboutPageContent();
  const bySection = Object.fromEntries(rows.map((row) => [row.section_key, row]));
  const heroRow = bySection.hero;
  const heroContent = heroRow?.content || {};
  const pillarsContent = bySection.pillars?.content || {};
  const foundersContent = bySection.founders?.content || {};
  const statsContent = bySection.stats?.content || {};
  const ctaContent = bySection.cta?.content || {};

  return {
    ...defaults,
    ...heroContent,
    image: heroRow?.image || defaults.image,
    imageAlt: heroRow?.image_alt_text || defaults.imageAlt,
    imageMediaId: heroRow?.image_media_id || null,
    pillars: defaults.pillars.map((pillar, index) => ({
      ...pillar,
      ...(pillarsContent.items?.[index] || {}),
      list: pillarsContent.items?.[index]?.list || pillar.list,
    })),
    founders: {
      ...defaults.founders,
      ...foundersContent,
      people: defaults.founders.people,
    },
    stats: {
      ...defaults.stats,
      ...statsContent,
      items: defaults.stats.items.map((item, index) => ({
        ...item,
        ...(statsContent.items?.[index] || {}),
      })),
    },
    cta: {
      ...defaults.cta,
      ...ctaContent,
      button: {
        ...defaults.cta.button,
        ...(ctaContent.button || {}),
      },
    },
  };
};

export async function getAboutPageContent() {
  return mergeAboutPageContent(await getPageSections('about'));
}

const mergeOurWorkPageContent = (rows = []) => {
  const defaults = defaultOurWorkPageContent();
  const bySection = Object.fromEntries(rows.map((row) => [row.section_key, row]));
  const heroRow = bySection.hero;
  const heroContent = heroRow?.content || {};
  const headingContent = bySection.programs_heading?.content || {};
  const statsContent = bySection.stats?.content || {};
  const partnerContent = bySection.partner_cta?.content || {};

  return {
    ...defaults,
    ...heroContent,
    cta: { ...defaults.cta, ...(heroContent.cta || {}) },
    image: heroRow?.image || defaults.image,
    imageAlt: heroRow?.image_alt_text || defaults.imageAlt,
    imageMediaId: heroRow?.image_media_id || null,
    programsEyebrow: headingContent.programsEyebrow || defaults.programsEyebrow,
    programsTitle: headingContent.programsTitle || defaults.programsTitle,
    programs: defaults.programs.map((program, index) => {
      const row = bySection[`program_${index + 1}`];
      const programContent = row?.content || {};
      return {
        ...program,
        ...programContent,
        link: { ...program.link, ...(programContent.link || {}) },
        img: row?.image || program.img,
        imgAlt: row?.image_alt_text || program.imgAlt,
        imageMediaId: row?.image_media_id || null,
      };
    }),
    stats: {
      ...defaults.stats,
      ...statsContent,
      items: defaults.stats.items.map((item, index) => ({
        ...item,
        ...(statsContent.items?.[index] || {}),
      })),
    },
    partnerCta: {
      ...defaults.partnerCta,
      ...partnerContent,
      button: {
        ...defaults.partnerCta.button,
        ...(partnerContent.button || {}),
      },
    },
  };
};

export async function getOurWorkPageContent() {
  return mergeOurWorkPageContent(await getPageSections('our_work'));
}

const mergeEventsPageContent = (rows = []) => {
  const defaults = defaultEventsPageContent();
  const bySection = Object.fromEntries(rows.map((row) => [row.section_key, row]));
  const heroRow = bySection.hero;
  const heroContent = heroRow?.content || {};
  const testimonialContent = bySection.testimonials?.content || {};
  const ideaContent = bySection.idea_cta?.content || {};

  return {
    ...defaults,
    ...heroContent,
    primaryCta: { ...defaults.primaryCta, ...(heroContent.primaryCta || {}) },
    secondaryCta: { ...defaults.secondaryCta, ...(heroContent.secondaryCta || {}) },
    image: heroRow?.image || defaults.image,
    imageAlt: heroRow?.image_alt_text || defaults.imageAlt,
    imageMediaId: heroRow?.image_media_id || null,
    testimonials: defaults.testimonials.map((testimonial, index) => ({
      ...testimonial,
      ...(testimonialContent.items?.[index] || {}),
    })),
    ideaCta: {
      ...defaults.ideaCta,
      ...ideaContent,
      button: {
        ...defaults.ideaCta.button,
        ...(ideaContent.button || {}),
      },
    },
  };
};

export async function getEventsPageContent() {
  return mergeEventsPageContent(await getPageSections('events'));
}

const mergeResearchPageContent = (rows = []) => {
  const defaults = defaultResearchPageContent();
  const bySection = Object.fromEntries(rows.map((row) => [row.section_key, row]));
  const heroRow = bySection.hero;
  const heroContent = heroRow?.content || {};
  const topicsContent = bySection.topics?.content || {};
  const libraryContent = bySection.library?.content || {};
  const bandContent = bySection.band?.content || {};
  const newsletterContent = bySection.newsletter?.content || {};

  return {
    ...defaults,
    ...heroContent,
    cta: { ...defaults.cta, ...(heroContent.cta || {}) },
    image: heroRow?.image || defaults.image,
    imageAlt: heroRow?.image_alt_text || defaults.imageAlt,
    imageMediaId: heroRow?.image_media_id || null,
    topicsTitle: topicsContent.topicsTitle || defaults.topicsTitle,
    topics: defaults.topics.map((topic, index) => ({
      ...topic,
      ...(topicsContent.items?.[index] || {}),
    })),
    libraryEyebrow: libraryContent.libraryEyebrow || defaults.libraryEyebrow,
    libraryTitle: libraryContent.libraryTitle || defaults.libraryTitle,
    searchPlaceholder: libraryContent.searchPlaceholder || defaults.searchPlaceholder,
    band: {
      ...defaults.band,
      ...bandContent,
      integrity: {
        ...defaults.band.integrity,
        ...(bandContent.integrity || {}),
        link: {
          ...defaults.band.integrity.link,
          ...(bandContent.integrity?.link || {}),
        },
      },
    },
    newsletter: {
      ...defaults.newsletter,
      ...newsletterContent,
    },
  };
};

export async function getResearchPageContent() {
  return mergeResearchPageContent(await getPageSections('research'));
}

const mergeAppPageContent = (rows = []) => {
  const defaults = defaultAppPageContent();
  const bySection = Object.fromEntries(rows.map((row) => [row.section_key, row]));
  const heroContent = bySection.hero?.content || {};
  const featuresContent = bySection.features?.content || {};
  const howContent = bySection.how_it_works?.content || {};
  const waitlistContent = bySection.waitlist?.content || {};

  return {
    ...defaults,
    ...heroContent,
    primaryCta: { ...defaults.primaryCta, ...(heroContent.primaryCta || {}) },
    secondaryCta: { ...defaults.secondaryCta, ...(heroContent.secondaryCta || {}) },
    bullets: defaults.bullets.map((bullet, index) => ({
      ...bullet,
      ...(heroContent.bullets?.[index] || {}),
    })),
    featuresTitle: featuresContent.featuresTitle || defaults.featuresTitle,
    features: defaults.features.map((feature, index) => ({
      ...feature,
      ...(featuresContent.items?.[index] || {}),
    })),
    howTitle: howContent.howTitle || defaults.howTitle,
    steps: defaults.steps.map((step, index) => ({
      ...step,
      ...(howContent.steps?.[index] || {}),
    })),
    journey: {
      ...defaults.journey,
      ...(howContent.journey || {}),
    },
    waitlist: {
      ...defaults.waitlist,
      ...waitlistContent,
    },
  };
};

export async function getAppPageContent() {
  return mergeAppPageContent(await getPageSections('app'));
}

const mergeGetInvolvedPageContent = (rows = []) => {
  const defaults = defaultGetInvolvedPageContent();
  const bySection = Object.fromEntries(rows.map((row) => [row.section_key, row]));
  const heroRow = bySection.hero;
  const heroContent = heroRow?.content || {};
  const waysContent = bySection.ways?.content || {};
  const strongerContent = bySection.stronger?.content || {};

  return {
    ...defaults,
    ...heroContent,
    image: heroRow?.image || defaults.image,
    imageAlt: heroRow?.image_alt_text || defaults.imageAlt,
    imageMediaId: heroRow?.image_media_id || null,
    waysTitle: waysContent.waysTitle || defaults.waysTitle,
    ways: defaults.ways.map((way, index) => ({
      ...way,
      ...(waysContent.items?.[index] || {}),
      link: {
        ...way.link,
        ...(waysContent.items?.[index]?.link || {}),
      },
    })),
    stronger: {
      ...defaults.stronger,
      ...strongerContent,
      cta: {
        ...defaults.stronger.cta,
        ...(strongerContent.cta || {}),
      },
    },
  };
};

export async function getGetInvolvedPageContent() {
  return mergeGetInvolvedPageContent(await getPageSections('get_involved'));
}

const mergeContactPageContent = (rows = []) => {
  const defaults = defaultContactPageContent();
  const bySection = Object.fromEntries(rows.map((row) => [row.section_key, row]));
  const heroRow = bySection.hero;
  const heroContent = heroRow?.content || {};
  const quickInfoContent = bySection.quick_info?.content || {};
  const formContent = bySection.form?.content || {};
  const sidebarContent = bySection.sidebar?.content || {};
  const newsletterContent = bySection.newsletter?.content || {};

  return {
    ...defaults,
    ...heroContent,
    image: heroRow?.image || defaults.image,
    imageAlt: heroRow?.image_alt_text || defaults.imageAlt,
    imageMediaId: heroRow?.image_media_id || null,
    quickInfo: defaults.quickInfo.map((item, index) => ({
      ...item,
      ...(quickInfoContent.items?.[index] || {}),
    })),
    formTitle: formContent.formTitle || defaults.formTitle,
    form: defaults.form.map((field, index) => ({
      ...field,
      ...(formContent.fields?.[index] || {}),
    })),
    sendButton: formContent.sendButton || defaults.sendButton,
    sidebar: {
      ...defaults.sidebar,
      ...sidebarContent,
      details: defaults.sidebar.details.map((item, index) => ({
        ...item,
        ...(sidebarContent.details?.[index] || {}),
      })),
      quote: {
        ...defaults.sidebar.quote,
        ...(sidebarContent.quote || {}),
      },
    },
    newsletter: {
      ...defaults.newsletter,
      ...newsletterContent,
    },
  };
};

export async function getContactPageContent() {
  return mergeContactPageContent(await getPageSections('contact'));
}

const mergeShopPageContent = (rows = []) => {
  const defaults = defaultShopPageContent();
  const bySection = Object.fromEntries(rows.map((row) => [row.section_key, row]));
  const heroRow = bySection.hero;
  const heroContent = heroRow?.content || {};
  const collectionContent = bySection.collection?.content || {};
  const thanksContent = bySection.thanks?.content || {};

  return {
    ...defaults,
    ...heroContent,
    cta: { ...defaults.cta, ...(heroContent.cta || {}) },
    bullets: defaults.bullets.map((bullet, index) => ({
      ...bullet,
      ...(heroContent.bullets?.[index] || {}),
    })),
    image: heroRow?.image || defaults.image,
    imageAlt: heroRow?.image_alt_text || defaults.imageAlt,
    imageMediaId: heroRow?.image_media_id || null,
    collectionTitle: collectionContent.collectionTitle || defaults.collectionTitle,
    allProductsLabel: collectionContent.allProductsLabel || defaults.allProductsLabel,
    thanks: {
      ...defaults.thanks,
      ...thanksContent,
      cta: {
        ...defaults.thanks.cta,
        ...(thanksContent.cta || {}),
      },
    },
  };
};

export async function getShopPageContent() {
  return mergeShopPageContent(await getPageSections('shop'));
}

const mergeSupportPageContent = (rows = []) => {
  const defaults = defaultSupportPageContent();
  const bySection = Object.fromEntries(rows.map((row) => [row.section_key, row]));
  const introContent = bySection.intro?.content || {};
  const donationContent = bySection.donation?.content || {};
  const thanksContent = bySection.thanks?.content || {};
  const savedPresets = Array.isArray(donationContent.presets)
    ? donationContent.presets
      .map(Number)
      .filter((value) => Number.isFinite(value) && value >= 100)
    : [];

  return {
    ...defaults,
    ...introContent,
    impactItems: defaults.impactItems.map((item, index) =>
      introContent.impactItems?.[index] || item
    ),
    ...donationContent,
    presets: savedPresets.length ? savedPresets : defaults.presets,
    thanks: {
      ...defaults.thanks,
      ...thanksContent,
      button: {
        ...defaults.thanks.button,
        ...(thanksContent.button || {}),
      },
    },
  };
};

export async function getSupportPageContent() {
  return mergeSupportPageContent(await getPageSections('support'));
}

const mergeVolunteerPageContent = (rows = []) => {
  const defaults = defaultVolunteerPageContent();
  const bySection = Object.fromEntries(rows.map((row) => [row.section_key, row]));

  return {
    landing: {
      ...defaults.landing,
      ...(bySection.landing?.content || {}),
    },
    application: {
      ...defaults.application,
      ...(bySection.application?.content || {}),
    },
  };
};

export async function getVolunteerPageContent() {
  return mergeVolunteerPageContent(await getPageSections('volunteer'));
}

const mergePartnerPageContent = (rows = []) => {
  const defaults = defaultPartnerPageContent();
  const bySection = Object.fromEntries(rows.map((row) => [row.section_key, row]));
  const introContent = bySection.intro?.content || {};
  const formContent = bySection.form?.content || {};
  const successContent = bySection.success?.content || {};

  return {
    ...defaults,
    ...introContent,
    ...formContent,
    orgTypeOptions: Array.isArray(formContent.orgTypeOptions) && formContent.orgTypeOptions.length
      ? formContent.orgTypeOptions
      : defaults.orgTypeOptions,
    partnershipTypeOptions: Array.isArray(formContent.partnershipTypeOptions) && formContent.partnershipTypeOptions.length
      ? formContent.partnershipTypeOptions
      : defaults.partnershipTypeOptions,
    success: {
      ...defaults.success,
      ...successContent,
      button: {
        ...defaults.success.button,
        ...(successContent.button || {}),
      },
    },
  };
};

export async function getPartnerPageContent() {
  return mergePartnerPageContent(await getPageSections('partner'));
}

const assertInformationPageKey = (pageKey) => {
  if (!INFORMATION_PAGE_KEYS.includes(pageKey)) {
    throw new Error(`Unknown information page: ${pageKey}`);
  }
};

export async function getInformationPageContent(pageKey) {
  assertInformationPageKey(pageKey);
  const defaults = defaultInformationPagesContent()[pageKey];
  const rows = await getPageSections(pageKey);
  const saved = rows.find((row) => row.section_key === 'content')?.content || {};

  return {
    ...defaults,
    ...saved,
    sections: defaults.sections.map((section, index) => ({
      ...section,
      ...(saved.sections?.[index] || {}),
    })),
  };
}

export async function getInformationPagesContent() {
  const entries = await Promise.all(
    INFORMATION_PAGE_KEYS.map(async (pageKey) => [
      pageKey,
      await getInformationPageContent(pageKey),
    ])
  );
  return Object.fromEntries(entries);
}

const upsertSection = async (pageKey, sectionKey, payload) => {
  const { data, error } = await supabase
    .from('page_sections')
    .upsert({
      page_key: pageKey,
      section_key: sectionKey,
      ...payload,
    }, { onConflict: 'page_key,section_key' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export async function saveHomePageContent(homePage) {
  const hero = homePage.hero;
  const mission = homePage.mission;
  const whatWeDo = homePage.whatWeDo;

  await Promise.all([
    upsertSection('home', 'hero', {
      content: {
        eyebrow: hero.eyebrow,
        title: hero.title,
        body: hero.body,
        primaryCta: hero.primaryCta,
        secondaryCta: hero.secondaryCta,
        bullets: hero.bullets,
      },
      image: hero.image || null,
      image_media_id: hero.imageMediaId || null,
      image_alt_text: hero.imageAlt || null,
    }),
    upsertSection('home', 'mission', {
      content: {
        headlineMarkup: mission.headlineMarkup,
        subhead: mission.subhead,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('home', 'what_we_do', {
      content: {
        eyebrow: whatWeDo.eyebrow,
        title: whatWeDo.title,
        items: whatWeDo.items,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
  ]);

  return getHomePageContent();
}

export async function saveAboutPageContent(aboutPage) {
  await Promise.all([
    upsertSection('about', 'hero', {
      content: {
        eyebrow: aboutPage.eyebrow,
        title: aboutPage.title,
        body: aboutPage.body,
      },
      image: aboutPage.image || null,
      image_media_id: aboutPage.imageMediaId || null,
      image_alt_text: aboutPage.imageAlt || null,
    }),
    upsertSection('about', 'pillars', {
      content: { items: aboutPage.pillars },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('about', 'founders', {
      content: {
        eyebrow: aboutPage.founders.eyebrow,
        title: aboutPage.founders.title,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('about', 'stats', {
      content: {
        title: aboutPage.stats.title,
        items: aboutPage.stats.items,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('about', 'cta', {
      content: aboutPage.cta,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
  ]);

  return getAboutPageContent();
}

export async function saveOurWorkPageContent(ourWorkPage) {
  const programmeRows = ourWorkPage.programs.map((program, index) =>
    upsertSection('our_work', `program_${index + 1}`, {
      content: {
        icon: program.icon,
        title: program.title,
        body: program.body,
        link: program.link,
      },
      image: program.img || null,
      image_media_id: program.imageMediaId || null,
      image_alt_text: program.imgAlt || null,
    })
  );

  await Promise.all([
    upsertSection('our_work', 'hero', {
      content: {
        eyebrow: ourWorkPage.eyebrow,
        title: ourWorkPage.title,
        body: ourWorkPage.body,
        cta: ourWorkPage.cta,
      },
      image: ourWorkPage.image || null,
      image_media_id: ourWorkPage.imageMediaId || null,
      image_alt_text: ourWorkPage.imageAlt || null,
    }),
    upsertSection('our_work', 'programs_heading', {
      content: {
        programsEyebrow: ourWorkPage.programsEyebrow,
        programsTitle: ourWorkPage.programsTitle,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    ...programmeRows,
    upsertSection('our_work', 'stats', {
      content: ourWorkPage.stats,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('our_work', 'partner_cta', {
      content: ourWorkPage.partnerCta,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
  ]);

  return getOurWorkPageContent();
}

export async function saveEventsPageContent(eventsPage) {
  await Promise.all([
    upsertSection('events', 'hero', {
      content: {
        eyebrow: eventsPage.eyebrow,
        title: eventsPage.title,
        body: eventsPage.body,
        primaryCta: eventsPage.primaryCta,
        secondaryCta: eventsPage.secondaryCta,
      },
      image: eventsPage.image || null,
      image_media_id: eventsPage.imageMediaId || null,
      image_alt_text: eventsPage.imageAlt || null,
    }),
    upsertSection('events', 'testimonials', {
      content: { items: eventsPage.testimonials },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('events', 'idea_cta', {
      content: eventsPage.ideaCta,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
  ]);

  return getEventsPageContent();
}

export async function saveResearchPageContent(researchPage) {
  await Promise.all([
    upsertSection('research', 'hero', {
      content: {
        eyebrow: researchPage.eyebrow,
        title: researchPage.title,
        body: researchPage.body,
        cta: researchPage.cta,
      },
      image: researchPage.image || null,
      image_media_id: researchPage.imageMediaId || null,
      image_alt_text: researchPage.imageAlt || null,
    }),
    upsertSection('research', 'topics', {
      content: {
        topicsTitle: researchPage.topicsTitle,
        items: researchPage.topics,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('research', 'library', {
      content: {
        libraryEyebrow: researchPage.libraryEyebrow,
        libraryTitle: researchPage.libraryTitle,
        searchPlaceholder: researchPage.searchPlaceholder,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('research', 'band', {
      content: researchPage.band,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('research', 'newsletter', {
      content: researchPage.newsletter,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
  ]);

  return getResearchPageContent();
}

export async function saveAppPageContent(appPage) {
  await Promise.all([
    upsertSection('app', 'hero', {
      content: {
        eyebrow: appPage.eyebrow,
        statusLabel: appPage.statusLabel,
        title: appPage.title,
        body: appPage.body,
        primaryCta: appPage.primaryCta,
        secondaryCta: appPage.secondaryCta,
        bullets: appPage.bullets,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('app', 'features', {
      content: {
        featuresTitle: appPage.featuresTitle,
        items: appPage.features,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('app', 'how_it_works', {
      content: {
        howTitle: appPage.howTitle,
        steps: appPage.steps,
        journey: appPage.journey,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('app', 'waitlist', {
      content: appPage.waitlist,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
  ]);

  return getAppPageContent();
}

export async function saveGetInvolvedPageContent(getInvolvedPage) {
  await Promise.all([
    upsertSection('get_involved', 'hero', {
      content: {
        eyebrow: getInvolvedPage.eyebrow,
        title: getInvolvedPage.title,
        body: getInvolvedPage.body,
        tagline: getInvolvedPage.tagline,
      },
      image: getInvolvedPage.image || null,
      image_media_id: getInvolvedPage.imageMediaId || null,
      image_alt_text: getInvolvedPage.imageAlt || null,
    }),
    upsertSection('get_involved', 'ways', {
      content: {
        waysTitle: getInvolvedPage.waysTitle,
        items: getInvolvedPage.ways,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('get_involved', 'stronger', {
      content: getInvolvedPage.stronger,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
  ]);

  return getGetInvolvedPageContent();
}

export async function saveContactPageContent(contactPage) {
  await Promise.all([
    upsertSection('contact', 'hero', {
      content: {
        eyebrow: contactPage.eyebrow,
        title: contactPage.title,
        body: contactPage.body,
      },
      image: contactPage.image || null,
      image_media_id: contactPage.imageMediaId || null,
      image_alt_text: contactPage.imageAlt || null,
    }),
    upsertSection('contact', 'quick_info', {
      content: { items: contactPage.quickInfo },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('contact', 'form', {
      content: {
        formTitle: contactPage.formTitle,
        fields: contactPage.form,
        sendButton: contactPage.sendButton,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('contact', 'sidebar', {
      content: contactPage.sidebar,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('contact', 'newsletter', {
      content: contactPage.newsletter,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
  ]);

  return getContactPageContent();
}

export async function saveShopPageContent(shopPage) {
  await Promise.all([
    upsertSection('shop', 'hero', {
      content: {
        eyebrow: shopPage.eyebrow,
        title: shopPage.title,
        body: shopPage.body,
        cta: shopPage.cta,
        bullets: shopPage.bullets,
      },
      image: shopPage.image || null,
      image_media_id: shopPage.imageMediaId || null,
      image_alt_text: shopPage.imageAlt || null,
    }),
    upsertSection('shop', 'collection', {
      content: {
        collectionTitle: shopPage.collectionTitle,
        allProductsLabel: shopPage.allProductsLabel,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('shop', 'thanks', {
      content: shopPage.thanks,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
  ]);

  return getShopPageContent();
}

export async function saveSupportPageContent(supportPage) {
  await Promise.all([
    upsertSection('support', 'intro', {
      content: {
        eyebrow: supportPage.eyebrow,
        title: supportPage.title,
        body: supportPage.body,
        impactItems: supportPage.impactItems,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('support', 'donation', {
      content: {
        formTitle: supportPage.formTitle,
        presets: supportPage.presets.map(Number),
        customAmountLabel: supportPage.customAmountLabel,
        customAmountPlaceholder: supportPage.customAmountPlaceholder,
        namePlaceholder: supportPage.namePlaceholder,
        emailPlaceholder: supportPage.emailPlaceholder,
        messagePlaceholder: supportPage.messagePlaceholder,
        donateButtonLabel: supportPage.donateButtonLabel,
        loadingLabel: supportPage.loadingLabel,
        securityPrefix: supportPage.securityPrefix,
        contactLabel: supportPage.contactLabel,
        contactHref: supportPage.contactHref,
        securitySuffix: supportPage.securitySuffix,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('support', 'thanks', {
      content: supportPage.thanks,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
  ]);

  return getSupportPageContent();
}

export async function saveVolunteerPageContent(volunteerPage) {
  await Promise.all([
    upsertSection('volunteer', 'landing', {
      content: volunteerPage.landing,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('volunteer', 'application', {
      content: volunteerPage.application,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
  ]);

  return getVolunteerPageContent();
}

export async function savePartnerPageContent(partnerPage) {
  await Promise.all([
    upsertSection('partner', 'intro', {
      content: {
        eyebrow: partnerPage.eyebrow,
        title: partnerPage.title,
        body: partnerPage.body,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('partner', 'form', {
      content: {
        organisationHeading: partnerPage.organisationHeading,
        orgNamePlaceholder: partnerPage.orgNamePlaceholder,
        websitePlaceholder: partnerPage.websitePlaceholder,
        orgTypePlaceholder: partnerPage.orgTypePlaceholder,
        orgTypeOptions: partnerPage.orgTypeOptions,
        partnershipTypePlaceholder: partnerPage.partnershipTypePlaceholder,
        partnershipTypeOptions: partnerPage.partnershipTypeOptions,
        contactHeading: partnerPage.contactHeading,
        contactNamePlaceholder: partnerPage.contactNamePlaceholder,
        rolePlaceholder: partnerPage.rolePlaceholder,
        emailPlaceholder: partnerPage.emailPlaceholder,
        phonePlaceholder: partnerPage.phonePlaceholder,
        detailsHeading: partnerPage.detailsHeading,
        goalsPlaceholder: partnerPage.goalsPlaceholder,
        audiencePlaceholder: partnerPage.audiencePlaceholder,
        timelinePlaceholder: partnerPage.timelinePlaceholder,
        budgetPlaceholder: partnerPage.budgetPlaceholder,
        messagePlaceholder: partnerPage.messagePlaceholder,
        responseNote: partnerPage.responseNote,
        submitLabel: partnerPage.submitLabel,
        submittingLabel: partnerPage.submittingLabel,
      },
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
    upsertSection('partner', 'success', {
      content: partnerPage.success,
      image: null,
      image_media_id: null,
      image_alt_text: null,
    }),
  ]);

  return getPartnerPageContent();
}

export async function saveInformationPageContent(pageKey, informationPage) {
  assertInformationPageKey(pageKey);
  await upsertSection(pageKey, 'content', {
    content: {
      eyebrow: informationPage.eyebrow,
      title: informationPage.title,
      intro: informationPage.intro,
      updatedLabel: informationPage.updatedLabel,
      sections: informationPage.sections,
    },
    image: null,
    image_media_id: null,
    image_alt_text: null,
  });
  return getInformationPageContent(pageKey);
}
