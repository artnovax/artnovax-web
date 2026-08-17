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
    'KES 1,000 helps stock materials for one campus session.',
    'KES 5,000 sponsors a small circle of care for a term.',
    'Any amount goes 100% to program delivery and research.',
  ],
  formTitle: 'Give today',
  presets: [500, 1000, 2500, 5000, 10000],
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
