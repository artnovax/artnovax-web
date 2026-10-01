import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  getEventFeedbackContext,
  submitEventFeedback,
} from "../services/events";

const defaultFeedbackQuestions = [
  {
    id: "overall_rating",
    label: "Overall, how would you rate this ArtNovaX activity?",
    type: "radio",
    required: true,
    options: ["1", "2", "3", "4", "5"],
    help: "1 = very poor, 5 = excellent",
  },
  {
    id: "feelings_during_activity",
    label: "How did you feel during the activity? Select all that apply.",
    type: "checkbox-group",
    options: [
      "Calm",
      "Relaxed",
      "Happy",
      "Connected",
      "Focused",
      "Creative",
      "Unsure",
      "Anxious",
      "Other",
    ],
  },
  {
    id: "enjoyment",
    label: "How much did you enjoy the activity?",
    type: "radio",
    options: ["Not at all", "A little", "Somewhat", "A lot", "Very much"],
  },
  {
    id: "post_activity_mood",
    label: "Compared with before the activity, how do you feel now?",
    type: "radio",
    options: [
      "Much worse",
      "A little worse",
      "About the same",
      "A little better",
      "Much better",
    ],
  },
  {
    id: "creative_expression",
    label: "Did the activity help you express yourself creatively?",
    type: "radio",
    options: ["Yes", "Somewhat", "No"],
  },
  {
    id: "inclusion",
    label: "Did you feel welcomed and included?",
    type: "radio",
    options: ["Yes", "Mostly", "No"],
  },
  {
    id: "self_discovery",
    label: "Did you learn or notice anything new about yourself?",
    type: "radio",
    options: ["Yes", "Maybe", "No"],
  },
  {
    id: "return_likelihood",
    label: "How likely are you to join another ArtNovaX activity?",
    type: "radio",
    options: ["Very unlikely", "Unlikely", "Not sure", "Likely", "Very likely"],
  },
  {
    id: "improvements",
    label: "What could we improve?",
    type: "textarea",
  },
  {
    id: "future_offerings",
    label:
      "What kinds of activities would you like ArtNovaX to offer in the future?",
    type: "textarea",
  },
];

const inputClass =
  "w-full rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40";

const FeedbackField = ({ question, value, onChange }) => {
  const set = (nextValue) => onChange(question.id, nextValue);

  if (question.type === "textarea") {
    return (
      <textarea
        rows={4}
        value={value || ""}
        onChange={(event) => set(event.target.value)}
        required={question.required}
        className={inputClass}
      />
    );
  }

  if (["text", "number", "email", "phone"].includes(question.type)) {
    const inputType =
      question.type === "phone"
        ? "tel"
        : question.type === "number"
          ? "number"
          : question.type === "email"
            ? "email"
            : "text";

    return (
      <input
        type={inputType}
        value={value ?? ""}
        onChange={(event) =>
          set(
            question.type === "number" && event.target.value !== ""
              ? Number(event.target.value)
              : event.target.value,
          )
        }
        required={question.required}
        className={inputClass}
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

  if (question.type === "checkbox") {
    return (
      <label className="inline-flex items-center gap-3 rounded-xl ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[13.5px] text-ink cursor-pointer">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => set(event.target.checked)}
          required={question.required}
        />
        <span>{question.checkboxLabel || "Yes"}</span>
      </label>
    );
  }

  if (question.type === "checkbox-group") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(question.options || []).map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className={`cursor-pointer flex items-center gap-2 rounded-xl ring-1 px-4 py-3 text-[13.5px] ${
                checked
                  ? "bg-burgundy/10 text-burgundy ring-burgundy/40"
                  : "ring-ivory-300 bg-ivory-100 text-ink hover:ring-burgundy/40"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  set(
                    checked
                      ? selected.filter((item) => item !== option)
                      : [...selected, option],
                  )
                }
              />
              {option}
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(question.options || []).map((option) => (
        <label
          key={option}
          className={`cursor-pointer rounded-full ring-1 px-4 py-2 text-[13px] font-semibold ${
            value === option
              ? "bg-burgundy text-ivory ring-burgundy"
              : "bg-ivory-100 text-ink ring-ivory-300 hover:ring-burgundy/40"
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
};

const EventFeedback = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [context, setContext] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      if (!token) {
        setError("This feedback link is incomplete.");
        setLoading(false);
        return;
      }

      try {
        const data = await getEventFeedbackContext(token);
        setContext(data);
        if (data.already_submitted) setDone(true);
      } catch (loadError) {
        setError(loadError?.message || "This feedback link is not available.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const questions = useMemo(() => {
    const configured = context?.feedback_questions;
    return Array.isArray(configured) && configured.length
      ? configured
      : defaultFeedbackQuestions;
  }, [context]);

  const setAnswer = (key, value) =>
    setAnswers((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const missing = questions.find((question) => {
      if (!question.required) return false;
      const value = answers[question.id];
      if (question.type === "checkbox-group") {
        return !Array.isArray(value) || value.length === 0;
      }
      if (question.type === "checkbox") {
        return value !== true;
      }
      return value == null || String(value).trim() === "";
    });

    if (missing) {
      setError(`Please complete “${missing.label}”.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitEventFeedback({ token, answers });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      setError(submitError?.message || "Feedback submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/events" />
      <section className="mx-auto max-w-[820px] px-4 md:px-8 py-10 md:py-14">
        {loading ? (
          <div className="py-24 text-center text-ink/60">
            Loading feedback form…
          </div>
        ) : done ? (
          <div className="rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-burgundy" />
            </div>
            <h1 className="mt-4 font-serif-display text-burgundy text-[32px] font-semibold">
              Thank you for your feedback
            </h1>
            <p className="mt-2 text-ink/70 text-[14px]">
              Your response for {context?.event_title || "this ArtNovaX event"}{" "}
              has been saved.
            </p>
            <a
              href="/events"
              className="mt-6 inline-flex rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold"
            >
              View events
            </a>
          </div>
        ) : !context ? (
          <div className="rounded-2xl bg-red-50 text-red-800 ring-1 ring-red-200 p-6">
            {error || "This feedback link is not available."}
          </div>
        ) : (
          <>
            <div className="text-burgundy tracking-[0.2em] text-[11px] font-semibold uppercase">
              Event feedback
            </div>
            <h1 className="mt-2 font-serif-display text-burgundy text-[36px] md:text-[44px] leading-tight font-semibold">
              Tell us about {context.event_title}
            </h1>
            <p className="mt-3 text-ink/70 text-[14.5px] leading-relaxed">
              Hi {context.name}. Your feedback helps ArtNovaX improve future
              activities. Answer as much as you are comfortable sharing.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5"
                >
                  <label className="block text-[13.5px] font-semibold text-burgundy mb-3">
                    {question.label}
                    {question.required && <span> *</span>}
                  </label>
                  <FeedbackField
                    question={question}
                    value={answers[question.id]}
                    onChange={setAnswer}
                  />
                  {question.help && (
                    <p className="mt-2 text-[11.5px] text-ink/55">
                      {question.help}
                    </p>
                  )}
                </div>
              ))}

              {error && (
                <div className="rounded-xl bg-red-50 text-red-800 px-4 py-3 text-[13px]">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3.5 text-[14px] font-semibold disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Submitting…" : "Submit feedback"}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default EventFeedback;
