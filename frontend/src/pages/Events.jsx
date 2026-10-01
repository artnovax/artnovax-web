import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Calendar, MapPin, Search } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BrushFrame from "../components/BrushFrame";
import { HeartHand } from "../components/BrandGlyphs";
import { getEvents } from "@/services/events";
import {
  defaultEventsPageContent,
  getEventsPageContent,
} from "../services/pageContent";

const Tab = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-colors ${active ? "bg-burgundy/10 text-burgundy ring-1 ring-burgundy/25" : "text-ink/70 hover:text-burgundy"}`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const formatEventDateShort = (ev) => {
  // Historical events may only have a known date or month, not a verified time.
  // Prefer the editorial date text whenever it exists.
  if (ev.date) return ev.date;
  if (!ev.starts_at) return "";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: ev.timezone || "Africa/Nairobi",
    }).format(new Date(ev.starts_at));
  } catch {
    return "";
  }
};

const eventExcerpt = (text, maxLength = 90) => {
  const clean = (text || "").replace(/\s+/g, " ").trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  const clipped = clean.slice(0, maxLength + 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const cutAt = lastSpace > Math.floor(maxLength * 0.7) ? lastSpace : maxLength;

  return `${clipped.slice(0, cutAt).trim()}…`;
};

const EventImage = ({ ev, compact = false }) => {
  if (ev.img) {
    return (
      <img
        src={ev.img}
        alt={ev.imgAlt || ev.title}
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
          compact ? "group-hover:scale-[1.05]" : ""
        }`}
      />
    );
  }

  return (
    <div
      className={`absolute inset-0 bg-burgundy flex flex-col items-center justify-center text-ivory text-center ${
        compact ? "px-3" : "px-7"
      }`}
    >
      <Calendar
        className={compact ? "w-6 h-6 opacity-75" : "w-8 h-8 opacity-75"}
        strokeWidth={1.4}
      />
      <div
        className={`tracking-[0.22em] font-semibold opacity-75 ${
          compact ? "mt-1.5 text-[9px]" : "mt-2.5 text-[10px]"
        }`}
      >
        ARTNOVAX EVENT
      </div>
      <div
        className={`font-serif-display leading-tight ${
          compact ? "mt-1.5 text-[15px]" : "mt-2.5 text-[17px] max-w-[90%]"
        }`}
      >
        {ev.title}
      </div>
    </div>
  );
};

const EventCard = ({ ev }) => (
  <article className="wwd-card group rounded-2xl overflow-hidden ring-1 ring-ivory-300 bg-ivory-100 flex flex-col h-full">
    <a
      href={`/events/${ev.slug || ev.id}`}
      className="block relative aspect-[16/9] shrink-0 overflow-hidden bg-ivory-200"
    >
      <EventImage ev={ev} />
      {ev.featured && (
        <span className="absolute top-3 left-3 inline-block bg-ivory text-burgundy text-[10.5px] font-semibold tracking-widest px-2 py-1 rounded">
          HIGHLIGHT
        </span>
      )}
    </a>

    <div className="p-5 flex-1 flex flex-col">
      <div className="min-h-[38px] flex items-start gap-x-3 gap-y-1 text-ink/60 text-[12px] flex-wrap">
        {formatEventDateShort(ev) && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-burgundy shrink-0" />
            {formatEventDateShort(ev)}
          </span>
        )}
        {ev.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-burgundy shrink-0" />
            {ev.location}
          </span>
        )}
      </div>

      <h3 className="mt-1.5 min-h-[48px] font-serif-display text-burgundy text-[20px] leading-tight font-semibold">
        {ev.title}
      </h3>

      <div className="mt-0.5 min-h-[36px]">
        {ev.subtitle && (
          <p className="text-ink/70 text-[13px] leading-snug">{ev.subtitle}</p>
        )}
      </div>

      {ev.body && (
        <p className="mt-1.5 text-ink/80 text-[13.5px] leading-[1.55]">
          {eventExcerpt(ev.body)}
        </p>
      )}

      <a
        href={`/events/${ev.slug || ev.id}`}
        className="mt-auto pt-4 inline-flex items-center gap-1 text-burgundy font-semibold text-[13.5px] self-start"
      >
        View details <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  </article>
);

const Events = () => {
  const [tab, setTab] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageContent, setPageContent] = useState(() =>
    defaultEventsPageContent(),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remoteContent = await getEventsPageContent();
        if (!cancelled) setPageContent(remoteContent);
      } catch (error) {
        console.warn("Using built-in Events page content.", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getEvents();
        setEvents(data);

        const hasUpcoming = data.some((event) => event.status === "upcoming");
        const hasPast = data.some((event) => event.status === "past");

        // If there is nothing upcoming yet, open directly on the real event archive.
        if (!hasUpcoming && hasPast) {
          setTab("past");
        }
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const featuredList = useMemo(
    () => events.filter((event) => event.featured).slice(0, 2),
    [events],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = events.filter((event) => {
      if (tab === "upcoming" && event.status !== "upcoming") return false;
      if (tab === "past" && event.status !== "past") return false;

      if (!q) return true;

      return `${event.title} ${event.subtitle || ""} ${event.location || ""} ${event.body || ""}`
        .toLowerCase()
        .includes(q);
    });

    // getEvents() returns oldest -> newest, while the archive should read newest -> oldest.
    if (tab === "past") return [...result].reverse();

    return result;
  }, [events, tab, query]);

  const showPastEvents = () => {
    setTab("past");
    requestAnimationFrame(() => {
      document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/events" />

      {/* Hero */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 pt-8 md:pt-14 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div className="order-2 lg:order-1">
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold fade-up">
            {pageContent.eyebrow}
          </div>

          <h1 className="fade-up delay-1 mt-4 font-serif-display text-burgundy text-[40px] sm:text-[50px] md:text-[58px] leading-[1.05] font-semibold whitespace-pre-line">
            {pageContent.title}
          </h1>

          <p className="fade-up delay-2 mt-6 text-[16px] md:text-[17px] leading-[1.7] text-ink/80 max-w-[560px]">
            {pageContent.body}
          </p>

          <div className="fade-up delay-3 mt-8 flex flex-wrap gap-3">
            <a
              href={pageContent.primaryCta.href}
              className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light shadow-[0_14px_30px_-14px_rgba(92,21,25,0.7)]"
            >
              <Calendar className="w-4 h-4" />
              {pageContent.primaryCta.label}
            </a>

            <button
              onClick={showPastEvents}
              className="cta-btn inline-flex items-center gap-2 rounded-full border-2 border-burgundy text-burgundy px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy hover:text-ivory"
            >
              {pageContent.secondaryCta.label}
            </button>
          </div>
        </div>

        <div className="order-1 lg:order-2 fade-up delay-2">
          <BrushFrame
            src={pageContent.image}
            alt={pageContent.imageAlt}
            aspect="aspect-[5/4]"
            objectPosition="center"
          />
        </div>
      </section>

      {/* Selected event highlight */}
      {featuredList.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-4 md:px-8 pt-6">
          <div className="text-burgundy tracking-[0.22em] text-[11.5px] font-semibold mb-3">
            EVENT HIGHLIGHT
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {featuredList.map((f) => (
              <a
                key={f.id}
                href={`/events/${f.slug || f.id}`}
                className="wwd-card group rounded-2xl overflow-hidden ring-1 ring-ivory-300 bg-ivory-100 grid grid-cols-[minmax(0,120px)_minmax(0,1fr)]"
              >
                <div className="relative h-full min-h-[145px] overflow-hidden bg-ivory-200">
                  <EventImage ev={f} compact />
                </div>

                <div className="p-4 flex flex-col">
                  <div className="text-burgundy text-[10.5px] tracking-widest font-semibold">
                    {(f.status || "EVENT").toUpperCase()}
                  </div>

                  <h3 className="mt-1 font-serif-display text-burgundy text-[18px] leading-tight font-semibold line-clamp-2">
                    {f.title}
                  </h3>

                  <div className="mt-1 text-ink/70 text-[12.5px] flex items-center gap-3 flex-wrap">
                    {formatEventDateShort(f) && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-burgundy" />
                        {formatEventDateShort(f)}
                      </span>
                    )}

                    {f.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-burgundy" />
                        {f.location}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-2 text-burgundy text-[13px] font-semibold inline-flex items-center gap-1">
                    Read the story <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Event archive */}
      <section
        id="events"
        className="mx-auto max-w-[1240px] px-4 md:px-8 pt-10"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-ivory-300 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Tab
              active={tab === "upcoming"}
              icon={Calendar}
              label="Upcoming"
              onClick={() => setTab("upcoming")}
            />
            <Tab
              active={tab === "past"}
              icon={Calendar}
              label="Past events"
              onClick={() => setTab("past")}
            />
          </div>

          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search events…"
              className="w-full rounded-full bg-ivory-100 ring-1 ring-ivory-300 pl-11 pr-4 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {loading && (
            <div className="col-span-full rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60">
              Loading events…
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="col-span-full rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60 text-[14px]">
              {tab === "upcoming"
                ? "No upcoming events are listed right now. You can explore our past events or check back for the next one."
                : "No events match your search."}
            </div>
          )}

          {filtered.map((ev) => (
            <EventCard key={ev.id} ev={ev} />
          ))}
        </div>
      </section>

      {/* Idea CTA */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 mt-16 md:mt-20 mb-16 md:mb-24">
        <div className="rounded-2xl bg-ivory-200/70 ring-1 ring-ivory-300 p-5 md:p-6 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-burgundy/10 flex items-center justify-center">
            <HeartHand className="w-8 h-8" color="#5C1519" />
          </div>

          <div>
            <div className="font-serif-display text-burgundy text-[20px] font-semibold">
              {pageContent.ideaCta.title}
            </div>
            <p className="text-ink/80 text-[14px] leading-relaxed mt-1">
              {pageContent.ideaCta.body}
            </p>
          </div>

          <a
            href={pageContent.ideaCta.button.href}
            className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14.5px] font-semibold hover:bg-burgundy-light"
          >
            {pageContent.ideaCta.button.label}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;
