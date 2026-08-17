import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CalendarDays,
  Share2,
  BookmarkPlus,
  Quote,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ARTICLES, ARTICLE_SLUGS } from "../mock_articles";
import { getArticle, getArticles } from "../services/content";

const renderBlock = (b, i) => {
  switch (b.type) {
    case "h2":
      return (
        <h2
          key={i}
          className="font-serif-display text-burgundy text-[26px] md:text-[30px] font-semibold mt-10 mb-3"
        >
          {b.text}
        </h2>
      );
    case "h3":
      return (
        <h3
          key={i}
          className="font-serif-display text-ink text-[20px] md:text-[22px] font-semibold mt-6 mb-2"
        >
          {b.text}
        </h3>
      );
    case "p":
      return (
        <p
          key={i}
          className="text-ink/85 text-[16px] md:text-[17px] leading-[1.8] mb-5"
        >
          {b.text}
        </p>
      );
    case "img":
      return (
        <figure key={i} className="my-8">
          <div className="rounded-2xl overflow-hidden ring-1 ring-ivory-300 aspect-[16/9] bg-ivory-200">
            <img
              src={b.src}
              alt={b.alt || ""}
              className="w-full h-full object-cover"
            />
          </div>
          {b.caption && (
            <figcaption className="mt-3 text-center text-ink/60 text-[13px] italic">
              {b.caption}
            </figcaption>
          )}
        </figure>
      );
    case "quote":
      return (
        <blockquote
          key={i}
          className="my-8 border-l-4 border-burgundy pl-5 md:pl-6"
        >
          <Quote className="w-6 h-6 text-burgundy/40 mb-2" />
          <p className="font-serif-display italic text-burgundy text-[20px] md:text-[24px] leading-snug">
            “{b.text}”
          </p>
          {b.author && (
            <div className="mt-2 text-ink/60 text-[13px]">— {b.author}</div>
          )}
        </blockquote>
      );
    default:
      return null;
  }
};

const ArticleDetail = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(ARTICLES[slug] || null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await getArticle(slug);
        if (!cancelled) setArticle(remote);
      } catch {
        if (!cancelled && !ARTICLES[slug]) setNotFound(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFound || (!article && !ARTICLES[slug])) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/research" />
        <section className="mx-auto max-w-[720px] px-6 py-24 text-center">
          <h1 className="font-serif-display text-burgundy text-[32px] font-semibold">
            Article not found
          </h1>
          <p className="mt-3 text-ink/70">This insight doesn’t exist yet.</p>
          <a
            href="/research"
            className="cta-btn mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Research
          </a>
        </section>
        <Footer />
      </div>
    );
  }

  const idx = ARTICLE_SLUGS.indexOf(slug);
  const nextSlug = ARTICLE_SLUGS[(idx + 1) % ARTICLE_SLUGS.length] || slug;
  const next = ARTICLES[nextSlug] || { slug: nextSlug, title: "Next insight" };

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/research" />

      {/* Article header */}
      <section className="mx-auto max-w-[860px] px-4 md:px-6 pt-8 md:pt-12">
        <a
          href="/research"
          className="inline-flex items-center gap-1 text-burgundy text-[13.5px] font-semibold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Research & Insights
        </a>
        <div className="mt-6 flex items-center gap-3 flex-wrap">
          <span className="inline-block bg-burgundy/10 text-burgundy text-[11px] tracking-widest font-semibold px-2.5 py-1 rounded-full">
            {article.topic.toUpperCase()}
          </span>
          {(article.tags || []).map((t) => (
            <span key={t} className="text-[11.5px] text-ink/60">
              #{t.toLowerCase()}
            </span>
          ))}
        </div>
        <h1 className="mt-3 font-serif-display text-burgundy text-[36px] md:text-[52px] leading-[1.05] font-semibold">
          {article.title}
        </h1>
        <div className="mt-4 flex items-center flex-wrap gap-4 text-ink/60 text-[13px]">
          <div className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {article.read}
          </div>
          <div className="inline-flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" /> Updated {article.updated}
          </div>
          <div className="flex-1" />
          <button className="inline-flex items-center gap-1 hover:text-burgundy">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button className="inline-flex items-center gap-1 hover:text-burgundy">
            <BookmarkPlus className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </section>

      {/* Hero (simple, no brush frame) */}
      <section className="mx-auto max-w-[1080px] px-4 md:px-6 mt-8">
        <div className="rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-ivory-200">
          <img
            src={article.hero}
            alt={article.heroAlt || article.title}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Body */}
      <article className="mx-auto max-w-[760px] px-4 md:px-6 pt-8 pb-8">
        <p className="font-serif-display italic text-ink text-[19px] md:text-[22px] leading-relaxed mb-8">
          {article.lead}
        </p>
        {(article.blocks || []).map(renderBlock)}

        {/* Key takeaways */}
        <div className="mt-10 rounded-2xl bg-ivory-200/70 ring-1 ring-ivory-300 p-6">
          <div className="text-burgundy tracking-[0.22em] text-[11.5px] font-semibold">
            KEY TAKEAWAYS
          </div>
          <ul className="mt-3 space-y-2 text-ink/85 text-[14.5px]">
            {(article.takeaways || []).map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-burgundy shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Read next */}
        <div className="mt-12 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 md:p-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-ink/60 tracking-widest text-[10.5px] font-semibold">
              READ NEXT
            </div>
            <div className="font-serif-display text-burgundy text-[18px] md:text-[20px] font-semibold mt-1">
              {next.title}
            </div>
          </div>
          <a
            href={`/research/${next.slug}`}
            className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light shrink-0"
          >
            Read <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default ArticleDetail;
