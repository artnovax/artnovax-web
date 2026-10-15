import React, { useEffect, useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getNewsletterIssues } from "../services/content";
import { subscribeNewsletter } from "../services/submissions";

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

  const [firstName, setFirstName] = useState("");


  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeMessage, setSubscribeMessage] = useState(null);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = await getNewsletterIssues();

        if (!cancelled) {
          setIssues(rows);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || "Unable to load newsletter issues.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const submitNewsletter = async (e) => {
    e.preventDefault();

    if (!email || subscribeLoading) return;

    setSubscribeLoading(true);
    setSubscribeMessage(null);

    try {
      const result = await subscribeNewsletter(
        email,
        "newsletter-archive",
        firstName,
      );

      setSubscribeMessage({
        type: "ok",
        text:
          result?.message || "You’re subscribed to the ArtNovaX newsletter.",
      });

      setFirstName("");
      setEmail("");
      setSubscribeOpen(false);
    } catch (err) {
      setSubscribeMessage({
        type: "err",
        text: err?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSubscribeLoading(false);

      setTimeout(() => {
        setSubscribeMessage(null);
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/newsletters" />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-[960px] px-4 md:px-8 pt-12 md:pt-20 pb-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center">
            <Mail className="w-6 h-6 text-burgundy" />
          </div>

          <div className="mt-5 text-burgundy tracking-[0.25em] text-[11.5px] font-semibold">
            Newsletter Issues
          </div>

          <h1 className="mt-3 font-serif-display text-burgundy text-[40px] md:text-[56px] leading-tight font-semibold">
            Stories, ideas &amp; updates
          </h1>

          <p className="mt-5 mx-auto max-w-[650px] text-ink/75 text-[16px] md:text-[17px] leading-relaxed">
            Explore published notes on art, wellbeing, community, and
            technology.
          </p>
        </section>

        {/* Newsletter archive */}
        <section className="mx-auto max-w-[1120px] px-4 md:px-8 pb-12 md:pb-16">
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
                      Read issue
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Newsletter signup */}
        <section className="mx-auto max-w-[1120px] px-4 md:px-8 pb-16 md:pb-24">
          <div className="rounded-3xl bg-ivory-200/70 ring-1 ring-ivory-300 p-6 md:p-8 lg:px-10 lg:py-9 grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 md:gap-8 lg:gap-10">
            <div className="w-14 h-14 rounded-2xl bg-burgundy/10 flex items-center justify-center">
              <Mail className="w-7 h-7 text-burgundy" strokeWidth={1.5} />
            </div>

            <div className="min-w-0">
              <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
                Stay informed
              </h3>
              <p className="text-ink/80 text-[14px] mt-1 max-w-[620px] leading-relaxed">
                Be the first to receive fresh artistic insights, creative
                reflections and wellbeing resources straight to your inbox.
              </p>
            </div>

          <div className="w-full md:w-auto md:min-w-[210px] flex md:justify-end md:pl-6">
            {!subscribeOpen ? (
              <button
                type="button"
                onClick={() => setSubscribeOpen(true)}
                aria-expanded={subscribeOpen}
                className="cta-btn inline-flex items-center justify-center gap-2 rounded-full bg-burgundy text-ivory px-7 py-3.5 text-[14px] font-semibold hover:bg-burgundy-light md:min-w-[168px]"
              >
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-full md:w-[390px] lg:w-[420px] rounded-2xl bg-ivory/75 ring-1 ring-ivory-300 p-4">
                <form onSubmit={submitNewsletter} className="space-y-2.5">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name (optional)"
                    aria-label="First name"
                    autoComplete="given-name"
                    maxLength={80}
                    className="w-full rounded-full bg-ivory ring-1 ring-ivory-300 px-4 py-2.5 text-[13.5px] text-ink placeholder:text-ink/50 outline-none focus:ring-2 focus:ring-burgundy/40"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={"Enter your email"}
                    aria-label="Email address"
                    autoComplete="email"
                    className="w-full rounded-full bg-ivory ring-1 ring-ivory-300 px-4 py-2.5 text-[13.5px] text-ink placeholder:text-ink/50 outline-none focus:ring-2 focus:ring-burgundy/40"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => setSubscribeOpen(false)}
                      className="rounded-full px-4 py-2 text-[12.5px] font-semibold text-ink/65 hover:text-burgundy"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={subscribeLoading}
                      className="cta-btn rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[12.5px] font-semibold hover:bg-burgundy-light disabled:opacity-70"
                    >
                      {subscribeLoading ? "Subscribing…" : "Subscribe"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          </div>

          {subscribeMessage && (
            <div
              aria-live="polite"
              className={subscribeMessage.type === "ok"
                ? "text-[13px] mt-3 md:text-right text-burgundy"
                : "text-[13px] mt-3 md:text-right text-red-700"}
            >
              {subscribeMessage.text}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NewsletterArchive;
