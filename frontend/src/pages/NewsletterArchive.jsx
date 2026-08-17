import React, { useEffect, useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getNewsletterIssues } from "../services/content";

const formatDate = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

const NewsletterArchive = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getNewsletterIssues();
        if (!cancelled) setIssues(rows);
      } catch (loadError) {
        if (!cancelled) setError(loadError?.message || "Unable to load newsletter issues.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/newsletters" />
      <main>
        <section className="mx-auto max-w-[960px] px-4 md:px-8 pt-12 md:pt-20 pb-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center">
            <Mail className="w-6 h-6 text-burgundy" />
          </div>
          <div className="mt-5 text-burgundy tracking-[0.25em] text-[11.5px] font-semibold">
            ARTNOVAX NEWSLETTER
          </div>
          <h1 className="mt-3 font-serif-display text-burgundy text-[40px] md:text-[56px] leading-tight font-semibold">
            Stories, ideas &amp; updates
          </h1>
          <p className="mt-5 mx-auto max-w-[650px] text-ink/75 text-[16px] md:text-[17px] leading-relaxed">
            Explore published notes from ArtNovaX on art, wellbeing, community, and technology.
          </p>
        </section>

        <section className="mx-auto max-w-[1120px] px-4 md:px-8 pb-16 md:pb-24">
          {loading && (
            <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-10 text-center text-ink/60 text-[14px]">
              Loading newsletter issues…
            </div>
          )}
          {error && !loading && (
            <div className="rounded-2xl bg-red-50 ring-1 ring-red-200 p-8 text-center text-red-800 text-[14px]">
              {error}
            </div>
          )}
          {!loading && !error && issues.length === 0 && (
            <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-10 text-center text-ink/60 text-[14px]">
              The first issue is being prepared. Check back soon.
            </div>
          )}
          {!loading && !error && issues.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {issues.map((issue) => (
                <a
                  key={issue.id}
                  href={`/newsletters/${issue.slug}`}
                  className="wwd-card rounded-2xl overflow-hidden ring-1 ring-ivory-300 bg-ivory-100 group"
                >
                  <div className="aspect-[16/9] bg-ivory-200 overflow-hidden">
                    {issue.hero ? (
                      <img
                        src={issue.hero}
                        alt={issue.heroAlt || issue.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-burgundy/10">
                        <Mail className="w-10 h-10 text-burgundy/45" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="text-burgundy tracking-[0.18em] text-[10.5px] font-semibold">
                      {formatDate(issue.publishedAt)}
                    </div>
                    <h2 className="mt-2 font-serif-display text-burgundy text-[24px] md:text-[27px] leading-tight font-semibold">
                      {issue.title}
                    </h2>
                    {issue.excerpt && (
                      <p className="mt-3 text-ink/75 text-[14px] leading-relaxed line-clamp-3">
                        {issue.excerpt}
                      </p>
                    )}
                    <span className="mt-5 inline-flex items-center gap-2 text-burgundy text-[13.5px] font-semibold">
                      Read issue <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default NewsletterArchive;
