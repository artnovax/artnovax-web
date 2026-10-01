import React, { useEffect, useMemo, useState } from "react";
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
import {
  getEventBySlug,
  isEventEnded,
  registerForEvent,
} from "../services/events";

const CONSENT_VERSION = "2026-09";

const googleCalendarUrl = (event) => {
  if (!event?.starts_at) return "#";

  const start = new Date(event.starts_at);
  const configuredEnd = event.ends_at || event.endsAt;
  const end = configuredEnd
    ? new Date(configuredEnd)
    : new Date(
        start.getTime() +
          Number(event.durationMinutes || event.duration_minutes || 180) *
            60 *
            1000,
      );

  const stamp = (date) =>
    date
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
    id: "prior_participation",
    label: "Have you participated in an ArtNovaX activity before?",
    type: "radio",
    options: ["Yes", "No"],
  },
  {
    id: "referral",
    label: "How did you hear about this event?",
    type: "select",
    options: [
      "Friend or family",
      "Social media",
      "University or school",
      "Partner organisation",
      "ArtNovaX event",
      "Other",
    ],
  },
  {
    id: "creative_frequency",
    label: "How often do you currently take part in creative activities?",
    type: "select",
    options: [
      "Daily",
      "A few times a week",
      "A few times a month",
      "Rarely",
      "Never",
    ],
  },
  {
    id: "creative_interests",
    label: "Which creative activities interest you? Select all that apply.",
    type: "checkbox-group",
    options: [
      "Drawing",
      "Painting",
      "Colouring",
      "Music",
      "Writing or poetry",
      "Photography",
      "Crafts",
      "Dance",
      "Other",
    ],
  },
  {
    id: "desired_outcomes",
    label: "What would you most like to get from the session? Select all that apply.",
    type: "checkbox-group",
    options: [
      "Relaxation or stress relief",
      "Creative expression",
      "Connection with others",
      "Learning something new",
      "Self-reflection",
      "Having fun",
      "Other",
    ],
  },
  {
    id: "accessibility",
    label: "Any accessibility needs or dietary requirements we should know about?",
    type: "textarea",
  },
];

const inputClass =
  "w-full rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40";

const renderField = (question, value, onChange) => {
  const set = (nextValue) => onChange(question.id, nextValue);

  if (question.type === "textarea") {
    return (
      <textarea
        value={value || ""}
        onChange={(event) => set(event.target.value)}
        rows={4}
        className={inputClass}
        required={question.required}
      />
    );
  }

  if (question.type === "select") {
    return (
      <select
        value={value || ""}
        onChange={(event) => set(event.target.value)}
        required={question.required}
        className={inputClass}
      >
        <option value="">Select…</option>
        {(question.options || []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === "radio") {
    return (
      <div className="flex flex-wrap gap-3">
        {(question.options || []).map((option) => (
          <label
            key={option}
            className={`cursor-pointer inline-flex items-center gap-2 rounded-full ring-1 px-4 py-2 text-[13.5px] ${
              value === option
                ? "bg-burgundy text-ivory ring-burgundy"
                : "ring-ivory-300 bg-ivory-100 text-ink hover:ring-burgundy/40"
            }`}
          >
            <input
              type="radio"
              name={question.id}
              className="sr-only"
              checked={value === option}
              onChange={() => set(option)}
              required={question.required && !value}
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "checkbox-group") {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (option) => {
      if (selected.includes(option)) {
        set(selected.filter((item) => item !== option));
      } else {
        set([...selected, option]);
      }
    };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(question.options || []).map((option) => (
          <label
            key={option}
            className={`cursor-pointer flex items-center gap-2 rounded-xl ring-1 px-4 py-3 text-[13.5px] ${
              selected.includes(option)
                ? "bg-burgundy/10 text-burgundy ring-burgundy/40"
                : "ring-ivory-300 bg-ivory-100 text-ink hover:ring-burgundy/40"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "checkbox") {
    return (
      <label className="inline-flex items-start gap-3 rounded-xl ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[13.5px] text-ink">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(event) => set(event.target.checked)}
          required={question.required}
          className="mt-0.5"
        />
        <span>{question.checkboxLabel || "Yes"}</span>
      </label>
    );
  }

  return (
    <input
      type={
        question.type === "email"
          ? "email"
          : question.type === "phone"
            ? "tel"
            : question.type === "number"
              ? "number"
              : "text"
      }
      value={value ?? ""}
      onChange={(event) => set(event.target.value)}
      required={question.required}
      className={inputClass}
    />
  );
};

const ConsentChoice = ({ label, value, onChange, help }) => (
  <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4">
    <div className="text-[13.5px] font-semibold text-ink">{label}</div>
    {help && <p className="mt-1 text-[12px] leading-relaxed text-ink/60">{help}</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      {[
        { label: "Yes", value: true },
        { label: "No", value: false },
      ].map((option) => (
        <button
          type="button"
          key={option.label}
          onClick={() => onChange(value === option.value ? null : option.value)}
          className={`rounded-full px-4 py-2 text-[12.5px] font-semibold ring-1 ${
            value === option.value
              ? "bg-burgundy text-ivory ring-burgundy"
              : "bg-ivory text-ink ring-ivory-300 hover:ring-burgundy/40"
          }`}
        >
          {option.label}
        </button>
      ))}
      <span className="self-center text-[11.5px] text-ink/50">Optional</span>
    </div>
  </div>
);

const EventRegister = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [answers, setAnswers] = useState({});
  const [consents, setConsents] = useState({
    evaluation: null,
    futureContact: null,
    photo: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const loadedEvent = await getEventBySlug(slug);
        setEvent(loadedEvent);
      } catch (error) {
        console.error("Failed to load event:", error);
        setErr("Event not found.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const questions = useMemo(
    () =>
      event && Array.isArray(event.questions) && event.questions.length
        ? event.questions
        : defaultQuestions,
    [event],
  );

  const registrationClosed =
    !!event && (event.status === "past" || isEventEnded(event));

  const submit = async (submitEvent) => {
    submitEvent.preventDefault();
    if (submitting || registrationClosed) return;

    const missingRequired = questions.find((question) => {
      if (!question.required) return false;
      const value = answers[question.id];
      if (question.type === "checkbox-group") {
        return !Array.isArray(value) || value.length === 0;
      }
      if (question.type === "checkbox") return value !== true;
      return value == null || String(value).trim() === "";
    });

    if (missingRequired) {
      setErr(`Please complete “${missingRequired.label}”.`);
      return;
    }

    setSubmitting(true);
    setErr(null);

    try {
      const result = await registerForEvent({
        eventId: event.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        answers,
        evaluationConsent: consents.evaluation,
        futureContactConsent: consents.futureContact,
        photoConsent: consents.photo,
        consentVersion: CONSENT_VERSION,
      });
      setDone(result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setErr(error?.message || "Registration failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const setAnswer = (key, value) =>
    setAnswers((current) => ({ ...current, [key]: value }));

  if (loading) {
    return (
      <Shell>
        <div className="text-center py-24 text-ink/60">Loading…</div>
      </Shell>
    );
  }

  if (!event) {
    return (
      <Shell>
        <div className="text-center py-24">
          <h1 className="font-serif-display text-burgundy text-[28px] font-semibold">
            Event not found
          </h1>
        </div>
      </Shell>
    );
  }

  if (registrationClosed) {
    return (
      <Shell>
        <div className="mx-auto max-w-[640px] rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center">
          <h1 className="font-serif-display text-burgundy text-[32px] font-semibold">
            Registration is closed
          </h1>
          <p className="mt-2 text-ink/70 text-[14px]">
            {event.title} has already ended, so new registrations are no longer accepted.
          </p>
          <a
            href={`/events/${event.slug || event.id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-burgundy text-burgundy px-6 py-3 text-[14px] font-semibold hover:bg-burgundy hover:text-ivory"
          >
            <ArrowLeft className="w-4 h-4" /> Back to event
          </a>
        </div>
      </Shell>
    );
  }

  if (done) {
    const waitlisted = done.status === "waitlist";
    return (
      <Shell>
        <div className="mx-auto max-w-[640px] rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-burgundy" />
          </div>
          <h1 className="mt-4 font-serif-display text-burgundy text-[32px] font-semibold">
            {waitlisted ? "You’re on the waitlist" : "You’re in — see you there."}
          </h1>
          <p className="mt-2 text-ink/75 text-[14.5px]">
            {waitlisted
              ? "The room is full for now. Your place on the waitlist has been saved."
              : "Your registration has been saved. Check your email for the confirmation and calendar file."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {!waitlisted && event.starts_at && (
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noreferrer"
                className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold hover:bg-burgundy-light"
              >
                <CalIcon className="w-4 h-4" />
                Add to calendar
              </a>
            )}
            <a
              href={`/events/${event.slug || event.id}`}
              className="cta-btn inline-flex items-center gap-2 rounded-full border-2 border-burgundy text-burgundy px-6 py-3 text-[14px] font-semibold hover:bg-burgundy hover:text-ivory"
            >
              Back to event
            </a>
          </div>
        </div>
      </Shell>
    );
  }

  const isFull = !!event.is_full;

  return (
    <Shell>
      <a
        href={`/events/${event.slug || event.id}`}
        className="inline-flex items-center gap-1 text-burgundy text-[13.5px] font-semibold hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to event
      </a>

      <h1 className="mt-6 font-serif-display text-burgundy text-[34px] md:text-[42px] leading-tight font-semibold">
        {isFull
          ? `Join the waitlist for ${event.title}`
          : `Register for ${event.title}`}
      </h1>
      <p className="text-ink/70 text-[14.5px] mt-1">
        {event.date} • {event.location}
      </p>

      {isFull && (
        <div className="mt-4 rounded-2xl bg-burgundy/5 ring-1 ring-burgundy/20 p-4 text-[13.5px] text-ink/80">
          This session is fully booked. Leave your details and we’ll save your place on the waitlist.
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
          onChange={(changeEvent) =>
            setForm({ ...form, name: changeEvent.target.value })
          }
          className={inputClass}
        />
        <input
          required
          type="email"
          placeholder="Email *"
          value={form.email}
          onChange={(changeEvent) =>
            setForm({ ...form, email: changeEvent.target.value })
          }
          className={inputClass}
        />
        <input
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(changeEvent) =>
            setForm({ ...form, phone: changeEvent.target.value })
          }
          className={`md:col-span-2 ${inputClass}`}
        />

        {questions.map((question) => (
          <div key={question.id} className="md:col-span-2">
            <label className="block text-[12.5px] text-burgundy font-semibold tracking-wider mb-2">
              {question.label}
              {question.required && <span className="text-burgundy"> *</span>}
            </label>
            {renderField(question, answers[question.id], setAnswer)}
            {question.help && (
              <div className="text-ink/60 text-[12px] mt-1">{question.help}</div>
            )}
          </div>
        ))}

        <div className="md:col-span-2 mt-3">
          <h2 className="font-serif-display text-burgundy text-[24px] font-semibold">
            Optional consent choices
          </h2>
          <p className="mt-1 text-[13px] text-ink/65 leading-relaxed">
            These choices are separate from your event registration. Leaving them unanswered will not affect your place.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <ConsentChoice
              label="May ArtNovaX use my responses for programme evaluation and research?"
              help="This may include aggregated or de-identified learning about how participants experience ArtNovaX activities."
              value={consents.evaluation}
              onChange={(value) =>
                setConsents((current) => ({ ...current, evaluation: value }))
              }
            />
            <ConsentChoice
              label="May ArtNovaX contact me in the future about related activities or research?"
              value={consents.futureContact}
              onChange={(value) =>
                setConsents((current) => ({ ...current, futureContact: value }))
              }
            />
            <ConsentChoice
              label="May ArtNovaX use photographs or video of me from this event in its communications?"
              value={consents.photo}
              onChange={(value) =>
                setConsents((current) => ({ ...current, photo: value }))
              }
            />
          </div>
        </div>

        {err && (
          <div className="md:col-span-2 rounded-xl bg-red-50 px-4 py-3 text-red-700 text-[13.5px]">
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
