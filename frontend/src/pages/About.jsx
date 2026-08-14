import React, { useEffect, useState } from 'react';
import { Target, Eye, Users, Calendar, Landmark, Globe, ArrowRight, Linkedin } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BrushFrame from '../components/BrushFrame';
import { BrainLineArt, HeartHand } from '../components/BrandGlyphs';
import { ABOUT } from '../mock_pages';
import { getFounders } from '../services/content';


const valuesIcon = (
  <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none" stroke="#5C1519" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 30l12 8 12-8" />
    <path d="M24 22c-3-3-8-2-9 2-1 4 2 6 4 7 2-1 4-3 5-5 1 2 3 4 5 5 2-1 5-3 4-7-1-4-6-5-9-2z" />
  </svg>
);

const iconFor = (key) => {
  if (key === 'target') return <Target className="w-9 h-9 text-burgundy" strokeWidth={1.4} />;
  if (key === 'eye') return <Eye className="w-9 h-9 text-burgundy" strokeWidth={1.4} />;
  if (key === 'values') return valuesIcon;
  return null;
};

const statIcon = (key) => {
  const cls = 'w-7 h-7 text-ivory';
  if (key === 'users') return <Users className={cls} strokeWidth={1.5} />;
  if (key === 'calendar') return <Calendar className={cls} strokeWidth={1.5} />;
  if (key === 'landmark') return <Landmark className={cls} strokeWidth={1.5} />;
  if (key === 'globe') return <Globe className={cls} strokeWidth={1.5} />;
  return null;
};

const SCROLL_KEY = 'about_scroll_y';

const About = () => {
  const [founders, setFounders] = useState(ABOUT.founders.people);
  useEffect(() => {
    (async () => {
      try {
        const rows = await getFounders();
        if (rows.length) setFounders(rows);
      } catch (err) { console.warn('Failed to load founders:', err); }
    })();
  }, []);

  // Restore scroll position when coming back from a founder detail page.
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      const y = parseInt(saved, 10);
      sessionStorage.removeItem(SCROLL_KEY);
      // Two-stage restore so late-loading images don\u2019t reset the layout.
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }));
      setTimeout(() => window.scrollTo({ top: y, behavior: 'auto' }), 350);
    }
  }, [founders.length]);

  const rememberScroll = () => { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)); };

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/about" />

      {/* Hero */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 pt-8 md:pt-14 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div className="order-2 lg:order-1">
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold fade-up">{ABOUT.eyebrow}</div>
          <h1 className="fade-up delay-1 mt-4 font-serif-display text-burgundy text-[40px] sm:text-[50px] md:text-[58px] leading-[1.05] font-semibold whitespace-pre-line">
            {ABOUT.title}
          </h1>
          <p className="fade-up delay-2 mt-6 text-[16px] md:text-[17px] leading-[1.7] text-ink/80 max-w-[520px]">{ABOUT.body}</p>
        </div>
        <div className="order-1 lg:order-2 fade-up delay-2">
          <BrushFrame src={ABOUT.image} alt={ABOUT.imageAlt} aspect="aspect-[5/4]" objectPosition="center" />
        </div>
      </section>

      {/* Pillars card */}
      <section className="mx-auto max-w-[1180px] px-4 md:px-8 mt-4 md:mt-8">
        <div className="rounded-3xl bg-ivory-200/60 ring-1 ring-ivory-300 p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 shadow-[0_20px_50px_-40px_rgba(92,21,25,0.35)]">
          {ABOUT.pillars.map((p) => (
            <div key={p.title} className="flex gap-4">
              <div className="shrink-0 w-14 h-14 rounded-full bg-ivory flex items-center justify-center ring-1 ring-ivory-300">
                {iconFor(p.icon)}
              </div>
              <div>
                <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">{p.title}</h3>
                {p.body && <p className="mt-2 text-ink/80 text-[14.5px] leading-relaxed">{p.body}</p>}
                {p.list && (
                  <ul className="mt-2 space-y-1.5 text-ink/85 text-[14.5px]">
                    {p.list.map((it) => (
                      <li key={it} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-burgundy" />{it}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Founders */}
      <section className="mx-auto max-w-[1180px] px-4 md:px-8 pt-16 md:pt-24 pb-6">
        <div className="text-center">
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold">{ABOUT.founders.eyebrow}</div>
          <h2 className="font-serif-display text-ink mt-3 text-[28px] sm:text-[34px] md:text-[40px] font-medium">{ABOUT.founders.title}</h2>
        </div>
        <div className="mt-10 md:mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {founders.map((p) => (
            <a key={p.slug} href={`/founders/${p.slug}`} onClick={rememberScroll} className="wwd-card group block">
              <div className="rounded-2xl overflow-hidden aspect-[4/5] bg-ivory-200 ring-1 ring-ivory-300">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="mt-3">
                <h3 className="font-serif-display text-burgundy text-[17px] font-semibold leading-tight">{p.name}</h3>
                <div className="text-[11px] tracking-widest text-ink/70 mt-1 uppercase">{p.role}</div>
                <p className="mt-2 text-ink/80 text-[13px] leading-relaxed line-clamp-3">{p.short}</p>
                <div className="mt-2 text-burgundy text-[12.5px] font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">Read more <Linkedin className="w-3.5 h-3.5" style={{ display: 'none' }} /></div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Stats band */}
      <section className="mt-16 md:mt-24">
        <div className="paint-band relative py-12 md:py-14 overflow-hidden">
          <BrainLineArt className="brain-line-left" color="#F1DFC7" />
          <div className="mx-auto max-w-[1180px] px-6 relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <h3 className="font-serif-display text-ivory text-[20px] md:text-[22px] leading-tight whitespace-pre-line ml-0 md:ml-24 md:flex-1">{ABOUT.stats.title}</h3>
            {ABOUT.stats.items.map((it, i) => (
              <React.Fragment key={it.label}>
                {i > 0 && <div className="hidden md:block h-12 w-px bg-ivory/25 self-center" />}
                <div className="flex items-center gap-2.5">
                  {statIcon(it.icon)}
                  <div>
                    <div className="font-serif-display text-ivory text-[24px] leading-none">{it.value}</div>
                    <div className="text-ivory/85 text-[11.5px] leading-tight whitespace-pre-line mt-1">{it.label}</div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Be part of our story CTA */}
      <section className="mx-auto max-w-[1180px] px-4 md:px-8 mt-12 md:mt-16 mb-16 md:mb-24">
        <div className="rounded-3xl bg-ivory-200/70 ring-1 ring-ivory-300 p-6 md:p-8 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-burgundy/10 flex items-center justify-center">
            <HeartHand className="w-9 h-9" color="#5C1519" />
          </div>
          <div>
            <h3 className="font-serif-display text-burgundy text-[22px] md:text-[26px] font-semibold">{ABOUT.cta.title}</h3>
            <p className="text-ink/80 text-[14.5px] leading-relaxed mt-1">{ABOUT.cta.body}</p>
          </div>
          <a href={ABOUT.cta.button.href} className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light shadow-[0_14px_30px_-14px_rgba(92,21,25,0.7)]">
            {ABOUT.cta.button.label}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
