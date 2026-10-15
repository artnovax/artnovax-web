import React, { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Mail, ArrowRight } from "lucide-react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getNewsletterIssue } from "../services/content";
import { subscribeNewsletter } from "../services/submissions";

const formatDate = (value) => {
  if (!value) return "Unpublished draft";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

const renderBody = (body = "") =>
  body
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section, index) => {
      if (section.startsWith("### ")) {
        return (
          <h3
            key={index}
            className="font-serif-display text-ink text-[21px] md:text-[23px] font-semibold mt-7 mb-2"
          >
            {section.slice(4).trim()}
          </h3>
        );
      }

      if (section.startsWith("## ")) {
        return (
          <h2
            key={index}
            className="font-serif-display text-burgundy text-[27px] md:text-[31px] font-semibold mt-10 mb-3"
          >
            {section.slice(3).trim()}
          </h2>
        );
      }

      if (section.startsWith("> ")) {
        return (
          <blockquote
            key={index}
            className="my-8 border-l-4 border-burgundy pl-5 font-serif-display italic text-burgundy text-[20px] md:text-[23px] leading-relaxed"
          >
            {section.slice(2).trim()}
          </blockquote>
        );
      }

      return (
        <p
          key={index}
          className="text-ink/85 text-[16px] md:text-[17px] leading-[1.8] mb-5 whitespace-pre-line"
        >
          {section}
        </p>
      );
    });

const NewsletterDetail = () => {
  const { slug } = useParams();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [firstName, setFirstName] = useState("");


  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeMessage, setSubscribeMessage] = useState(null);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const row = await getNewsletterIssue(slug);

        if (!cancelled) {
          setIssue(row);
        }
      } catch {
        if (!cancelled) {
          setNotFound(true);
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
  }, [slug]);

  const submitNewsletter = async (e) => {
    e.preventDefault();

    if (!email || subscribeLoading) return;

    setSubscribeLoading(true);
    setSubscribeMessage(null);

    try {
      const result = await subscribeNewsletter(
        email,
        "newsletter-detail",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/newsletters" />

        <div className="mx-auto max-w-[760px] px-4 py-24 text-center text-ink/60">
          Loading issue…
        </div>

        <Footer />
      </div>
    );
  }

  if (notFound || !issue) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/newsletters" />

        <section className="mx-auto max-w-[720px] px-6 py-24 text-center">
          <h1 className="font-serif-display text-burgundy text-[32px] font-semibold">
            Newsletter issue not found
          </h1>

          <p className="mt-3 text-ink/70">
            It may still be a private draft or may no longer exist.
          </p>

          <a
            href="/newsletters"
            className="cta-btn mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to archive
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
            Saved draft preview — only signed-in website staff can view this
            issue.
          </div>
        )}

        {/* Issue heading */}
        <section className="mx-auto max-w-[860px] px-4 md:px-6 pt-8 md:pt-12">
          <a
            href="/newsletters"
            className="inline-flex items-center gap-1 text-burgundy text-[13.5px] font-semibold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to archive
          </a>

          <h1 className="mt-3 font-serif-display text-burgundy text-[38px] md:text-[54px] leading-[1.06] font-semibold">
            {issue.title}
          </h1>

          <div className="mt-4 inline-flex items-center gap-2 text-ink/60 text-[13px]">
            <CalendarDays className="w-4 h-4" />
            {formatDate(issue.publishedAt)}
          </div>

          {issue.excerpt && (
            <p className="mt-6 font-serif-display italic text-ink text-[19px] md:text-[22px] leading-relaxed">
              {issue.excerpt}
            </p>
          )}
        </section>

        {/* Hero image */}
        {issue.hero && (
          <section className="mx-auto max-w-[1080px] px-4 md:px-6 mt-8">
            <div className="rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-ivory-200">
              <img
                src={issue.hero}
                alt={issue.heroAlt || issue.title}
                className="w-full h-full object-cover"
              />
            </div>
          </section>
        )}

        {/* Issue body */}
        <article className="mx-auto max-w-[760px] px-4 md:px-6 pt-9 pb-14 md:pb-20">
          {renderBody(issue.body)}
        </article>

        {/* Newsletter signup */}
        <section className="mx-auto max-w-[1080px] px-4 md:px-6 pb-16 md:pb-24">
          <div className="rounded-3xl bg-ivory-200/70 ring-1 ring-ivory-300 p-6 md:p-8 lg:px-10 lg:py-9 grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 md:gap-8 lg:gap-10">
            <div className="w-14 h-14 rounded-2xl bg-burgundy/10 flex items-center justify-center">
              <Mail className="w-7 h-7 text-burgundy" strokeWidth={1.5} />
            </div>

            <div className="min-w-0">
              <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
                Enjoyed this issue?
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

export default NewsletterDetail;
