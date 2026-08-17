import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MediaLibrary from "../components/admin/MediaLibrary";
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
                label={`Newsletter (${data.subscribers.length})`}
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
          <Field label="Image URL">
            <input
              value={form.img || ""}
              onChange={(e) => setForm({ ...form, img: e.target.value })}
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

  const startNew = () => {
    setForm({
      topic: "",
      title: "",
      excerpt: "",
      read: "6 min read",
      updated: "",
      hero: "",
      lead: "",
      bodyText: "",
      tags: "",
      takeaways: "",
    });
    setEditing("new");
  };
  const startEdit = (row) => {
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
      tags: (row.tags || []).join(", "),
      takeaways: (row.takeaways || []).join("\n"),
    });
    setEditing(row.id);
  };
  const cancel = () => {
    setEditing(null);
    setForm({});
  };

  const parseBody = (text) => {
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
        if (m)
          blocks.push({
            type: "img",
            alt: m[1],
            src: m[2],
            caption: m[3] || "",
          });
      } else blocks.push({ type: "p", text: p });
    }
    return blocks;
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
      lead: form.lead,
      blocks: parseBody(form.bodyText),
      tags: (form.tags || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      takeaways: (form.takeaways || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      slug: form.slug,
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
          <Field label="Hero image URL">
            <input
              value={form.hero || ""}
              onChange={(e) => setForm({ ...form, hero: e.target.value })}
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
            <Field label="Body (markdown-lite: ## heading, ### subheading, > quote — author, ![alt](url) — caption)">
              <textarea
                rows={12}
                value={form.bodyText || ""}
                onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
                className={inputCls + " font-mono text-[13px]"}
                placeholder="## First section&#10;Paragraph text here…&#10;&#10;![Alt text](https://example.com/image.jpg) — optional caption&#10;&#10;> Blockquote text — Author"
              />
            </Field>
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
      description: "",
      active: true,
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
          <Field label="Image URL">
            <input
              value={form.img || ""}
              onChange={(e) => setForm({ ...form, img: e.target.value })}
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
                    alt={r.name}
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
          <Field label="Photo URL">
            <input
              value={form.img || ""}
              onChange={(e) => setForm({ ...form, img: e.target.value })}
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
                    alt={r.name}
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
