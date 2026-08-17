import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  defaultInformationPagesContent,
  getInformationPageContent,
} from "../services/pageContent";

const InfoPage = ({ pageKey, activePath }) => {
  const [content, setContent] = useState(
    () => defaultInformationPagesContent()[pageKey],
  );

  useEffect(() => {
    (async () => {
      try {
        setContent(await getInformationPageContent(pageKey));
      } catch (error) {
        console.warn(`Using built-in ${pageKey} page content.`, error);
      }
    })();
  }, [pageKey]);

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath={activePath || `/${pageKey}`} />
      <main className="mx-auto max-w-[900px] px-4 md:px-8 pt-10 md:pt-16 pb-16 md:pb-24">
        <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold">
          {content.eyebrow}
        </div>
        <h1 className="mt-3 font-serif-display text-burgundy text-[40px] md:text-[54px] leading-[1.05] font-semibold">
          {content.title}
        </h1>
        <p className="mt-5 text-ink/80 text-[16px] md:text-[17px] leading-[1.75] max-w-[760px] whitespace-pre-line">
          {content.intro}
        </p>
        <div className="mt-4 text-ink/55 text-[12.5px]">
          {content.updatedLabel}
        </div>

        <div className="mt-10 space-y-6">
          {content.sections.map((section, index) => (
            <section
              key={`${section.title}-${index}`}
              className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 md:p-7"
            >
              <h2 className="font-serif-display text-burgundy text-[22px] md:text-[25px] font-semibold">
                {section.title}
              </h2>
              <p className="mt-3 text-ink/80 text-[14.5px] md:text-[15.5px] leading-[1.8] whitespace-pre-line">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InfoPage;
