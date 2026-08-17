import { supabase } from '@/lib/supabase';
import { createEvent, updateEvent, deleteEvent, getEvents } from './events';
import { dbPayloads, getArticles, getFounders, getNewsletterIssues, getProducts } from './content';
import { getAboutPageContent, getEventsPageContent, getHomePageContent, getOurWorkPageContent, getResearchPageContent, saveAboutPageContent, saveEventsPageContent, saveHomePageContent, saveOurWorkPageContent, saveResearchPageContent } from './pageContent';

export async function signInAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const role = await getCurrentRole();
  if (!['admin', 'editor'].includes(role)) {
    await supabase.auth.signOut();
    throw new Error('This account does not have website admin access.');
  }
  return data;
}

export async function signOutAdmin() { await supabase.auth.signOut(); }
export async function getSession() { const { data } = await supabase.auth.getSession(); return data.session; }
export async function getCurrentRole() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userData.user.id).single();
  if (error) return null;
  return data?.role || null;
}

const list = async (table, orderCol = 'created_at', ascending = false) => {
  const { data, error } = await supabase.from(table).select('*').order(orderCol, { ascending });
  if (error) throw error;
  return data || [];
};

export async function loadAdminDashboard() {
  const [subscribers, newsletters, waitlist, messages, events, articles, products, registrations, applicationsRaw, inquiries, roles, founders, homePage, aboutPage, ourWorkPage, eventsPage, researchPage] = await Promise.all([
    list('newsletter_subscribers', 'subscribed_at'),
    getNewsletterIssues({ includeDrafts: true }),
    list('app_waitlist'),
    list('contact_messages', 'submitted_at'),
    getEvents({ includeDrafts: true }),
    getArticles({ includeDrafts: true }),
    getProducts({ includeInactive: true }),
    list('event_registrations'),
    supabase.from('volunteer_applications').select('*, volunteer_roles(title, slug)').order('created_at', { ascending: false }).then(({ data, error }) => { if (error) throw error; return data || []; }),
    list('partner_inquiries'),
    list('volunteer_roles'),
    getFounders(),
    getHomePageContent(),
    getAboutPageContent(),
    getOurWorkPageContent(),
    getEventsPageContent(),
    getResearchPageContent(),
  ]);
  const applications = applicationsRaw.map((a) => ({ ...a, role_title: a.volunteer_roles?.title, role_slug: a.volunteer_roles?.slug }));
  return { subscribers, newsletters, waitlist, messages, events, articles, products, registrations, applications, inquiries, roles, founders, homePage, aboutPage, ourWorkPage, eventsPage, researchPage };
}

const insert = async (table, payload) => { const { data, error } = await supabase.from(table).insert(payload).select().single(); if (error) throw error; return data; };
const update = async (table, id, payload) => { const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single(); if (error) throw error; return data; };
const remove = async (table, id) => { const { error } = await supabase.from(table).delete().eq('id', id); if (error) throw error; };

export { createEvent, updateEvent, deleteEvent };
export const createArticle = (p) => insert('articles', dbPayloads.article(p));
export const updateArticle = (id, p) => update('articles', id, dbPayloads.article(p));
export const deleteArticle = (id) => remove('articles', id);
export const createNewsletterIssue = (p) => insert('newsletter_issues', dbPayloads.newsletterIssue(p));
export const updateNewsletterIssue = (id, p) => update('newsletter_issues', id, dbPayloads.newsletterIssue(p));
export const deleteNewsletterIssue = (id) => remove('newsletter_issues', id);
export const saveHomepage = (payload) => saveHomePageContent(payload);
export const saveAboutPage = (payload) => saveAboutPageContent(payload);
export const saveOurWorkPage = (payload) => saveOurWorkPageContent(payload);
export const saveEventsPage = (payload) => saveEventsPageContent(payload);
export const saveResearchPage = (payload) => saveResearchPageContent(payload);
export const createProduct = (p) => insert('products', dbPayloads.product(p));
export const updateProduct = (id, p) => update('products', id, dbPayloads.product(p));
export const deleteProduct = (id) => remove('products', id);
export const createFounder = (p) => insert('founders', dbPayloads.founder(p));
export const updateFounder = (id, p) => update('founders', id, dbPayloads.founder(p));
export const deleteFounder = (id) => remove('founders', id);
export const createVolunteerRole = (p) => insert('volunteer_roles', dbPayloads.volunteerRole(p));
export const updateVolunteerRole = (id, p) => update('volunteer_roles', id, dbPayloads.volunteerRole(p));
export const deleteVolunteerRole = (id) => remove('volunteer_roles', id);
