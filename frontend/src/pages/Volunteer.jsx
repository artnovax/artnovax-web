import React, { useEffect, useState } from "react";
import { ArrowRight, MapPin, Clock, Briefcase } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getVolunteerRoles } from "../services/content";
import {
  defaultVolunteerPageContent,
  getVolunteerPageContent,
} from "../services/pageContent";

const Volunteer = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageContent, setPageContent] = useState(() =>
    defaultVolunteerPageContent(),
  );

  useEffect(() => {
    (async () => {
      try {
        setPageContent(await getVolunteerPageContent());
      } catch (error) {
        console.warn("Using built-in Volunteer page content.", error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setRoles(await getVolunteerRoles());
      } catch (error) {
        console.error("Failed to load volunteer roles:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const content = pageContent.landing;

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/get-involved/volunteer" />
      <section className="mx-auto max-w-[1180px] px-4 md:px-8 pt-10 md:pt-14 pb-6">
        <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold">
          {content.eyebrow}
        </div>
        <h1 className="mt-3 font-serif-display text-burgundy text-[42px] md:text-[56px] leading-[1.02] font-semibold whitespace-pre-line">
          {content.title}
        </h1>
        <p className="mt-5 text-ink/80 text-[16px] max-w-[620px] leading-[1.7]">
          {content.body}
        </p>
      </section>
      <section className="mx-auto max-w-[1180px] px-4 md:px-8 pb-16 md:pb-24">
        {loading && (
          <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60">
            {content.loadingText}
          </div>
        )}
        {!loading && roles.length === 0 && (
          <div className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center text-ink/60 text-[14px]">
            {content.emptyPrefix}
            <a className="text-burgundy font-semibold" href={content.emptyContactHref}>
              {content.emptyContactLabel}
            </a>
            {content.emptySuffix}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((r) => (
            <article
              key={r.id}
              className="wwd-card rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-6 flex flex-col"
            >
              <div className="text-burgundy text-[11.5px] tracking-widest font-semibold">
                {(r.department || content.defaultDepartmentLabel).toUpperCase()}
              </div>
              <h3 className="mt-1 font-serif-display text-burgundy text-[22px] leading-tight font-semibold">
                {r.title}
              </h3>
              <div className="mt-3 flex items-center gap-3 flex-wrap text-ink/70 text-[12.5px]">
                {r.commitment && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-burgundy" />
                    {r.commitment}
                  </span>
                )}
                {r.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-burgundy" />
                    {r.location}
                  </span>
                )}
                {r.department && (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-burgundy" />
                    {r.department}
                  </span>
                )}
              </div>
              {r.description && (
                <p className="mt-3 text-ink/85 text-[14px] leading-relaxed flex-1">
                  {r.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2">
                <a
                  href={`/get-involved/volunteer/${r.slug}`}
                  className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light"
                >
                  {content.applyLabel} <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={`/get-involved/volunteer/${r.slug}`}
                  className="text-burgundy text-[13.5px] font-semibold hover:underline"
                >
                  {content.detailsLabel}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Volunteer;
