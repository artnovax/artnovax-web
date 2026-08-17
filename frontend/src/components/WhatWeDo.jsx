import React from "react";
import { ArrowRight, Brush, Brain, Smartphone } from "lucide-react";
import { WHAT_WE_DO } from "../mock";

const iconMap = { brush: Brush, brain: Brain, app: Smartphone };

const WhatWeDo = ({ data = WHAT_WE_DO }) => {
  return (
    <section className="relative bg-ivory pt-16 md:pt-24 pb-20 md:pb-28">
      <div className="mx-auto max-w-[1180px] px-4 md:px-8">
        <div className="text-center max-w-[820px] mx-auto">
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold">
            {data.eyebrow}
          </div>
          <h2 className="font-serif-display text-ink mt-3 text-[28px] sm:text-[34px] md:text-[42px] leading-[1.15] font-medium">
            {data.title}
          </h2>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {data.items.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <div
                key={item.title}
                className="wwd-card group text-left rounded-2xl bg-ivory-100/60 hover:bg-ivory-100 ring-1 ring-transparent hover:ring-ivory-300 p-6 md:p-8"
              >
                <div className="flex items-center justify-center w-[92px] h-[92px] rounded-full bg-ivory-200 mb-6">
                  <Icon className="w-9 h-9 text-burgundy" strokeWidth={1.4} />
                </div>
                <h3 className="font-serif-display text-burgundy text-[24px] md:text-[26px] font-semibold">
                  {item.title}
                </h3>
                <p className="mt-3 text-ink/80 text-[15px] leading-[1.7] max-w-[320px]">
                  {item.body}
                </p>
                <a
                  href={item.link.href}
                  className="mt-6 inline-flex items-center gap-2 text-burgundy font-semibold text-[14px] group-hover:gap-3 transition-all"
                >
                  {item.link.label}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhatWeDo;
