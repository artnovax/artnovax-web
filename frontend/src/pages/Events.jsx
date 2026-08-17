import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  MapPin,
  ChevronDown,
  Quote,
  Users,
  Search,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BrushFrame from "../components/BrushFrame";
import { HeartHand } from "../components/BrandGlyphs";
import { EVENTS } from "../mock_pages";
import { getEvents } from "@/services/events";

const Tab = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-colors ${active ? "bg-burgundy/10 text-burgundy ring-1 ring-burgundy/25" : "text-ink/70 hover:text-burgundy"}`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const EventCard = ({ ev }) => (
  <article className="wwd-card group rounded-2xl overflow-hidden ring-1 ring-ivory-300 bg-ivory-100 flex flex-col">
    <a
      href={`/events/${ev.slug || ev.id}`}
      className="block relative aspect-[16/10] overflow-hidden bg-ivory-200"
    >
      <img
        src={ev.img}
        alt={ev.imgAlt || ev.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      {ev.featured && (
        <span className="absolute top-3 left-3 inline-block bg-burgundy text-ivory text-[10.5px] font-semibold tracking-widest px-2 py-1 rounded">
          FEATURED
        </span>
      )}
    </a>
    <div className="p-5 flex-1 flex flex-col">
      <div className="flex items-center gap-3 text-ink/60 text-[12px]">
        {ev.date && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-burgundy" />
            {ev.date}
          </span>
        )}
        {ev.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-burgundy" />
            {ev.location}
          </span>
        )}
      </div>
      <h3 className="mt-2 font-serif-display text-burgundy text-[20px] leading-tight font-semibold">
        {ev.title}
      </h3>
      {ev.subtitle && (
        <div className="text-ink/70 text-[13px] mt-0.5">{ev.subtitle}</div>
      )}
      {ev.body && (
        <p className="mt-2 text-ink/80 text-[13.5px] leading-relaxed line-clamp-3 flex-1">
          {ev.body}
        </p>
      )}
      <a
        href={`/events/${ev.slug || ev.id}`}
        className="mt-4 inline-flex items-center gap-1 text-burgundy font-semibold text-[13.5px] self-start"
      >
        View details <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  </article>
);

const Events = () => {
  const [tab, setTab] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [tIdx, setTIdx] = useState(0);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const featuredList = useMemo(
    () => events.filter((e) => e.featured).slice(0, 2),
    [events],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (tab === "upcoming" && e.status !== "upcoming") return false;
      if (tab === "past" && e.status !== "past") return false;
      if (tab === "featured" && !e.featured) return false;
      if (!q) return true;
      return `${e.title} ${e.subtitle || ""} ${e.location || ""} ${e.body || ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [events, tab, query]);

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/events" />

      {/* Hero */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 pt-8 md:pt-14 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div className="order-2 lg:order-1">
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold fade-up">
            {EVENTS.eyebrow}
          </div>
          <h1 className="fade-up delay-1 mt-4 font-serif-display text-burgundy text-[40px] sm:text-[50px] md:text-[58px] leading-[1.05] font-semibold whitespace-pre-line">
            {EVENTS.title}
          </h1>
          <p className="fade-up delay-2 mt-6 text-[16px] md:text-[17px] leading-[1.7] text-ink/80 max-w-[520px]">
            {EVENTS.body}
          </p>
          <div className="fade-up delay-3 mt-8 flex flex-wrap gap-3">
            <a
              href="#upcoming"
              className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light shadow-[0_14px_30px_-14px_rgba(92,21,25,0.7)]"
            >
              <Calendar className="w-4 h-4" />
              View Upcoming Events
            </a>
            <button
              onClick={() => setTab("past")}
              className="cta-btn inline-flex items-center gap-2 rounded-full border-2 border-burgundy text-burgundy px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy hover:text-ivory"
            >
              See Past Events
            </button>
          </div>
        </div>
        <div className="order-1 lg:order-2 fade-up delay-2">
          <BrushFrame
            src={EVENTS.image}
            alt={EVENTS.imageAlt}
            aspect="aspect-[5/4]"
            objectPosition="center"
          />
        </div>
      </section>

      {/* Featured events row (compact, up to 2) */}
      {featuredList.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-4 md:px-8 pt-6">
          <div className="text-burgundy tracking-[0.22em] text-[11.5px] font-semibold mb-3">
            FEATURED
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {featuredList.map((f) => (
              <a
                key={f.id}
                href={`/events/${f.slug || f.id}`}
                className="wwd-card group rounded-2xl overflow-hidden ring-1 ring-ivory-300 bg-ivory-100 grid grid-cols-[minmax(0,120px)_minmax(0,1fr)]"
              >
                <div className="relative aspect-square overflow-hidden bg-ivory-200">
                  <img
                    src={f.img}
                    alt={f.imgAlt || f.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                </div>
                <div className="p-4 flex flex-col">
                  <div className="text-burgundy text-[10.5px] tracking-widest font-semibold">
                    {(f.status || "UPCOMING").toUpperCase()}
                  </div>
                  <h3 className="mt-1 font-serif-display text-burgundy text-[18px] leading-tight font-semibold line-clamp-2">
                    {f.title}
                  </h3>
                  <div className="mt-1 text-ink/70 text-[12.5px] flex items-center gap-3 flex-wrap">
                    {f.date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-burgundy" />
                        {f.date}
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
                    View details <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Tabs + search */}
      <section
        id="upcoming"
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
            <Tab
              active={tab === "testimonials"}
              icon={Quote}
              label="Testimonials"
              onClick={() => setTab("testimonials")}
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

        {tab !== "testimonials" && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && (
              <div className="col-span-full rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60">
                Loading events…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="col-span-full rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60 text-[14px]">
                No events match your search.
              </div>
            )}
            {filtered.map((ev) => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>
        )}

        {tab === "testimonials" && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {EVENTS.testimonials.map((t, i) => (
              <div key={i} className="rounded-2xl bg-burgundy text-ivory p-6">
                <Quote className="w-6 h-6 text-ivory/70 mb-3" />
                <p className="font-serif-display italic text-ivory text-[17px] leading-snug">
                  “{t.quote}”
                </p>
                <div className="mt-3 text-ivory/80 text-[12.5px]">
                  – {t.author}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Idea CTA */}
      <section className="mx-auto max-w-[1180px] px-4 md:px-8 mt-16 md:mt-20 mb-16 md:mb-24">
        <div className="rounded-2xl bg-ivory-200/70 ring-1 ring-ivory-300 p-5 md:p-6 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-burgundy/10 flex items-center justify-center">
            <HeartHand className="w-8 h-8" color="#5C1519" />
          </div>
          <div>
            <div className="font-serif-display text-burgundy text-[20px] font-semibold">
              {EVENTS.ideaCta.title}
            </div>
            <p className="text-ink/80 text-[14px] leading-relaxed mt-1">
              {EVENTS.ideaCta.body}
            </p>
          </div>
          <a
            href={EVENTS.ideaCta.button.href}
            className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14.5px] font-semibold hover:bg-burgundy-light"
          >
            {EVENTS.ideaCta.button.label}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;
