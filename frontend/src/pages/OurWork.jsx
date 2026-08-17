import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Brush,
  Users,
  BookOpen,
  Calendar,
  Landmark,
  Globe,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BrushFrame from "../components/BrushFrame";
import { BrainLineArt } from "../components/BrandGlyphs";
import { defaultOurWorkPageContent, getOurWorkPageContent } from "../services/pageContent";

const progIcon = (key) => {
  const cls = "w-8 h-8 text-burgundy";
  if (key === "brush") return <Brush className={cls} strokeWidth={1.4} />;
  if (key === "users") return <Users className={cls} strokeWidth={1.4} />;
  if (key === "book-open")
    return <BookOpen className={cls} strokeWidth={1.4} />;
  return null;
};

const statIcon = (key) => {
  const cls = "w-7 h-7 text-ivory";
  if (key === "users") return <Users className={cls} strokeWidth={1.5} />;
  if (key === "calendar") return <Calendar className={cls} strokeWidth={1.5} />;
  if (key === "landmark") return <Landmark className={cls} strokeWidth={1.5} />;
  if (key === "globe") return <Globe className={cls} strokeWidth={1.5} />;
  return null;
};

const OurWork = () => {
  const [pageContent, setPageContent] = useState(() => defaultOurWorkPageContent());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remoteContent = await getOurWorkPageContent();
        if (!cancelled) setPageContent(remoteContent);
      } catch (error) {
        console.warn("Using built-in Our Work page content.", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/our-work" />

      {/* Hero */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 pt-8 md:pt-14 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div className="order-2 lg:order-1">
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold fade-up">
            {pageContent.eyebrow}
          </div>
          <h1 className="fade-up delay-1 mt-4 font-serif-display text-burgundy text-[40px] sm:text-[50px] md:text-[58px] leading-[1.05] font-semibold whitespace-pre-line">
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

      {/* Program areas */}
      <section
        id="programs"
        className="mx-auto max-w-[1180px] px-4 md:px-8 pt-14 md:pt-20"
      >
        <div className="text-center">
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold">
            {pageContent.programsEyebrow}
          </div>
          <h2 className="font-serif-display text-ink mt-3 text-[28px] sm:text-[34px] md:text-[40px] font-medium">
            {pageContent.programsTitle}
          </h2>
        </div>

        <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {pageContent.programs.map((p) => (
            <article
              key={p.title}
              className="wwd-card rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-5 md:p-6 flex flex-col"
            >
              <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                <div className="w-14 h-14 rounded-full bg-ivory-200 flex items-center justify-center">
                  {progIcon(p.icon)}
                </div>
                <div className="rounded-xl overflow-hidden aspect-[5/4] bg-ivory-300">
                  <img
                    src={p.img}
                    alt={p.imgAlt || p.title.replace(/\n/g, " ")}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="font-serif-display text-burgundy text-[22px] md:text-[24px] font-semibold mt-5 whitespace-pre-line">
                {p.title}
              </h3>
              <p className="mt-2 text-ink/80 text-[14.5px] leading-relaxed">
                {p.body}
              </p>
              <a
                href={p.link.href}
                className="mt-4 inline-flex items-center gap-2 text-burgundy font-semibold text-[14px]"
              >
                {p.link.label}
                <ArrowRight className="w-4 h-4" />
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Stats band */}
      <section className="mt-14 md:mt-20">
        <div className="mx-auto max-w-[1180px] px-4 md:px-8">
          <div className="paint-band relative rounded-3xl overflow-hidden py-10 md:py-12 px-6 md:px-10">
            <BrainLineArt
              className="absolute left-4 top-1/2 -translate-y-1/2 w-28 h-28 opacity-30"
              color="#F1DFC7"
            />
            <div className="grid grid-cols-1 md:grid-cols-[1.1fr_auto_auto_auto_auto_auto_auto_auto] gap-4 md:gap-5 items-center relative z-10">
              <div className="ml-0 md:ml-24">
                <h3 className="font-serif-display text-ivory text-[20px] md:text-[22px] leading-tight whitespace-pre-line">
                  {pageContent.stats.title}
                </h3>
                <p className="text-ivory/85 text-[13px] mt-2 max-w-[300px] leading-relaxed">
                  {pageContent.stats.body}
                </p>
              </div>
              {pageContent.stats.items.map((it, i) => (
                <React.Fragment key={it.label}>
                  {i > 0 && (
                    <div className="hidden md:block h-12 w-px bg-ivory/25" />
                  )}
                  <div className="flex items-center gap-2.5">
                    {statIcon(it.icon)}
                    <div>
                      <div className="font-serif-display text-ivory text-[24px] leading-none">
                        {it.value}
                      </div>
                      <div className="text-ivory/85 text-[11.5px] leading-tight whitespace-pre-line mt-1">
                        {it.label}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="text-ivory/70 text-[12px] mt-5 md:text-center">
              {pageContent.stats.footnote}
            </div>
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="mx-auto max-w-[1180px] px-4 md:px-8 mt-10 md:mt-14 mb-16 md:mb-24">
        <div className="rounded-2xl bg-ivory-200/70 ring-1 ring-ivory-300 p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-ink/85 text-[14.5px] leading-relaxed max-w-[720px]">
            {pageContent.partnerCta.body}
          </p>
          <a
            href={pageContent.partnerCta.button.href}
            className="cta-btn inline-flex items-center gap-2 rounded-full border-2 border-burgundy text-burgundy px-6 py-3 text-[14.5px] font-semibold hover:bg-burgundy hover:text-ivory"
          >
            {pageContent.partnerCta.button.label}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OurWork;
