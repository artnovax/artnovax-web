import React, { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Mail } from "lucide-react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getNewsletterIssue } from "../services/content";

const formatDate = (value) => {
  if (!value) return "Unpublished draft";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

const renderBody = (body = "") => body
  .split(/\n\s*\n/)
  .map((section) => section.trim())
  .filter(Boolean)
  .map((section, index) => {
    if (section.startsWith("### ")) {
      return (
        <h3 key={index} className="font-serif-display text-ink text-[21px] md:text-[23px] font-semibold mt-7 mb-2">
          {section.slice(4).trim()}
        </h3>
      );
    }
    if (section.startsWith("## ")) {
      return (
        <h2 key={index} className="font-serif-display text-burgundy text-[27px] md:text-[31px] font-semibold mt-10 mb-3">
          {section.slice(3).trim()}
        </h2>
      );
    }
    if (section.startsWith("> ")) {
      return (
        <blockquote key={index} className="my-8 border-l-4 border-burgundy pl-5 font-serif-display italic text-burgundy text-[20px] md:text-[23px] leading-relaxed">
          {section.slice(2).trim()}
        </blockquote>
      );
    }
    return (
      <p key={index} className="text-ink/85 text-[16px] md:text-[17px] leading-[1.8] mb-5 whitespace-pre-line">
        {section}
      </p>
    );
  });

const NewsletterDetail = () => {
  const { slug } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await getNewsletterIssue(slug);
        if (!cancelled) setIssue(row);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/newsletters" />
        <div className="mx-auto max-w-[760px] px-4 py-24 text-center text-ink/60">Loading issue…</div>
        <Footer />
      </div>
    );
  }

  if (notFound || !issue) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/newsletters" />
        <section className="mx-auto max-w-[720px] px-6 py-24 text-center">
          <h1 className="font-serif-display text-burgundy text-[32px] font-semibold">Newsletter issue not found</h1>
          <p className="mt-3 text-ink/70">It may still be a private draft or may no longer exist.</p>
          <a href="/newsletters" className="cta-btn mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to newsletter archive
          </a>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/newsletters" />
      <main>
        {issue.status === "draft" && (
          <div className="bg-amber-100 text-amber-900 text-center px-4 py-2.5 text-[13px] font-semibold ring-1 ring-amber-200">
            Saved draft preview — only signed-in website staff can view this issue.
          </div>
        )}
        <section className="mx-auto max-w-[860px] px-4 md:px-6 pt-8 md:pt-12">
          <a href="/newsletters" className="inline-flex items-center gap-1 text-burgundy text-[13.5px] font-semibold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to newsletter archive
          </a>
          <div className="mt-7 inline-flex items-center gap-2 text-burgundy tracking-[0.18em] text-[10.5px] font-semibold">
            <Mail className="w-4 h-4" /> ARTNOVAX NEWSLETTER
          </div>
          <h1 className="mt-3 font-serif-display text-burgundy text-[38px] md:text-[54px] leading-[1.06] font-semibold">
            {issue.title}
          </h1>
          <div className="mt-4 inline-flex items-center gap-2 text-ink/60 text-[13px]">
            <CalendarDays className="w-4 h-4" /> {formatDate(issue.publishedAt)}
          </div>
          {issue.excerpt && (
            <p className="mt-6 font-serif-display italic text-ink text-[19px] md:text-[22px] leading-relaxed">
              {issue.excerpt}
            </p>
          )}
        </section>

        {issue.hero && (
          <section className="mx-auto max-w-[1080px] px-4 md:px-6 mt-8">
            <div className="rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-ivory-200">
              <img src={issue.hero} alt={issue.heroAlt || issue.title} className="w-full h-full object-cover" />
            </div>
          </section>
        )}

        <article className="mx-auto max-w-[760px] px-4 md:px-6 pt-9 pb-16 md:pb-24">
          {renderBody(issue.body)}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default NewsletterDetail;
