import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Linkedin, Sparkles, Palette, Heart } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ABOUT } from "../mock_pages";
import { getFounder } from "../services/content";

const FounderDetail = () => {
  const { slug } = useParams();
  const [p, setP] = useState(
    ABOUT.founders.people.find((x) => x.slug === slug) || null,
  );
  useEffect(() => {
    (async () => {
      try {
        setP(await getFounder(slug));
      } catch {
        if (!ABOUT.founders.people.find((x) => x.slug === slug)) setP(null);
      }
    })();
  }, [slug]);
  if (!p) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/about" />
        <section className="mx-auto max-w-[720px] px-6 py-24 text-center">
          <h1 className="font-serif-display text-burgundy text-[32px] font-semibold">
            Founder not found
          </h1>
          <a
            href="/about"
            className="cta-btn mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to About
          </a>
        </section>
        <Footer />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/about" />
      <section className="mx-auto max-w-[1080px] px-4 md:px-8 pt-8 md:pt-12 pb-16">
        <a
          href="/about"
          className="inline-flex items-center gap-1 text-burgundy text-[13.5px] font-semibold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to About
        </a>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-8">
          <div>
            <div className="rounded-3xl overflow-hidden aspect-[4/5] ring-1 ring-ivory-300 bg-ivory-200">
              <img
                src={p.img}
                alt={p.imgAlt || p.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="text-burgundy tracking-[0.24em] text-[11.5px] font-semibold">
              {(p.role || "").toUpperCase()}
            </div>
            <h1 className="mt-2 font-serif-display text-burgundy text-[42px] md:text-[56px] leading-[1.02] font-semibold">
              {p.name}
            </h1>
            <p className="mt-4 font-serif-display italic text-ink text-[19px] leading-relaxed">
              {p.short}
            </p>
            <div className="mt-6 text-ink/85 text-[15.5px] leading-[1.8] whitespace-pre-wrap">
              {p.bio}
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {p.medium && (
                <InfoCard
                  icon={<Palette className="w-5 h-5 text-burgundy" />}
                  label="Preferred medium"
                  value={p.medium}
                />
              )}
              {p.why_art && (
                <InfoCard
                  icon={<Heart className="w-5 h-5 text-burgundy" />}
                  label="Why art for wellbeing"
                  value={p.why_art}
                />
              )}
              {p.funfact && (
                <InfoCard
                  icon={<Sparkles className="w-5 h-5 text-burgundy" />}
                  label="Fun fact"
                  value={p.funfact}
                />
              )}
            </div>

            {p.linkedin && (
              <a
                href={p.linkedin}
                target="_blank"
                rel="noreferrer"
                className="cta-btn mt-8 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-3 text-[14px] font-semibold hover:bg-burgundy-light"
              >
                <Linkedin className="w-4 h-4" /> Connect on LinkedIn
              </a>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

const InfoCard = ({ icon, label, value }) => (
  <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-[11.5px] tracking-widest text-ink/60 uppercase font-semibold">
        {label}
      </span>
    </div>
    <div className="mt-2 text-ink/85 text-[13.5px] leading-relaxed">
      {value}
    </div>
  </div>
);

export default FounderDetail;
