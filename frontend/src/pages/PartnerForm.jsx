import React, { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Building2, Loader2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { submitPartnerInquiry } from "../services/submissions";
import {
  defaultPartnerPageContent,
  getPartnerPageContent,
} from "../services/pageContent";

const PartnerForm = () => {
  const [form, setForm] = useState({
    org_name: "",
    contact_name: "",
    role: "",
    email: "",
    phone: "",
    website: "",
    org_type: "",
    partnership_type: "",
    goals: "",
    audience: "",
    budget: "",
    timeline: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);
  const [pageContent, setPageContent] = useState(() =>
    defaultPartnerPageContent(),
  );

  useEffect(() => {
    (async () => {
      try {
        setPageContent(await getPartnerPageContent());
      } catch (error) {
        console.warn("Using built-in Partner page content.", error);
      }
    })();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      await submitPartnerInquiry(form);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const cls =
    "w-full rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40";

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/get-involved/partner" />
      <section className="mx-auto max-w-[1100px] px-4 md:px-8 pt-10 md:pt-14 pb-16">
        <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold">
          {pageContent.eyebrow}
        </div>
        <h1 className="mt-3 font-serif-display text-burgundy text-[42px] md:text-[52px] leading-[1.05] font-semibold">
          {pageContent.title}
        </h1>
        <p className="mt-5 text-ink/80 max-w-[720px] text-[16px] leading-[1.7]">
          {pageContent.body}
        </p>

        {done ? (
          <div className="mt-10 rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center max-w-[640px] mx-auto">
            <div className="mx-auto w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-burgundy" />
            </div>
            <h2 className="mt-4 font-serif-display text-burgundy text-[28px] font-semibold">
              {pageContent.success.title}
            </h2>
            <p className="mt-2 text-ink/75 text-[14.5px]">
              {pageContent.success.body}
            </p>
            <a
              href={pageContent.success.button.href}
              className="cta-btn mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold hover:bg-burgundy-light"
            >
              {pageContent.success.button.label} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2 text-burgundy tracking-widest text-[11px] font-semibold">
              {pageContent.organisationHeading}
            </div>
            <input
              required
              placeholder={pageContent.orgNamePlaceholder}
              value={form.org_name}
              onChange={set("org_name")}
              className={cls}
            />
            <input
              placeholder={pageContent.websitePlaceholder}
              value={form.website}
              onChange={set("website")}
              className={cls}
            />
            <select
              value={form.org_type}
              onChange={set("org_type")}
              className={cls}
            >
              <option value="">{pageContent.orgTypePlaceholder}</option>
              {pageContent.orgTypeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select
              value={form.partnership_type}
              onChange={set("partnership_type")}
              className={cls}
            >
              <option value="">{pageContent.partnershipTypePlaceholder}</option>
              {pageContent.partnershipTypeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <div className="md:col-span-2 text-burgundy tracking-widest text-[11px] font-semibold mt-2">
              {pageContent.contactHeading}
            </div>
            <input
              required
              placeholder={pageContent.contactNamePlaceholder}
              value={form.contact_name}
              onChange={set("contact_name")}
              className={cls}
            />
            <input
              placeholder={pageContent.rolePlaceholder}
              value={form.role}
              onChange={set("role")}
              className={cls}
            />
            <input
              required
              type="email"
              placeholder={pageContent.emailPlaceholder}
              value={form.email}
              onChange={set("email")}
              className={cls}
            />
            <input
              placeholder={pageContent.phonePlaceholder}
              value={form.phone}
              onChange={set("phone")}
              className={cls}
            />
            <div className="md:col-span-2 text-burgundy tracking-widest text-[11px] font-semibold mt-2">
              {pageContent.detailsHeading}
            </div>
            <textarea
              placeholder={pageContent.goalsPlaceholder}
              value={form.goals}
              onChange={set("goals")}
              rows={4}
              className={cls + " md:col-span-2"}
            />
            <input
              placeholder={pageContent.audiencePlaceholder}
              value={form.audience}
              onChange={set("audience")}
              className={cls}
            />
            <input
              placeholder={pageContent.timelinePlaceholder}
              value={form.timeline}
              onChange={set("timeline")}
              className={cls}
            />
            <input
              placeholder={pageContent.budgetPlaceholder}
              value={form.budget}
              onChange={set("budget")}
              className={cls}
            />
            <textarea
              placeholder={pageContent.messagePlaceholder}
              value={form.message}
              onChange={set("message")}
              rows={4}
              className={cls + " md:col-span-2"}
            />
            {err && (
              <div className="md:col-span-2 text-red-700 text-[13.5px]">
                {err}
              </div>
            )}
            <div className="md:col-span-2 flex justify-between items-center">
              <div className="text-ink/60 text-[12.5px] inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {pageContent.responseNote}
              </div>
              <button
                disabled={submitting}
                className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {pageContent.submittingLabel}
                  </>
                ) : (
                  <>
                    {pageContent.submitLabel} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default PartnerForm;
