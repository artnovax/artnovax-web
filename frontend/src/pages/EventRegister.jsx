import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Calendar as CalIcon,
  Loader2,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getEventBySlug, registerForEvent } from "../services/events";

const googleCalendarUrl = (event) => {
  if (!event?.starts_at) return "#";
  const start = new Date(event.starts_at);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const stamp = (d) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title || "ArtNovaX Event",
    dates: `${stamp(start)}/${stamp(end)}`,
    location: event.location || "",
    details: event.body || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const defaultQuestions = [
  {
    id: "expect",
    label: "What do you hope to get out of this event?",
    type: "textarea",
    required: true,
  },
  {
    id: "experience",
    label:
      "Do you have any prior experience with art or creative wellbeing sessions?",
    type: "radio",
    required: true,
    options: ["None", "Some", "A lot"],
  },
  {
    id: "accessibility",
    label:
      "Any accessibility needs or dietary requirements we should know about?",
    type: "textarea",
  },
  {
    id: "referral",
    label: "How did you hear about this event?",
    type: "select",
    options: [
      "Friend",
      "Social media",
      "University / school",
      "Partner org",
      "Other",
    ],
  },
];

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

const EventRegister = () => {
  const { slug } = useParams();
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const event = await getEventBySlug(slug);
        setEv(event);
      } catch (error) {
        console.error("Failed to load event:", error);
        setErr("Event not found.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const questions =
    ev && ev.questions && ev.questions.length ? ev.questions : defaultQuestions;

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      const result = await registerForEvent({
        eventId: ev.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        answers,
      });
      setDone(result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErr(e?.message || "Registration failed. Try again.");
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
  if (!ev)
    return (
      <Shell>
        <div className="text-center py-24">
          <h1 className="font-serif-display text-burgundy text-[28px] font-semibold">
            Event not found
          </h1>
        </div>
      </Shell>
    );

  if (done) {
    const waitlisted = done.status === "waitlist";
    return (
      <Shell>
        <div className="mx-auto max-w-[640px] rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-burgundy" />
          </div>
          <h1 className="mt-4 font-serif-display text-burgundy text-[32px] font-semibold">
            {waitlisted
              ? "You’re on the waitlist"
              : "You’re in — see you there."}
          </h1>
          <p className="mt-2 text-ink/75 text-[14.5px]">
            {waitlisted
              ? "The room is full for now. Your place on the waitlist has been saved."
              : "Your registration has been saved. We look forward to seeing you there."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {!waitlisted && ev.starts_at && (
              <a
                href={googleCalendarUrl(ev)}
                target="_blank"
                rel="noreferrer"
                className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold hover:bg-burgundy-light"
              >
                <CalIcon className="w-4 h-4" />
                Add to calendar
              </a>
            )}
            <a
              href={`/events/${ev.slug || ev.id}`}
              className="cta-btn inline-flex items-center gap-2 rounded-full border-2 border-burgundy text-burgundy px-6 py-3 text-[14px] font-semibold hover:bg-burgundy hover:text-ivory"
            >
              Back to event
            </a>
          </div>
        </div>
      </Shell>
    );
  }

  const isFull = !!ev.is_full;

  return (
    <Shell>
      <a
        href={`/events/${ev.slug || ev.id}`}
        className="inline-flex items-center gap-1 text-burgundy text-[13.5px] font-semibold hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to event
      </a>
      <h1 className="mt-6 font-serif-display text-burgundy text-[34px] md:text-[42px] leading-tight font-semibold">
        {isFull
          ? `Join the waitlist for ${ev.title}`
          : `Register for ${ev.title}`}
      </h1>
      <p className="text-ink/70 text-[14.5px] mt-1">
        {ev.date} • {ev.location}
      </p>
      {isFull && (
        <div className="mt-4 rounded-2xl bg-burgundy/5 ring-1 ring-burgundy/20 p-4 text-[13.5px] text-ink/80">
          This session is fully booked. Leave your details and we’ll email you
          the moment a seat opens up.
        </div>
      )}
      <form
        onSubmit={submit}
        className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
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
        {questions.map((q) => (
          <div key={q.id} className="md:col-span-2">
            <label className="block text-[12.5px] text-burgundy font-semibold tracking-wider mb-2">
              {q.label}
              {q.required && <span className="text-burgundy"> *</span>}
            </label>
            {renderField(q, answers[q.id], setAns)}
            {q.help && (
              <div className="text-ink/60 text-[12px] mt-1">{q.help}</div>
            )}
          </div>
        ))}
        {err && (
          <div className="md:col-span-2 text-red-700 text-[13.5px]">{err}</div>
        )}
        <div className="md:col-span-2 flex justify-end">
          <button
            disabled={submitting}
            className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                {isFull ? "Join waitlist" : "Complete registration"}{" "}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </Shell>
  );
};

const Shell = ({ children }) => (
  <div className="min-h-screen bg-ivory">
    <Header activePath="/events" />
    <section className="mx-auto max-w-[900px] px-4 md:px-8 py-10 md:py-14">
      {children}
    </section>
    <Footer />
  </div>
);

export default EventRegister;
