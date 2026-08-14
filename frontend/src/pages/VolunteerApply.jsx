import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  Clock,
  Briefcase,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  getVolunteerRole,
  submitVolunteerApplication,
} from "../services/content";

const renderField = (q, value, onChange) => {
  const cls =
    "w-full rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40";
  const set = (v) => onChange(q.id, v);
  if (q.type === "textarea")
    return (
      <textarea
        value={value || ""}
        onChange={(e) => set(e.target.value)}
        rows={4}
        className={cls}
        required={q.required}
      />
    );
  if (q.type === "select")
    return (
      <select
        value={value || ""}
        onChange={(e) => set(e.target.value)}
        required={q.required}
        className={cls}
      >
        <option value="">Select…</option>
        {(q.options || []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  if (q.type === "radio")
    return (
      <div className="flex flex-wrap gap-3">
        {(q.options || []).map((o) => (
          <label
            key={o}
            className={`cursor-pointer inline-flex items-center gap-2 rounded-full ring-1 px-4 py-2 text-[13.5px] ${value === o ? "bg-burgundy text-ivory ring-burgundy" : "ring-ivory-300 bg-ivory-100 text-ink hover:ring-burgundy/40"}`}
          >
            <input
              type="radio"
              name={q.id}
              className="sr-only"
              checked={value === o}
              onChange={() => set(o)}
              required={q.required && !value}
            />
            {o}
          </label>
        ))}
      </div>
    );
  return (
    <input
      type={q.type === "email" ? "email" : q.type === "phone" ? "tel" : "text"}
      value={value || ""}
      onChange={(e) => set(e.target.value)}
      required={q.required}
      className={cls}
    />
  );
};

const VolunteerApply = () => {
  const { slug } = useParams();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setRole(await getVolunteerRole(slug));
      } catch {
        setErr("Role not found.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      await submitVolunteerApplication({
        roleId: role.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        answers,
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErr(e?.message || "Application failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const setAns = (k, v) => setAnswers((a) => ({ ...a, [k]: v }));

  if (loading)
    return (
      <Shell>
        <div className="text-center py-24 text-ink/60">Loading…</div>
      </Shell>
    );
  if (!role)
    return (
      <Shell>
        <div className="text-center py-24">
          <h1 className="font-serif-display text-burgundy text-[28px] font-semibold">
            Role not found
          </h1>
        </div>
      </Shell>
    );
  if (done)
    return (
      <Shell>
        <div className="mx-auto max-w-[560px] rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-burgundy" />
          </div>
          <h1 className="mt-4 font-serif-display text-burgundy text-[30px] font-semibold">
            Thank you — we’ve got your application.
          </h1>
          <p className="mt-2 text-ink/75 text-[14.5px]">
            Our team reviews applications every week and will be in touch.
          </p>
          <a
            href="/get-involved/volunteer"
            className="cta-btn mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold hover:bg-burgundy-light"
          >
            See other roles <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </Shell>
    );

  return (
    <Shell>
      <a
        href="/get-involved/volunteer"
        className="inline-flex items-center gap-1 text-burgundy text-[13.5px] font-semibold hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        All roles
      </a>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-8">
        <aside className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-6 h-fit">
          <div className="text-burgundy tracking-widest text-[11px] font-semibold">
            {(role.department || "").toUpperCase()}
          </div>
          <h1 className="mt-1 font-serif-display text-burgundy text-[26px] font-semibold">
            {role.title}
          </h1>
          <div className="mt-3 flex items-center gap-3 flex-wrap text-ink/70 text-[12.5px]">
            {role.commitment && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-burgundy" />
                {role.commitment}
              </span>
            )}
            {role.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-burgundy" />
                {role.location}
              </span>
            )}
            {role.department && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-burgundy" />
                {role.department}
              </span>
            )}
          </div>
          {role.description && (
            <p className="mt-4 text-ink/85 text-[14px] leading-relaxed">
              {role.description}
            </p>
          )}
          {(role.responsibilities || []).length > 0 && (
            <div className="mt-4">
              <div className="text-[11.5px] tracking-widest text-burgundy font-semibold">
                RESPONSIBILITIES
              </div>
              <ul className="mt-1 text-ink/80 text-[13.5px] space-y-1">
                {role.responsibilities.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-burgundy shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(role.requirements || []).length > 0 && (
            <div className="mt-4">
              <div className="text-[11.5px] tracking-widest text-burgundy font-semibold">
                REQUIREMENTS
              </div>
              <ul className="mt-1 text-ink/80 text-[13.5px] space-y-1">
                {role.requirements.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-burgundy shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <h2 className="md:col-span-2 font-serif-display text-burgundy text-[22px] font-semibold">
            Application
          </h2>
          <input
            required
            placeholder="Full name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
          />
          <input
            required
            type="email"
            placeholder="Email *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
          />
          <input
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="md:col-span-2 rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
          />
          {(role.questions || []).map((q) => (
            <div key={q.id} className="md:col-span-2">
              <label className="block text-[12.5px] text-burgundy font-semibold tracking-wider mb-2">
                {q.label}
                {q.required && <span> *</span>}
              </label>
              {renderField(q, answers[q.id], setAns)}
            </div>
          ))}
          {err && (
            <div className="md:col-span-2 text-red-700 text-[13.5px]">
              {err}
            </div>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button
              disabled={submitting}
              className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit application <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
};

const Shell = ({ children }) => (
  <div className="min-h-screen bg-ivory">
    <Header activePath="/get-involved/volunteer" />
    <section className="mx-auto max-w-[1180px] px-4 md:px-8 py-10 md:py-14">
      {children}
    </section>
    <Footer />
  </div>
);

export default VolunteerApply;
