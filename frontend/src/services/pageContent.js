import { supabase } from '@/lib/supabase';
import { HERO, MISSION_BAND, WHAT_WE_DO } from '../mock';
import { ABOUT } from '../mock_pages';

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
