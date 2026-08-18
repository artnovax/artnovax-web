import React from "react";
import { Heart } from "lucide-react";
import { BrainLineArt } from "./BrandGlyphs";
import { MISSION_BAND } from "../mock";

const MissionBand = ({ data = MISSION_BAND }) => {
  return (
    <section className="mt-14 md:mt-20">
      <div className="mx-auto max-w-[1240px] px-4 md:px-8">
        <div className="paint-band relative rounded-3xl overflow-hidden py-14 md:py-16 px-6 md:px-10">
          <BrainLineArt className="brain-line-left" color="#F1DFC7" />
          <BrainLineArt className="brain-line-right" color="#F1DFC7" />

          <div className="mx-auto max-w-[900px] text-center relative z-10">
            <h2 className="font-serif-display text-ivory text-[26px] sm:text-[32px] md:text-[38px] leading-[1.25] font-medium">
              {data.headline.map((seg, i) => (
                <span
                  key={i}
                  className={seg.style === "italic" ? "italic" : ""}
                >
                  {seg.text}
                </span>
              ))}
            </h2>

            <div className="flex items-center justify-center mt-4">
              <Heart className="w-4 h-4 text-ivory/80" />
            </div>

            <p className="mt-3 text-ivory/85 text-[14px] md:text-[15px] max-w-[640px] mx-auto leading-relaxed">
              {data.subhead}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionBand;
