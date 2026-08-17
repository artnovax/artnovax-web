import { supabase } from '@/lib/supabase';
import { HERO, MISSION_BAND, WHAT_WE_DO } from '../mock';
import { ABOUT, EVENTS, OUR_WORK } from '../mock_pages';
import { RESEARCH } from '../mock_pages2';

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
