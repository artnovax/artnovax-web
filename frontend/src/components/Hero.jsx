import React from "react";
import { ArrowRight, Users, BookOpen, Smartphone } from "lucide-react";
import BrushFrame from "./BrushFrame";
import { HERO } from "../mock";

const iconMap = { users: Users, "book-open": BookOpen, smartphone: Smartphone };

const Hero = ({ data = HERO }) => {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-[1240px] px-4 md:px-8 pt-8 md:pt-14 pb-10 md:pb-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        {/* Text */}
        <div className="order-2 lg:order-1">
          <div className="fade-up flex items-center gap-3 text-burgundy text-[12px] md:text-[13px] font-semibold tracking-[0.2em]">
            {data.eyebrow.map((word, i) => (
              <React.Fragment key={word}>
                <span>{word}</span>
                {i < data.eyebrow.length - 1 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-burgundy" />
                )}
              </React.Fragment>
            ))}
          </div>

          <h1 className="fade-up delay-1 mt-5 font-serif-display text-burgundy text-[44px] sm:text-[54px] md:text-[64px] leading-[1.02] font-semibold whitespace-pre-line">
            {data.title}
          </h1>

          <p className="fade-up delay-2 mt-6 text-[16px] md:text-[17px] leading-[1.7] text-ink/80 max-w-[520px]">
            {data.body}
          </p>

          <div className="fade-up delay-3 mt-8 flex flex-wrap gap-3">
            <a
              href={data.primaryCta.href}
              className="cta-btn inline-flex items-center gap-3 rounded-full bg-burgundy text-ivory px-6 py-4 text-[15px] font-semibold hover:bg-burgundy-light shadow-[0_14px_30px_-14px_rgba(92,21,25,0.7)]"
            >
              {data.primaryCta.label}
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={data.secondaryCta.href}
              className="cta-btn inline-flex items-center gap-3 rounded-full border-2 border-burgundy text-burgundy px-6 py-4 text-[15px] font-semibold hover:bg-burgundy hover:text-ivory"
            >
              {data.secondaryCta.label}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="fade-up delay-3 mt-8 flex flex-wrap gap-x-8 gap-y-4 items-center">
            {data.bullets.map((b) => {
              const Icon = iconMap[b.icon] || Users;
              return (
                <div
                  key={b.label}
                  className="flex items-center gap-2 text-[13px] md:text-[14px] text-ink/85"
                >
                  <Icon className="w-5 h-5 text-burgundy" strokeWidth={1.6} />
                  <span className="font-medium">{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Image */}
        <div className="order-1 lg:order-2">
          <div className="fade-up delay-2">
            <BrushFrame
              src={data.image}
              alt={data.imageAlt}
              aspect="aspect-[4/3] md:aspect-[5/4]"
              objectPosition="60% center"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
