import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Brain,
  Sparkles,
  BookOpen,
  Users,
  Leaf,
  Quote,
  FileText,
  Search,
  Clock,
  Filter,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BrushFrame from "../components/BrushFrame";
import { BrainLineArt } from "../components/BrandGlyphs";
import { ARTICLES_LIST } from "../mock_articles";
import { getArticles } from "../services/content";
import {
  defaultResearchPageContent,
  getResearchPageContent,
} from "../services/pageContent";
import { subscribeNewsletter } from "../services/submissions";

const topicIcon = (key) => {
  const cls = "w-8 h-8 text-burgundy";
  if (key === "brain") return <Brain className={cls} strokeWidth={1.4} />;
  if (key === "sparkles") return <Sparkles className={cls} strokeWidth={1.4} />;
  if (key === "book") return <BookOpen className={cls} strokeWidth={1.4} />;
  if (key === "users") return <Users className={cls} strokeWidth={1.4} />;
  if (key === "plant") return <Leaf className={cls} strokeWidth={1.4} />;
  return null;
};

const Research = () => {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState(ARTICLES_LIST);
  const [pageContent, setPageContent] = useState(() =>
    defaultResearchPageContent(),
  );

  useEffect(() => {
    (async () => {
      try {
        setPageContent(await getResearchPageContent());
      } catch (error) {
        console.warn("Using built-in Research page content.", error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const remote = await getArticles();
        if (remote.length) {
          const bySlug = new Map(ARTICLES_LIST.map((a) => [a.slug, a]));
          remote.forEach((a) => bySlug.set(a.slug, a));
          setArticles(Array.from(bySlug.values()));
        }
      } catch (error) {
        console.warn(
          "Failed to load Supabase articles; using bundled articles.",
          error,
        );
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setMsg(null);
    try {
      const r = await subscribeNewsletter(email, "research");
      setMsg({ type: "ok", text: r.message });
      setEmail("");
    } catch (err) {
      setMsg({ type: "err", text: err?.message || "Something went wrong." });
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (tag !== "All" && !(a.tags || []).includes(tag)) return false;
      if (!q) return true;
      const hay =
        `${a.title} ${a.excerpt} ${a.topic} ${(a.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [articles, query, tag]);

  const allTags = useMemo(
    () => Array.from(new Set(articles.flatMap((a) => a.tags || []))).sort(),
    [articles],
  );

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/research" />

      {/* Hero */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 pt-8 md:pt-14 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div className="order-2 lg:order-1">
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold fade-up">
            {pageContent.eyebrow}
          </div>
          <h1 className="fade-up delay-1 mt-4 font-serif-display text-burgundy text-[42px] sm:text-[52px] md:text-[60px] leading-[1.02] font-semibold whitespace-pre-line">
            {pageContent.title}
          </h1>
          <p className="fade-up delay-2 mt-6 text-[16px] md:text-[17px] leading-[1.7] text-ink/80 max-w-[520px]">
            {pageContent.body}
          </p>
          <a
            href={pageContent.cta.href}
            className="fade-up delay-3 mt-8 inline-flex items-center gap-3 rounded-full bg-burgundy text-ivory px-6 py-4 text-[15px] font-semibold hover:bg-burgundy-light shadow-[0_14px_30px_-14px_rgba(92,21,25,0.7)] cta-btn"
          >
            {pageContent.cta.label}
            <ArrowRight className="w-4 h-4" />
          </a>
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

      {/* Topics */}
      <section
        id="topics"
        className="mx-auto max-w-[1240px] px-4 md:px-8 pt-10 md:pt-16"
      >
        <h2 className="font-serif-display text-ink text-[26px] md:text-[32px] font-medium inline-block border-b-2 border-burgundy pb-2">
          {pageContent.topicsTitle}
        </h2>
        <div className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {pageContent.topics.map((t, idx) => (
            <article
              key={t.title}
              className="wwd-card rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-5 flex flex-col"
            >
              <div className="w-14 h-14 rounded-full bg-ivory-200 flex items-center justify-center mb-4">
                {topicIcon(t.icon)}
              </div>
              <h3 className="font-serif-display text-burgundy text-[19px] leading-tight font-semibold whitespace-pre-line">
                {t.title}
              </h3>
              <p className="mt-3 text-ink/80 text-[13.5px] leading-relaxed flex-1">
                {t.body}
              </p>
              <a
                href={`/research/${articles[idx]?.slug || ARTICLES_LIST[idx]?.slug || ""}`}
                className="mt-4 inline-flex items-center gap-1 text-burgundy font-semibold text-[13.5px]"
              >
                Read more <ArrowRight className="w-4 h-4" />
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Library with search + filter */}
      <section
        id="library"
        className="mx-auto max-w-[1240px] px-4 md:px-8 pt-14 md:pt-20"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-burgundy tracking-[0.22em] text-[11.5px] font-semibold">
              {pageContent.libraryEyebrow}
            </div>
            <h2 className="font-serif-display text-ink text-[26px] md:text-[32px] font-medium mt-1">
              {pageContent.libraryTitle}
            </h2>
          </div>
          <div className="relative w-full md:w-[380px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder={pageContent.searchPlaceholder}
              className="w-full rounded-full bg-ivory-100 ring-1 ring-ivory-300 pl-11 pr-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-ink/60" />
          {["All", ...allTags].map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`text-[12.5px] font-semibold px-3 py-1.5 rounded-full transition-colors ${tag === t ? "bg-burgundy text-ivory" : "ring-1 ring-ivory-300 bg-ivory-100 text-ink/70 hover:text-burgundy"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60 text-[14px]">
              No articles match your search. Try a different keyword or tag.
            </div>
          )}
          {filtered.map((a) => (
            <a
              key={a.slug}
              href={`/research/${a.slug}`}
              className="wwd-card rounded-2xl overflow-hidden ring-1 ring-ivory-300 bg-ivory-100 block"
            >
              <div className="aspect-[16/10] bg-ivory-200 overflow-hidden">
                <img
                  src={a.hero}
                  alt={a.heroAlt || a.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <div className="text-burgundy tracking-[0.22em] text-[10.5px] font-semibold">
                  {a.topic.toUpperCase()}
                </div>
                <h3 className="font-serif-display text-burgundy text-[19px] md:text-[20px] leading-tight font-semibold mt-2">
                  {a.title}
                </h3>
                <p className="mt-2 text-ink/75 text-[13.5px] leading-relaxed">
                  {a.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-ink/60 text-[12px] inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {a.read}
                  </div>
                  <span className="text-burgundy text-[13px] font-semibold inline-flex items-center gap-1">
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Burgundy quote band */}
      <section className="mt-14 md:mt-20">
        <div className="mx-auto max-w-[1240px] px-4 md:px-8">
          <div className="paint-band relative rounded-3xl overflow-hidden py-10 md:py-12 px-6 md:px-10">
            <BrainLineArt className="brain-line-left" color="#F1DFC7" />
            <BrainLineArt className="brain-line-right" color="#F1DFC7" />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
              <div className="flex items-start gap-4">
                <Quote className="w-8 h-8 text-ivory/85 shrink-0 mt-1" />
                <div>
                  <p className="font-serif-display italic text-ivory text-[20px] md:text-[22px] leading-snug">
                    {pageContent.band.quote}
                  </p>
                  <div className="mt-2 text-ivory/80 text-[13px]">
                    {pageContent.band.author}
                  </div>
                </div>
              </div>
              <div className="md:pl-8 md:border-l md:border-ivory/20 flex items-start gap-4">
                <FileText className="w-7 h-7 text-ivory/85 shrink-0 mt-1" />
                <div>
                  <h3 className="font-serif-display text-ivory text-[20px] md:text-[22px]">
                    {pageContent.band.integrity.title}
                  </h3>
                  <p className="mt-2 text-ivory/85 text-[13.5px] leading-relaxed">
                    {pageContent.band.integrity.body}
                  </p>
                  <a
                    href={pageContent.band.integrity.link.href}
                    className="mt-2 inline-flex items-center gap-1 text-ivory font-semibold text-[13.5px]"
                  >
                    {pageContent.band.integrity.link.label}{" "}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stay informed */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 mt-12 md:mt-16 mb-16 md:mb-24">
        <div className="rounded-3xl bg-ivory-200/70 ring-1 ring-ivory-300 p-6 md:p-8 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-burgundy/10 flex items-center justify-center">
            <svg
              viewBox="0 0 48 48"
              className="w-8 h-8"
              fill="none"
              stroke="#5C1519"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="8" y="14" width="32" height="22" rx="3" />
              <path d="M8 16l16 12 16-12" />
            </svg>
          </div>
          <div>
            <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
              {pageContent.newsletter.title}
            </h3>
            <p className="text-ink/80 text-[14px] mt-1">
              {pageContent.newsletter.body}
            </p>
          </div>
          <form
            onSubmit={submit}
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={pageContent.newsletter.placeholder}
              className="flex-1 md:w-[280px] rounded-full bg-ivory ring-1 ring-ivory-300 px-5 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
            />
            <button
              disabled={loading}
              className="cta-btn rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold hover:bg-burgundy-light disabled:opacity-70"
            >
              {pageContent.newsletter.button}
            </button>
          </form>
        </div>
        {msg && (
          <div
            className={`text-[13px] mt-2 md:text-right ${msg.type === "ok" ? "text-burgundy" : "text-red-700"}`}
          >
            {msg.text}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Research;
