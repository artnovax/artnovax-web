import React, { useEffect, useRef, useState } from "react";
import {
  Lock,
  Mail,
  MessageSquare,
  LogOut,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Calendar,
  BookOpen,
  Package,
  Ticket,
  Users,
  Handshake,
  UserSquare2,
  ArrowUp,
  ArrowDown,
  Images,
  ExternalLink,
  Globe2,
  PanelsTopLeft,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MediaLibrary, { MediaPicker } from "../components/admin/MediaLibrary";
import {
  signInAdmin,
  signOutAdmin,
  getSession,
  getCurrentRole,
  loadAdminDashboard,
  createEvent,
  updateEvent,
  deleteEvent,
  createArticle,
  updateArticle,
  deleteArticle,
  createNewsletterIssue,
  updateNewsletterIssue,
  deleteNewsletterIssue,
  saveHomepage,
  saveAboutPage,
  saveOurWorkPage,
  saveEventsPage,
  saveResearchPage,
  saveAppPage,
  saveGetInvolvedPage,
  saveContactPage,
  saveShopPage,
  saveSupportPage,
  saveVolunteerPage,
  createProduct,
  updateProduct,
  deleteProduct,
  createFounder,
  updateFounder,
  deleteFounder,
  createVolunteerRole,
  updateVolunteerRole,
  deleteVolunteerRole,
} from "../services/admin";

const emptyData = {
  subscribers: [],
  newsletters: [],
  homePage: null,
  aboutPage: null,
  ourWorkPage: null,
  eventsPage: null,
  researchPage: null,
  appPage: null,
  getInvolvedPage: null,
  contactPage: null,
  shopPage: null,
  supportPage: null,
  volunteerPage: null,
  waitlist: [],
  messages: [],
  events: [],
  articles: [],
  products: [],
  registrations: [],
  applications: [],
  inquiries: [],
  roles: [],
  founders: [],
};

const Admin = () => {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("events");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const authorized = !!session && ["admin", "editor"].includes(role);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      setData(await loadAdminDashboard());
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const current = await getSession();
      if (current) {
        const currentRole = await getCurrentRole();
        if (["admin", "editor"].includes(currentRole)) {
          setSession(current);
          setRole(currentRole);
        } else {
          await signOutAdmin();
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (authorized) load();
  }, [authorized]);

  const signIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const result = await signInAdmin(email, password);
      const currentRole = await getCurrentRole();
      setSession(result.session);
      setRole(currentRole);
      setPassword("");
    } catch (e) {
      setErr(e?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await signOutAdmin();
    setSession(null);
    setRole(null);
    setData(emptyData);
    setPassword("");
  };

  const refresh = () => load();

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/admin" />
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 py-10 md:py-14">
        {!authorized ? (
          <div className="max-w-[420px] mx-auto rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-burgundy" />
            </div>
            <h1 className="mt-4 font-serif-display text-burgundy text-[26px] font-semibold">
              Team Sign In
            </h1>
            <p className="mt-1 text-ink/70 text-[13.5px]">
              Sign in with your ArtNovaX website admin account.
            </p>
            <form onSubmit={signIn} className="mt-6 space-y-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email"
                required
                className="w-full rounded-lg ring-1 ring-ivory-300 bg-ivory px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
                required
                className="w-full rounded-lg ring-1 ring-ivory-300 bg-ivory px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
              />
              <button
                disabled={loading}
                className="cta-btn w-full inline-flex justify-center items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-3 text-[14px] font-semibold hover:bg-burgundy-light disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            {err && <div className="mt-3 text-red-700 text-[13px]">{err}</div>}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between border-b border-ivory-300 pb-4 flex-wrap gap-3">
              <div>
                <h1 className="font-serif-display text-burgundy text-[32px] md:text-[38px] font-semibold">
                  Dashboard
                </h1>
                <p className="text-ink/60 text-[13.5px]">
                  Supabase CMS · signed in as {role}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refresh}
                  className="inline-flex items-center gap-1.5 text-burgundy text-[13.5px] font-semibold rounded-full ring-1 ring-burgundy/30 px-3 py-1.5 hover:bg-burgundy/10"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
                <button
                  onClick={signOut}
                  className="inline-flex items-center gap-1.5 text-ink/70 text-[13.5px] font-semibold rounded-full ring-1 ring-ivory-300 px-3 py-1.5 hover:bg-ivory-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </div>

            {err && (
              <div className="mt-4 rounded-xl bg-red-50 text-red-800 px-4 py-3 text-[13px]">
                {err}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <TabPill
                icon={Images}
                label="Media Library"
                active={tab === "media"}
                onClick={() => setTab("media")}
              />
              <TabPill
                icon={PanelsTopLeft}
                label="Homepage"
                active={tab === "homepage"}
                onClick={() => setTab("homepage")}
              />
              <TabPill
                icon={PanelsTopLeft}
                label="About Page"
                active={tab === "aboutpage"}
                onClick={() => setTab("aboutpage")}
              />
              <TabPill
                icon={PanelsTopLeft}
                label="Our Work Page"
                active={tab === "ourworkpage"}
                onClick={() => setTab("ourworkpage")}
              />
              <TabPill
                icon={PanelsTopLeft}
                label="Events Page"
                active={tab === "eventspage"}
                onClick={() => setTab("eventspage")}
              />
              <TabPill
                icon={PanelsTopLeft}
                label="Research Page"
                active={tab === "researchpage"}
                onClick={() => setTab("researchpage")}
              />
              <TabPill
                icon={PanelsTopLeft}
                label="App Page"
                active={tab === "apppage"}
                onClick={() => setTab("apppage")}
              />
              <TabPill
                icon={PanelsTopLeft}
                label="Get Involved Page"
                active={tab === "getinvolvedpage"}
                onClick={() => setTab("getinvolvedpage")}
              />
              <TabPill
                icon={PanelsTopLeft}
                label="Contact Page"
                active={tab === "contactpage"}
                onClick={() => setTab("contactpage")}
              />
              <TabPill
                icon={PanelsTopLeft}
                label="Shop Page"
                active={tab === "shoppage"}
                onClick={() => setTab("shoppage")}
              />
              <TabPill
                icon={PanelsTopLeft}
                label="Support Page"
                active={tab === "supportpage"}
                onClick={() => setTab("supportpage")}
              />
              <TabPill
                icon={PanelsTopLeft}
                label="Volunteer Pages"
                active={tab === "volunteerpage"}
                onClick={() => setTab("volunteerpage")}
              />
              <TabPill
                icon={Calendar}
                label={`Events (${data.events.length})`}
                active={tab === "events"}
                onClick={() => setTab("events")}
              />
              <TabPill
                icon={Ticket}
                label={`Registrations (${data.registrations.length})`}
                active={tab === "registrations"}
                onClick={() => setTab("registrations")}
              />
              <TabPill
                icon={Users}
                label={`Volunteer Roles (${data.roles.length})`}
                active={tab === "vroles"}
                onClick={() => setTab("vroles")}
              />
              <TabPill
                icon={Users}
                label={`Applications (${data.applications.length})`}
                active={tab === "applications"}
                onClick={() => setTab("applications")}
              />
              <TabPill
                icon={BookOpen}
                label={`Articles (${data.articles.length})`}
                active={tab === "articles"}
                onClick={() => setTab("articles")}
              />
              <TabPill
                icon={UserSquare2}
                label={`Team (${data.founders.length})`}
                active={tab === "founders"}
                onClick={() => setTab("founders")}
              />
              <TabPill
                icon={Package}
                label={`Products (${data.products.length})`}
                active={tab === "products"}
                onClick={() => setTab("products")}
              />
              <TabPill
                icon={Mail}
                label={`Newsletter Issues (${data.newsletters.length})`}
                active={tab === "newsletters"}
                onClick={() => setTab("newsletters")}
              />
              <TabPill
                icon={Mail}
                label={`Subscribers (${data.subscribers.length})`}
                active={tab === "subscribers"}
                onClick={() => setTab("subscribers")}
              />
              <TabPill
                icon={Mail}
                label={`App Waitlist (${data.waitlist.length})`}
                active={tab === "waitlist"}
                onClick={() => setTab("waitlist")}
              />
              <TabPill
                icon={MessageSquare}
                label={`Messages (${data.messages.length})`}
                active={tab === "messages"}
                onClick={() => setTab("messages")}
              />
              <TabPill
                icon={Handshake}
                label={`Partners (${data.inquiries.length})`}
                active={tab === "inquiries"}
                onClick={() => setTab("inquiries")}
              />
            </div>

            <div className="mt-8">
              {tab === "media" && <MediaLibrary />}
              {tab === "homepage" && data.homePage && (
                <HomepageManager content={data.homePage} onChange={refresh} />
              )}
              {tab === "aboutpage" && data.aboutPage && (
                <AboutPageManager content={data.aboutPage} onChange={refresh} />
              )}
              {tab === "ourworkpage" && data.ourWorkPage && (
                <OurWorkPageManager content={data.ourWorkPage} onChange={refresh} />
              )}
              {tab === "eventspage" && data.eventsPage && (
                <EventsPageManager content={data.eventsPage} onChange={refresh} />
              )}
              {tab === "researchpage" && data.researchPage && (
                <ResearchPageManager content={data.researchPage} onChange={refresh} />
              )}
              {tab === "apppage" && data.appPage && (
                <AppPageManager content={data.appPage} onChange={refresh} />
              )}
              {tab === "getinvolvedpage" && data.getInvolvedPage && (
                <GetInvolvedPageManager content={data.getInvolvedPage} onChange={refresh} />
              )}
              {tab === "contactpage" && data.contactPage && (
                <ContactPageManager content={data.contactPage} onChange={refresh} />
              )}
              {tab === "shoppage" && data.shopPage && (
                <ShopPageManager content={data.shopPage} onChange={refresh} />
              )}
              {tab === "supportpage" && data.supportPage && (
                <SupportPageManager content={data.supportPage} onChange={refresh} />
              )}
              {tab === "volunteerpage" && data.volunteerPage && (
                <VolunteerPageManager content={data.volunteerPage} onChange={refresh} />
              )}
              {tab === "events" && (
                <EventsManager rows={data.events} onChange={refresh} />
              )}
              {tab === "registrations" && (
                <RegistrationsList rows={data.registrations} />
              )}
              {tab === "vroles" && (
                <VolunteerRolesManager rows={data.roles} onChange={refresh} />
              )}
              {tab === "applications" && (
                <ApplicationsList rows={data.applications} />
              )}
              {tab === "articles" && (
                <ArticlesManager rows={data.articles} onChange={refresh} />
              )}
              {tab === "founders" && (
                <FoundersManager rows={data.founders} onChange={refresh} />
              )}
              {tab === "products" && (
                <ProductsManager rows={data.products} onChange={refresh} />
              )}
              {tab === "newsletters" && (
                <NewsletterManager rows={data.newsletters} onChange={refresh} />
              )}
              {tab === "subscribers" && (
                <SubscribersTable rows={data.subscribers} />
              )}
              {tab === "waitlist" && <WaitlistTable rows={data.waitlist} />}
              {tab === "messages" && <MessagesList rows={data.messages} />}
              {tab === "inquiries" && <InquiriesList rows={data.inquiries} />}
            </div>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

const TabPill = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${active ? "bg-burgundy text-ivory" : "bg-ivory-100 ring-1 ring-ivory-300 text-ink hover:text-burgundy"}`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const SubscribersTable = ({ rows }) => (
  <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 overflow-hidden">
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] text-[12px] font-semibold text-ink/60 uppercase tracking-widest px-4 py-3 border-b border-ivory-300 bg-ivory-200/50">
      <div>Email</div>
      <div>Source</div>
      <div>Subscribed</div>
    </div>
    {rows.length === 0 ? (
      <div className="px-4 py-8 text-center text-ink/60 text-[13.5px]">
        No subscribers yet.
      </div>
    ) : (
      rows.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] px-4 py-3 border-b border-ivory-300 last:border-b-0 text-[13.5px] text-ink"
        >
          <div className="truncate">{r.email}</div>
          <div className="text-ink/70">{r.source || "—"}</div>
          <div className="text-ink/70">
            {new Date(r.subscribed_at).toLocaleString()}
          </div>
        </div>
      ))
    )}
  </div>
);

const WaitlistTable = ({ rows }) => (
  <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 overflow-hidden">
    <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)] text-[12px] font-semibold text-ink/60 uppercase tracking-widest px-4 py-3 border-b border-ivory-300 bg-ivory-200/50">
      <div>Email</div>
      <div>Status</div>
      <div>Joined</div>
    </div>
    {rows.length === 0 ? (
      <div className="px-4 py-8 text-center text-ink/60 text-[13.5px]">
        No app waitlist signups yet.
      </div>
    ) : (
      rows.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)] px-4 py-3 border-b border-ivory-300 last:border-b-0 text-[13.5px] text-ink"
        >
          <div className="truncate">{r.email}</div>
          <div className="text-ink/70">{r.status || "waiting"}</div>
          <div className="text-ink/70">
            {new Date(r.created_at).toLocaleString()}
          </div>
        </div>
      ))
    )}
  </div>
);

const MessagesList = ({ rows }) => (
  <div className="space-y-4">
    {rows.length === 0 && (
      <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60 text-[13.5px]">
        No messages yet.
      </div>
    )}
    {rows.map((m) => (
      <div
        key={m.id}
        className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[14.5px] font-semibold text-ink">
              {m.name}{" "}
              <span className="text-ink/50 font-normal">— {m.email}</span>
            </div>
            <div className="font-serif-display text-burgundy text-[17px] font-semibold mt-0.5">
              {m.subject}
            </div>
          </div>
          <div className="text-[12px] text-ink/60">
            {new Date(m.submitted_at).toLocaleString()}
          </div>
        </div>
        <p className="mt-3 text-ink/85 text-[14px] leading-relaxed whitespace-pre-wrap">
          {m.message}
        </p>
      </div>
    ))}
  </div>
);

const OrdersTable = ({ rows }) => (
  <div className="space-y-4">
    {rows.length === 0 && (
      <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60 text-[13.5px]">
        No orders yet.
      </div>
    )}
    {rows.map((o) => (
      <div
        key={o.id}
        className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[13px] text-ink/60">Order</div>
            <div className="font-serif-display text-burgundy text-[18px] font-semibold">
              #{o.id?.slice(0, 8).toUpperCase()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] text-ink/60">
              Total • {o.status || "pending"}
            </div>
            <div className="font-serif-display text-burgundy text-[20px] font-semibold">
              KES {(o.total || 0).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-[13.5px]">
          <div>
            <div className="text-ink/60">Customer</div>
            <div className="text-ink font-semibold">
              {o.customer?.name} — {o.customer?.email}
            </div>
            <div className="text-ink/70">{o.customer?.phone}</div>
            <div className="text-ink/70">
              {o.customer?.address}, {o.customer?.city}, {o.customer?.country}
            </div>
          </div>
          <div>
            <div className="text-ink/60">Items</div>
            <ul className="space-y-1 mt-1">
              {(o.items || []).map((it, i) => (
                <li key={i} className="text-ink/85 flex justify-between">
                  <span>
                    {it.name} × {it.qty}
                  </span>
                  <span>KES {(it.price * it.qty).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ---- Generic Manager helper ----
const useForm = (init) => {
  const [f, set] = useState(init);
  const on = (k) => (e) => set((s) => ({ ...s, [k]: e.target.value }));
  const reset = () => set(init);
  return [f, on, reset, set];
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">
      {label}
    </span>
    <div className="mt-1">{children}</div>
  </label>
);

const inputCls =
  "w-full rounded-lg ring-1 ring-ivory-300 bg-ivory px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40";

// ---- Homepage Manager ----
const HomepageManager = ({ content, onChange }) => {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  const updateHero = (patch) => setForm((current) => ({
    ...current,
    hero: { ...current.hero, ...patch },
  }));

  const updateMission = (patch) => setForm((current) => ({
    ...current,
    mission: { ...current.mission, ...patch },
  }));

  const updateWhatWeDo = (patch) => setForm((current) => ({
    ...current,
    whatWeDo: { ...current.whatWeDo, ...patch },
  }));

  const updateWhatItem = (index, patch) => setForm((current) => ({
    ...current,
    whatWeDo: {
      ...current.whatWeDo,
      items: current.whatWeDo.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    },
  }));

  const updateWhatLink = (index, patch) => setForm((current) => ({
    ...current,
    whatWeDo: {
      ...current.whatWeDo,
      items: current.whatWeDo.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, link: { ...item.link, ...patch } }
          : item
      ),
    },
  }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveHomepage(form);
      onChange();
      alert("Homepage content saved.");
    } catch (error) {
      alert(error?.message || "Homepage save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            Homepage Content
          </h3>
          <p className="mt-1 text-ink/60 text-[13px]">
            Changes become public immediately after saving. Existing built-in content remains the fallback.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy/10 inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View homepage
          </a>
          <button
            disabled={saving}
            className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save homepage"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Hero</h4>
        </div>
        <Field label="Eyebrow words (comma-separated)">
          <input
            required
            value={(form.hero.eyebrow || []).join(", ")}
            onChange={(event) => updateHero({
              eyebrow: event.target.value.split(",").map((value) => value.trim()).filter(Boolean),
            })}
            className={inputCls}
          />
        </Field>
        <Field label="Hero title (line breaks are preserved)">
          <textarea
            required
            rows={3}
            value={form.hero.title || ""}
            onChange={(event) => updateHero({ title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Hero introduction">
            <textarea
              required
              rows={3}
              value={form.hero.body || ""}
              onChange={(event) => updateHero({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Primary button label">
          <input
            required
            value={form.hero.primaryCta?.label || ""}
            onChange={(event) => updateHero({
              primaryCta: { ...form.hero.primaryCta, label: event.target.value },
            })}
            className={inputCls}
          />
        </Field>
        <Field label="Primary button link">
          <input
            required
            value={form.hero.primaryCta?.href || ""}
            onChange={(event) => updateHero({
              primaryCta: { ...form.hero.primaryCta, href: event.target.value },
            })}
            className={inputCls}
          />
        </Field>
        <Field label="Secondary button label">
          <input
            required
            value={form.hero.secondaryCta?.label || ""}
            onChange={(event) => updateHero({
              secondaryCta: { ...form.hero.secondaryCta, label: event.target.value },
            })}
            className={inputCls}
          />
        </Field>
        <Field label="Secondary button link">
          <input
            required
            value={form.hero.secondaryCta?.href || ""}
            onChange={(event) => updateHero({
              secondaryCta: { ...form.hero.secondaryCta, href: event.target.value },
            })}
            className={inputCls}
          />
        </Field>
        {(form.hero.bullets || []).map((bullet, index) => (
          <Field key={bullet.icon} label={`Highlight ${index + 1}`}>
            <input
              required
              value={bullet.label || ""}
              onChange={(event) => updateHero({
                bullets: form.hero.bullets.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, label: event.target.value } : item
                ),
              })}
              className={inputCls}
            />
          </Field>
        ))}
        <div className="md:col-span-2">
          <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">
            Hero image
          </span>
          <div className="mt-1">
            <MediaPicker
              value={form.hero.image ? {
                id: form.hero.imageMediaId,
                public_url: form.hero.image,
                alt_text: form.hero.imageAlt,
                title: "Homepage hero",
              } : null}
              onChange={(asset) => updateHero({
                image: asset.public_url,
                imageAlt: asset.alt_text || "",
                imageMediaId: asset.id,
              })}
              buttonLabel={form.hero.image ? "Replace hero image" : "Choose hero image"}
            />
          </div>
          {form.hero.image && !form.hero.imageMediaId && (
            <p className="mt-2 text-amber-800 text-[12px]">
              The homepage still uses its built-in image. Choose a library image to make it CMS-managed and deletion-protected.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <Field label="Hero image alt text">
            <input
              required={!!form.hero.image}
              value={form.hero.imageAlt || ""}
              onChange={(event) => updateHero({ imageAlt: event.target.value })}
              className={inputCls}
              placeholder="Describe what is visible in the image"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 gap-3">
        <div>
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Mission band</h4>
          <p className="mt-1 text-ink/55 text-[11.5px]">Wrap words in underscores to display them in italics, for example _art_.</p>
        </div>
        <Field label="Mission headline">
          <textarea
            required
            rows={2}
            value={form.mission.headlineMarkup || ""}
            onChange={(event) => updateMission({ headlineMarkup: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Mission supporting text">
          <textarea
            required
            rows={2}
            value={form.mission.subhead || ""}
            onChange={(event) => updateMission({ subhead: event.target.value })}
            className={inputCls}
          />
        </Field>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <div>
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">What We Do</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Section eyebrow">
            <input
              required
              value={form.whatWeDo.eyebrow || ""}
              onChange={(event) => updateWhatWeDo({ eyebrow: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Section title">
            <input
              required
              value={form.whatWeDo.title || ""}
              onChange={(event) => updateWhatWeDo({ title: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {(form.whatWeDo.items || []).map((item, index) => (
            <div key={item.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <div className="text-[11px] tracking-widest uppercase text-burgundy font-semibold">Card {index + 1}</div>
              <Field label="Title">
                <input
                  required
                  value={item.title || ""}
                  onChange={(event) => updateWhatItem(index, { title: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <textarea
                  required
                  rows={5}
                  value={item.body || ""}
                  onChange={(event) => updateWhatItem(index, { body: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Link label">
                <input
                  required
                  value={item.link?.label || ""}
                  onChange={(event) => updateWhatLink(index, { label: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Link destination">
                <input
                  required
                  value={item.link?.href || ""}
                  onChange={(event) => updateWhatLink(index, { href: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          disabled={saving}
          className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save homepage"}
        </button>
      </div>
    </form>
  );
};

// ---- About Page Manager ----
const AboutPageManager = ({ content, onChange }) => {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  const updatePillar = (index, patch) => setForm((current) => ({
    ...current,
    pillars: current.pillars.map((pillar, pillarIndex) =>
      pillarIndex === index ? { ...pillar, ...patch } : pillar
    ),
  }));

  const updateFounders = (patch) => setForm((current) => ({
    ...current,
    founders: { ...current.founders, ...patch },
  }));

  const updateStat = (index, patch) => setForm((current) => ({
    ...current,
    stats: {
      ...current.stats,
      items: current.stats.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    },
  }));

  const updateCta = (patch) => setForm((current) => ({
    ...current,
    cta: { ...current.cta, ...patch },
  }));

  const updateCtaButton = (patch) => setForm((current) => ({
    ...current,
    cta: {
      ...current.cta,
      button: { ...current.cta.button, ...patch },
    },
  }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveAboutPage(form);
      onChange();
      alert("About page content saved.");
    } catch (error) {
      alert(error?.message || "About page save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            About Page Content
          </h3>
          <p className="mt-1 text-ink/60 text-[13px]">
            Team member profiles remain managed from the Team tab. These changes become public immediately.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy/10 inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View About page
          </a>
          <button
            disabled={saving}
            className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save About page"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Hero</h4>
        </div>
        <Field label="Eyebrow">
          <input
            required
            value={form.eyebrow || ""}
            onChange={(event) => setForm({ ...form, eyebrow: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Title (line breaks are preserved)">
          <textarea
            required
            rows={3}
            value={form.title || ""}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Introduction">
            <textarea
              required
              rows={3}
              value={form.body || ""}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">
            Hero image
          </span>
          <div className="mt-1">
            <MediaPicker
              value={form.image ? {
                id: form.imageMediaId,
                public_url: form.image,
                alt_text: form.imageAlt,
                title: "About page hero",
              } : null}
              onChange={(asset) => setForm({
                ...form,
                image: asset.public_url,
                imageAlt: asset.alt_text || "",
                imageMediaId: asset.id,
              })}
              buttonLabel={form.image ? "Replace hero image" : "Choose hero image"}
            />
          </div>
          {form.image && !form.imageMediaId && (
            <p className="mt-2 text-amber-800 text-[12px]">
              This page still uses its legacy image URL. Choose a library image to make it deletion-protected.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <Field label="Hero image alt text">
            <input
              required={!!form.image}
              value={form.imageAlt || ""}
              onChange={(event) => setForm({ ...form, imageAlt: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">
          Mission, vision and values
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {form.pillars.map((pillar, index) => (
            <div key={pillar.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <Field label="Title">
                <input
                  required
                  value={pillar.title || ""}
                  onChange={(event) => updatePillar(index, { title: event.target.value })}
                  className={inputCls}
                />
              </Field>
              {pillar.list ? (
                <Field label="Values (one per line)">
                  <textarea
                    required
                    rows={6}
                    value={pillar.list.join("\n")}
                    onChange={(event) => updatePillar(index, {
                      list: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean),
                    })}
                    className={inputCls}
                  />
                </Field>
              ) : (
                <Field label="Description">
                  <textarea
                    required
                    rows={6}
                    value={pillar.body || ""}
                    onChange={(event) => updatePillar(index, { body: event.target.value })}
                    className={inputCls}
                  />
                </Field>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Team section heading</h4>
          <p className="mt-1 text-ink/55 text-[11.5px]">Edit individual people from the separate Team tab.</p>
        </div>
        <Field label="Eyebrow">
          <input
            required
            value={form.founders.eyebrow || ""}
            onChange={(event) => updateFounders({ eyebrow: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Title">
          <input
            required
            value={form.founders.title || ""}
            onChange={(event) => updateFounders({ title: event.target.value })}
            className={inputCls}
          />
        </Field>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Impact band</h4>
        <Field label="Band title (line breaks are preserved)">
          <textarea
            required
            rows={2}
            value={form.stats.title || ""}
            onChange={(event) => setForm({
              ...form,
              stats: { ...form.stats, title: event.target.value },
            })}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {form.stats.items.map((item, index) => (
            <div key={item.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <Field label="Value">
                <input
                  required
                  value={item.value || ""}
                  onChange={(event) => updateStat(index, { value: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Label (line breaks are preserved)">
                <textarea
                  required
                  rows={2}
                  value={item.label || ""}
                  onChange={(event) => updateStat(index, { label: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Closing call to action</h4>
        </div>
        <Field label="Title">
          <input
            required
            value={form.cta.title || ""}
            onChange={(event) => updateCta({ title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Button label">
          <input
            required
            value={form.cta.button?.label || ""}
            onChange={(event) => updateCtaButton({ label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Supporting text">
            <textarea
              required
              rows={2}
              value={form.cta.body || ""}
              onChange={(event) => updateCta({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Button destination">
            <input
              required
              value={form.cta.button?.href || ""}
              onChange={(event) => updateCtaButton({ href: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          disabled={saving}
          className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save About page"}
        </button>
      </div>
    </form>
  );
};

// ---- Our Work Page Manager ----
const OurWorkPageManager = ({ content, onChange }) => {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  const updateHeroCta = (patch) => setForm((current) => ({
    ...current,
    cta: { ...current.cta, ...patch },
  }));

  const updateProgram = (index, patch) => setForm((current) => ({
    ...current,
    programs: current.programs.map((program, programIndex) =>
      programIndex === index ? { ...program, ...patch } : program
    ),
  }));

  const updateProgramLink = (index, patch) => setForm((current) => ({
    ...current,
    programs: current.programs.map((program, programIndex) =>
      programIndex === index
        ? { ...program, link: { ...program.link, ...patch } }
        : program
    ),
  }));

  const updateStat = (index, patch) => setForm((current) => ({
    ...current,
    stats: {
      ...current.stats,
      items: current.stats.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    },
  }));

  const updatePartnerCta = (patch) => setForm((current) => ({
    ...current,
    partnerCta: { ...current.partnerCta, ...patch },
  }));

  const updatePartnerButton = (patch) => setForm((current) => ({
    ...current,
    partnerCta: {
      ...current.partnerCta,
      button: { ...current.partnerCta.button, ...patch },
    },
  }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveOurWorkPage(form);
      onChange();
      alert("Our Work page content saved.");
    } catch (error) {
      alert(error?.message || "Our Work page save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            Our Work Page Content
          </h3>
          <p className="mt-1 text-ink/60 text-[13px]">
            Edit programme descriptions and impact messaging. Event records remain managed from Events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/our-work"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy/10 inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Our Work
          </a>
          <button
            disabled={saving}
            className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Our Work page"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Hero</h4>
        </div>
        <Field label="Eyebrow">
          <input
            required
            value={form.eyebrow || ""}
            onChange={(event) => setForm({ ...form, eyebrow: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Title (line breaks are preserved)">
          <textarea
            required
            rows={4}
            value={form.title || ""}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Introduction">
            <textarea
              required
              rows={3}
              value={form.body || ""}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Hero button label">
          <input
            required
            value={form.cta?.label || ""}
            onChange={(event) => updateHeroCta({ label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Hero button destination">
          <input
            required
            value={form.cta?.href || ""}
            onChange={(event) => updateHeroCta({ href: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">Hero image</span>
          <div className="mt-1">
            <MediaPicker
              value={form.image ? {
                id: form.imageMediaId,
                public_url: form.image,
                alt_text: form.imageAlt,
                title: "Our Work hero",
              } : null}
              onChange={(asset) => setForm({
                ...form,
                image: asset.public_url,
                imageAlt: asset.alt_text || "",
                imageMediaId: asset.id,
              })}
              buttonLabel={form.image ? "Replace hero image" : "Choose hero image"}
            />
          </div>
          {form.image && !form.imageMediaId && (
            <p className="mt-2 text-amber-800 text-[12px]">
              This page still uses a legacy hero URL. Choose a library image to make it deletion-protected.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <Field label="Hero image alt text">
            <input
              required={!!form.image}
              value={form.imageAlt || ""}
              onChange={(event) => setForm({ ...form, imageAlt: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Programme section eyebrow">
            <input
              required
              value={form.programsEyebrow || ""}
              onChange={(event) => setForm({ ...form, programsEyebrow: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Programme section title">
            <input
              required
              value={form.programsTitle || ""}
              onChange={(event) => setForm({ ...form, programsTitle: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {form.programs.map((program, index) => (
            <div key={program.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <div className="text-[11px] tracking-widest uppercase text-burgundy font-semibold">Programme {index + 1}</div>
              <Field label="Title (line breaks are preserved)">
                <textarea
                  required
                  rows={2}
                  value={program.title || ""}
                  onChange={(event) => updateProgram(index, { title: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <textarea
                  required
                  rows={5}
                  value={program.body || ""}
                  onChange={(event) => updateProgram(index, { body: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Link label">
                <input
                  required
                  value={program.link?.label || ""}
                  onChange={(event) => updateProgramLink(index, { label: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Link destination">
                <input
                  required
                  value={program.link?.href || ""}
                  onChange={(event) => updateProgramLink(index, { href: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <div>
                <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">Programme image</span>
                <div className="mt-1">
                  <MediaPicker
                    value={program.img ? {
                      id: program.imageMediaId,
                      public_url: program.img,
                      alt_text: program.imgAlt,
                      title: program.title,
                    } : null}
                    onChange={(asset) => updateProgram(index, {
                      img: asset.public_url,
                      imgAlt: asset.alt_text || "",
                      imageMediaId: asset.id,
                    })}
                    buttonLabel={program.img ? "Replace image" : "Choose image"}
                  />
                </div>
                {program.img && !program.imageMediaId && (
                  <p className="mt-2 text-amber-800 text-[11.5px]">
                    Legacy image—choose a library image for deletion protection.
                  </p>
                )}
              </div>
              <Field label="Image alt text">
                <input
                  required={!!program.img}
                  value={program.imgAlt || ""}
                  onChange={(event) => updateProgram(index, { imgAlt: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Impact band</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Title (line breaks are preserved)">
            <textarea
              required
              rows={2}
              value={form.stats.title || ""}
              onChange={(event) => setForm({ ...form, stats: { ...form.stats, title: event.target.value } })}
              className={inputCls}
            />
          </Field>
          <Field label="Supporting text">
            <textarea
              required
              rows={2}
              value={form.stats.body || ""}
              onChange={(event) => setForm({ ...form, stats: { ...form.stats, body: event.target.value } })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {form.stats.items.map((item, index) => (
            <div key={item.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <Field label="Value">
                <input
                  required
                  value={item.value || ""}
                  onChange={(event) => updateStat(index, { value: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Label (line breaks are preserved)">
                <textarea
                  required
                  rows={2}
                  value={item.label || ""}
                  onChange={(event) => updateStat(index, { label: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
        <Field label="Footnote">
          <input
            value={form.stats.footnote || ""}
            onChange={(event) => setForm({ ...form, stats: { ...form.stats, footnote: event.target.value } })}
            className={inputCls}
          />
        </Field>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Partner call to action</h4>
        </div>
        <div className="md:col-span-2">
          <Field label="Message">
            <textarea
              required
              rows={2}
              value={form.partnerCta.body || ""}
              onChange={(event) => updatePartnerCta({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Button label">
          <input
            required
            value={form.partnerCta.button?.label || ""}
            onChange={(event) => updatePartnerButton({ label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Button destination">
          <input
            required
            value={form.partnerCta.button?.href || ""}
            onChange={(event) => updatePartnerButton({ href: event.target.value })}
            className={inputCls}
          />
        </Field>
      </section>

      <div className="flex justify-end">
        <button
          disabled={saving}
          className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Our Work page"}
        </button>
      </div>
    </form>
  );
};

// ---- Events Landing Page Manager ----
const EventsPageManager = ({ content, onChange }) => {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  const updateHeroCta = (key, patch) => setForm((current) => ({
    ...current,
    [key]: { ...current[key], ...patch },
  }));

  const updateTestimonial = (index, patch) => setForm((current) => ({
    ...current,
    testimonials: current.testimonials.map((testimonial, testimonialIndex) =>
      testimonialIndex === index ? { ...testimonial, ...patch } : testimonial
    ),
  }));

  const updateIdeaCta = (patch) => setForm((current) => ({
    ...current,
    ideaCta: { ...current.ideaCta, ...patch },
  }));

  const updateIdeaButton = (patch) => setForm((current) => ({
    ...current,
    ideaCta: {
      ...current.ideaCta,
      button: { ...current.ideaCta.button, ...patch },
    },
  }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveEventsPage(form);
      onChange();
      alert("Events landing page content saved.");
    } catch (error) {
      alert(error?.message || "Events page save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            Events Landing Page Content
          </h3>
          <p className="mt-1 text-ink/60 text-[13px]">
            Event dates, posters and registrations remain managed from the Events tab.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/events"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy/10 inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Events page
          </a>
          <button
            disabled={saving}
            className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Events page"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Hero</h4>
        </div>
        <Field label="Eyebrow">
          <input
            required
            value={form.eyebrow || ""}
            onChange={(event) => setForm({ ...form, eyebrow: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Title (line breaks are preserved)">
          <textarea
            required
            rows={3}
            value={form.title || ""}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Introduction">
            <textarea
              required
              rows={3}
              value={form.body || ""}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Upcoming button label">
          <input
            required
            value={form.primaryCta?.label || ""}
            onChange={(event) => updateHeroCta("primaryCta", { label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Upcoming button destination">
          <input
            required
            value={form.primaryCta?.href || ""}
            onChange={(event) => updateHeroCta("primaryCta", { href: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Past events button label">
          <input
            required
            value={form.secondaryCta?.label || ""}
            onChange={(event) => updateHeroCta("secondaryCta", { label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div />
        <div className="md:col-span-2">
          <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">Hero image</span>
          <div className="mt-1">
            <MediaPicker
              value={form.image ? {
                id: form.imageMediaId,
                public_url: form.image,
                alt_text: form.imageAlt,
                title: "Events page hero",
              } : null}
              onChange={(asset) => setForm({
                ...form,
                image: asset.public_url,
                imageAlt: asset.alt_text || "",
                imageMediaId: asset.id,
              })}
              buttonLabel={form.image ? "Replace hero image" : "Choose hero image"}
            />
          </div>
          {form.image && !form.imageMediaId && (
            <p className="mt-2 text-amber-800 text-[12px]">
              This page still uses its built-in image. Choose a library image to make it deletion-protected.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <Field label="Hero image alt text">
            <input
              required={!!form.image}
              value={form.imageAlt || ""}
              onChange={(event) => setForm({ ...form, imageAlt: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <div>
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Testimonials</h4>
          <p className="mt-1 text-ink/55 text-[11.5px]">These appear under the Testimonials tab on the public Events page.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {form.testimonials.map((testimonial, index) => (
            <div key={index} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <Field label="Quote">
                <textarea
                  required
                  rows={5}
                  value={testimonial.quote || ""}
                  onChange={(event) => updateTestimonial(index, { quote: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Attribution">
                <input
                  required
                  value={testimonial.author || ""}
                  onChange={(event) => updateTestimonial(index, { author: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Event idea call to action</h4>
        </div>
        <Field label="Title">
          <input
            required
            value={form.ideaCta.title || ""}
            onChange={(event) => updateIdeaCta({ title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Button label">
          <input
            required
            value={form.ideaCta.button?.label || ""}
            onChange={(event) => updateIdeaButton({ label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Supporting text">
            <textarea
              required
              rows={2}
              value={form.ideaCta.body || ""}
              onChange={(event) => updateIdeaCta({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Button destination">
            <input
              required
              value={form.ideaCta.button?.href || ""}
              onChange={(event) => updateIdeaButton({ href: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          disabled={saving}
          className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Events page"}
        </button>
      </div>
    </form>
  );
};

// ---- Research Landing Page Manager ----
const ResearchPageManager = ({ content, onChange }) => {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  const updateHeroCta = (patch) => setForm((current) => ({
    ...current,
    cta: { ...current.cta, ...patch },
  }));

  const updateTopic = (index, patch) => setForm((current) => ({
    ...current,
    topics: current.topics.map((topic, topicIndex) =>
      topicIndex === index ? { ...topic, ...patch } : topic
    ),
  }));

  const updateBand = (patch) => setForm((current) => ({
    ...current,
    band: { ...current.band, ...patch },
  }));

  const updateIntegrity = (patch) => setForm((current) => ({
    ...current,
    band: {
      ...current.band,
      integrity: { ...current.band.integrity, ...patch },
    },
  }));

  const updateIntegrityLink = (patch) => setForm((current) => ({
    ...current,
    band: {
      ...current.band,
      integrity: {
        ...current.band.integrity,
        link: { ...current.band.integrity.link, ...patch },
      },
    },
  }));

  const updateNewsletter = (patch) => setForm((current) => ({
    ...current,
    newsletter: { ...current.newsletter, ...patch },
  }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveResearchPage(form);
      onChange();
      alert("Research landing page content saved.");
    } catch (error) {
      alert(error?.message || "Research page save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            Research Landing Page Content
          </h3>
          <p className="mt-1 text-ink/60 text-[13px]">
            Individual research articles remain managed from the Articles tab.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/research"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy/10 inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Research page
          </a>
          <button
            disabled={saving}
            className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Research page"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Hero</h4>
        </div>
        <Field label="Eyebrow">
          <input
            required
            value={form.eyebrow || ""}
            onChange={(event) => setForm({ ...form, eyebrow: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Title (line breaks are preserved)">
          <textarea
            required
            rows={3}
            value={form.title || ""}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Introduction">
            <textarea
              required
              rows={3}
              value={form.body || ""}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Hero button label">
          <input
            required
            value={form.cta?.label || ""}
            onChange={(event) => updateHeroCta({ label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Hero button destination">
          <input
            required
            value={form.cta?.href || ""}
            onChange={(event) => updateHeroCta({ href: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">Hero image</span>
          <div className="mt-1">
            <MediaPicker
              value={form.image ? {
                id: form.imageMediaId,
                public_url: form.image,
                alt_text: form.imageAlt,
                title: "Research page hero",
              } : null}
              onChange={(asset) => setForm({
                ...form,
                image: asset.public_url,
                imageAlt: asset.alt_text || "",
                imageMediaId: asset.id,
              })}
              buttonLabel={form.image ? "Replace hero image" : "Choose hero image"}
            />
          </div>
          {form.image && !form.imageMediaId && (
            <p className="mt-2 text-amber-800 text-[12px]">
              This page still uses a legacy hero URL. Choose a library image to make it deletion-protected.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <Field label="Hero image alt text">
            <input
              required={!!form.image}
              value={form.imageAlt || ""}
              onChange={(event) => setForm({ ...form, imageAlt: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <Field label="Topics section title">
          <input
            required
            value={form.topicsTitle || ""}
            onChange={(event) => setForm({ ...form, topicsTitle: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {form.topics.map((topic, index) => (
            <div key={topic.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <Field label="Topic title">
                <textarea
                  required
                  rows={2}
                  value={topic.title || ""}
                  onChange={(event) => updateTopic(index, { title: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <textarea
                  required
                  rows={6}
                  value={topic.body || ""}
                  onChange={(event) => updateTopic(index, { body: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-3">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Insights library heading</h4>
        </div>
        <Field label="Eyebrow">
          <input
            required
            value={form.libraryEyebrow || ""}
            onChange={(event) => setForm({ ...form, libraryEyebrow: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Title">
          <input
            required
            value={form.libraryTitle || ""}
            onChange={(event) => setForm({ ...form, libraryTitle: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Search placeholder">
          <input
            required
            value={form.searchPlaceholder || ""}
            onChange={(event) => setForm({ ...form, searchPlaceholder: event.target.value })}
            className={inputCls}
          />
        </Field>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Evidence band</h4>
        </div>
        <Field label="Quote">
          <textarea
            required
            rows={3}
            value={form.band.quote || ""}
            onChange={(event) => updateBand({ quote: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Quote attribution">
          <input
            required
            value={form.band.author || ""}
            onChange={(event) => updateBand({ author: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Integrity title">
          <input
            required
            value={form.band.integrity.title || ""}
            onChange={(event) => updateIntegrity({ title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Integrity link label">
          <input
            required
            value={form.band.integrity.link?.label || ""}
            onChange={(event) => updateIntegrityLink({ label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Integrity statement">
            <textarea
              required
              rows={3}
              value={form.band.integrity.body || ""}
              onChange={(event) => updateIntegrity({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Integrity link destination">
            <input
              required
              value={form.band.integrity.link?.href || ""}
              onChange={(event) => updateIntegrityLink({ href: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Research newsletter prompt</h4>
        </div>
        <Field label="Title">
          <input
            required
            value={form.newsletter.title || ""}
            onChange={(event) => updateNewsletter({ title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Button label">
          <input
            required
            value={form.newsletter.button || ""}
            onChange={(event) => updateNewsletter({ button: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Supporting text">
            <textarea
              required
              rows={2}
              value={form.newsletter.body || ""}
              onChange={(event) => updateNewsletter({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Email placeholder">
            <input
              required
              value={form.newsletter.placeholder || ""}
              onChange={(event) => updateNewsletter({ placeholder: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          disabled={saving}
          className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Research page"}
        </button>
      </div>
    </form>
  );
};

// ---- App Landing Page Manager ----
const AppPageManager = ({ content, onChange }) => {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  const updateCta = (key, patch) => setForm((current) => ({
    ...current,
    [key]: { ...current[key], ...patch },
  }));

  const updateListItem = (key, index, patch) => setForm((current) => ({
    ...current,
    [key]: current[key].map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item
    ),
  }));

  const updateJourney = (patch) => setForm((current) => ({
    ...current,
    journey: { ...current.journey, ...patch },
  }));

  const updateWaitlist = (patch) => setForm((current) => ({
    ...current,
    waitlist: { ...current.waitlist, ...patch },
  }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveAppPage(form);
      onChange();
      alert("App landing page content saved.");
    } catch (error) {
      alert(error?.message || "App page save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            ArtNovaX App Landing Page Content
          </h3>
          <p className="mt-1 text-ink/60 text-[13px]">
            Waitlist submissions remain available from the App Waitlist tab. Icons and the tablet preview stay design-controlled.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/app"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy/10 inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View App page
          </a>
          <button
            disabled={saving}
            className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save App page"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Hero</h4>
        </div>
        <Field label="Eyebrow">
          <input
            required
            value={form.eyebrow || ""}
            onChange={(event) => setForm({ ...form, eyebrow: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Development status badge">
          <input
            required
            value={form.statusLabel || ""}
            onChange={(event) => setForm({ ...form, statusLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Title (line breaks are preserved)">
          <textarea
            required
            rows={3}
            value={form.title || ""}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Introduction">
          <textarea
            required
            rows={4}
            value={form.body || ""}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Primary button label">
          <input
            required
            value={form.primaryCta?.label || ""}
            onChange={(event) => updateCta("primaryCta", { label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Primary button destination">
          <input
            required
            value={form.primaryCta?.href || ""}
            onChange={(event) => updateCta("primaryCta", { href: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Secondary button label">
          <input
            required
            value={form.secondaryCta?.label || ""}
            onChange={(event) => updateCta("secondaryCta", { label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Secondary button destination">
          <input
            required
            value={form.secondaryCta?.href || ""}
            onChange={(event) => updateCta("secondaryCta", { href: event.target.value })}
            className={inputCls}
          />
        </Field>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <div>
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Hero trust points</h4>
          <p className="mt-1 text-ink/60 text-[12px]">The four existing icons remain fixed.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {form.bullets.map((bullet, index) => (
            <div key={bullet.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <Field label="Title">
                <input
                  required
                  value={bullet.title || ""}
                  onChange={(event) => updateListItem("bullets", index, { title: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Supporting text">
                <input
                  required
                  value={bullet.sub || ""}
                  onChange={(event) => updateListItem("bullets", index, { sub: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <Field label="Features section title">
          <input
            required
            value={form.featuresTitle || ""}
            onChange={(event) => setForm({ ...form, featuresTitle: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {form.features.map((feature, index) => (
            <div key={feature.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <Field label="Feature title">
                <input
                  required
                  value={feature.title || ""}
                  onChange={(event) => updateListItem("features", index, { title: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <textarea
                  required
                  rows={3}
                  value={feature.body || ""}
                  onChange={(event) => updateListItem("features", index, { body: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <Field label="How it works section title">
          <input
            required
            value={form.howTitle || ""}
            onChange={(event) => setForm({ ...form, howTitle: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {form.steps.map((step, index) => (
            <div key={step.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <Field label="Step title">
                <input
                  required
                  value={step.title || ""}
                  onChange={(event) => updateListItem("steps", index, { title: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <textarea
                  required
                  rows={4}
                  value={step.body || ""}
                  onChange={(event) => updateListItem("steps", index, { body: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Journey panel title">
            <input
              required
              value={form.journey.title || ""}
              onChange={(event) => updateJourney({ title: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Journey panel text">
            <textarea
              required
              rows={3}
              value={form.journey.body || ""}
              onChange={(event) => updateJourney({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Waitlist prompt</h4>
        </div>
        <Field label="Title">
          <input
            required
            value={form.waitlist.title || ""}
            onChange={(event) => updateWaitlist({ title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Button label">
          <input
            required
            value={form.waitlist.button || ""}
            onChange={(event) => updateWaitlist({ button: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Supporting text">
            <textarea
              required
              rows={2}
              value={form.waitlist.body || ""}
              onChange={(event) => updateWaitlist({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Email placeholder">
            <input
              required
              value={form.waitlist.placeholder || ""}
              onChange={(event) => updateWaitlist({ placeholder: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          disabled={saving}
          className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save App page"}
        </button>
      </div>
    </form>
  );
};

// ---- Get Involved Landing Page Manager ----
const GetInvolvedPageManager = ({ content, onChange }) => {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  const updateWay = (index, patch) => setForm((current) => ({
    ...current,
    ways: current.ways.map((way, wayIndex) =>
      wayIndex === index ? { ...way, ...patch } : way
    ),
  }));

  const updateWayLink = (index, patch) => setForm((current) => ({
    ...current,
    ways: current.ways.map((way, wayIndex) =>
      wayIndex === index
        ? { ...way, link: { ...way.link, ...patch } }
        : way
    ),
  }));

  const updateStronger = (patch) => setForm((current) => ({
    ...current,
    stronger: { ...current.stronger, ...patch },
  }));

  const updateStrongerCta = (patch) => setForm((current) => ({
    ...current,
    stronger: {
      ...current.stronger,
      cta: { ...current.stronger.cta, ...patch },
    },
  }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveGetInvolvedPage(form);
      onChange();
      alert("Get Involved page content saved.");
    } catch (error) {
      alert(error?.message || "Get Involved page save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            Get Involved Overview Content
          </h3>
          <p className="mt-1 text-ink/60 text-[13px]">
            Volunteer roles, applications, partner enquiries, and products remain managed from their dedicated tabs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/get-involved"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy/10 inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Get Involved page
          </a>
          <button
            disabled={saving}
            className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Get Involved page"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Hero</h4>
        </div>
        <Field label="Eyebrow">
          <input
            required
            value={form.eyebrow || ""}
            onChange={(event) => setForm({ ...form, eyebrow: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Title (line breaks are preserved)">
          <textarea
            required
            rows={3}
            value={form.title || ""}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Introduction">
          <textarea
            required
            rows={4}
            value={form.body || ""}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Hero tagline (line breaks are preserved)">
          <textarea
            required
            rows={3}
            value={form.tagline || ""}
            onChange={(event) => setForm({ ...form, tagline: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">Hero image</span>
          <div className="mt-1">
            <MediaPicker
              value={form.image ? {
                id: form.imageMediaId,
                public_url: form.image,
                alt_text: form.imageAlt,
                title: "Get Involved page hero",
              } : null}
              onChange={(asset) => setForm({
                ...form,
                image: asset.public_url,
                imageAlt: asset.alt_text || "",
                imageMediaId: asset.id,
              })}
              buttonLabel={form.image ? "Replace hero image" : "Choose hero image"}
            />
          </div>
          {form.image && !form.imageMediaId && (
            <p className="mt-2 text-amber-800 text-[12px]">
              This page still uses a legacy hero URL. Choose a library image to make it deletion-protected.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <Field label="Hero image alt text">
            <input
              required={!!form.image}
              value={form.imageAlt || ""}
              onChange={(event) => setForm({ ...form, imageAlt: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <div>
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Ways to get involved</h4>
          <p className="mt-1 text-ink/60 text-[12px]">The five existing card icons remain fixed.</p>
        </div>
        <Field label="Section title">
          <input
            required
            value={form.waysTitle || ""}
            onChange={(event) => setForm({ ...form, waysTitle: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {form.ways.map((way, index) => (
            <div key={way.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <Field label="Card title">
                <input
                  required
                  value={way.title || ""}
                  onChange={(event) => updateWay(index, { title: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <textarea
                  required
                  rows={5}
                  value={way.body || ""}
                  onChange={(event) => updateWay(index, { body: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Link label">
                <input
                  required
                  value={way.link?.label || ""}
                  onChange={(event) => updateWayLink(index, { label: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Link destination">
                <input
                  required
                  value={way.link?.href || ""}
                  onChange={(event) => updateWayLink(index, { href: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Stronger together call to action</h4>
          <p className="mt-1 text-ink/60 text-[12px]">The community illustration remains design-controlled.</p>
        </div>
        <Field label="Title">
          <input
            required
            value={form.stronger.title || ""}
            onChange={(event) => updateStronger({ title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Button label">
          <input
            required
            value={form.stronger.cta?.label || ""}
            onChange={(event) => updateStrongerCta({ label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Supporting text">
            <textarea
              required
              rows={3}
              value={form.stronger.body || ""}
              onChange={(event) => updateStronger({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Button destination">
            <input
              required
              value={form.stronger.cta?.href || ""}
              onChange={(event) => updateStrongerCta({ href: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          disabled={saving}
          className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Get Involved page"}
        </button>
      </div>
    </form>
  );
};

// ---- Contact Page Manager ----
const ContactPageManager = ({ content, onChange }) => {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  const updateListItem = (key, index, patch) => setForm((current) => ({
    ...current,
    [key]: current[key].map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item
    ),
  }));

  const updateSidebarDetail = (index, patch) => setForm((current) => ({
    ...current,
    sidebar: {
      ...current.sidebar,
      details: current.sidebar.details.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    },
  }));

  const updateSidebar = (patch) => setForm((current) => ({
    ...current,
    sidebar: { ...current.sidebar, ...patch },
  }));

  const updateSidebarQuote = (patch) => setForm((current) => ({
    ...current,
    sidebar: {
      ...current.sidebar,
      quote: { ...current.sidebar.quote, ...patch },
    },
  }));

  const updateNewsletter = (patch) => setForm((current) => ({
    ...current,
    newsletter: { ...current.newsletter, ...patch },
  }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveContactPage(form);
      onChange();
      alert("Contact page content saved.");
    } catch (error) {
      alert(error?.message || "Contact page save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            Contact Page Content
          </h3>
          <p className="mt-1 text-ink/60 text-[13px]">
            Submitted contact messages remain available from the Messages tab. Form field names and types stay system-controlled.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy/10 inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Contact page
          </a>
          <button
            disabled={saving}
            className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Contact page"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Hero</h4>
        </div>
        <Field label="Eyebrow">
          <input
            required
            value={form.eyebrow || ""}
            onChange={(event) => setForm({ ...form, eyebrow: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Title (line breaks are preserved)">
          <textarea
            required
            rows={3}
            value={form.title || ""}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Introduction">
            <textarea
              required
              rows={3}
              value={form.body || ""}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">Hero image</span>
          <div className="mt-1">
            <MediaPicker
              value={form.image ? {
                id: form.imageMediaId,
                public_url: form.image,
                alt_text: form.imageAlt,
                title: "Contact page hero",
              } : null}
              onChange={(asset) => setForm({
                ...form,
                image: asset.public_url,
                imageAlt: asset.alt_text || "",
                imageMediaId: asset.id,
              })}
              buttonLabel={form.image ? "Replace hero image" : "Choose hero image"}
            />
          </div>
          {form.image && !form.imageMediaId && (
            <p className="mt-2 text-amber-800 text-[12px]">
              This page still uses a legacy hero URL. Choose a library image to make it deletion-protected.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <Field label="Hero image alt text">
            <input
              required={!!form.image}
              value={form.imageAlt || ""}
              onChange={(event) => setForm({ ...form, imageAlt: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <div>
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Hero contact details</h4>
          <p className="mt-1 text-ink/60 text-[12px]">The email, phone, and location icons remain fixed.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {form.quickInfo.map((item, index) => (
            <div key={item.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <Field label="Label">
                <input
                  required
                  value={item.label || ""}
                  onChange={(event) => updateListItem("quickInfo", index, { label: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Value">
                <input
                  required
                  value={item.value || ""}
                  onChange={(event) => updateListItem("quickInfo", index, { value: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Contact form title">
            <input
              required
              value={form.formTitle || ""}
              onChange={(event) => setForm({ ...form, formTitle: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Submit button label">
            <input
              required
              value={form.sendButton || ""}
              onChange={(event) => setForm({ ...form, sendButton: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {form.form.map((field, index) => (
            <div key={field.name} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4">
              <Field label={`${field.name} placeholder`}>
                <input
                  required
                  value={field.placeholder || ""}
                  onChange={(event) => updateListItem("form", index, { placeholder: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <Field label="Response-time heading (line breaks are preserved)">
          <textarea
            required
            rows={2}
            value={form.sidebar.responseTitle || ""}
            onChange={(event) => updateSidebar({ responseTitle: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {form.sidebar.details.map((item, index) => (
            <div key={item.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <Field label="Label">
                <input
                  required
                  value={item.label || ""}
                  onChange={(event) => updateSidebarDetail(index, { label: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Value">
                <textarea
                  required
                  rows={2}
                  value={item.value || ""}
                  onChange={(event) => updateSidebarDetail(index, { value: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Quote-card title">
            <textarea
              required
              rows={2}
              value={form.sidebar.quote.title || ""}
              onChange={(event) => updateSidebarQuote({ title: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Quote-card text">
            <textarea
              required
              rows={3}
              value={form.sidebar.quote.body || ""}
              onChange={(event) => updateSidebarQuote({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Newsletter prompt</h4>
        </div>
        <Field label="Title">
          <input
            required
            value={form.newsletter.title || ""}
            onChange={(event) => updateNewsletter({ title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Button label">
          <input
            required
            value={form.newsletter.button || ""}
            onChange={(event) => updateNewsletter({ button: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Supporting text">
            <textarea
              required
              rows={2}
              value={form.newsletter.body || ""}
              onChange={(event) => updateNewsletter({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Email placeholder">
            <input
              required
              value={form.newsletter.placeholder || ""}
              onChange={(event) => updateNewsletter({ placeholder: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          disabled={saving}
          className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Contact page"}
        </button>
      </div>
    </form>
  );
};

// ---- Shop Landing Page Manager ----
const ShopPageManager = ({ content, onChange }) => {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  const updateHeroCta = (patch) => setForm((current) => ({
    ...current,
    cta: { ...current.cta, ...patch },
  }));

  const updateBullet = (index, patch) => setForm((current) => ({
    ...current,
    bullets: current.bullets.map((bullet, bulletIndex) =>
      bulletIndex === index ? { ...bullet, ...patch } : bullet
    ),
  }));

  const updateThanks = (patch) => setForm((current) => ({
    ...current,
    thanks: { ...current.thanks, ...patch },
  }));

  const updateThanksCta = (patch) => setForm((current) => ({
    ...current,
    thanks: {
      ...current.thanks,
      cta: { ...current.thanks.cta, ...patch },
    },
  }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveShopPage(form);
      onChange();
      alert("Shop landing page content saved.");
    } catch (error) {
      alert(error?.message || "Shop page save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            Shop Landing Page Content
          </h3>
          <p className="mt-1 text-ink/60 text-[13px]">
            Individual products, prices, categories, availability, and galleries remain managed from the Products tab.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/shop"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy/10 inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Shop page
          </a>
          <button
            disabled={saving}
            className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Shop page"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Hero</h4>
        </div>
        <Field label="Eyebrow">
          <input
            required
            value={form.eyebrow || ""}
            onChange={(event) => setForm({ ...form, eyebrow: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Title (line breaks are preserved)">
          <textarea
            required
            rows={3}
            value={form.title || ""}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Introduction">
            <textarea
              required
              rows={3}
              value={form.body || ""}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Hero button label">
          <input
            required
            value={form.cta?.label || ""}
            onChange={(event) => updateHeroCta({ label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Hero button destination">
          <input
            required
            value={form.cta?.href || ""}
            onChange={(event) => updateHeroCta({ href: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">Hero image</span>
          <div className="mt-1">
            <MediaPicker
              value={form.image ? {
                id: form.imageMediaId,
                public_url: form.image,
                alt_text: form.imageAlt,
                title: "Shop page hero",
              } : null}
              onChange={(asset) => setForm({
                ...form,
                image: asset.public_url,
                imageAlt: asset.alt_text || "",
                imageMediaId: asset.id,
              })}
              buttonLabel={form.image ? "Replace hero image" : "Choose hero image"}
            />
          </div>
          {form.image && !form.imageMediaId && (
            <p className="mt-2 text-amber-800 text-[12px]">
              This page still uses a legacy hero URL. Choose a library image to make it deletion-protected.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <Field label="Hero image alt text">
            <input
              required={!!form.image}
              value={form.imageAlt || ""}
              onChange={(event) => setForm({ ...form, imageAlt: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <div>
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Hero impact points</h4>
          <p className="mt-1 text-ink/60 text-[12px]">The three existing icons remain fixed.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {form.bullets.map((bullet, index) => (
            <div key={bullet.icon} className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3">
              <Field label="Title">
                <input
                  required
                  value={bullet.title || ""}
                  onChange={(event) => updateBullet(index, { title: event.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Supporting text">
                <textarea
                  required
                  rows={3}
                  value={bullet.sub || ""}
                  onChange={(event) => updateBullet(index, { sub: event.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Product collection heading</h4>
          <p className="mt-1 text-ink/60 text-[12px]">Category filters are generated from active product records.</p>
        </div>
        <Field label="Collection title">
          <input
            required
            value={form.collectionTitle || ""}
            onChange={(event) => setForm({ ...form, collectionTitle: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="All-products filter label">
          <input
            required
            value={form.allProductsLabel || ""}
            onChange={(event) => setForm({ ...form, allProductsLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Thank-you panel</h4>
        </div>
        <Field label="Title">
          <input
            required
            value={form.thanks.title || ""}
            onChange={(event) => updateThanks({ title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Button label">
          <input
            required
            value={form.thanks.cta?.label || ""}
            onChange={(event) => updateThanksCta({ label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Supporting text">
            <textarea
              required
              rows={3}
              value={form.thanks.body || ""}
              onChange={(event) => updateThanks({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Button destination">
            <input
              required
              value={form.thanks.cta?.href || ""}
              onChange={(event) => updateThanksCta({ href: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          disabled={saving}
          className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Shop page"}
        </button>
      </div>
    </form>
  );
};

// ---- Support Page Manager ----
const SupportPageManager = ({ content, onChange }) => {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  const updateImpact = (index, value) => setForm((current) => ({
    ...current,
    impactItems: current.impactItems.map((item, itemIndex) =>
      itemIndex === index ? value : item
    ),
  }));

  const updatePreset = (index, value) => setForm((current) => ({
    ...current,
    presets: current.presets.map((preset, presetIndex) =>
      presetIndex === index ? value : preset
    ),
  }));

  const updateThanks = (patch) => setForm((current) => ({
    ...current,
    thanks: { ...current.thanks, ...patch },
  }));

  const updateThanksButton = (patch) => setForm((current) => ({
    ...current,
    thanks: {
      ...current.thanks,
      button: { ...current.thanks.button, ...patch },
    },
  }));

  const save = async (event) => {
    event.preventDefault();
    const presets = form.presets.map(Number);
    if (presets.some((value) => !Number.isFinite(value) || value < 100)) {
      alert("Every donation preset must be at least KES 100.");
      return;
    }

    setSaving(true);
    try {
      await saveSupportPage({ ...form, presets });
      onChange();
      alert("Support page content saved.");
    } catch (error) {
      alert(error?.message || "Support page save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            Support and Donation Page Content
          </h3>
          <p className="mt-1 text-ink/60 text-[13px]">
            Stripe checkout configuration, the Edge Function contract, success detection, and the KES 100 minimum remain system-controlled.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/support"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy/10 inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Support page
          </a>
          <button
            disabled={saving}
            className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Support page"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Introduction</h4>
        </div>
        <Field label="Eyebrow">
          <input
            required
            value={form.eyebrow || ""}
            onChange={(event) => setForm({ ...form, eyebrow: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Title">
          <textarea
            required
            rows={3}
            value={form.title || ""}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Introduction text">
            <textarea
              required
              rows={4}
              value={form.body || ""}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        {form.impactItems.map((item, index) => (
          <div key={index} className={index === 2 ? "md:col-span-2" : ""}>
            <Field label={`Impact statement ${index + 1}`}>
              <textarea
                required
                rows={2}
                value={item || ""}
                onChange={(event) => updateImpact(index, event.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">
        <div>
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Donation panel</h4>
          <p className="mt-1 text-ink/60 text-[12px]">Preset amounts must each be at least KES 100.</p>
        </div>
        <Field label="Panel title">
          <input
            required
            value={form.formTitle || ""}
            onChange={(event) => setForm({ ...form, formTitle: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {form.presets.map((preset, index) => (
            <Field key={index} label={`Preset ${index + 1} (KES)`}>
              <input
                required
                type="number"
                min="100"
                step="1"
                value={preset}
                onChange={(event) => updatePreset(index, event.target.value)}
                className={inputCls}
              />
            </Field>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Custom amount label">
            <input
              required
              value={form.customAmountLabel || ""}
              onChange={(event) => setForm({ ...form, customAmountLabel: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Custom amount placeholder">
            <input
              required
              value={form.customAmountPlaceholder || ""}
              onChange={(event) => setForm({ ...form, customAmountPlaceholder: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Name placeholder">
            <input
              required
              value={form.namePlaceholder || ""}
              onChange={(event) => setForm({ ...form, namePlaceholder: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Email placeholder">
            <input
              required
              value={form.emailPlaceholder || ""}
              onChange={(event) => setForm({ ...form, emailPlaceholder: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Message placeholder">
            <input
              required
              value={form.messagePlaceholder || ""}
              onChange={(event) => setForm({ ...form, messagePlaceholder: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Donate button label">
            <input
              required
              value={form.donateButtonLabel || ""}
              onChange={(event) => setForm({ ...form, donateButtonLabel: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Loading label">
            <input
              required
              value={form.loadingLabel || ""}
              onChange={(event) => setForm({ ...form, loadingLabel: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Checkout reassurance</h4>
        </div>
        <div className="md:col-span-2">
          <Field label="Text before contact link">
            <textarea
              required
              rows={2}
              value={form.securityPrefix || ""}
              onChange={(event) => setForm({ ...form, securityPrefix: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Contact-link label">
          <input
            required
            value={form.contactLabel || ""}
            onChange={(event) => setForm({ ...form, contactLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Contact-link destination">
          <input
            required
            value={form.contactHref || ""}
            onChange={(event) => setForm({ ...form, contactHref: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Text after contact link">
          <input
            value={form.securitySuffix || ""}
            onChange={(event) => setForm({ ...form, securitySuffix: event.target.value })}
            className={inputCls}
          />
        </Field>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Successful-checkout message</h4>
        </div>
        <Field label="Title">
          <input
            required
            value={form.thanks.title || ""}
            onChange={(event) => updateThanks({ title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Button label">
          <input
            required
            value={form.thanks.button?.label || ""}
            onChange={(event) => updateThanksButton({ label: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Confirmation text">
            <textarea
              required
              rows={3}
              value={form.thanks.body || ""}
              onChange={(event) => updateThanks({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Button destination">
            <input
              required
              value={form.thanks.button?.href || ""}
              onChange={(event) => updateThanksButton({ href: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          disabled={saving}
          className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Support page"}
        </button>
      </div>
    </form>
  );
};

// ---- Volunteer Pages Manager ----
const VolunteerPageManager = ({ content, onChange }) => {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(content)));
  }, [content]);

  const updateLanding = (patch) => setForm((current) => ({
    ...current,
    landing: { ...current.landing, ...patch },
  }));

  const updateApplication = (patch) => setForm((current) => ({
    ...current,
    application: { ...current.application, ...patch },
  }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveVolunteerPage(form);
      onChange();
      alert("Volunteer page content saved.");
    } catch (error) {
      alert(error?.message || "Volunteer page save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            Volunteer Landing and Application Content
          </h3>
          <p className="mt-1 text-ink/60 text-[13px]">
            Role content and custom application questions remain managed from Volunteer Roles. Submitted applications remain under Applications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/get-involved/volunteer"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy/10 inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Volunteer page
          </a>
          <button
            disabled={saving}
            className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Volunteer pages"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Volunteer landing page</h4>
        </div>
        <Field label="Eyebrow">
          <input
            required
            value={form.landing.eyebrow || ""}
            onChange={(event) => updateLanding({ eyebrow: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Title (line breaks are preserved)">
          <textarea
            required
            rows={3}
            value={form.landing.title || ""}
            onChange={(event) => updateLanding({ title: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Introduction">
            <textarea
              required
              rows={3}
              value={form.landing.body || ""}
              onChange={(event) => updateLanding({ body: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Loading message">
          <input
            required
            value={form.landing.loadingText || ""}
            onChange={(event) => updateLanding({ loadingText: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Default department label">
          <input
            required
            value={form.landing.defaultDepartmentLabel || ""}
            onChange={(event) => updateLanding({ defaultDepartmentLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Empty-state text before contact link">
            <textarea
              required
              rows={2}
              value={form.landing.emptyPrefix || ""}
              onChange={(event) => updateLanding({ emptyPrefix: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Empty-state contact label">
          <input
            required
            value={form.landing.emptyContactLabel || ""}
            onChange={(event) => updateLanding({ emptyContactLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Empty-state contact destination">
          <input
            required
            value={form.landing.emptyContactHref || ""}
            onChange={(event) => updateLanding({ emptyContactHref: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Text after contact link">
          <input
            value={form.landing.emptySuffix || ""}
            onChange={(event) => updateLanding({ emptySuffix: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Apply button label">
          <input
            required
            value={form.landing.applyLabel || ""}
            onChange={(event) => updateLanding({ applyLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="View-details link label">
          <input
            required
            value={form.landing.detailsLabel || ""}
            onChange={(event) => updateLanding({ detailsLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Volunteer application screen</h4>
        </div>
        <Field label="Loading message">
          <input
            required
            value={form.application.loadingText || ""}
            onChange={(event) => updateApplication({ loadingText: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Role-not-found title">
          <input
            required
            value={form.application.notFoundTitle || ""}
            onChange={(event) => updateApplication({ notFoundTitle: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Back-to-roles label">
          <input
            required
            value={form.application.backLabel || ""}
            onChange={(event) => updateApplication({ backLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Form title">
          <input
            required
            value={form.application.formTitle || ""}
            onChange={(event) => updateApplication({ formTitle: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Responsibilities heading">
          <input
            required
            value={form.application.responsibilitiesLabel || ""}
            onChange={(event) => updateApplication({ responsibilitiesLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Requirements heading">
          <input
            required
            value={form.application.requirementsLabel || ""}
            onChange={(event) => updateApplication({ requirementsLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Name placeholder">
          <input
            required
            value={form.application.namePlaceholder || ""}
            onChange={(event) => updateApplication({ namePlaceholder: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Email placeholder">
          <input
            required
            value={form.application.emailPlaceholder || ""}
            onChange={(event) => updateApplication({ emailPlaceholder: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Phone placeholder">
          <input
            required
            value={form.application.phonePlaceholder || ""}
            onChange={(event) => updateApplication({ phonePlaceholder: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Select-field placeholder">
          <input
            required
            value={form.application.selectPlaceholder || ""}
            onChange={(event) => updateApplication({ selectPlaceholder: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Submit button label">
          <input
            required
            value={form.application.submitLabel || ""}
            onChange={(event) => updateApplication({ submitLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Submitting label">
          <input
            required
            value={form.application.submittingLabel || ""}
            onChange={(event) => updateApplication({ submittingLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <h4 className="font-serif-display text-burgundy text-[19px] font-semibold">Application confirmation</h4>
        </div>
        <Field label="Title">
          <input
            required
            value={form.application.successTitle || ""}
            onChange={(event) => updateApplication({ successTitle: event.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Button label">
          <input
            required
            value={form.application.successButtonLabel || ""}
            onChange={(event) => updateApplication({ successButtonLabel: event.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Confirmation text">
            <textarea
              required
              rows={3}
              value={form.application.successBody || ""}
              onChange={(event) => updateApplication({ successBody: event.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          disabled={saving}
          className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Volunteer pages"}
        </button>
      </div>
    </form>
  );
};

// ---- Newsletter Issues Manager ----
const NewsletterManager = ({ rows, onChange }) => {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const startNew = () => {
    setForm({
      title: "",
      slug: "",
      subject: "",
      preheader: "",
      excerpt: "",
      hero: "",
      heroAlt: "",
      heroMediaId: null,
      body: "",
      status: "draft",
    });
    setEditing("new");
  };

  const startEdit = (row) => {
    setForm({ ...row });
    setEditing(row.id);
  };

  const cancel = () => {
    setEditing(null);
    setForm({});
  };

  const save = async (event) => {
    event.preventDefault();
    try {
      if (editing === "new") await createNewsletterIssue(form);
      else await updateNewsletterIssue(editing, form);
      setEditing(null);
      onChange();
    } catch (error) {
      alert(error?.message || "Save failed");
    }
  };

  const changePublication = async (row) => {
    const nextStatus = row.status === "published" ? "draft" : "published";
    if (nextStatus === "published" && !String(row.body || "").trim()) {
      alert("Add newsletter body content before publishing.");
      return;
    }
    const action = nextStatus === "published" ? "Publish" : "Unpublish";
    if (!window.confirm(`${action} “${row.title}”?`)) return;
    try {
      await updateNewsletterIssue(row.id, { ...row, status: nextStatus });
      if (editing === row.id) setEditing(null);
      onChange();
    } catch (error) {
      alert(error?.message || `${action} failed`);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete “${row.title}”? This cannot be undone.`)) return;
    try {
      await deleteNewsletterIssue(row.id);
      if (editing === row.id) setEditing(null);
      onChange();
    } catch (error) {
      alert(error?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            Newsletter Issues
          </h3>
          <p className="text-ink/60 text-[12.5px] mt-0.5">
            Publish issues to the website archive. Subscriber email sending is separate.
          </p>
        </div>
        <button
          onClick={startNew}
          className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-2 text-[13px] font-semibold hover:bg-burgundy-light"
        >
          <Plus className="w-4 h-4" />
          New issue
        </button>
      </div>

      {editing && (
        <form
          onSubmit={save}
          className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <Field label="Title">
            <input
              required
              value={form.title || ""}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Slug (optional)">
            <input
              value={form.slug || ""}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="auto-generated from title"
              className={inputCls}
            />
          </Field>
          <Field label="Email subject (reserved for sending workflow)">
            <input
              value={form.subject || ""}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Preheader (reserved for sending workflow)">
            <input
              value={form.preheader || ""}
              onChange={(event) => setForm({ ...form, preheader: event.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Archive excerpt">
              <textarea
                rows={2}
                value={form.excerpt || ""}
                onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">
              Hero image
            </span>
            <div className="mt-1 flex items-end gap-2 flex-wrap">
              <MediaPicker
                value={form.hero ? {
                  id: form.heroMediaId,
                  public_url: form.hero,
                  alt_text: form.heroAlt,
                  title: form.title ? `${form.title} hero` : "Newsletter hero",
                } : null}
                onChange={(asset) => setForm({
                  ...form,
                  hero: asset.public_url,
                  heroAlt: asset.alt_text || "",
                  heroMediaId: asset.id,
                })}
                buttonLabel={form.hero ? "Replace hero" : "Choose hero"}
              />
              {form.hero && (
                <button
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    hero: "",
                    heroAlt: "",
                    heroMediaId: null,
                  })}
                  className="rounded-full ring-1 ring-ivory-300 px-4 py-2 text-[13px] font-semibold text-ink/70 hover:bg-ivory-200"
                >
                  Remove hero
                </button>
              )}
            </div>
            {form.hero && !form.heroMediaId && (
              <p className="mt-2 text-amber-800 text-[12px]">
                This issue uses a legacy image URL. Choose a library image to protect it from accidental deletion.
              </p>
            )}
          </div>
          <Field label="Hero alt text">
            <input
              required={!!form.hero}
              value={form.heroAlt || ""}
              onChange={(event) => setForm({ ...form, heroAlt: event.target.value })}
              placeholder="Describe the newsletter hero image"
              className={inputCls}
            />
          </Field>
          <div className="flex items-end">
            <div className="text-[12.5px] text-ink/60">
              Status: <span className="font-semibold text-burgundy">{form.status || "draft"}</span>
            </div>
          </div>
          <div className="md:col-span-2">
            <Field label="Issue body">
              <textarea
                rows={14}
                value={form.body || ""}
                onChange={(event) => setForm({ ...form, body: event.target.value })}
                className={inputCls + " font-mono text-[13px]"}
                placeholder="## Section heading&#10;&#10;Write each paragraph with a blank line between paragraphs.&#10;&#10;> Optional highlighted quote"
              />
            </Field>
            <p className="mt-1 text-ink/55 text-[11.5px]">
              Preview opens the last saved version. Body supports ## headings, ### subheadings, and &gt; highlighted quotes.
            </p>
          </div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={cancel}
              className="rounded-full ring-1 ring-ivory-300 px-4 py-2 text-[13.5px] font-semibold hover:bg-ivory-200 inline-flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-1">
              <Save className="w-4 h-4" />
              Save {form.status === "published" ? "changes" : "draft"}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 overflow-hidden">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] text-[11.5px] font-semibold text-ink/60 uppercase tracking-widest px-4 py-3 border-b border-ivory-300 bg-ivory-200/50">
          <div>Issue</div>
          <div>Status</div>
          <div>Published</div>
          <div>Actions</div>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-ink/60 text-[13.5px]">
            No newsletter issues yet.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] items-center px-4 py-3 border-b border-ivory-300 last:border-b-0 text-[13.5px]"
            >
              <div className="min-w-0">
                <div className="font-semibold text-ink truncate">{row.title}</div>
                <div className="text-ink/60 text-[12px] truncate">/newsletters/{row.slug}</div>
              </div>
              <div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {row.status}
                </span>
              </div>
              <div className="text-ink/70 text-[12px]">
                {row.publishedAt ? new Date(row.publishedAt).toLocaleString() : "—"}
              </div>
              <div className="flex gap-1 justify-end items-center">
                <a
                  href={`/newsletters/${row.slug}?preview=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Preview ${row.title}`}
                  className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-burgundy"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => changePublication(row)}
                  title={row.status === "published" ? "Unpublish" : "Publish"}
                  aria-label={`${row.status === "published" ? "Unpublish" : "Publish"} ${row.title}`}
                  className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-burgundy"
                >
                  <Globe2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startEdit(row)}
                  aria-label={`Edit ${row.title}`}
                  className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-burgundy"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(row)}
                  aria-label={`Delete ${row.title}`}
                  className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ---- Events Manager ----
const EventsManager = ({ rows, onChange }) => {
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState({});

  const startNew = () => {
    setForm({
      title: "",
      subtitle: "",
      date: "",
      location: "",
      body: "",
      img: "",
      imgAlt: "",
      posterMediaId: null,
      status: "upcoming",
      featured: false,
      partners: "",
      tags: "",
    });
    setEditing("new");
  };
  const startEdit = (row) => {
    setForm({
      ...row,
      partners: (row.partners || []).join(", "),
      tags: (row.tags || []).join(", "),
    });
    setEditing(row.id);
  };
  const cancel = () => {
    setEditing(null);
    setForm({});
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      partners: (form.partners || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (editing === "new") await createEvent(payload);
      else await updateEvent(editing, payload);
      setEditing(null);
      onChange();
    } catch (err) {
      alert(err?.message || "Save failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await deleteEvent(id);
      onChange();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
          Events
        </h3>
        <button
          onClick={startNew}
          className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-2 text-[13px] font-semibold hover:bg-burgundy-light"
        >
          <Plus className="w-4 h-4" />
          New event
        </button>
      </div>

      {editing && (
        <form
          onSubmit={save}
          className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <Field label="Title">
            <input
              required
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Subtitle">
            <input
              value={form.subtitle || ""}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Date">
            <input
              value={form.date || ""}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              placeholder="e.g. Wednesday, 4th March 2026"
              className={inputCls}
            />
          </Field>
          <Field label="Location">
            <input
              value={form.location || ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Audience">
            <input
              value={form.audience || ""}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status || "upcoming"}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputCls}
            >
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </Field>
          <div className="md:col-span-2">
            <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">
              Event poster
            </span>
            <div className="mt-1 flex items-end gap-2 flex-wrap">
              <MediaPicker
                value={form.img ? {
                  id: form.posterMediaId,
                  public_url: form.img,
                  alt_text: form.imgAlt,
                  title: form.title ? `${form.title} poster` : "Event poster",
                } : null}
                onChange={(asset) => setForm({
                  ...form,
                  img: asset.public_url,
                  imgAlt: asset.alt_text || "",
                  posterMediaId: asset.id,
                })}
                buttonLabel={form.img ? "Replace poster" : "Choose poster"}
              />
              {form.img && (
                <button
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    img: "",
                    imgAlt: "",
                    posterMediaId: null,
                  })}
                  className="rounded-full ring-1 ring-ivory-300 px-4 py-2 text-[13px] font-semibold text-ink/70 hover:bg-ivory-200"
                >
                  Remove poster
                </button>
              )}
            </div>
            {form.img && !form.posterMediaId && (
              <p className="mt-2 text-amber-800 text-[12px]">
                This event still uses a legacy image URL. Choose a library image to protect it from accidental deletion.
              </p>
            )}
          </div>
          <Field label="Poster alt text">
            <input
              required={!!form.img}
              value={form.imgAlt || ""}
              onChange={(e) => setForm({ ...form, imgAlt: e.target.value })}
              placeholder="Describe the poster image"
              className={inputCls}
            />
          </Field>
          <Field label="Capacity (leave blank for unlimited)">
            <input
              type="number"
              min="0"
              value={form.capacity ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  capacity:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="e.g. 50"
              className={inputCls}
            />
          </Field>
          <Field label="Tags (comma-separated)">
            <input
              value={form.tags || ""}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Partners (comma-separated)">
            <input
              value={form.partners || ""}
              onChange={(e) => setForm({ ...form, partners: e.target.value })}
              className={inputCls}
            />
          </Field>
          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={!!form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            <span className="text-[13.5px]">Featured</span>
          </label>
          <div className="md:col-span-2">
            <Field label="Body">
              <textarea
                rows={4}
                value={form.body || ""}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={cancel}
              className="rounded-full ring-1 ring-ivory-300 px-4 py-2 text-[13.5px] font-semibold hover:bg-ivory-200 inline-flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-1">
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 overflow-hidden">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_auto] text-[11.5px] font-semibold text-ink/60 uppercase tracking-widest px-4 py-3 border-b border-ivory-300 bg-ivory-200/50">
          <div>Title</div>
          <div>Date</div>
          <div>Capacity</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-ink/60 text-[13.5px]">
            No events yet.
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_auto] items-center px-4 py-3 border-b border-ivory-300 last:border-b-0 text-[13.5px]"
            >
              <div>
                <div className="font-semibold text-ink truncate">{r.title}</div>
                <div className="text-ink/60 text-[12px]">{r.slug}</div>
              </div>
              <div className="text-ink/70 truncate">{r.date || "—"}</div>
              <div className="text-ink/70 text-[12.5px]">
                {r.capacity ? `${r.capacity}` : "∞"}
              </div>
              <div>
                <span
                  className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.status === "upcoming" ? "bg-emerald-100 text-emerald-800" : "bg-ivory-300 text-ink/70"}`}
                >
                  {r.status}
                </span>
                {r.featured && (
                  <span className="ml-1 text-[10.5px] text-burgundy">★</span>
                )}
              </div>
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => startEdit(r)}
                  className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-burgundy"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ---- Articles Manager ----
const ArticlesManager = ({ rows, onChange }) => {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const bodyTextareaRef = useRef(null);

  const startNew = () => {
    setForm({
      topic: "",
      title: "",
      excerpt: "",
      read: "6 min read",
      updated: "",
      hero: "",
      heroAlt: "",
      heroMediaId: null,
      lead: "",
      bodyText: "",
      inlineMediaByUrl: {},
      tags: "",
      takeaways: "",
    });
    setEditing("new");
  };
  const startEdit = (row) => {
    const inlineMediaByUrl = Object.fromEntries(
      (row.blocks || [])
        .filter((block) => block.type === "img" && block.src && (block.media_asset_id || block.mediaAssetId))
        .map((block) => [
          block.src,
          { id: block.media_asset_id || block.mediaAssetId },
        ]),
    );
    const bodyText = (row.blocks || [])
      .map((b) => {
        if (b.type === "h2") return `## ${b.text}`;
        if (b.type === "h3") return `### ${b.text}`;
        if (b.type === "p") return b.text;
        if (b.type === "img")
          return `![${b.alt || ""}](${b.src})${b.caption ? ` — ${b.caption}` : ""}`;
        if (b.type === "quote")
          return `> ${b.text}${b.author ? ` — ${b.author}` : ""}`;
        return "";
      })
      .join("\n\n");
    setForm({
      ...row,
      bodyText,
      inlineMediaByUrl,
      tags: (row.tags || []).join(", "),
      takeaways: (row.takeaways || []).join("\n"),
    });
    setEditing(row.id);
  };
  const cancel = () => {
    setEditing(null);
    setForm({});
  };

  const parseBody = (text, inlineMediaByUrl = {}) => {
    const blocks = [];
    const paragraphs = (text || "").split(/\n\s*\n/);
    for (const raw of paragraphs) {
      const p = raw.trim();
      if (!p) continue;
      if (p.startsWith("### "))
        blocks.push({ type: "h3", text: p.slice(4).trim() });
      else if (p.startsWith("## "))
        blocks.push({ type: "h2", text: p.slice(3).trim() });
      else if (p.startsWith("> ")) {
        const rest = p.slice(2).trim();
        const m = rest.split(/ [—-] /);
        if (m.length > 1)
          blocks.push({
            type: "quote",
            text: m[0].trim(),
            author: m.slice(1).join(" — ").trim(),
          });
        else blocks.push({ type: "quote", text: rest });
      } else if (p.startsWith("!")) {
        const m = p.match(/!\[([^\]]*)\]\(([^)]+)\)(?:\s+[—-]\s+(.+))?/);
        if (m) {
          const imageBlock = {
            type: "img",
            alt: m[1],
            src: m[2],
            caption: m[3] || "",
          };
          const mediaAssetId = inlineMediaByUrl[m[2]]?.id;
          if (mediaAssetId) imageBlock.media_asset_id = mediaAssetId;
          blocks.push(imageBlock);
        }
      } else blocks.push({ type: "p", text: p });
    }
    return blocks;
  };

  const insertInlineImage = (asset) => {
    const textarea = bodyTextareaRef.current;
    const current = form.bodyText || "";
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? start;
    const alt = String(asset.alt_text || asset.title || "Article image")
      .replace(/[\[\]]/g, "")
      .trim();
    const caption = String(asset.caption || "").trim();
    const imageMarkup = `![${alt}](${asset.public_url})${caption ? ` — ${caption}` : ""}`;
    const before = current.slice(0, start);
    const after = current.slice(end);
    const leadingBreak = before && !before.endsWith("\n\n") ? "\n\n" : "";
    const trailingBreak = after && !after.startsWith("\n\n") ? "\n\n" : "";
    const insertion = `${leadingBreak}${imageMarkup}${trailingBreak}`;
    const nextBody = `${before}${insertion}${after}`;
    const nextCursor = before.length + insertion.length;

    setForm({
      ...form,
      bodyText: nextBody,
      inlineMediaByUrl: {
        ...(form.inlineMediaByUrl || {}),
        [asset.public_url]: { id: asset.id },
      },
    });

    window.requestAnimationFrame(() => {
      bodyTextareaRef.current?.focus();
      bodyTextareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      topic: form.topic,
      title: form.title,
      excerpt: form.excerpt,
      read: form.read,
      updated: form.updated,
      hero: form.hero,
      heroAlt: form.heroAlt,
      heroMediaId: form.heroMediaId,
      lead: form.lead,
      blocks: parseBody(form.bodyText, form.inlineMediaByUrl),
      tags: (form.tags || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      takeaways: (form.takeaways || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      slug: form.slug,
      status: form.status,
    };
    try {
      if (editing === "new") await createArticle(payload);
      else await updateArticle(editing, payload);
      setEditing(null);
      onChange();
    } catch (err) {
      alert(err?.message || "Save failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this article?")) return;
    try {
      await deleteArticle(id);
      onChange();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
          Articles
        </h3>
        <button
          onClick={startNew}
          className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-2 text-[13px] font-semibold hover:bg-burgundy-light"
        >
          <Plus className="w-4 h-4" />
          New article
        </button>
      </div>

      {editing && (
        <form
          onSubmit={save}
          className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <Field label="Topic">
            <input
              required
              value={form.topic || ""}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Title">
            <input
              required
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Excerpt">
            <input
              value={form.excerpt || ""}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Read time">
            <input
              value={form.read || ""}
              onChange={(e) => setForm({ ...form, read: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Updated (label)">
            <input
              value={form.updated || ""}
              onChange={(e) => setForm({ ...form, updated: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="md:col-span-2">
            <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">
              Hero image
            </span>
            <div className="mt-1 flex items-end gap-2 flex-wrap">
              <MediaPicker
                value={form.hero ? {
                  id: form.heroMediaId,
                  public_url: form.hero,
                  alt_text: form.heroAlt,
                  title: form.title ? `${form.title} hero` : "Article hero",
                } : null}
                onChange={(asset) => setForm({
                  ...form,
                  hero: asset.public_url,
                  heroAlt: asset.alt_text || "",
                  heroMediaId: asset.id,
                })}
                buttonLabel={form.hero ? "Replace hero" : "Choose hero"}
              />
              {form.hero && (
                <button
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    hero: "",
                    heroAlt: "",
                    heroMediaId: null,
                  })}
                  className="rounded-full ring-1 ring-ivory-300 px-4 py-2 text-[13px] font-semibold text-ink/70 hover:bg-ivory-200"
                >
                  Remove hero
                </button>
              )}
            </div>
            {form.hero && !form.heroMediaId && (
              <p className="mt-2 text-amber-800 text-[12px]">
                This article still uses a legacy hero URL. Choose a library image to protect it from accidental deletion.
              </p>
            )}
          </div>
          <Field label="Hero alt text">
            <input
              required={!!form.hero}
              value={form.heroAlt || ""}
              onChange={(e) => setForm({ ...form, heroAlt: e.target.value })}
              placeholder="Describe the article hero image"
              className={inputCls}
            />
          </Field>
          <Field label="Tags (comma-separated)">
            <input
              value={form.tags || ""}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Slug (optional)">
            <input
              value={form.slug || ""}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className={inputCls}
              placeholder="auto-generated from title"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Lead paragraph">
              <textarea
                rows={2}
                value={form.lead || ""}
                onChange={(e) => setForm({ ...form, lead: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">
                Body
              </span>
              <MediaPicker
                value={null}
                onChange={insertInlineImage}
                buttonLabel="Insert library image"
              />
            </div>
            <p className="mt-1 text-ink/55 text-[11.5px]">
              Place the cursor where the image should appear. Markdown-lite supports ## heading, ### subheading, &gt; quote — author, and ![alt](url) — caption. Manually entered image URLs remain unprotected.
            </p>
            <textarea
              ref={bodyTextareaRef}
              rows={12}
              value={form.bodyText || ""}
              onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
              className={inputCls + " mt-2 font-mono text-[13px]"}
              placeholder="## First section&#10;Paragraph text here…&#10;&#10;![Alt text](https://example.com/image.jpg) — optional caption&#10;&#10;> Blockquote text — Author"
            />
          </div>
          <div className="md:col-span-2">
            <Field label="Takeaways (one per line)">
              <textarea
                rows={3}
                value={form.takeaways || ""}
                onChange={(e) =>
                  setForm({ ...form, takeaways: e.target.value })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={cancel}
              className="rounded-full ring-1 ring-ivory-300 px-4 py-2 text-[13.5px] font-semibold hover:bg-ivory-200 inline-flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-1">
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 overflow-hidden">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] text-[11.5px] font-semibold text-ink/60 uppercase tracking-widest px-4 py-3 border-b border-ivory-300 bg-ivory-200/50">
          <div>Title</div>
          <div>Topic</div>
          <div>Blocks</div>
          <div>Actions</div>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-ink/60 text-[13.5px]">
            No articles yet.
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center px-4 py-3 border-b border-ivory-300 last:border-b-0 text-[13.5px]"
            >
              <div>
                <div className="font-semibold text-ink truncate">{r.title}</div>
                <div className="text-ink/60 text-[12px]">/{r.slug}</div>
              </div>
              <div className="text-ink/70 truncate">{r.topic}</div>
              <div className="text-ink/70">
                {(r.blocks || []).length} blocks
              </div>
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => startEdit(r)}
                  className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-burgundy"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ---- Products Manager ----
const ProductsManager = ({ rows, onChange }) => {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const startNew = () => {
    setForm({
      name: "",
      price: 0,
      category: "Accessories",
      img: "",
      images: [],
      description: "",
      active: true,
    });
    setEditing("new");
  };
  const startEdit = (row) => {
    setForm({ ...row, images: row.images || [] });
    setEditing(row.id);
  };
  const cancel = () => {
    setEditing(null);
    setForm({});
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price) };
    try {
      if (editing === "new") await createProduct(payload);
      else await updateProduct(editing, payload);
      setEditing(null);
      onChange();
    } catch (err) {
      alert(err?.message || "Save failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      onChange();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  };

  const normalizeImages = (images) => images.map((image, index) => ({
    ...image,
    order: index,
  }));

  const addGalleryImage = (asset) => {
    const images = form.images || [];
    if (images.some((image) => image.mediaAssetId === asset.id)) {
      window.alert("That image is already in this product gallery.");
      return;
    }
    const added = {
      mediaAssetId: asset.id,
      publicUrl: asset.public_url,
      altText: asset.alt_text || "",
      caption: asset.caption || "",
      isPrimary: images.length === 0,
      order: images.length,
    };
    const nextImages = [...images, added];
    setForm({
      ...form,
      images: nextImages,
      img: images.length === 0 ? asset.public_url : form.img,
    });
  };

  const updateGalleryImage = (index, patch) => {
    setForm({
      ...form,
      images: (form.images || []).map((image, imageIndex) =>
        imageIndex === index ? { ...image, ...patch } : image
      ),
    });
  };

  const makePrimary = (index) => {
    const images = (form.images || []).map((image, imageIndex) => ({
      ...image,
      isPrimary: imageIndex === index,
    }));
    setForm({ ...form, images, img: images[index]?.publicUrl || "" });
  };

  const moveGalleryImage = (index, direction) => {
    const destination = index + direction;
    const images = [...(form.images || [])];
    if (destination < 0 || destination >= images.length) return;
    [images[index], images[destination]] = [images[destination], images[index]];
    setForm({ ...form, images: normalizeImages(images) });
  };

  const removeGalleryImage = (index) => {
    const current = form.images || [];
    const removedWasPrimary = current[index]?.isPrimary;
    const images = normalizeImages(current.filter((_, imageIndex) => imageIndex !== index));
    if (removedWasPrimary && images.length) images[0] = { ...images[0], isPrimary: true };
    const primary = images.find((image) => image.isPrimary) || images[0];
    setForm({ ...form, images, img: primary?.publicUrl || "" });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
          Products
        </h3>
        <button
          onClick={startNew}
          className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-2 text-[13px] font-semibold hover:bg-burgundy-light"
        >
          <Plus className="w-4 h-4" />
          New product
        </button>
      </div>

      {editing && (
        <form
          onSubmit={save}
          className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <Field label="Name">
            <input
              required
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Price (KES)">
            <input
              required
              type="number"
              min="0"
              step="1"
              value={form.price || 0}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Category">
            <select
              value={form.category || "Accessories"}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputCls}
            >
              {[
                "Stickers",
                "Book Cards",
                "Apparel",
                "Accessories",
                "Bundles",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">
                  Product gallery
                </span>
                <p className="mt-1 text-ink/55 text-[11.5px]">
                  Add multiple images, arrange their order, and choose the primary shop image.
                </p>
              </div>
              <MediaPicker
                value={null}
                onChange={addGalleryImage}
                buttonLabel="Add gallery image"
              />
            </div>

            {(form.images || []).length > 0 && (
              <div className="mt-4 space-y-3">
                {(form.images || []).map((image, index) => (
                  <div
                    key={image.mediaAssetId}
                    className={`rounded-xl p-3 grid grid-cols-[88px_minmax(0,1fr)_auto] gap-3 items-center ${image.isPrimary ? "ring-2 ring-burgundy bg-burgundy/5" : "ring-1 ring-ivory-300 bg-ivory"}`}
                  >
                    <img
                      src={image.publicUrl}
                      alt={image.altText || ""}
                      className="w-[88px] h-[88px] rounded-lg object-cover bg-ivory-200"
                    />
                    <div>
                      <Field label="Image alt text">
                        <input
                          required
                          value={image.altText || ""}
                          onChange={(event) => updateGalleryImage(index, { altText: event.target.value })}
                          className={inputCls}
                          placeholder="Describe this product image"
                        />
                      </Field>
                      <button
                        type="button"
                        onClick={() => makePrimary(index)}
                        className={`mt-2 rounded-full px-3 py-1 text-[11.5px] font-semibold ${image.isPrimary ? "bg-burgundy text-ivory" : "ring-1 ring-burgundy/30 text-burgundy hover:bg-burgundy/10"}`}
                      >
                        {image.isPrimary ? "Primary image" : "Make primary"}
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        aria-label="Move image up"
                        disabled={index === 0}
                        onClick={() => moveGalleryImage(index, -1)}
                        className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-burgundy disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move image down"
                        disabled={index === form.images.length - 1}
                        onClick={() => moveGalleryImage(index, 1)}
                        className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-burgundy disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove image from gallery"
                        onClick={() => removeGalleryImage(index)}
                        className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(form.images || []).length === 0 && form.img && (
              <div className="mt-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 p-3 flex items-center gap-3">
                <img src={form.img} alt={form.name || "Legacy product"} className="w-16 h-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-amber-900 text-[12.5px] font-semibold">Legacy product image</div>
                  <p className="text-amber-800 text-[11.5px]">Add a library image to create a protected gallery.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, img: "" })}
                  className="rounded-full ring-1 ring-amber-300 px-3 py-1.5 text-[11.5px] font-semibold text-amber-900 hover:bg-amber-100"
                >
                  Remove legacy image
                </button>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                rows={3}
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span className="text-[13.5px]">Active / visible on shop</span>
          </label>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={cancel}
              className="rounded-full ring-1 ring-ivory-300 px-4 py-2 text-[13.5px] font-semibold hover:bg-ivory-200 inline-flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-1">
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 overflow-hidden">
        <div className="grid grid-cols-[80px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] text-[11.5px] font-semibold text-ink/60 uppercase tracking-widest px-4 py-3 border-b border-ivory-300 bg-ivory-200/50">
          <div>Image</div>
          <div>Name</div>
          <div>Category</div>
          <div>Price</div>
          <div>Actions</div>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-ink/60 text-[13.5px]">
            No products yet.
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[80px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center px-4 py-3 border-b border-ivory-300 last:border-b-0 text-[13.5px]"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden ring-1 ring-ivory-300 bg-ivory-200">
                {r.img && (
                  <img
                    src={r.img}
                    alt={r.imgAlt || r.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <div className="font-semibold text-ink">
                  {r.name}{" "}
                  {r.active === false && (
                    <span className="text-[10.5px] ml-2 text-ink/50">
                      hidden
                    </span>
                  )}
                </div>
                <div className="text-ink/60 text-[12px] line-clamp-1">
                  {r.description}
                </div>
                {(r.images || []).length > 0 && (
                  <div className="text-burgundy/70 text-[11px] mt-0.5">
                    {r.images.length} gallery {r.images.length === 1 ? "image" : "images"}
                  </div>
                )}
              </div>
              <div className="text-ink/70">{r.category}</div>
              <div className="text-burgundy font-semibold">
                KES {Number(r.price).toLocaleString()}
              </div>
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => startEdit(r)}
                  className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-burgundy"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Admin;

const SimpleList = ({ rows, cols, emptyText }) => (
  <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 overflow-hidden">
    <div
      className="grid px-4 py-3 border-b border-ivory-300 bg-ivory-200/50 text-[11.5px] font-semibold text-ink/60 uppercase tracking-widest"
      style={{ gridTemplateColumns: cols.map(() => "minmax(0,1fr)").join(" ") }}
    >
      {cols.map((c) => (
        <div key={c.key}>{c.label}</div>
      ))}
    </div>
    {rows.length === 0 ? (
      <div className="px-4 py-8 text-center text-ink/60 text-[13.5px]">
        {emptyText}
      </div>
    ) : (
      rows.map((r) => (
        <div
          key={r.id}
          className="grid px-4 py-3 border-b border-ivory-300 last:border-b-0 text-[13.5px] text-ink"
          style={{
            gridTemplateColumns: cols.map(() => "minmax(0,1fr)").join(" "),
          }}
        >
          {cols.map((c) => (
            <div key={c.key} className="truncate text-ink/85">
              {c.render ? c.render(r) : r[c.key]}
            </div>
          ))}
        </div>
      ))
    )}
  </div>
);

const RegistrationsList = ({ rows }) => (
  <SimpleList
    rows={rows}
    emptyText="No registrations yet."
    cols={[
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "event_title", label: "Event" },
      {
        key: "created_at",
        label: "When",
        render: (r) => new Date(r.created_at).toLocaleString(),
      },
      {
        key: "answers",
        label: "Answers",
        render: (r) =>
          Object.entries(r.answers || {})
            .map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`)
            .join(" • "),
      },
    ]}
  />
);

const ApplicationsList = ({ rows }) => (
  <div className="space-y-4">
    {rows.length === 0 && (
      <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60 text-[13.5px]">
        No volunteer applications yet.
      </div>
    )}
    {rows.map((a) => (
      <div
        key={a.id}
        className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[14.5px] font-semibold text-ink">
              {a.name}{" "}
              <span className="text-ink/50 font-normal">— {a.email}</span>
            </div>
            <div className="font-serif-display text-burgundy text-[17px] font-semibold mt-0.5">
              {a.role_title}
            </div>
          </div>
          <div className="text-[12px] text-ink/60">
            {new Date(a.created_at).toLocaleString()}
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[13.5px]">
          {Object.entries(a.answers || {}).map(([k, v]) => (
            <div
              key={k}
              className="rounded-lg bg-ivory-200/60 ring-1 ring-ivory-300 p-3"
            >
              <dt className="text-ink/60 text-[11.5px] uppercase tracking-widest">
                {k}
              </dt>
              <dd className="mt-1 text-ink/85 whitespace-pre-wrap">
                {String(v)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    ))}
  </div>
);

const InquiriesList = ({ rows }) => (
  <div className="space-y-4">
    {rows.length === 0 && (
      <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60 text-[13.5px]">
        No partner inquiries yet.
      </div>
    )}
    {rows.map((q) => (
      <div
        key={q.id}
        className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[14.5px] font-semibold text-ink">
              {q.org_name} —{" "}
              <span className="font-normal text-ink/60">
                {q.org_type || "—"}
              </span>
            </div>
            <div className="font-serif-display text-burgundy text-[16px] font-semibold mt-0.5">
              {q.partnership_type || "General inquiry"}
            </div>
            <div className="text-ink/70 text-[12.5px] mt-0.5">
              {q.contact_name} • {q.email} {q.phone && `• ${q.phone}`}{" "}
              {q.website && `• ${q.website}`}
            </div>
          </div>
          <div className="text-[12px] text-ink/60">
            {new Date(q.created_at).toLocaleString()}
          </div>
        </div>
        {q.goals && (
          <div className="mt-3 text-ink/85 text-[14px]">
            <b className="text-burgundy">Goals: </b>
            {q.goals}
          </div>
        )}
        {q.audience && (
          <div className="mt-1 text-ink/85 text-[14px]">
            <b className="text-burgundy">Audience: </b>
            {q.audience}
          </div>
        )}
        {q.timeline && (
          <div className="mt-1 text-ink/85 text-[14px]">
            <b className="text-burgundy">Timeline: </b>
            {q.timeline}
          </div>
        )}
        {q.budget && (
          <div className="mt-1 text-ink/85 text-[14px]">
            <b className="text-burgundy">Budget: </b>
            {q.budget}
          </div>
        )}
        {q.message && (
          <p className="mt-2 text-ink/80 text-[14px] whitespace-pre-wrap">
            {q.message}
          </p>
        )}
      </div>
    ))}
  </div>
);

const DonationsList = ({ rows }) => (
  <SimpleList
    rows={rows}
    emptyText="No donations yet."
    cols={[
      { key: "name", label: "Name", render: (r) => r.name || "Anonymous" },
      { key: "email", label: "Email" },
      {
        key: "amount_kes",
        label: "Amount",
        render: (r) => `KES ${Number(r.amount_kes).toLocaleString()}`,
      },
      { key: "status", label: "Status" },
      {
        key: "created_at",
        label: "When",
        render: (r) => new Date(r.created_at).toLocaleString(),
      },
    ]}
  />
);

// ---- Founders Manager ----
const FoundersManager = ({ rows, onChange }) => {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const startNew = () => {
    setForm({
      name: "",
      role: "",
      short: "",
      bio: "",
      img: "",
      imgAlt: "",
      photoMediaId: null,
      linkedin: "",
      funfact: "",
      medium: "",
      why_art: "",
      order: rows.length + 1,
      active: true,
    });
    setEditing("new");
  };
  const startEdit = (r) => {
    setForm({ ...r });
    setEditing(r.id);
  };
  const cancel = () => {
    setEditing(null);
    setForm({});
  };
  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === "new") await createFounder(form);
      else await updateFounder(editing, form);
      setEditing(null);
      onChange();
    } catch (err) {
      alert(err?.message || "Save failed");
    }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this team member?")) return;
    try {
      await deleteFounder(id);
      onChange();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
          Team / Founders
        </h3>
        <button
          onClick={startNew}
          className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-2 text-[13px] font-semibold hover:bg-burgundy-light"
        >
          <Plus className="w-4 h-4" />
          New member
        </button>
      </div>
      {editing && (
        <form
          onSubmit={save}
          className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <Field label="Name">
            <input
              required
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Role">
            <input
              value={form.role || ""}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="md:col-span-2">
            <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">
              Team photograph
            </span>
            <div className="mt-1 flex items-end gap-2 flex-wrap">
              <MediaPicker
                value={form.img ? {
                  id: form.photoMediaId,
                  public_url: form.img,
                  alt_text: form.imgAlt,
                  title: form.name ? `${form.name} photograph` : "Team photograph",
                } : null}
                onChange={(asset) => setForm({
                  ...form,
                  img: asset.public_url,
                  imgAlt: asset.alt_text || "",
                  photoMediaId: asset.id,
                })}
                buttonLabel={form.img ? "Replace photograph" : "Choose photograph"}
              />
              {form.img && (
                <button
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    img: "",
                    imgAlt: "",
                    photoMediaId: null,
                  })}
                  className="rounded-full ring-1 ring-ivory-300 px-4 py-2 text-[13px] font-semibold text-ink/70 hover:bg-ivory-200"
                >
                  Remove photograph
                </button>
              )}
            </div>
            {form.img && !form.photoMediaId && (
              <p className="mt-2 text-amber-800 text-[12px]">
                This profile still uses a legacy image URL. Choose a library image to protect it from accidental deletion.
              </p>
            )}
          </div>
          <Field label="Photograph alt text">
            <input
              required={!!form.img}
              value={form.imgAlt || ""}
              onChange={(e) => setForm({ ...form, imgAlt: e.target.value })}
              placeholder="Describe the team photograph"
              className={inputCls}
            />
          </Field>
          <Field label="LinkedIn URL">
            <input
              value={form.linkedin || ""}
              onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="One-line summary">
              <input
                value={form.short || ""}
                onChange={(e) => setForm({ ...form, short: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Bio (paragraph)">
              <textarea
                rows={5}
                value={form.bio || ""}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Preferred medium">
            <input
              value={form.medium || ""}
              onChange={(e) => setForm({ ...form, medium: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Why art?">
            <input
              value={form.why_art || ""}
              onChange={(e) => setForm({ ...form, why_art: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Fun fact">
            <input
              value={form.funfact || ""}
              onChange={(e) => setForm({ ...form, funfact: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Display order">
            <input
              type="number"
              value={form.order || 0}
              onChange={(e) =>
                setForm({ ...form, order: Number(e.target.value) })
              }
              className={inputCls}
            />
          </Field>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={cancel}
              className="rounded-full ring-1 ring-ivory-300 px-4 py-2 text-[13.5px] font-semibold hover:bg-ivory-200 inline-flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-1">
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      )}
      <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 overflow-hidden">
        <div className="grid grid-cols-[64px_minmax(0,2fr)_minmax(0,1.4fr)_auto] text-[11.5px] font-semibold text-ink/60 uppercase tracking-widest px-4 py-3 border-b border-ivory-300 bg-ivory-200/50">
          <div>Photo</div>
          <div>Name</div>
          <div>Role</div>
          <div>Actions</div>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-ink/60 text-[13.5px]">
            No team members yet.
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[64px_minmax(0,2fr)_minmax(0,1.4fr)_auto] items-center px-4 py-3 border-b border-ivory-300 last:border-b-0 text-[13.5px]"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-ivory-300 bg-ivory-200">
                {r.img && (
                  <img
                    src={r.img}
                    alt={r.imgAlt || r.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-ink truncate">{r.name}</div>
                <div className="text-ink/60 text-[12px] truncate">
                  /{r.slug}
                </div>
              </div>
              <div className="text-ink/70 truncate">{r.role}</div>
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => startEdit(r)}
                  className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-burgundy"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ---- Volunteer Roles Manager (with visual question editor) ----
const QUESTION_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Multiple choice" },
];

const QuestionEditor = ({ questions, onChange }) => {
  const update = (idx, patch) =>
    onChange(questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  const remove = (idx) => onChange(questions.filter((_, i) => i !== idx));
  const move = (idx, dir) => {
    const to = idx + dir;
    if (to < 0 || to >= questions.length) return;
    const next = [...questions];
    const [it] = next.splice(idx, 1);
    next.splice(to, 0, it);
    onChange(next);
  };
  const add = () =>
    onChange([
      ...questions,
      {
        id: `q${Date.now()}`,
        label: "New question",
        type: "text",
        required: false,
        options: [],
      },
    ]);

  return (
    <div className="rounded-2xl bg-ivory-200/40 ring-1 ring-ivory-300 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11.5px] tracking-widest text-burgundy font-semibold">
          APPLICATION QUESTIONS
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-burgundy text-[12.5px] font-semibold rounded-full ring-1 ring-burgundy/30 px-3 py-1 hover:bg-burgundy/10"
        >
          <Plus className="w-3.5 h-3.5" />
          Add question
        </button>
      </div>
      {questions.length === 0 && (
        <div className="text-ink/60 text-[13px]">
          No questions yet — the applicant will only see name / email / phone.
        </div>
      )}
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div
            key={q.id || i}
            className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] gap-2 items-start">
              <input
                value={q.label || ""}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Question text"
                className={inputCls}
              />
              <select
                value={q.type}
                onChange={(e) => update(i, { type: e.target.value })}
                className={inputCls}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  title="Move up"
                  className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-ink/60"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  title="Move down"
                  className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-ink/60"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  title="Remove"
                  className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4 flex-wrap">
              <label className="inline-flex items-center gap-2 text-[12.5px]">
                <input
                  type="checkbox"
                  checked={!!q.required}
                  onChange={(e) => update(i, { required: e.target.checked })}
                />
                Required
              </label>
              {(q.type === "select" || q.type === "radio") && (
                <input
                  value={(q.options || []).join(", ")}
                  onChange={(e) =>
                    update(i, {
                      options: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Options (comma separated)"
                  className={inputCls + " flex-1 min-w-[220px]"}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VolunteerRolesManager = ({ rows, onChange }) => {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const startNew = () => {
    setForm({
      title: "",
      department: "",
      commitment: "",
      location: "",
      description: "",
      responsibilities: [],
      requirements: [],
      questions: [],
      active: true,
    });
    setEditing("new");
  };
  const startEdit = (r) => {
    setForm({ ...r });
    setEditing(r.id);
  };
  const cancel = () => {
    setEditing(null);
    setForm({});
  };
  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      responsibilities: Array.isArray(form.responsibilities)
        ? form.responsibilities
        : String(form.responsibilities || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
      requirements: Array.isArray(form.requirements)
        ? form.requirements
        : String(form.requirements || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
      questions: form.questions || [],
    };
    try {
      if (editing === "new") await createVolunteerRole(payload);
      else await updateVolunteerRole(editing, payload);
      setEditing(null);
      onChange();
    } catch (err) {
      alert(err?.message || "Save failed");
    }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this role?")) return;
    try {
      await deleteVolunteerRole(id);
      onChange();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
          Volunteer roles
        </h3>
        <button
          onClick={startNew}
          className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-2 text-[13px] font-semibold hover:bg-burgundy-light"
        >
          <Plus className="w-4 h-4" />
          New role
        </button>
      </div>
      {editing && (
        <form
          onSubmit={save}
          className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <Field label="Title">
            <input
              required
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Department">
            <input
              value={form.department || ""}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Commitment">
            <input
              value={form.commitment || ""}
              onChange={(e) => setForm({ ...form, commitment: e.target.value })}
              placeholder="e.g. ~5 hrs/week"
              className={inputCls}
            />
          </Field>
          <Field label="Location">
            <input
              value={form.location || ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                rows={3}
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Responsibilities (one per line)">
              <textarea
                rows={3}
                value={
                  (form.responsibilities || []).join
                    ? (form.responsibilities || []).join("\n")
                    : form.responsibilities
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    responsibilities: e.target.value.split("\n"),
                  })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Requirements (one per line)">
              <textarea
                rows={3}
                value={
                  (form.requirements || []).join
                    ? (form.requirements || []).join("\n")
                    : form.requirements
                }
                onChange={(e) =>
                  setForm({ ...form, requirements: e.target.value.split("\n") })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span className="text-[13.5px]">
              Active (visible to applicants)
            </span>
          </label>
          <div className="md:col-span-2">
            <QuestionEditor
              questions={form.questions || []}
              onChange={(qs) => setForm({ ...form, questions: qs })}
            />
          </div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={cancel}
              className="rounded-full ring-1 ring-ivory-300 px-4 py-2 text-[13.5px] font-semibold hover:bg-ivory-200 inline-flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2 text-[13.5px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-1">
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      )}
      <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 overflow-hidden">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] text-[11.5px] font-semibold text-ink/60 uppercase tracking-widest px-4 py-3 border-b border-ivory-300 bg-ivory-200/50">
          <div>Role</div>
          <div>Department</div>
          <div>Questions</div>
          <div>Actions</div>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-ink/60 text-[13.5px]">
            No volunteer roles yet.
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center px-4 py-3 border-b border-ivory-300 last:border-b-0 text-[13.5px]"
            >
              <div>
                <div className="font-semibold text-ink truncate">
                  {r.title}{" "}
                  {r.active === false && (
                    <span className="text-[10.5px] ml-2 text-ink/50">
                      hidden
                    </span>
                  )}
                </div>
                <div className="text-ink/60 text-[12px] truncate">
                  /{r.slug}
                </div>
              </div>
              <div className="text-ink/70 truncate">{r.department || "—"}</div>
              <div className="text-ink/70">
                {(r.questions || []).length} questions
              </div>
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => startEdit(r)}
                  className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-burgundy"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
