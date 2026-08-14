import React from "react";
import {
  ArrowRight,
  Calendar,
  Handshake,
  Heart,
  Gift,
  ShoppingBag,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BrushFrame from "../components/BrushFrame";
import { GET_INVOLVED } from "../mock_pages2";

const wayIcon = (key) => {
  const cls = "w-8 h-8 text-burgundy";
  const map = {
    calendar: Calendar,
    handshake: Handshake,
    "heart-hands": Heart,
    gift: Gift,
    "shopping-bag": ShoppingBag,
  };
  const Icon = map[key];
  return Icon ? <Icon className={cls} strokeWidth={1.4} /> : null;
};

const StrongerIllustration = () => (
  <svg viewBox="0 0 480 240" className="w-full h-full">
    <defs>
      <linearGradient id="skin1" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#8B5A2B" />
        <stop offset="1" stopColor="#5C3A1A" />
      </linearGradient>
    </defs>
    {/* Plants */}
    <path
      d="M20 220c10-30 30-50 60-40"
      stroke="#5C1519"
      strokeWidth="2"
      fill="none"
      opacity="0.4"
    />
    <path
      d="M15 210c8-20 22-30 40-24"
      stroke="#5C1519"
      strokeWidth="2"
      fill="none"
      opacity="0.4"
    />
    <path
      d="M460 220c-10-30-30-50-60-40"
      stroke="#5C1519"
      strokeWidth="2"
      fill="none"
      opacity="0.4"
    />
    {/* People from behind - silhouettes */}
    {[
      {
        x: 60,
        hair: "#2A1B1C",
        top: "#7A2E2E",
        hairPath:
          "M0 -22c-8-2-12 4-10 14 4 6 8 8 16 8s12-2 16-8c2-10-2-16-10-14z",
      },
      {
        x: 110,
        hair: "#1B0F0F",
        top: "#B0603A",
        hairPath:
          "M0 -18c-10 0-14 6-12 16 4 4 8 6 14 6s10-2 14-6c2-10-2-16-16-16z",
      },
      {
        x: 160,
        hair: "#2A1B1C",
        top: "#4C2A2A",
        hairPath:
          "M0 -26c-12-2-16 8-12 22 4 6 8 8 14 8s10-2 14-8c4-14 0-24-16-22z",
      },
      {
        x: 210,
        hair: "#1B0F0F",
        top: "#7C4B2E",
        hairPath:
          "M0 -20c-8 0-12 4-12 12 2 8 6 10 12 10s10-2 12-10c0-8-4-12-12-12z",
      },
      {
        x: 260,
        hair: "#2A1B1C",
        top: "#6E3535",
        hairPath:
          "M0 -22c-8-2-12 2-12 12 4 8 8 10 14 10s10-2 12-10c0-10-4-14-14-12z",
      },
      {
        x: 310,
        hair: "#3A2A2A",
        top: "#A45C3A",
        hairPath:
          "M0 -24c-10 0-16 6-14 16 2 8 8 12 14 12s12-4 14-12c2-10-4-16-14-16z",
      },
    ].map((p, i) => (
      <g key={i} transform={`translate(${p.x} 170)`}>
        {/* Hair */}
        <path d={p.hairPath} fill={p.hair} transform="translate(0 -30)" />
        <circle cx="0" cy="-20" r="14" fill="#8B5A2B" />
        {/* Body */}
        <path d="M-20 0c2-8 8-14 20-14s18 6 20 14v40h-40z" fill={p.top} />
        {/* Arm reaching to next */}
        {i < 5 && (
          <path
            d="M18 4c8 2 18 2 34 0"
            stroke={p.top}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </g>
    ))}
    {/* Heart in air */}
    <g transform="translate(370 60)">
      <path
        d="M0 0c-8-8-20 0-16 12 4 10 16 14 16 22 0-8 12-12 16-22 4-12-8-20-16-12z"
        stroke="#5C1519"
        strokeWidth="2"
        fill="none"
      />
    </g>
  </svg>
);

const GetInvolved = () => {
  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/get-involved" />

      {/* Hero */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 pt-8 md:pt-14 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div className="order-2 lg:order-1">
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold fade-up">
            {GET_INVOLVED.eyebrow}
          </div>
          <h1 className="fade-up delay-1 mt-4 font-serif-display text-burgundy text-[42px] sm:text-[52px] md:text-[60px] leading-[1.02] font-semibold whitespace-pre-line">
            {GET_INVOLVED.title}
          </h1>
          <p className="fade-up delay-2 mt-6 text-[16px] md:text-[17px] leading-[1.7] text-ink/80 max-w-[520px]">
            {GET_INVOLVED.body}
          </p>
          <div className="fade-up delay-3 mt-8 flex items-start gap-3">
            <svg
              viewBox="0 0 64 64"
              className="w-14 h-14 shrink-0"
              fill="none"
              stroke="#5C1519"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M14 46c8-14 20-24 34-24 8 0 12 8 8 14" />
              <path d="M32 46c-6-4-14-10-14-18 0-5 4-9 8-9 3 0 5 2 6 4 1-2 3-4 6-4 4 0 8 4 8 9 0 8-8 14-14 18z" />
            </svg>
            <div className="text-ink/85 font-serif-display italic text-[15px] leading-snug whitespace-pre-line">
              {GET_INVOLVED.tagline}
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2 fade-up delay-2">
          <BrushFrame
            src={GET_INVOLVED.image}
            alt={GET_INVOLVED.imageAlt}
            aspect="aspect-[5/4]"
            objectPosition="center"
          />
        </div>
      </section>

      {/* Ways */}
      <section
        id="ways"
        className="mx-auto max-w-[1240px] px-4 md:px-8 pt-10 md:pt-14"
      >
        <div className="text-center">
          <h2 className="font-serif-display text-ink text-[26px] md:text-[32px] font-medium">
            {GET_INVOLVED.waysTitle}
          </h2>
          <div className="mx-auto mt-2 w-16 h-0.5 bg-burgundy/40" />
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {GET_INVOLVED.ways.map((w) => (
            <article
              key={w.title}
              className="wwd-card rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 text-center flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-ivory-200 flex items-center justify-center">
                {wayIcon(w.icon)}
              </div>
              <h3 className="mt-4 font-serif-display text-burgundy text-[19px] font-semibold">
                {w.title}
              </h3>
              <p className="mt-2 text-ink/80 text-[13.5px] leading-relaxed flex-1">
                {w.body}
              </p>
              <div className="w-8 h-px bg-burgundy/40 my-3" />
              <a
                href={w.link.href}
                className="text-burgundy font-semibold text-[13.5px] inline-flex items-center gap-1 hover:gap-2 transition-all"
              >
                {w.link.label} <ArrowRight className="w-4 h-4" />
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Stronger together band */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 mt-14 md:mt-20 mb-16 md:mb-24">
        <div className="relative rounded-3xl bg-ivory-200/80 ring-1 ring-ivory-300 overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6 items-center p-6 md:p-8">
          <div className="h-56 md:h-64">
            <StrongerIllustration />
          </div>
          <div>
            <h3 className="font-serif-display text-burgundy text-[26px] md:text-[30px] font-semibold">
              {GET_INVOLVED.stronger.title}
            </h3>
            <p className="mt-3 text-ink/80 text-[14.5px] leading-relaxed max-w-[420px]">
              {GET_INVOLVED.stronger.body}
            </p>
            <a
              href={GET_INVOLVED.stronger.cta.href}
              className="cta-btn mt-5 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light"
            >
              {GET_INVOLVED.stronger.cta.label}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GetInvolved;
