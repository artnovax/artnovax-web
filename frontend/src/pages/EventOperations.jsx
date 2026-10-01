import React, { useEffect, useMemo, useState } from "react";

import {

  ArrowLeft,

  BarChart3,

  Check,

  ClipboardCheck,

  Download,

  ExternalLink,

  Loader2,

  Plus,

  RefreshCw,

  Save,

  Settings2,

  Ticket,

  Trash2,

  UserPlus,

  Users,

} from "lucide-react";

import Header from "../components/Header";

import Footer from "../components/Footer";

import { getCurrentRole, getSession } from "../services/admin";

import {

  addEventWalkIn,

  finalizeEventAttendance,

  getEventFeedback,

  getEventRegistrations,

  getEvents,

  isEventEnded,

  setRegistrationAttendance,

  updateEvent,

} from "../services/events";



const questionTypes = [

  ["text", "Short text"],

  ["textarea", "Long text"],

  ["number", "Number"],

  ["select", "Dropdown"],

  ["radio", "Single choice"],

  ["checkbox", "Checkbox"],

  ["checkbox-group", "Multiple select"],

];



const inputClass =

  "w-full rounded-lg ring-1 ring-ivory-300 bg-ivory px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-burgundy/40";



const formatDateTime = (value) => {

  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();

};



const ConsentValue = ({ value }) => (

  <span className={value === true ? "text-emerald-700" : value === false ? "text-ink/60" : "text-ink/40"}>

    {value === true ? "Yes" : value === false ? "No" : "Not answered"}

  </span>

);



const OptionsInput = ({ options = [], onChange }) => {

  const [draft, setDraft] = useState(() => options.join(", "));



  useEffect(() => {

    setDraft(options.join(", "));

  }, [options]);



  const commit = () => {

    const normalized = draft

      .split(",")

      .map((value) => value.trim())

      .filter(Boolean);



    onChange(normalized);

  };



  return (

    <input

      value={draft}

      onChange={(event) => setDraft(event.target.value)}

      onBlur={commit}

      placeholder="Options, comma-separated"

      className={inputClass}

    />

  );

};



const NumberListInput = ({

  values = [],

  onChange,

  placeholder = "",

  className = "",

}) => {

  const [draft, setDraft] = useState(() => values.join(", "));



  useEffect(() => {

    setDraft(values.join(", "));

  }, [values]);



  const commit = () => {

    const normalized = [

      ...new Set(

        draft

          .split(",")

          .map((value) => value.trim())

          .filter(Boolean)

          .map(Number)

          .filter((value) => Number.isFinite(value) && value > 0),

      ),

    ].sort((a, b) => b - a);



    onChange(normalized);

  };



  return (

    <input

      value={draft}

      onChange={(event) => setDraft(event.target.value)}

      onBlur={commit}

      placeholder={placeholder}

      className={`${inputClass} ${className}`.trim()}

    />

  );

};



const QuestionEditor = ({ questions, onChange, title }) => {

  const update = (index, patch) =>

    onChange(

      questions.map((question, questionIndex) =>

        questionIndex === index ? { ...question, ...patch } : question,

      ),

    );



  const add = () =>

    onChange([

      ...questions,

      {

        id: `q_${Date.now()}`,

        label: "New question",

        type: "text",

        required: false,

        options: [],

      },

    ]);



  const remove = (index) =>

    onChange(questions.filter((_, questionIndex) => questionIndex !== index));



  const move = (index, direction) => {

    const destination = index + direction;

    if (destination < 0 || destination >= questions.length) return;

    const next = [...questions];

    [next[index], next[destination]] = [next[destination], next[index]];

    onChange(next);

  };



  return (

    <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 space-y-4">

      <div className="flex items-center justify-between gap-3 flex-wrap">

        <div>

          <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">{title}</h3>

          <p className="text-[12px] text-ink/60 mt-1">

            For Dropdown, Single choice, and Multiple select questions, enter each option separated by a comma. Multiple-select answers are stored as an array.

          </p>

        </div>

        <button

          type="button"

          onClick={add}

          className="inline-flex items-center gap-1.5 rounded-full ring-1 ring-burgundy/30 px-3 py-2 text-[12.5px] font-semibold text-burgundy hover:bg-burgundy/10"

        >

          <Plus className="w-4 h-4" /> Add question

        </button>

      </div>



      {questions.length === 0 && (

        <div className="rounded-xl bg-ivory ring-1 ring-ivory-300 px-4 py-5 text-[13px] text-ink/60">

          No custom questions configured. The public form will use its built-in defaults.

        </div>

      )}



      {questions.map((question, index) => {

        const hasOptions = ["select", "radio", "checkbox-group"].includes(question.type);

        return (

          <div

            key={question.id || index}

            className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 space-y-3"

          >

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] gap-2">

              <input

                value={question.label || ""}

                onChange={(event) =>

                  update(index, { label: event.target.value })

                }

                placeholder="Question"

                className={inputClass}

              />

              <select

                value={question.type || "text"}

                onChange={(event) =>

                  update(index, { type: event.target.value })

                }

                className={inputClass}

              >

                {questionTypes.map(([value, label]) => (

                  <option key={value} value={value}>

                    {label}

                  </option>

                ))}

              </select>

              <div className="flex gap-1 justify-end">

                <button

                  type="button"

                  onClick={() => move(index, -1)}

                  disabled={index === 0}

                  className="w-8 h-8 rounded-full hover:bg-ivory-200 disabled:opacity-30"

                >

                  ↑

                </button>

                <button

                  type="button"

                  onClick={() => move(index, 1)}

                  disabled={index === questions.length - 1}

                  className="w-8 h-8 rounded-full hover:bg-ivory-200 disabled:opacity-30"

                >

                  ↓

                </button>

                <button

                  type="button"

                  onClick={() => remove(index)}

                  className="w-8 h-8 rounded-full hover:bg-red-50 text-red-700 inline-flex items-center justify-center"

                >

                  <Trash2 className="w-4 h-4" />

                </button>

              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

              <input

                value={question.help || ""}

                onChange={(event) =>

                  update(index, { help: event.target.value })

                }

                placeholder="Optional help text"

                className={inputClass}

              />

              {hasOptions ? (

                <OptionsInput

                  options={question.options || []}

                  onChange={(options) => update(index, { options })}

                />

              ) : question.type === "checkbox" ? (

                <input

                  value={question.checkboxLabel || ""}

                  onChange={(event) =>

                    update(index, { checkboxLabel: event.target.value })

                  }

                  placeholder="Checkbox label, e.g. I agree"

                  className={inputClass}

                />

              ) : (

                <div />

              )}

            </div>

            <label className="inline-flex items-center gap-2 text-[12.5px] text-ink/75">

              <input

                type="checkbox"

                checked={!!question.required}

                onChange={(event) =>

                  update(index, { required: event.target.checked })

                }

              />

              Required

            </label>

          </div>

        );

      })}

    </section>

  );

};



const EventOperations = () => {

  const [authorized, setAuthorized] = useState(null);

  const [events, setEvents] = useState([]);

  const [selectedId, setSelectedId] = useState("");

  const [registrations, setRegistrations] = useState([]);

  const [feedback, setFeedback] = useState([]);

  const [tab, setTab] = useState("setup");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [workingId, setWorkingId] = useState(null);

  const [error, setError] = useState(null);

  const [walkIn, setWalkIn] = useState({ name: "", email: "", phone: "" });



  const selected = useMemo(

    () => events.find((event) => event.id === selectedId) || null,

    [events, selectedId],

  );



  const loadEvents = async (preferredId = null) => {

    const loaded = await getEvents({ includeDrafts: true });

    setEvents(loaded);

    const nextId = preferredId || selectedId || loaded[0]?.id || "";

    setSelectedId(nextId);

    return nextId;

  };



  const loadEventData = async (eventId) => {

    if (!eventId) {

      setRegistrations([]);

      setFeedback([]);

      return;

    }

    const [registrationRows, feedbackRows] = await Promise.all([

      getEventRegistrations(eventId),

      getEventFeedback(eventId),

    ]);

    setRegistrations(registrationRows);

    setFeedback(feedbackRows);

  };



  const refresh = async () => {

    setLoading(true);

    setError(null);

    try {

      const eventId = await loadEvents(selectedId);

      await loadEventData(eventId);

    } catch (loadError) {

      setError(loadError?.message || "Unable to load event operations.");

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    (async () => {

      try {

        const session = await getSession();

        if (!session) {

          setAuthorized(false);

          return;

        }

        const role = await getCurrentRole();

        const allowed = ["admin", "editor"].includes(role);

        setAuthorized(allowed);

        if (!allowed) return;

        const eventId = await loadEvents();

        await loadEventData(eventId);

      } catch (loadError) {

        setError(loadError?.message || "Unable to load event operations.");

      } finally {

        setLoading(false);

      }

    })();

  }, []);



  useEffect(() => {

    if (!authorized || !selectedId) return;

    setLoading(true);

    loadEventData(selectedId)

      .catch((loadError) => setError(loadError?.message || "Unable to load event data."))

      .finally(() => setLoading(false));

  }, [selectedId, authorized]);



  const patchSelected = (patch) =>

    setEvents((current) =>

      current.map((event) =>

        event.id === selectedId ? { ...event, ...patch } : event,

      ),

    );



  const saveSetup = async () => {

    if (!selected) return;

    setSaving(true);

    setError(null);

    try {

      const saved = await updateEvent(selected.id, selected);

      setEvents((current) => current.map((event) => event.id === saved.id ? saved : event));

      window.alert("Event lifecycle settings saved.");

    } catch (saveError) {

      setError(saveError?.message || "Unable to save settings.");

    } finally {

      setSaving(false);

    }

  };



  const changeAttendance = async (registration, nextStatus) => {

    setWorkingId(registration.id);

    setError(null);

    try {

      await setRegistrationAttendance(registration.id, nextStatus);

      await loadEventData(selectedId);

    } catch (attendanceError) {

      setError(attendanceError?.message || "Unable to update attendance.");

    } finally {

      setWorkingId(null);

    }

  };



  const addWalkIn = async (event) => {

    event.preventDefault();

    if (!walkIn.name.trim()) return;

    setSaving(true);

    setError(null);

    try {

      await addEventWalkIn({ eventId: selectedId, ...walkIn });

      setWalkIn({ name: "", email: "", phone: "" });

      await loadEventData(selectedId);

    } catch (walkInError) {

      setError(walkInError?.message || "Unable to add walk-in.");

    } finally {

      setSaving(false);

    }

  };



  const finalize = async () => {

    if (!selected) return;

    const pendingCount = registrations.filter(

      (registration) => registration.status === "confirmed" && registration.attendance_status === "pending",

    ).length;

    const message = pendingCount

      ? `Finalize attendance? ${pendingCount} remaining confirmed registration${pendingCount === 1 ? "" : "s"} will be marked no-show. Feedback can be sent after finalization.`

      : "Finalize attendance for this event? Feedback can be sent after finalization.";

    if (!window.confirm(message)) return;



    setSaving(true);

    setError(null);

    try {

      await finalizeEventAttendance(selected.id);

      const eventId = await loadEvents(selected.id);

      await loadEventData(eventId);

    } catch (finalizeError) {

      setError(finalizeError?.message || "Unable to finalize attendance.");

    } finally {

      setSaving(false);

    }

  };



  const metrics = useMemo(() => {

    const count = (predicate) => registrations.filter(predicate).length;

    const attended = count((registration) => registration.attendance_status === "attended");

    const responses = feedback.length;

    return {

      total: registrations.length,

      confirmed: count((registration) => registration.status === "confirmed"),

      waitlist: count((registration) => registration.status === "waitlist"),

      cancelled: count((registration) => registration.status === "cancelled"),

      attended,

      noShow: count((registration) => registration.attendance_status === "no_show"),

      walkIns: count((registration) => registration.registration_source === "walk_in"),

      responses,

      responseRate: attended ? Math.round((responses / attended) * 100) : 0,

      evaluationYes: count((registration) => registration.evaluation_consent === true),

      futureContactYes: count((registration) => registration.future_contact_consent === true),

      photoYes: count((registration) => registration.photo_consent === true),

    };

  }, [registrations, feedback]);



  const downloadCsv = () => {

    const headers = [

      "name", "email", "phone", "registration_status", "attendance_status", "registration_source",

      "evaluation_consent", "future_contact_consent", "photo_consent", "created_at", "checked_in_at",

      "feedback_email_sent_at", "feedback_submitted_at", "answers_json",

    ];

    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

    const lines = [headers.join(",")];

    registrations.forEach((registration) => {

      lines.push([

        registration.name,

        registration.email,

        registration.phone,

        registration.status,

        registration.attendance_status,

        registration.registration_source,

        registration.evaluation_consent,

        registration.future_contact_consent,

        registration.photo_consent,

        registration.created_at,

        registration.checked_in_at,

        registration.feedback_email_sent_at,

        registration.feedback_submitted_at,

        JSON.stringify(registration.answers || {}),

      ].map(escape).join(","));

    });



    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;

    anchor.download = `${selected?.slug || "event"}-registrations.csv`;

    anchor.click();

    URL.revokeObjectURL(url);

  };



  if (authorized === false) {

    return (

      <div className="min-h-screen bg-ivory">

        <Header activePath="/admin" />

        <section className="mx-auto max-w-[720px] px-4 md:px-8 py-16 text-center">

          <h1 className="font-serif-display text-burgundy text-[34px] font-semibold">Staff access required</h1>

          <p className="mt-2 text-ink/65">Sign in from the main admin dashboard first.</p>

          <a href="/admin" className="mt-6 inline-flex rounded-full bg-burgundy text-ivory px-5 py-3 font-semibold">Go to admin sign in</a>

        </section>

        <Footer />

      </div>

    );

  }



  return (

    <div className="min-h-screen bg-ivory">

      <Header activePath="/admin" />

      <section className="mx-auto max-w-[1240px] px-4 md:px-8 py-10 md:py-14">

        <div className="flex items-start justify-between gap-4 flex-wrap">

          <div>

            <a href="/admin" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-burgundy hover:underline">

              <ArrowLeft className="w-4 h-4" /> Main CMS

            </a>

            <h1 className="mt-2 font-serif-display text-burgundy text-[34px] md:text-[42px] font-semibold">Event operations</h1>

            <p className="mt-1 text-[13.5px] text-ink/60">

              Registration setup, reminders, attendance, feedback and event reporting.

            </p>

          </div>

          <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-full ring-1 ring-burgundy/30 px-4 py-2 text-[13px] font-semibold text-burgundy disabled:opacity-50">

            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh

          </button>

        </div>



        {error && <div className="mt-4 rounded-xl bg-red-50 text-red-800 px-4 py-3 text-[13px]">{error}</div>}



        <div className="mt-6 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4">

          <label className="text-[11.5px] uppercase tracking-widest font-semibold text-ink/60">Event</label>

          <div className="mt-2 flex items-center gap-3 flex-wrap">

            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className={`${inputClass} max-w-[620px]`}>

              {events.map((event) => (

                <option key={event.id} value={event.id}>

                  {event.title} — {event.status}

                </option>

              ))}

            </select>

            {selected && (

              <a href={`/events/${selected.slug || selected.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-burgundy text-[12.5px] font-semibold">

                View public event <ExternalLink className="w-3.5 h-3.5" />

              </a>

            )}

          </div>

          {selected && (

            <div className="mt-3 flex flex-wrap gap-2 text-[11.5px]">

              <span className="rounded-full bg-ivory px-3 py-1 ring-1 ring-ivory-300">Status: <b>{selected.status}</b></span>

              <span className="rounded-full bg-ivory px-3 py-1 ring-1 ring-ivory-300">Ends: <b>{formatDateTime(selected.endsAt || selected.ends_at)}</b></span>

              <span className="rounded-full bg-ivory px-3 py-1 ring-1 ring-ivory-300">Attendance: <b>{selected.attendanceFinalizedAt ? "finalized" : "open"}</b></span>

            </div>

          )}

        </div>



        <div className="mt-5 flex flex-wrap gap-2">

          {[

            ["setup", Settings2, "Setup"],

            ["registrations", Ticket, `Registrations (${registrations.length})`],

            ["attendance", ClipboardCheck, "Attendance"],

            ["feedback", Users, `Feedback (${feedback.length})`],

            ["reporting", BarChart3, "Reporting"],

          ].map(([key, Icon, label]) => (

            <button key={key} onClick={() => setTab(key)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold ${tab === key ? "bg-burgundy text-ivory" : "bg-ivory-100 ring-1 ring-ivory-300 text-ink/70"}`}>

              <Icon className="w-4 h-4" /> {label}

            </button>

          ))}

        </div>



        {!selected ? (

          <div className="mt-8 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60">No events available.</div>

        ) : tab === "setup" ? (

          <div className="mt-6 space-y-5">

            <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5">

              <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">Reminder schedule</h3>

              <p className="mt-1 text-[12px] text-ink/60">Enter hours before the event. Leave the field empty to disable reminders completely.</p>

              <NumberListInput

                values={selected.reminder_hours || []}

                onChange={(reminder_hours) =>

                  patchSelected({ reminder_hours })

                }

                placeholder="48, 24, 2"

                className="mt-3"

              />

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">

                <label className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4 flex items-center gap-3">

                  <input type="checkbox" checked={selected.feedbackEnabled !== false} onChange={(event) => patchSelected({ feedbackEnabled: event.target.checked, feedback_enabled: event.target.checked })} />

                  <span className="text-[13px] font-semibold text-ink">Send post-event feedback invitations</span>

                </label>

                <label className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4">

                  <span className="block text-[11px] uppercase tracking-widest text-ink/60 font-semibold">Feedback delay after event end (hours)</span>

                  <input type="number" min="0" max="720" value={selected.feedbackDelayHours ?? 24} onChange={(event) => patchSelected({ feedbackDelayHours: Number(event.target.value), feedback_delay_hours: Number(event.target.value) })} className={`${inputClass} mt-2`} />

                </label>

              </div>

            </section>



            <QuestionEditor

              title="Registration questions"

              questions={selected.questions || []}

              onChange={(questions) => patchSelected({ questions })}

            />



            <QuestionEditor

              title="Feedback questions"

              questions={selected.feedbackQuestions || selected.feedback_questions || []}

              onChange={(feedbackQuestions) => patchSelected({ feedbackQuestions, feedback_questions: feedbackQuestions })}

            />



            <div className="flex justify-end">

              <button onClick={saveSetup} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-3 text-[13.5px] font-semibold disabled:opacity-60">

                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}

                {saving ? "Saving…" : "Save lifecycle settings"}

              </button>

            </div>

          </div>

        ) : tab === "registrations" ? (

          <div className="mt-6 space-y-3">

            {registrations.length === 0 ? (

              <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60">No registrations yet.</div>

            ) : registrations.map((registration) => (

              <details key={registration.id} className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4">

                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 flex-wrap">

                  <div>

                    <div className="font-semibold text-ink">{registration.name} <span className="font-normal text-ink/50">— {registration.email || "walk-in"}</span></div>

                    <div className="mt-1 text-[11.5px] text-ink/60">{registration.status} • {registration.registration_source || "web"} • {formatDateTime(registration.created_at)}</div>

                  </div>

                  <span className="rounded-full bg-ivory px-3 py-1 text-[11px] ring-1 ring-ivory-300">{registration.attendance_status || "pending"}</span>

                </summary>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 text-[12.5px]">

                  <div className="rounded-xl bg-ivory p-4 ring-1 ring-ivory-300">

                    <div className="text-[11px] uppercase tracking-widest text-ink/50 font-semibold">Consent</div>

                    <div className="mt-2 space-y-1"><b>Evaluation:</b> <ConsentValue value={registration.evaluation_consent} /></div>

                    <div className="space-y-1"><b>Future contact:</b> <ConsentValue value={registration.future_contact_consent} /></div>

                    <div className="space-y-1"><b>Photo/video:</b> <ConsentValue value={registration.photo_consent} /></div>

                    <div className="mt-1 text-ink/50">Version: {registration.consent_version || "—"}</div>

                  </div>

                  <div className="rounded-xl bg-ivory p-4 ring-1 ring-ivory-300">

                    <div className="text-[11px] uppercase tracking-widest text-ink/50 font-semibold">Answers</div>

                    <div className="mt-2 space-y-2">

                      {Object.entries(registration.answers || {}).filter(([key]) => key !== "_consent").map(([key, value]) => (

                        <div key={key}><b>{key}:</b> {Array.isArray(value) ? value.join(", ") : String(value ?? "")}</div>

                      ))}

                    </div>

                  </div>

                </div>

              </details>

            ))}

          </div>

        ) : tab === "attendance" ? (

          <div className="mt-6 space-y-5">

            <form onSubmit={addWalkIn} className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5">

              <div className="flex items-center gap-2 text-burgundy font-semibold"><UserPlus className="w-4 h-4" /> Add walk-in attendee</div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">

                <input required value={walkIn.name} onChange={(event) => setWalkIn({ ...walkIn, name: event.target.value })} placeholder="Name *" className={inputClass} />

                <input type="email" value={walkIn.email} onChange={(event) => setWalkIn({ ...walkIn, email: event.target.value })} placeholder="Email (optional)" className={inputClass} />

                <input value={walkIn.phone} onChange={(event) => setWalkIn({ ...walkIn, phone: event.target.value })} placeholder="Phone (optional)" className={inputClass} />

              </div>

              <button disabled={saving} className="mt-3 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-2 text-[12.5px] font-semibold disabled:opacity-60"><Plus className="w-4 h-4" /> Add walk-in</button>

            </form>



            <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 overflow-hidden">

              {registrations.filter((registration) => registration.status === "confirmed").map((registration) => (

                <div key={registration.id} className="px-4 py-3 border-b border-ivory-300 last:border-0 flex items-center justify-between gap-3 flex-wrap">

                  <div>

                    <div className="font-semibold text-[13.5px] text-ink">{registration.name}</div>

                    <div className="text-[11.5px] text-ink/55">{registration.email || "No email"} • {registration.registration_source || "web"}</div>

                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">

                    {["attended", "no_show", "pending"].map((status) => (

                      <button

                        key={status}

                        type="button"

                        disabled={workingId === registration.id}

                        onClick={() => changeAttendance(registration, status)}

                        className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold ring-1 ${registration.attendance_status === status ? "bg-burgundy text-ivory ring-burgundy" : "bg-ivory text-ink/70 ring-ivory-300"}`}

                      >

                        {status === "no_show" ? "No-show" : status.charAt(0).toUpperCase() + status.slice(1)}

                      </button>

                    ))}

                  </div>

                </div>

              ))}

            </div>



            <section className="rounded-2xl bg-burgundy/5 ring-1 ring-burgundy/20 p-5">

              <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">Finalize attendance</h3>

              <p className="mt-1 text-[12.5px] text-ink/70 leading-relaxed">

                Finalization is intentionally separate from RSVP status. It marks remaining confirmed, pending registrations as no-shows. Feedback invitations are not eligible until this step is complete.

              </p>

              {selected.attendanceFinalizedAt ? (

                <div className="mt-3 inline-flex items-center gap-2 text-emerald-700 text-[12.5px] font-semibold"><Check className="w-4 h-4" /> Finalized {formatDateTime(selected.attendanceFinalizedAt)}</div>

              ) : (

                <button onClick={finalize} disabled={saving || !isEventEnded(selected)} className="mt-3 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-2.5 text-[12.5px] font-semibold disabled:opacity-40">

                  <ClipboardCheck className="w-4 h-4" /> Finalize attendance

                </button>

              )}

              {!isEventEnded(selected) && !selected.attendanceFinalizedAt && <p className="mt-2 text-[11.5px] text-ink/50">Available after the event ends.</p>}

            </section>

          </div>

        ) : tab === "feedback" ? (

          <div className="mt-6 space-y-4">

            <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5">

              <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">Feedback delivery</h3>

              <p className="mt-1 text-[12.5px] text-ink/65 leading-relaxed">

                The scheduled feedback worker only emails confirmed attendees marked attended, only after attendance is finalized, and only after the configured delay from the event end time.

              </p>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">

                <Metric label="Attended" value={metrics.attended} />

                <Metric label="Invitations sent" value={registrations.filter((registration) => !!registration.feedback_email_sent_at).length} />

                <Metric label="Responses" value={metrics.responses} />

                <Metric label="Response rate" value={`${metrics.responseRate}%`} />

              </div>

            </section>

            {feedback.length === 0 ? (

              <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60">No feedback submitted yet.</div>

            ) : feedback.map((response) => (

              <details key={response.id} className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4">

                <summary className="cursor-pointer list-none flex justify-between gap-3"><b>Response</b><span className="text-[11.5px] text-ink/60">{formatDateTime(response.submitted_at)}</span></summary>

                <div className="mt-3 space-y-2 text-[12.5px]">

                  {Object.entries(response.answers || {}).map(([key, value]) => <div key={key}><b>{key}:</b> {Array.isArray(value) ? value.join(", ") : String(value ?? "")}</div>)}

                </div>

              </details>

            ))}

          </div>

        ) : (

          <div className="mt-6 space-y-5">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              <Metric label="Registrations" value={metrics.total} />

              <Metric label="Confirmed" value={metrics.confirmed} />

              <Metric label="Waitlist" value={metrics.waitlist} />

              <Metric label="Cancelled" value={metrics.cancelled} />

              <Metric label="Attended" value={metrics.attended} />

              <Metric label="No-shows" value={metrics.noShow} />

              <Metric label="Walk-ins" value={metrics.walkIns} />

              <Metric label="Feedback rate" value={`${metrics.responseRate}%`} />

            </div>

            <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5">

              <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">Consent snapshot</h3>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">

                <Metric label="Evaluation / research — Yes" value={metrics.evaluationYes} />

                <Metric label="Future contact — Yes" value={metrics.futureContactYes} />

                <Metric label="Photo / video — Yes" value={metrics.photoYes} />

              </div>

            </section>

            <div className="flex justify-end">

              <button onClick={downloadCsv} className="inline-flex items-center gap-2 rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2.5 text-[12.5px] font-semibold"><Download className="w-4 h-4" /> Download registration CSV</button>

            </div>

          </div>

        )}

      </section>

      <Footer />

    </div>

  );

};



const Metric = ({ label, value }) => (

  <div className="rounded-xl bg-ivory-100 ring-1 ring-ivory-300 p-4 text-center">

    <div className="font-serif-display text-burgundy text-[26px] font-semibold">{value}</div>

    <div className="mt-1 text-[11px] uppercase tracking-wider text-ink/55 font-semibold">{label}</div>

  </div>

);



export default EventOperations;
