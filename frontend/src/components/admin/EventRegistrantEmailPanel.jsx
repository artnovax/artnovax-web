import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  Users,
} from "lucide-react";
import {
  getEventEmailCampaigns,
  sendEventRegistrantEmail,
} from "../../services/eventEmails";
const inputClass =
  "w-full rounded-lg ring-1 ring-ivory-300 bg-ivory px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-burgundy/40";
const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const formatDateTime = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString();
};
const firstName = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)[0] || "there";
const TEMPLATE_VARIABLES = [
  ["{{first_name}}", "First name"],
  ["{{full_name}}", "Full name"],
  ["{{event_title}}", "Event title"],
  ["{{event_date}}", "Event date"],
  ["{{event_location}}", "Event location"],
];

const PREVIEW_REGISTRATION = { name: "Simbiri" };
const renderPreviewTemplate = (value, registration, event) => {
  const first = firstName(registration?.name);
  const full = String(registration?.name || "").trim() || "there";
  const date = event?.starts_at
    ? new Date(event.starts_at).toLocaleString()
    : event?.date || "";
  const replacements = {
    "{{first_name}}": first,
    "{{full_name}}": full,
    "{{event_title}}": event?.title || "",
    "{{event_date}}": date,
    "{{event_location}}": event?.location || "Location to be confirmed",
  };
  return Object.entries(replacements).reduce(
    (current, [token, replacement]) => current.split(token).join(replacement),
    String(value || ""),
  );
};
const EventRegistrantEmailPanel = ({
  event,
  registrations = [],
  onNotice,
  onError,
}) => {
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [selectionInitializedFor, setSelectionInitializedFor] = useState(null);
  const eligible = useMemo(
    () =>
      registrations.filter(
        (registration) =>
          (!registration.event_id || registration.event_id === event?.id) &&
          registration.status === "confirmed" &&
          String(registration.email || "").trim(),
      ),
    [event?.id, registrations],
  );
  const eligibleIds = useMemo(
    () => eligible.map((registration) => registration.id),
    [eligible],
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const visibleRecipients = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return eligible;
    return eligible.filter((registration) =>
      normalize(
        [registration.name, registration.email, registration.phone]
          .filter(Boolean)
          .join(" "),
      ).includes(needle),
    );
  }, [eligible, query]);
  const selectedRecipients = useMemo(
    () => eligible.filter((registration) => selectedSet.has(registration.id)),
    [eligible, selectedSet],
  );
  const loadHistory = async () => {
    if (!event?.id) {
      setCampaigns([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const rows = await getEventEmailCampaigns(event.id);
      setCampaigns(rows);
    } catch (error) {
      onError?.(error?.message || "Unable to load event email history.");
    } finally {
      setHistoryLoading(false);
    }
  };
  useEffect(() => {
    setSubject("Update — {{event_title}}");
    setBodyText("Hi {{first_name}},\n\n");
    setQuery("");
    setSelectedIds([]);
    setSelectionInitializedFor(null);
    loadHistory();
  }, [event?.id]);
  const eligibleKey = eligibleIds.join("|");
  useEffect(() => {
    if (!event?.id || selectionInitializedFor === event.id) return;
    if (eligibleIds.length === 0) return;
    setSelectedIds(eligibleIds);
    setSelectionInitializedFor(event.id);
  }, [event?.id, eligibleIds, eligibleKey, selectionInitializedFor]);
  const toggleRecipient = (registrationId) => {
    setSelectedIds((current) =>
      current.includes(registrationId)
        ? current.filter((id) => id !== registrationId)
        : [...current, registrationId],
    );
  };
  const selectVisible = () => {
    const visibleIds = visibleRecipients.map((registration) => registration.id);
    setSelectedIds((current) =>
      Array.from(new Set([...current, ...visibleIds])),
    );
  };
  const omitVisible = () => {
    const visibleIds = new Set(
      visibleRecipients.map((registration) => registration.id),
    );
    setSelectedIds((current) => current.filter((id) => !visibleIds.has(id)));
  };
  const handleMessageKeyDown = (event) => {
    if (event.key !== "Enter" || event.nativeEvent?.isComposing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const textarea = event.currentTarget;
    const start = textarea.selectionStart ?? bodyText.length;
    const end = textarea.selectionEnd ?? start;

    if (bodyText.length >= 12000 && start === end) {
      return;
    }

    const nextValue = (
      bodyText.slice(0, start) +
      "\n" +
      bodyText.slice(end)
    ).slice(0, 12000);

    setBodyText(nextValue);

    const nextCursorPosition = Math.min(start + 1, nextValue.length);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  const send = async () => {
    const cleanSubject = subject.trim();
    const cleanBody = bodyText.trim();
    onError?.(null);
    onNotice?.(null);
    if (!cleanSubject) {
      onError?.("Add an email subject before sending.");
      return;
    }
    if (!cleanBody) {
      onError?.("Add an email message before sending.");
      return;
    }
    if (selectedRecipients.length === 0) {
      onError?.(
        "Select at least one confirmed registrant with an email address.",
      );
      return;
    }
    const confirmed = window.confirm(
      `Send this email to ${selectedRecipients.length} selected confirmed registrant${selectedRecipients.length === 1 ? "" : "s"} for “${event.title}”?\n\nEach person receives a separate email.`,
    );
    if (!confirmed) return;
    setSending(true);
    try {
      const requestId =
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const result = await sendEventRegistrantEmail({
        eventId: event.id,
        registrationIds: selectedRecipients.map(
          (registration) => registration.id,
        ),
        subject: cleanSubject,
        bodyText: cleanBody,
        requestId,
      });
      const sent = Number(result?.sent || 0);
      const failed = Number(result?.failed || 0);
      const skipped = Number(result?.skipped || 0);
      if (failed > 0) {
        onNotice?.(
          `${sent} email${sent === 1 ? "" : "s"} sent. ${failed} failed${skipped ? ` and ${skipped} skipped because the registration was no longer eligible` : ""}.`,
        );
      } else {
        onNotice?.(
          `${sent} email${sent === 1 ? "" : "s"} sent successfully${skipped ? `. ${skipped} registration${skipped === 1 ? " was" : "s were"} skipped because eligibility changed before send time` : ""}.`,
        );
      }
      await loadHistory();
    } catch (error) {
      onError?.(error?.message || "Unable to send the event email.");
    } finally {
      setSending(false);
    }
  };
  const previewRegistration = PREVIEW_REGISTRATION;
  const previewSubject = renderPreviewTemplate(
    subject,
    previewRegistration,
    event,
  );
  const previewBody = renderPreviewTemplate(
    bodyText,
    previewRegistration,
    event,
  );
  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-burgundy font-semibold">
              <Mail className="w-4 h-4" />
              Email confirmed registrants
            </div>
            <p className="mt-1 max-w-[760px] text-[12.5px] leading-relaxed text-ink/65">
              Send an operational update to any subset of the people who are
              currently confirmed for this event. This works for upcoming and
              past events. Recipients are rechecked at send time, so cancelled
              or waitlisted registrations cannot receive the message by mistake.
            </p>
          </div>
          <span className="rounded-full bg-burgundy/10 px-3 py-1.5 text-[11.5px] font-semibold text-burgundy">
            Admin only
          </span>
        </div>
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <label>
            <span className="text-[11px] uppercase tracking-widest text-ink/55 font-semibold">
              Subject
            </span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={200}
              className={`${inputClass} mt-1.5`}
              placeholder="Update — {{event_title}}"
            />
          </label>
          <div className="rounded-xl bg-ivory ring-1 ring-ivory-300 px-4 py-3">
            <div className="text-[11px] uppercase tracking-widest text-ink/55 font-semibold">
              Current audience
            </div>
            <div className="mt-1 text-[13px] text-ink/75">
              <b>{eligible.length}</b> confirmed registrant
              {eligible.length === 1 ? "" : "s"} with email ·{" "}
              <b>{selectedRecipients.length}</b> selected
            </div>
          </div>
        </div>
        <label className="block mt-4">
          <span className="text-[11px] uppercase tracking-widest text-ink/55 font-semibold">
            Message
          </span>
          <textarea
            rows={9}
            value={bodyText}
            onChange={(event) => setBodyText(event.target.value)}
            onKeyDown={handleMessageKeyDown}
            maxLength={12000}
            className={`${inputClass} mt-1.5 resize-y`}
            placeholder="Write the update you want confirmed registrants to receive."
          />
          <div className="mt-2 flex items-center justify-between gap-3 flex-wrap text-[11.5px] text-ink/50">
            <span>
              Use personalization variables in the subject or message.
            </span>
            <span>{bodyText.length.toLocaleString()} / 12,000</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {TEMPLATE_VARIABLES.map(([token, label]) => (
              <button
                key={token}
                type="button"
                onClick={() =>
                  setBodyText(
                    (current) =>
                      `${current}${current && !current.endsWith(" ") && !current.endsWith("\n") ? " " : ""}${token}`,
                  )
                }
                className="rounded-full bg-ivory px-3 py-1.5 text-[11px] font-semibold text-burgundy ring-1 ring-burgundy/20 hover:bg-burgundy/5"
                title={`Insert ${token}`}
              >
                {label}
              </button>
            ))}
          </div>
        </label>
      </section>
      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">
              Preview
            </h3>
            <p className="mt-1 text-[12px] text-ink/60">
              Every recipient receives a separate message, so registrant email
              addresses are never exposed to one another.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-ivory px-3 py-1.5 ring-1 ring-ivory-300 text-[11.5px] text-ink/65">
            <Users className="w-3.5 h-3.5" /> {selectedRecipients.length}{" "}
            recipient{selectedRecipients.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="mt-3 text-[11.5px] text-ink/50">
          Preview personalization uses “Simbiri”. Each recipient receives their
          own name when the email is sent.
        </div>
        <div className="mt-4 rounded-xl bg-white ring-1 ring-ivory-300 p-5 text-[13px] leading-relaxed text-ink/80">
          <div className="font-semibold text-burgundy">
            {previewSubject.trim() || "Email subject"}
          </div>
          <div className="mt-4 whitespace-pre-wrap">
            {previewBody.trim() || "Your message preview will appear here."}
          </div>
          <div className="mt-5 text-[11.5px] text-ink/45">
            ArtNovaX Mental Health Foundation
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">
              Choose recipients
            </h3>
            <p className="mt-1 text-[12px] text-ink/60">
              Everyone eligible starts selected. Uncheck any individual you want
              to omit, or use the bulk controls below.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedIds(eligibleIds)}
              disabled={eligible.length === 0}
              className="rounded-full ring-1 ring-burgundy/30 px-3 py-2 text-[12px] font-semibold text-burgundy disabled:opacity-40"
            >
              Select all confirmed
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0}
              className="rounded-full ring-1 ring-ivory-300 px-3 py-2 text-[12px] font-semibold text-ink/65 disabled:opacity-40"
            >
              Clear all
            </button>
          </div>
        </div>
        <label className="relative block mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search confirmed registrants by name, email or phone"
            className={`${inputClass} pl-9`}
          />
        </label>
        {query && visibleRecipients.length > 0 && (
          <div className="mt-2 flex items-center gap-2 flex-wrap text-[11.5px]">
            <button
              type="button"
              onClick={selectVisible}
              className="text-burgundy font-semibold hover:underline"
            >
              Select all {visibleRecipients.length} visible
            </button>
            <span className="text-ink/35">•</span>
            <button
              type="button"
              onClick={omitVisible}
              className="text-ink/60 font-semibold hover:underline"
            >
              Omit all visible
            </button>
          </div>
        )}
        <div className="mt-4 rounded-xl bg-ivory ring-1 ring-ivory-300 overflow-hidden">
          {eligible.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-ink/55">
              There are no currently confirmed registrations with an email
              address.
            </div>
          ) : visibleRecipients.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-ink/55">
              No confirmed registrants match this search.
            </div>
          ) : (
            visibleRecipients.map((registration) => {
              const checked = selectedSet.has(registration.id);
              return (
                <label
                  key={registration.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-ivory-300 last:border-0 cursor-pointer hover:bg-ivory-200/50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRecipient(registration.id)}
                    className="w-4 h-4"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-ink truncate">
                      {registration.name}
                    </div>
                    <div className="text-[11.5px] text-ink/55 truncate">
                      {registration.email}
                      {registration.phone ? ` · ${registration.phone}` : ""}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${
                      checked
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-ivory-200 text-ink/50"
                    }`}
                  >
                    {checked ? "Included" : "Omitted"}
                  </span>
                </label>
              );
            })
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={send}
            disabled={
              sending ||
              selectedRecipients.length === 0 ||
              !subject.trim() ||
              !bodyText.trim()
            }
            className="inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-3 text-[13px] font-semibold disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending
              ? "Sending…"
              : `Send to ${selectedRecipients.length} selected`}
          </button>
        </div>
      </section>
      <section className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">
              Recent event emails
            </h3>
            <p className="mt-1 text-[12px] text-ink/60">
              Delivery history for this event, including partial or failed
              sends.
            </p>
          </div>
          <button
            type="button"
            onClick={loadHistory}
            disabled={historyLoading}
            className="inline-flex items-center gap-2 rounded-full ring-1 ring-ivory-300 px-3 py-2 text-[12px] font-semibold text-ink/65 disabled:opacity-40"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${historyLoading ? "animate-spin" : ""}`}
            />
            Refresh history
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {historyLoading && campaigns.length === 0 ? (
            <div className="rounded-xl bg-ivory ring-1 ring-ivory-300 px-4 py-6 text-center text-[12.5px] text-ink/55">
              Loading email history…
            </div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-xl bg-ivory ring-1 ring-ivory-300 px-4 py-6 text-center text-[12.5px] text-ink/55">
              No manual registrant emails have been sent for this event yet.
            </div>
          ) : (
            campaigns.map((campaign) => {
              const failed = Number(campaign.failed_count || 0);
              const skipped = Number(campaign.skipped_count || 0);
              return (
                <div
                  key={campaign.id}
                  className="rounded-xl bg-ivory ring-1 ring-ivory-300 p-4"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-ink truncate">
                        {campaign.subject}
                      </div>
                      <div className="mt-1 text-[11.5px] text-ink/50">
                        {formatDateTime(campaign.created_at)}
                        {campaign.created_by_email
                          ? ` · ${campaign.created_by_email}`
                          : ""}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${
                        failed > 0
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      }`}
                    >
                      {failed > 0 ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      {campaign.status || "sent"}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap text-[11.5px] text-ink/60">
                    <span className="rounded-full bg-ivory-200 px-2.5 py-1">
                      Sent {campaign.sent_count || 0}
                    </span>
                    {failed > 0 && (
                      <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-1">
                        Failed {failed}
                      </span>
                    )}
                    {skipped > 0 && (
                      <span className="rounded-full bg-ivory-200 px-2.5 py-1">
                        Skipped {skipped}
                      </span>
                    )}
                    <span className="rounded-full bg-ivory-200 px-2.5 py-1">
                      Requested {campaign.requested_recipient_count || 0}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
export default EventRegistrantEmailPanel;
