import { supabase } from '@/lib/supabase';
import { getMySiteAccess, hasPermission } from './access';
import { createEvent, updateEvent, deleteEvent, getEvents } from './events';
import { dbPayloads, getArticles, getFounders, getNewsletterIssues, getProducts } from './content';
import { getAboutPageContent, getAppPageContent, getContactPageContent, getEventsPageContent, getGetInvolvedPageContent, getHomePageContent, getInformationPagesContent, getOurWorkPageContent, getPartnerPageContent, getResearchPageContent, getShopPageContent, getSupportPageContent, getVolunteerPageContent, saveAboutPageContent, saveAppPageContent, saveContactPageContent, saveEventsPageContent, saveGetInvolvedPageContent, saveHomePageContent, saveInformationPageContent, saveOurWorkPageContent, savePartnerPageContent, saveResearchPageContent, saveShopPageContent, saveSupportPageContent, saveVolunteerPageContent } from './pageContent';

export async function signInAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const access = await getMySiteAccess();
  if (!hasPermission(access, 'cms.access')) {
    await supabase.auth.signOut();
    throw new Error('This account does not currently have website CMS access.');
  }
  return data;
}

export async function signOutAdmin() { await supabase.auth.signOut(); }
export async function getSession() { const { data } = await supabase.auth.getSession(); return data.session; }
export async function getCurrentRole() {
  try {
    const access = await getMySiteAccess();
    return access?.active ? access.role || null : null;
  } catch {
    return null;
  }
}

const list = async (table, orderCol = 'created_at', ascending = false) => {
  const { data, error } = await supabase.from(table).select('*').order(orderCol, { ascending });
  if (error) throw error;
  return data || [];
};

export async function loadAdminDashboard(accessOverride = null) {
  const access = accessOverride || await getMySiteAccess();
  const can = (permission) => hasPermission(access, permission);
  const result = {
    subscribers: [], newsletters: [], homePage: null, aboutPage: null,
    ourWorkPage: null, eventsPage: null, researchPage: null, appPage: null,
    getInvolvedPage: null, contactPage: null, shopPage: null, supportPage: null,
    volunteerPage: null, partnerPage: null, informationPages: null,
    waitlist: [], messages: [], events: [], articles: [], products: [],
    registrations: [], applications: [], inquiries: [], roles: [], founders: [],
  };

  const jobs = [];
  const assign = (key, promise) => jobs.push(
    Promise.resolve(promise).then((value) => { result[key] = value; }),
  );

  if (can('newsletter_subscribers.read')) assign('subscribers', list('newsletter_subscribers', 'subscribed_at'));
  if (can('newsletters.read')) assign('newsletters', getNewsletterIssues({ includeDrafts: true }));
  if (can('waitlist.read')) assign('waitlist', list('app_waitlist'));
  if (can('messages.read')) assign('messages', list('contact_messages', 'submitted_at'));
  if (can('events.read')) assign('events', getEvents({ includeDrafts: true }));
  if (can('articles.read')) assign('articles', getArticles({ includeDrafts: true }));
  if (can('products.publish')) assign('products', getProducts({ includeInactive: true }));
  if (can('registrations.read')) assign('registrations', list('event_registrations'));
  if (can('partners.read')) assign('inquiries', list('partner_inquiries'));
  if (can('volunteer_roles.read')) assign('roles', list('volunteer_roles'));
  if (can('team.publish')) assign('founders', getFounders());

  if (can('volunteer_applications.read')) {
    jobs.push(
      supabase
        .from('volunteer_applications')
        .select('*, volunteer_roles(title, slug)')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error;
          result.applications = (data || []).map((application) => ({
            ...application,
            role_title: application.volunteer_roles?.title,
            role_slug: application.volunteer_roles?.slug,
          }));
        }),
    );
  }

  if (can('pages.home.publish')) assign('homePage', getHomePageContent());
  if (can('pages.about.publish')) assign('aboutPage', getAboutPageContent());
  if (can('pages.our_work.publish')) assign('ourWorkPage', getOurWorkPageContent());
  if (can('pages.events.publish')) assign('eventsPage', getEventsPageContent());
  if (can('pages.research.publish')) assign('researchPage', getResearchPageContent());
  if (can('pages.app.publish')) assign('appPage', getAppPageContent());
  if (can('pages.get_involved.publish')) assign('getInvolvedPage', getGetInvolvedPageContent());
  if (can('pages.contact.publish')) assign('contactPage', getContactPageContent());
  if (can('pages.shop.publish')) assign('shopPage', getShopPageContent());
  if (can('pages.support.publish')) assign('supportPage', getSupportPageContent());
  if (can('pages.volunteer.publish')) assign('volunteerPage', getVolunteerPageContent());
  if (can('pages.partner.publish')) assign('partnerPage', getPartnerPageContent());
  if (can('pages.information.publish')) assign('informationPages', getInformationPagesContent());

  await Promise.all(jobs);
  return result;
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
export async function sendNewsletterIssue(id) {
  const { data, error } = await supabase.functions.invoke('send-newsletter', {
    body: { issue_id: id },
  });
  if (error) {
    let message = error.message || 'Newsletter delivery failed.';
    try {
      const body = await error?.context?.json?.();
      message = body?.error || message;
    } catch {}
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
export const saveHomepage = (payload) => saveHomePageContent(payload);
export const saveAboutPage = (payload) => saveAboutPageContent(payload);
export const saveOurWorkPage = (payload) => saveOurWorkPageContent(payload);
export const saveEventsPage = (payload) => saveEventsPageContent(payload);
export const saveResearchPage = (payload) => saveResearchPageContent(payload);
export const saveAppPage = (payload) => saveAppPageContent(payload);
export const saveGetInvolvedPage = (payload) => saveGetInvolvedPageContent(payload);
export const saveContactPage = (payload) => saveContactPageContent(payload);
export const saveShopPage = (payload) => saveShopPageContent(payload);
export const saveSupportPage = (payload) => saveSupportPageContent(payload);
export const saveVolunteerPage = (payload) => saveVolunteerPageContent(payload);
export const savePartnerPage = (payload) => savePartnerPageContent(payload);
export const saveInformationPage = (pageKey, payload) => saveInformationPageContent(pageKey, payload);
export const createProduct = (p) => insert('products', dbPayloads.product(p));
export const updateProduct = (id, p) => update('products', id, dbPayloads.product(p));
export const deleteProduct = (id) => remove('products', id);
export const createFounder = (p) => insert('founders', dbPayloads.founder(p));
export const updateFounder = (id, p) => update('founders', id, dbPayloads.founder(p));
export const deleteFounder = (id) => remove('founders', id);
export const createVolunteerRole = (p) => insert('volunteer_roles', dbPayloads.volunteerRole(p));
export const updateVolunteerRole = (id, p) => update('volunteer_roles', id, dbPayloads.volunteerRole(p));
export const deleteVolunteerRole = (id) => remove('volunteer_roles', id);
