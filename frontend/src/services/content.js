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

export async function getArticles() {
  const { data, error } = await supabase.from('articles').select('*').eq('status', 'published').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getArticle(slug) {
  const { data, error } = await supabase.from('articles').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data;
}

export async function getProducts({ includeInactive = false } = {}) {
  let q = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (!includeInactive) q = q.eq('active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

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
    read: a.read || '6 min read', updated: a.updated || null, hero: a.hero || null, lead: a.lead || null,
    blocks: a.blocks || [], takeaways: normalizeList(a.takeaways), tags: normalizeList(a.tags), status: a.status || 'published',
  }),
  product: (p) => ({
    name: p.name, price: Number(p.price || 0), currency: p.currency || 'KES', category: p.category || 'All Products',
    img: p.img || null, description: p.description || null, active: p.active !== false,
  }),
};
