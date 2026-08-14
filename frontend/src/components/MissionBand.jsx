import React from 'react';
import { Heart } from 'lucide-react';
import { BrainLineArt } from './BrandGlyphs';
import { MISSION_BAND } from '../mock';

const MissionBand = () => {
  return (
    <section className="relative">
      <div className="paint-band relative py-14 md:py-16 overflow-hidden">
        <BrainLineArt className="brain-line-left" color="#F1DFC7" />
        <BrainLineArt className="brain-line-right" color="#F1DFC7" />

        <div className="mx-auto max-w-[900px] px-6 text-center relative z-10">
          <h2 className="font-serif-display text-ivory text-[26px] sm:text-[32px] md:text-[38px] leading-[1.25] font-medium">
            {MISSION_BAND.headline.map((seg, i) => (
              <span key={i} className={seg.style === 'italic' ? 'italic' : ''}>{seg.text}</span>
            ))}
          </h2>
          <div className="flex items-center justify-center mt-4">
            <Heart className="w-4 h-4 text-ivory/80" />
          </div>
          <p className="mt-3 text-ivory/85 text-[14px] md:text-[15px] max-w-[640px] mx-auto leading-relaxed">
            {MISSION_BAND.subhead}
          </p>
        </div>
      </div>
    </section>
  );
};

export default MissionBand;
