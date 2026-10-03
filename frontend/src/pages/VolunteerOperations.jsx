import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  Inbox,
  Loader2,
  Mail,
  MailCheck,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getCurrentRole, getSession } from '../services/admin';
import {
  addVolunteerApplicationNote,
  getVolunteerApplicationDetails,
  getVolunteerApplications,
  getVolunteerReviewers,
  previewVolunteerApplicationEmail,
  saveVolunteerApplicationDetails,
  sendVolunteerApplicationEmail,
  setVolunteerApplicationAssignee,
  transitionVolunteerApplication,
} from '../services/volunteerAdmin';

const STAGES = [
  { key: 'new', label: 'New', group: 'active' },
  { key: 'reviewing', label: 'In Review', group: 'active' },
  { key: 'shortlisted', label: 'Shortlisted', group: 'active' },
  { key: 'interview', label: 'Interview', group: 'active' },
  { key: 'accepted', label: 'Accepted', group: 'active' },
  { key: 'onboarding', label: 'Onboarding', group: 'active' },
  { key: 'onboarded', label: 'Onboarded', group: 'closed' },
  { key: 'rejected', label: 'Rejected', group: 'closed' },
  { key: 'withdrawn', label: 'Withdrawn', group: 'closed' },
  { key: 'archived', label: 'Archived', group: 'closed' },
];

const STAGE_MAP = Object.fromEntries(STAGES.map((stage) => [stage.key, stage]));
const CLOSED_STATUSES = new Set(STAGES.filter((s) => s.group === 'closed').map((s) => s.key));
const EMAIL_TYPES = {
  interview: 'Interview invitation',
  acceptance: 'Acceptance email',
  rejection: 'Rejection email',
  onboarding: 'Onboarding email',
  custom: 'Custom email',
  acknowledgement: 'Application receipt',
};

const stageClass = {
  new: 'bg-sky-50 text-sky-800 ring-sky-200',
  reviewing: 'bg-amber-50 text-amber-800 ring-amber-200',
  shortlisted: 'bg-violet-50 text-violet-800 ring-violet-200',
  interview: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  accepted: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  onboarding: 'bg-teal-50 text-teal-800 ring-teal-200',
  onboarded: 'bg-green-50 text-green-800 ring-green-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
  withdrawn: 'bg-stone-100 text-stone-700 ring-stone-300',
  archived: 'bg-neutral-100 text-neutral-700 ring-neutral-300',
};

const inputClass =
  'w-full rounded-xl ring-1 ring-ivory-300 bg-ivory px-3.5 py-2.5 text-[13.5px] text-ink focus:outline-none focus:ring-2 focus:ring-burgundy/35';

const buttonSecondary =
  'inline-flex items-center justify-center gap-2 rounded-full ring-1 ring-burgundy/25 text-burgundy px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy/5 disabled:opacity-50 disabled:cursor-not-allowed';

const buttonPrimary =
  'cta-btn inline-flex items-center justify-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-2.5 text-[13px] font-semibold hover:bg-burgundy-light disabled:opacity-50 disabled:cursor-not-allowed';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

const formatShortDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const toDatetimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
};

const localToIso = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const answerText = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};

const newRequestId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const StageBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ${
      stageClass[status] || 'bg-ivory-200 text-ink/70 ring-ivory-300'
    }`}
  >
    {STAGE_MAP[status]?.label || status}
  </span>
);

const MetricCard = ({ label, value, sub }) => (
  <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4">
    <div className="text-[11px] uppercase tracking-[0.16em] text-ink/50">{label}</div>
    <div className="mt-1 font-serif-display text-burgundy text-[28px] font-semibold">{value}</div>
    {sub && <div className="mt-1 text-[12px] text-ink/55">{sub}</div>}
  </div>
);

const EmptyColumn = () => (
  <div className="rounded-xl border border-dashed border-ivory-300 px-4 py-8 text-center text-[12.5px] text-ink/45">
    No applications here.
  </div>
);

const ApplicationCard = ({ application, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left rounded-2xl bg-ivory p-4 ring-1 transition-all hover:-translate-y-0.5 hover:shadow-sm ${
      selected ? 'ring-2 ring-burgundy/55' : 'ring-ivory-300'
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-ink truncate">{application.name}</div>
        <div className="mt-0.5 text-[12.5px] text-burgundy font-medium line-clamp-2">
          {application.role_title}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-ink/35 shrink-0 mt-0.5" />
    </div>

    <div className="mt-3 space-y-1.5 text-[11.5px] text-ink/55">
      <div className="flex items-center gap-1.5">
        <Clock3 className="w-3.5 h-3.5" />
        Applied {formatShortDate(application.created_at)}
      </div>
      <div className="flex items-center gap-1.5">
        <UserCheck className="w-3.5 h-3.5" />
        {application.assigned_to_label || 'Unassigned'}
      </div>
    </div>

    {application.email_last_error && (
      <div className="mt-3 rounded-lg bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700 ring-1 ring-rose-200">
        Email delivery needs attention
      </div>
    )}
  </button>
);

const ApplicationBoard = ({ stages, applications, selectedId, onOpen }) => (
  <div className="overflow-x-auto pb-4">
    <div className="grid grid-flow-col auto-cols-[285px] gap-4 min-w-max">
      {stages.map((stage) => {
        const rows = applications.filter((application) => application.status === stage.key);
        return (
          <section key={stage.key} className="rounded-2xl bg-ivory-100/70 ring-1 ring-ivory-300 p-3.5 self-start">
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
              <div className="flex items-center gap-2">
                <StageBadge status={stage.key} />
                <span className="text-[11.5px] text-ink/45">{rows.length}</span>
              </div>
            </div>
            <div className="space-y-3">
              {rows.length === 0 ? (
                <EmptyColumn />
              ) : (
                rows.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    selected={application.id === selectedId}
                    onClick={() => onOpen(application.id)}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  </div>
);

const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="block text-[12px] font-semibold text-burgundy mb-1.5">{label}</span>
    {children}
    {hint && <span className="block mt-1.5 text-[11px] text-ink/50">{hint}</span>}
  </label>
);

const DetailTabButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
      active ? 'bg-burgundy text-ivory' : 'text-ink/65 hover:text-burgundy bg-ivory-100 ring-1 ring-ivory-300'
    }`}
  >
    {children}
  </button>
);

const ApplicationAnswers = ({ application }) => {
  const questions = application.role_questions || [];
  const questionMap = new Map(questions.map((q) => [String(q.id), q.label || q.id]));
  const entries = Object.entries(application.answers || {});

  if (entries.length === 0) {
    return <div className="text-[13px] text-ink/55">No custom application answers were submitted.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-xl bg-ivory-100 ring-1 ring-ivory-300 p-3.5">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink/45">
            {questionMap.get(String(key)) || key}
          </div>
          <div className="mt-1.5 text-[13.5px] text-ink/85 whitespace-pre-wrap break-words">
            {answerText(value)}
          </div>
        </div>
      ))}
    </div>
  );
};

const HistoryPanel = ({ activity, emails }) => (
  <div className="space-y-7">
    <section>
      <h3 className="font-serif-display text-burgundy text-[19px] font-semibold">Activity</h3>
      <div className="mt-3 space-y-3">
        {activity.length === 0 ? (
          <div className="text-[13px] text-ink/50">No activity recorded yet.</div>
        ) : (
          activity.map((item) => (
            <div key={item.id} className="relative pl-5 border-l border-ivory-300">
              <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-burgundy/45" />
              <div className="text-[12px] text-ink/45">{formatDate(item.created_at)}</div>
              <div className="mt-0.5 text-[13.5px] text-ink/85">
                {item.event_type === 'status_changed' && item.from_status && item.to_status ? (
                  <>
                    Moved from <b>{STAGE_MAP[item.from_status]?.label || item.from_status}</b> to{' '}
                    <b>{STAGE_MAP[item.to_status]?.label || item.to_status}</b>
                  </>
                ) : (
                  item.note || item.event_type.replaceAll('_', ' ')
                )}
              </div>
              {item.event_type === 'status_changed' && item.note && (
                <div className="mt-1 text-[12.5px] text-ink/60 whitespace-pre-wrap">{item.note}</div>
              )}
              {item.actor_label && <div className="mt-1 text-[11.5px] text-ink/45">by {item.actor_label}</div>}
            </div>
          ))
        )}
      </div>
    </section>

    <section>
      <h3 className="font-serif-display text-burgundy text-[19px] font-semibold">Email history</h3>
      <div className="mt-3 space-y-3">
        {emails.length === 0 ? (
          <div className="text-[13px] text-ink/50">No applicant emails recorded yet.</div>
        ) : (
          emails.map((email) => (
            <details key={email.id} className="rounded-xl bg-ivory-100 ring-1 ring-ivory-300 p-3.5">
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {email.delivery_status === 'sent' ? (
                        <MailCheck className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <CircleAlert className="w-4 h-4 text-rose-700" />
                      )}
                      <span className="text-[13px] font-semibold text-ink">
                        {EMAIL_TYPES[email.email_type] || email.email_type}
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] text-ink/55">{email.subject}</div>
                  </div>
                  <div className="text-right text-[11px] text-ink/45 shrink-0">
                    {formatDate(email.sent_at || email.created_at)}
                  </div>
                </div>
              </summary>
              <div className="mt-3 pt-3 border-t border-ivory-300 text-[12.5px] text-ink/70">
                <div><b>To:</b> {email.recipient_email}</div>
                {email.sent_by_label && <div className="mt-1"><b>Sent by:</b> {email.sent_by_label}</div>}
                {email.body_text && (
                  <div className="mt-3 whitespace-pre-wrap rounded-lg bg-ivory p-3 ring-1 ring-ivory-300">
                    {email.body_text}
                  </div>
                )}
                {email.error && <div className="mt-2 text-rose-700">{email.error}</div>}
              </div>
            </details>
          ))
        )}
      </div>
    </section>
  </div>
);

const EmailComposer = ({ application, emails, type, onClose, onSent }) => {
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [interviewAt, setInterviewAt] = useState(toDatetimeLocal(application.interview_at));
  const [interviewTimezone, setInterviewTimezone] = useState(application.interview_timezone || 'Africa/Nairobi');
  const [interviewDuration, setInterviewDuration] = useState(application.interview_duration_minutes || 30);
  const [interviewLocation, setInterviewLocation] = useState(application.interview_location || '');
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [requestId] = useState(() => newRequestId());

  const alreadySent = emails.some(
    (email) => email.email_type === type && email.delivery_status === 'sent',
  );

  const payloadBase = () => ({
    application_id: application.id,
    type,
    interview_at: localToIso(interviewAt),
    interview_timezone: interviewTimezone,
    interview_duration_minutes: Number(interviewDuration || 30),
    interview_location: interviewLocation || null,
  });

  const refreshPreview = async () => {
    setLoadingPreview(true);
    setError(null);
    try {
      const preview = await previewVolunteerApplicationEmail(payloadBase());
      setSubject(preview.subject || '');
      setBodyText(preview.body_text || '');
    } catch (previewError) {
      setError(previewError?.message || 'Could not prepare email preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    refreshPreview();
  }, []);

  const send = async () => {
    if (type === 'interview' && !interviewAt) {
      setError('Choose an interview date and time before sending the invitation.');
      return;
    }

    setSending(true);
    setError(null);
    try {
      await sendVolunteerApplicationEmail({
        ...payloadBase(),
        request_id: requestId,
        subject,
        body_text: bodyText,
        allow_resend: alreadySent,
      });
      await onSent();
    } catch (sendError) {
      setError(sendError?.message || 'Could not send this email.');
    } finally {
      setSending(false);
    }
  };

  const transition = {
    interview: 'Interview',
    acceptance: 'Accepted',
    rejection: 'Rejected',
    onboarding: 'Onboarding',
  }[type];

  return (
    <div className="fixed inset-0 z-[70] bg-ink/35 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-[760px] max-h-[92vh] overflow-y-auto rounded-3xl bg-ivory shadow-2xl ring-1 ring-ivory-300">
        <div className="sticky top-0 z-10 bg-ivory/95 backdrop-blur border-b border-ivory-300 px-5 md:px-7 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-ink/45">Applicant communication</div>
            <h2 className="mt-1 font-serif-display text-burgundy text-[24px] font-semibold">
              {EMAIL_TYPES[type] || 'Email applicant'}
            </h2>
            <p className="mt-1 text-[12.5px] text-ink/60">To {application.name} · {application.email}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-ivory-200" aria-label="Close email composer">
            <X className="w-5 h-5 text-ink/60" />
          </button>
        </div>

        <div className="p-5 md:p-7 space-y-5">
          {alreadySent && (
            <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 text-[12.5px] text-amber-800">
              A {EMAIL_TYPES[type]?.toLowerCase() || type} has already been sent. Sending from this window will create a deliberate resend and keep both messages in the communication history.
            </div>
          )}

          {transition && (
            <div className="rounded-xl bg-burgundy/5 ring-1 ring-burgundy/15 px-4 py-3 text-[12.5px] text-ink/70">
              After successful delivery, this application will move to <b>{transition}</b>. If delivery fails, the stage will not change.
            </div>
          )}

          {type === 'interview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4">
              <Field label="Interview date and time">
                <input type="datetime-local" value={interviewAt} onChange={(e) => setInterviewAt(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Timezone">
                <input value={interviewTimezone} onChange={(e) => setInterviewTimezone(e.target.value)} className={inputClass} placeholder="Africa/Nairobi" />
              </Field>
              <Field label="Duration (minutes)">
                <input type="number" min="10" max="240" value={interviewDuration} onChange={(e) => setInterviewDuration(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Location / meeting link">
                <input value={interviewLocation} onChange={(e) => setInterviewLocation(e.target.value)} className={inputClass} placeholder="Google Meet link, office, phone…" />
              </Field>
              <div className="md:col-span-2 text-[11.5px] text-ink/50">
                A calendar (.ics) invitation is attached automatically when the interview email is sent.
              </div>
            </div>
          )}

          {loadingPreview ? (
            <div className="py-12 flex items-center justify-center text-ink/55 text-[13px]">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Preparing suggested copy…
            </div>
          ) : (
            <>
              <Field label="Subject">
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} maxLength={200} />
              </Field>
              <Field label="Email body" hint="Plain text is wrapped in the standard ArtNovaX transactional email design.">
                <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={13} className={`${inputClass} resize-y`} maxLength={12000} />
              </Field>
            </>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-[12.5px] text-rose-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
            <button type="button" onClick={refreshPreview} disabled={loadingPreview || sending} className={buttonSecondary}>
              <RefreshCw className="w-4 h-4" /> Reset suggested copy
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} disabled={sending} className={buttonSecondary}>Cancel</button>
              <button type="button" onClick={send} disabled={sending || loadingPreview || !subject.trim() || !bodyText.trim()} className={buttonPrimary}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {alreadySent ? 'Send again' : 'Send email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicationDrawer = ({ details, loading, currentUser, reviewers, busy, onClose, onRefresh, onAction, onOpenEmail }) => {
  const [tab, setTab] = useState('application');
  const [stageTarget, setStageTarget] = useState('new');
  const [assigneeTarget, setAssigneeTarget] = useState('');
  const [stageNote, setStageNote] = useState('');
  const [note, setNote] = useState('');
  const [workflow, setWorkflow] = useState({
    interviewAt: '',
    interviewTimezone: 'Africa/Nairobi',
    interviewDuration: 30,
    interviewLocation: '',
    interviewNotes: '',
    decisionNotes: '',
  });

  const application = details?.application;

  useEffect(() => {
    if (!application) return;
    setStageTarget(application.status || 'new');
    setAssigneeTarget(application.assigned_to || '');
    setWorkflow({
      interviewAt: toDatetimeLocal(application.interview_at),
      interviewTimezone: application.interview_timezone || 'Africa/Nairobi',
      interviewDuration: application.interview_duration_minutes || 30,
      interviewLocation: application.interview_location || '',
      interviewNotes: application.interview_notes || '',
      decisionNotes: application.decision_notes || '',
    });
  }, [application]);

  if (!application && !loading) return null;

  const moveStage = async () => {
    if (!application || stageTarget === application.status) return;

    const consequential = ['interview', 'accepted', 'rejected', 'onboarding'].includes(stageTarget);
    if (consequential) {
      const confirmed = window.confirm(
        `Move this application to ${STAGE_MAP[stageTarget]?.label || stageTarget} without sending an email?\n\nUse the email actions instead if you want the applicant notified.`,
      );
      if (!confirmed) return;
    }

    await onAction(() =>
      transitionVolunteerApplication({
        applicationId: application.id,
        status: stageTarget,
        note: stageNote || null,
        actorLabel: currentUser?.email || null,
      }),
    );
    setStageNote('');
  };

  const saveAssignee = () =>
    onAction(() =>
      setVolunteerApplicationAssignee({
        applicationId: application.id,
        assigneeId: assigneeTarget || null,
        actorLabel: currentUser?.email || null,
      }),
    );

  const assignToMe = () => {
    setAssigneeTarget(currentUser?.id || '');
    return onAction(() =>
      setVolunteerApplicationAssignee({
        applicationId: application.id,
        assigneeId: currentUser?.id || null,
        actorLabel: currentUser?.email || null,
      }),
    );
  };

  const saveWorkflow = () =>
    onAction(() =>
      saveVolunteerApplicationDetails({
        applicationId: application.id,
        interviewAt: localToIso(workflow.interviewAt),
        interviewTimezone: workflow.interviewTimezone,
        interviewDurationMinutes: Number(workflow.interviewDuration || 30),
        interviewLocation: workflow.interviewLocation,
        interviewNotes: workflow.interviewNotes,
        decisionNotes: workflow.decisionNotes,
        actorLabel: currentUser?.email || null,
      }),
    );

  const addNote = async () => {
    if (!note.trim()) return;
    await onAction(() =>
      addVolunteerApplicationNote({
        applicationId: application.id,
        note: note.trim(),
        actorLabel: currentUser?.email || null,
      }),
    );
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-ink/25 flex justify-end" role="dialog" aria-modal="true">
      <div className="w-full max-w-[860px] h-full overflow-y-auto bg-ivory shadow-2xl ring-1 ring-ivory-300">
        <div className="sticky top-0 z-20 bg-ivory/95 backdrop-blur border-b border-ivory-300 px-5 md:px-7 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {loading || !application ? (
                <div className="flex items-center gap-2 text-ink/55"><Loader2 className="w-4 h-4 animate-spin" /> Loading application…</div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-serif-display text-burgundy text-[25px] font-semibold">{application.name}</h2>
                    <StageBadge status={application.status} />
                  </div>
                  <div className="mt-1 text-[12.5px] text-ink/60">{application.role_title} · Applied {formatDate(application.created_at)}</div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={onRefresh} disabled={busy || loading} className="rounded-full p-2 hover:bg-ivory-200" aria-label="Refresh application">
                <RefreshCw className={`w-4 h-4 text-ink/55 ${busy ? 'animate-spin' : ''}`} />
              </button>
              <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-ivory-200" aria-label="Close application">
                <X className="w-5 h-5 text-ink/60" />
              </button>
            </div>
          </div>

          {application && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
              <DetailTabButton active={tab === 'application'} onClick={() => setTab('application')}>Application</DetailTabButton>
              <DetailTabButton active={tab === 'workflow'} onClick={() => setTab('workflow')}>Workflow</DetailTabButton>
              <DetailTabButton active={tab === 'history'} onClick={() => setTab('history')}>History & Email</DetailTabButton>
            </div>
          )}
        </div>

        {application && (
          <div className="p-5 md:p-7">
            {application.email_last_error && (
              <div className="mb-5 rounded-xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-[12.5px] text-rose-700">
                <b>Email delivery issue:</b> {application.email_last_error}
              </div>
            )}

            {tab === 'application' && (
              <div className="space-y-7">
                <section>
                  <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">Applicant</h3>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-ivory-100 ring-1 ring-ivory-300 p-4">
                      <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink/45">Email</div>
                      <a href={`mailto:${application.email}`} className="mt-1.5 block text-[13.5px] text-burgundy hover:underline break-all">{application.email}</a>
                    </div>
                    <div className="rounded-xl bg-ivory-100 ring-1 ring-ivory-300 p-4">
                      <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink/45">Phone</div>
                      {application.phone ? (
                        <a href={`tel:${application.phone}`} className="mt-1.5 block text-[13.5px] text-burgundy hover:underline">{application.phone}</a>
                      ) : (
                        <div className="mt-1.5 text-[13.5px] text-ink/50">Not provided</div>
                      )}
                    </div>
                    <div className="rounded-xl bg-ivory-100 ring-1 ring-ivory-300 p-4">
                      <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink/45">Role</div>
                      <div className="mt-1.5 text-[13.5px] text-ink/85">{application.role_title}</div>
                      {application.role?.department && <div className="mt-0.5 text-[12px] text-ink/50">{application.role.department}</div>}
                    </div>
                    <div className="rounded-xl bg-ivory-100 ring-1 ring-ivory-300 p-4">
                      <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink/45">Receipt email</div>
                      <div className="mt-1.5 text-[13.5px] text-ink/85">
                        {application.acknowledgement_email_sent_at ? `Sent ${formatDate(application.acknowledgement_email_sent_at)}` : 'Not confirmed as sent'}
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">Application responses</h3>
                  <div className="mt-3"><ApplicationAnswers application={application} /></div>
                </section>
              </div>
            )}

            {tab === 'workflow' && (
              <div className="space-y-7">
                <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4 md:p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">Review ownership</h3>
                      <p className="mt-1 text-[12.5px] text-ink/55">
                        {application.assigned_to_label ? `Assigned to ${application.assigned_to_label}` : 'This application is currently unassigned.'}
                      </p>
                    </div>
                    {application.assigned_to !== currentUser?.id && (
                      <button type="button" disabled={busy} onClick={assignToMe} className={buttonSecondary}>
                        <UserPlus className="w-4 h-4" /> Assign to me
                      </button>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                    <Field label="Reviewer">
                      <select value={assigneeTarget} onChange={(e) => setAssigneeTarget(e.target.value)} className={inputClass}>
                        <option value="">Unassigned</option>
                        {reviewers.map((reviewer) => (
                          <option key={reviewer.user_id} value={reviewer.user_id}>
                            {reviewer.email} ({reviewer.role})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <button
                      type="button"
                      disabled={busy || assigneeTarget === (application.assigned_to || '')}
                      onClick={saveAssignee}
                      className={buttonSecondary}
                    >
                      <UserCheck className="w-4 h-4" /> Save reviewer
                    </button>
                  </div>
                </section>

                <section>
                  <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">Applicant communication</h3>
                  <p className="mt-1 text-[12.5px] text-ink/55">Lifecycle emails change the stage only after delivery succeeds.</p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button type="button" onClick={() => onOpenEmail('interview')} className="rounded-2xl bg-indigo-50 ring-1 ring-indigo-200 p-4 text-left hover:ring-indigo-300">
                      <CalendarClock className="w-5 h-5 text-indigo-700" />
                      <div className="mt-2 text-[13.5px] font-semibold text-indigo-900">Invite to interview</div>
                      <div className="mt-1 text-[11.5px] text-indigo-800/70">Schedules the interview, sends an .ics invite and moves to Interview.</div>
                    </button>
                    <button type="button" onClick={() => onOpenEmail('acceptance')} className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 p-4 text-left hover:ring-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                      <div className="mt-2 text-[13.5px] font-semibold text-emerald-900">Send acceptance</div>
                      <div className="mt-1 text-[11.5px] text-emerald-800/70">Notifies the applicant and moves the application to Accepted.</div>
                    </button>
                    <button type="button" onClick={() => onOpenEmail('rejection')} className="rounded-2xl bg-rose-50 ring-1 ring-rose-200 p-4 text-left hover:ring-rose-300">
                      <XCircle className="w-5 h-5 text-rose-700" />
                      <div className="mt-2 text-[13.5px] font-semibold text-rose-900">Send rejection</div>
                      <div className="mt-1 text-[11.5px] text-rose-800/70">Sends the decision email and moves the application to Rejected.</div>
                    </button>
                    <button type="button" onClick={() => onOpenEmail('onboarding')} className="rounded-2xl bg-teal-50 ring-1 ring-teal-200 p-4 text-left hover:ring-teal-300">
                      <UserCheck className="w-5 h-5 text-teal-700" />
                      <div className="mt-2 text-[13.5px] font-semibold text-teal-900">Start onboarding</div>
                      <div className="mt-1 text-[11.5px] text-teal-800/70">Sends next steps and moves the application into Onboarding.</div>
                    </button>
                  </div>
                  <button type="button" onClick={() => onOpenEmail('custom')} className={`${buttonSecondary} mt-3`}>
                    <Mail className="w-4 h-4" /> Send custom email
                  </button>
                </section>

                <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4 md:p-5">
                  <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">Move stage manually</h3>
                  <p className="mt-1 text-[12px] text-ink/50">Useful for internal progress such as In Review, Shortlisted, Onboarded, Withdrawn or Archived. Manual changes do not email the applicant.</p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-3 items-end">
                    <Field label="Stage">
                      <select value={stageTarget} onChange={(e) => setStageTarget(e.target.value)} className={inputClass}>
                        {STAGES.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Reason / note (optional)">
                      <input value={stageNote} onChange={(e) => setStageNote(e.target.value)} className={inputClass} placeholder="Why is the stage changing?" />
                    </Field>
                    <button type="button" disabled={busy || stageTarget === application.status} onClick={moveStage} className={buttonPrimary}>
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />} Move
                    </button>
                  </div>
                </section>

                <section>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">Interview & decision notes</h3>
                      <p className="mt-1 text-[12px] text-ink/50">Internal only. These fields are never included in applicant emails unless you copy them into the email yourself.</p>
                    </div>
                    <button type="button" disabled={busy} onClick={saveWorkflow} className={buttonSecondary}>
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />} Save details
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Interview date and time">
                      <input type="datetime-local" value={workflow.interviewAt} onChange={(e) => setWorkflow((v) => ({ ...v, interviewAt: e.target.value }))} className={inputClass} />
                    </Field>
                    <Field label="Timezone">
                      <input value={workflow.interviewTimezone} onChange={(e) => setWorkflow((v) => ({ ...v, interviewTimezone: e.target.value }))} className={inputClass} />
                    </Field>
                    <Field label="Duration (minutes)">
                      <input type="number" min="10" max="240" value={workflow.interviewDuration} onChange={(e) => setWorkflow((v) => ({ ...v, interviewDuration: e.target.value }))} className={inputClass} />
                    </Field>
                    <Field label="Location / meeting link">
                      <input value={workflow.interviewLocation} onChange={(e) => setWorkflow((v) => ({ ...v, interviewLocation: e.target.value }))} className={inputClass} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Interview notes">
                        <textarea rows={5} value={workflow.interviewNotes} onChange={(e) => setWorkflow((v) => ({ ...v, interviewNotes: e.target.value }))} className={`${inputClass} resize-y`} />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Decision notes">
                        <textarea rows={4} value={workflow.decisionNotes} onChange={(e) => setWorkflow((v) => ({ ...v, decisionNotes: e.target.value }))} className={`${inputClass} resize-y`} />
                      </Field>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">Add internal note</h3>
                  <div className="mt-3 flex items-start gap-2">
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={`${inputClass} resize-y`} placeholder="Add context for the rest of the team…" maxLength={5000} />
                    <button type="button" disabled={busy || !note.trim()} onClick={addNote} className={`${buttonPrimary} shrink-0`}>
                      <MessageSquareText className="w-4 h-4" /> Add
                    </button>
                  </div>
                </section>
              </div>
            )}

            {tab === 'history' && <HistoryPanel activity={details.activity || []} emails={details.emails || []} />}
          </div>
        )}
      </div>
    </div>
  );
};

const VolunteerOperations = () => {
  const [authorized, setAuthorized] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [emailType, setEmailType] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [scope, setScope] = useState('active');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  const loadApplications = async () => {
    setError(null);
    const rows = await getVolunteerApplications();
    setApplications(rows);
    return rows;
  };

  const loadReviewers = async () => {
    const rows = await getVolunteerReviewers();
    setReviewers(rows);
    return rows;
  };

  const loadDetails = async (id) => {
    if (!id) return;
    setDetailsLoading(true);
    try {
      setDetails(await getVolunteerApplicationDetails(id));
    } catch (loadError) {
      setError(loadError?.message || 'Could not load this application.');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setLoading(true);
      try {
        const session = await getSession();
        if (!session) {
          if (!cancelled) setAuthorized(false);
          return;
        }

        const role = await getCurrentRole();
        const allowed = ['admin', 'editor'].includes(role);
        if (cancelled) return;

        setAuthorized(allowed);
        setCurrentUser({ id: session.user.id, email: session.user.email, role });

        if (!allowed) return;

        try {
          const [rows] = await Promise.all([loadApplications(), loadReviewers()]);
          const requestedId = new URLSearchParams(window.location.search).get('application');
          if (requestedId && rows.some((row) => row.id === requestedId)) {
            setSelectedId(requestedId);
            await loadDetails(requestedId);
          }
        } catch (dataError) {
          console.error(dataError);
          if (!cancelled) {
            setError(
              dataError?.message ||
                'Could not load volunteer lifecycle data. Confirm the lifecycle migration has been applied.',
            );
          }
        }
      } catch (initializeError) {
        console.error(initializeError);
        if (!cancelled) {
          setAuthorized(false);
          setError(initializeError?.message || 'Could not verify your admin session.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initialize();
    return () => { cancelled = true; };
  }, []);

  const refreshAll = async () => {
    setBusy(true);
    setError(null);
    try {
      await Promise.all([loadApplications(), loadReviewers()]);
      if (selectedId) await loadDetails(selectedId);
    } catch (refreshError) {
      setError(refreshError?.message || 'Could not refresh volunteer applications.');
    } finally {
      setBusy(false);
    }
  };

  const openApplication = async (id) => {
    setSelectedId(id);
    setDetails(null);
    setNotice(null);
    await loadDetails(id);
  };

  const closeApplication = () => {
    setSelectedId(null);
    setDetails(null);
    setEmailType(null);
  };

  const performAction = async (operation, successMessage = 'Application updated.') => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await operation();
      await Promise.all([
        loadApplications(),
        selectedId ? loadDetails(selectedId) : Promise.resolve(),
      ]);
      setNotice(successMessage);
    } catch (actionError) {
      setError(actionError?.message || 'Could not update this application.');
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSent = async () => {
    setEmailType(null);
    await Promise.all([loadApplications(), selectedId ? loadDetails(selectedId) : Promise.resolve()]);
    setNotice('Email sent and application lifecycle updated.');
  };

  const roles = useMemo(() => {
    const map = new Map();
    applications.forEach((application) => {
      if (application.role_id) map.set(application.role_id, application.role_title);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return applications.filter((application) => {
      if (roleFilter !== 'all' && application.role_id !== roleFilter) return false;
      if (scope === 'active' && CLOSED_STATUSES.has(application.status)) return false;
      if (scope === 'closed' && !CLOSED_STATUSES.has(application.status)) return false;
      if (assignmentFilter === 'mine' && application.assigned_to !== currentUser?.id) return false;
      if (assignmentFilter === 'unassigned' && application.assigned_to) return false;
      if (assignmentFilter.startsWith('reviewer:') && application.assigned_to !== assignmentFilter.slice('reviewer:'.length)) return false;
      if (needle) {
        const haystack = `${application.name} ${application.email} ${application.phone || ''} ${application.role_title}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [applications, search, roleFilter, scope, assignmentFilter, currentUser]);

  const visibleStages = useMemo(() => {
    if (scope === 'active') return STAGES.filter((s) => s.group === 'active');
    if (scope === 'closed') return STAGES.filter((s) => s.group === 'closed');
    return STAGES;
  }, [scope]);

  const metrics = useMemo(() => ({
    total: applications.length,
    new: applications.filter((a) => a.status === 'new').length,
    review: applications.filter((a) => ['reviewing', 'shortlisted'].includes(a.status)).length,
    interview: applications.filter((a) => a.status === 'interview').length,
    onboarding: applications.filter((a) => ['accepted', 'onboarding'].includes(a.status)).length,
    onboarded: applications.filter((a) => a.status === 'onboarded').length,
  }), [applications]);

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/admin" />
        <section className="mx-auto max-w-[620px] px-4 md:px-8 py-16 text-center">
          <div className="rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-8 md:p-10">
            <CircleAlert className="w-10 h-10 text-burgundy mx-auto" />
            <h1 className="mt-4 font-serif-display text-burgundy text-[28px] font-semibold">Staff sign-in required</h1>
            <p className="mt-2 text-ink/70 text-[14px]">Sign in through the website admin, then return to Volunteer Operations.</p>
            <a href="/admin" className={`${buttonPrimary} mt-6`}>
              Go to Admin <ArrowLeft className="w-4 h-4 rotate-180" />
            </a>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/admin" />
      <main className="mx-auto max-w-[1500px] px-4 md:px-8 py-8 md:py-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <a href="/admin" className="inline-flex items-center gap-1.5 text-[12.5px] text-burgundy font-semibold hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to Admin
            </a>
            <div className="mt-3 flex items-center gap-3">
              <Users className="w-7 h-7 text-burgundy" />
              <h1 className="font-serif-display text-burgundy text-[31px] md:text-[38px] font-semibold">Volunteer Operations</h1>
            </div>
            <p className="mt-2 max-w-[760px] text-[13.5px] md:text-[14px] text-ink/60 leading-relaxed">
              Manage each application from receipt through review, interview, decision and onboarding, with applicant emails and an audit trail kept alongside the application.
            </p>
          </div>
          <button type="button" onClick={refreshAll} disabled={busy || loading} className={buttonSecondary}>
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-[13px] text-rose-700 flex items-start gap-2">
            <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <div>{error}</div>
          </div>
        )}
        {notice && (
          <div className="mt-5 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 text-[13px] text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <div>{notice}</div>
          </div>
        )}

        <div className="mt-7 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricCard label="All applications" value={metrics.total} />
          <MetricCard label="New" value={metrics.new} />
          <MetricCard label="Reviewing" value={metrics.review} sub="In review + shortlisted" />
          <MetricCard label="Interviews" value={metrics.interview} />
          <MetricCard label="Accepted / onboarding" value={metrics.onboarding} />
          <MetricCard label="Onboarded" value={metrics.onboarded} />
        </div>

        <section className="mt-6 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_220px_180px_180px] gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/35" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone or role…" className={`${inputClass} pl-10`} />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputClass}>
              <option value="all">All volunteer roles</option>
              {roles.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
            </select>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className={inputClass}>
              <option value="active">Active pipeline</option>
              <option value="closed">Completed / closed</option>
              <option value="all">All stages</option>
            </select>
            <select value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value)} className={inputClass}>
              <option value="all">All reviewers</option>
              <option value="mine">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
              {reviewers.map((reviewer) => (
                <option key={reviewer.user_id} value={`reviewer:${reviewer.user_id}`}>
                  {reviewer.email}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 py-20 flex items-center justify-center text-[13.5px] text-ink/55">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading volunteer applications…
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 py-16 text-center">
              <Inbox className="w-9 h-9 text-burgundy/55 mx-auto" />
              <h2 className="mt-3 font-serif-display text-burgundy text-[22px] font-semibold">No volunteer applications yet</h2>
              <p className="mt-1 text-[13px] text-ink/55">New applications will enter the New stage automatically.</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 py-12 text-center text-[13px] text-ink/55">
              No applications match these filters.
            </div>
          ) : (
            <ApplicationBoard stages={visibleStages} applications={filteredApplications} selectedId={selectedId} onOpen={openApplication} />
          )}
        </div>
      </main>
      <Footer />

      {selectedId && (
        <ApplicationDrawer
          details={details}
          loading={detailsLoading}
          currentUser={currentUser}
          reviewers={reviewers}
          busy={busy}
          onClose={closeApplication}
          onRefresh={() => loadDetails(selectedId)}
          onAction={performAction}
          onOpenEmail={(type) => setEmailType(type)}
        />
      )}

      {emailType && details?.application && (
        <EmailComposer
          application={details.application}
          emails={details.emails || []}
          type={emailType}
          onClose={() => setEmailType(null)}
          onSent={handleEmailSent}
        />
      )}
    </div>
  );
};

export default VolunteerOperations;
