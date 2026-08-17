import { supabase } from '@/lib/supabase';

const slugify = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const normalizeList = (value) => Array.isArray(value) ? value.filter(Boolean) : String(value || '').split(',').map((v) => v.trim()).filter(Boolean);

export async function getVolunteerRoles({ includeInactive = false } = {}) {
  let q = supabase.from('volunteer_roles').select('*').order('created_at', { ascending: false });
  if (!includeInactive) q = q.eq('active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getVolunteerRole(slug) {
  const { data, error } = await supabase.from('volunteer_roles').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data;
}

export async function submitVolunteerApplication({
  roleId,
  name,
  email,
  phone,
  answers,
}) {
  const { data, error } =
    await supabase.functions.invoke(
      'public-submission',
      {
        body: {
          type: 'volunteer',
          payload: {
            role_id: roleId,
            name,
            email,
            phone,
            answers,
          },
        },
      },
    );

  if (error) throw error;

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
export async function getFounders() {
  const { data, error } = await supabase.from('founders').select('*').order('display_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(toFrontendFounder);
}

export async function getFounder(slug) {
  const { data, error } = await supabase.from('founders').select('*').eq('slug', slug).single();
  if (error) throw error;
  return toFrontendFounder(data);
}

const toFrontendFounder = (row) => ({
  ...row,
  order: row.display_order,
  imgAlt: row.image_alt_text ?? row.imgAlt ?? '',
  photoMediaId: row.photo_media_id ?? row.photoMediaId ?? null,
});

export async function getArticles({ includeDrafts = false } = {}) {
  let query = supabase.from('articles').select('*').order('created_at', { ascending: false });
  if (!includeDrafts) query = query.eq('status', 'published');
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toFrontendArticle);
}

export async function getArticle(slug) {
  const { data, error } = await supabase.from('articles').select('*').eq('slug', slug).single();
  if (error) throw error;
  return toFrontendArticle(data);
}

const toFrontendArticle = (row) => ({
  ...row,
  heroAlt: row.hero_alt_text ?? row.heroAlt ?? '',
  heroMediaId: row.hero_media_id ?? row.heroMediaId ?? null,
});

const toFrontendNewsletterIssue = (row) => ({
  ...row,
  heroAlt: row.hero_alt_text ?? row.heroAlt ?? '',
  heroMediaId: row.hero_media_id ?? row.heroMediaId ?? null,
  publishedAt: row.published_at ?? row.publishedAt ?? null,
});

export async function getNewsletterIssues({ includeDrafts = false } = {}) {
  let query = supabase
    .from('newsletter_issues')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (!includeDrafts) query = query.eq('status', 'published');
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toFrontendNewsletterIssue);
}

export async function getNewsletterIssue(slug) {
  const { data, error } = await supabase
    .from('newsletter_issues')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return toFrontendNewsletterIssue(data);
}

const toFrontendProductImages = (images = []) => {
  const ordered = (Array.isArray(images) ? images : []).map((image, index) => ({
    mediaAssetId: image.media_asset_id ?? image.mediaAssetId ?? null,
    publicUrl: image.src ?? image.publicUrl ?? '',
    altText: image.alt ?? image.altText ?? '',
    caption: image.caption ?? '',
    isPrimary: image.is_primary ?? image.isPrimary ?? false,
    order: Number(image.display_order ?? image.order ?? index),
  }))
  .sort((a, b) => a.order - b.order)
  .map((image, index) => ({ ...image, order: index }));
  const primaryIndex = ordered.findIndex((image) => image.isPrimary);
  const normalizedPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;
  return ordered.map((image, index) => ({
    ...image,
    isPrimary: index === normalizedPrimaryIndex,
  }));
};

const toFrontendProduct = (row) => {
  const images = toFrontendProductImages(row.images);
  const primary = images.find((image) => image.isPrimary) || images[0];
  return {
    ...row,
    images,
    img: primary?.publicUrl || row.img || null,
    imgAlt: primary?.altText || row.name,
  };
};

export async function getProducts({ includeInactive = false } = {}) {
  let q = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (!includeInactive) q = q.eq('active', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(toFrontendProduct);
}

export async function getProduct(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return toFrontendProduct(data);
}

const toDatabaseProduct = (product) => {
  const images = toFrontendProductImages(product.images).map((image, index) => ({
    media_asset_id: image.mediaAssetId,
    src: image.publicUrl,
    alt: image.altText || '',
    caption: image.caption || '',
    display_order: index,
    is_primary: !!image.isPrimary,
  }));
  const primary = images.find((image) => image.is_primary) || images[0];

  return {
    name: product.name,
    price: Number(product.price || 0),
    currency: product.currency || 'KES',
    category: product.category || 'All Products',
    img: primary?.src || product.img || null,
    images,
    description: product.description || null,
    active: product.active !== false,
  };
};

export const dbPayloads = {
  volunteerRole: (r) => ({
    slug: r.slug || slugify(r.title),
    title: r.title,
    department: r.department || null,
    commitment: r.commitment || null,
    location: r.location || null,
    description: r.description || null,
    responsibilities: normalizeList(r.responsibilities),
    requirements: normalizeList(r.requirements),
    questions: r.questions || [],
    active: r.active !== false,
  }),
  founder: (f) => ({
    slug: f.slug || slugify(f.name), name: f.name, role: f.role || null, short: f.short || null,
    bio: f.bio || null, img: f.img || null, image_alt_text: f.imgAlt ?? f.image_alt_text ?? null,
    photo_media_id: f.photoMediaId ?? f.photo_media_id ?? null,
    linkedin: f.linkedin || null, funfact: f.funfact || null,
    medium: f.medium || null, why_art: f.why_art || null, display_order: Number(f.order ?? f.display_order ?? 0),
  }),
  article: (a) => ({
    slug: a.slug || slugify(a.title), topic: a.topic, title: a.title, excerpt: a.excerpt || null,
    read: a.read || '6 min read', updated: a.updated || null, hero: a.hero || null,
    hero_alt_text: a.heroAlt ?? a.hero_alt_text ?? null,
    hero_media_id: a.heroMediaId ?? a.hero_media_id ?? null, lead: a.lead || null,
    blocks: a.blocks || [], takeaways: normalizeList(a.takeaways), tags: normalizeList(a.tags), status: a.status || 'published',
  }),
  newsletterIssue: (issue) => ({
    slug: issue.slug || slugify(issue.title),
    title: issue.title,
    subject: issue.subject || null,
    preheader: issue.preheader || null,
    excerpt: issue.excerpt || null,
    hero: issue.hero || null,
    hero_alt_text: issue.heroAlt ?? issue.hero_alt_text ?? null,
    hero_media_id: issue.heroMediaId ?? issue.hero_media_id ?? null,
    body: issue.body || '',
    status: issue.status || 'draft',
  }),
  product: toDatabaseProduct,
};
