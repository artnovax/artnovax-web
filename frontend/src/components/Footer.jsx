import React, { useState } from "react";
import { Instagram, Linkedin, Mail, MapPin, ArrowRight } from "lucide-react";
import { LogoWithTagline } from "./Logo";
import { FOOTER } from "../mock";
import { subscribeNewsletter } from "../services/submissions";


const iconMap = {
  instagram: Instagram,
  linkedin: Linkedin,
  mail: Mail,
  "map-pin": MapPin,
};

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await subscribeNewsletter(email, "footer");
      setMsg({
        type: "ok",
        text: res.message || "Thanks — you’re on the list!",
      });
      setEmail("");
    } catch (err) {
      const text = err?.message || "Something went wrong. Please try again.";
      setMsg({ type: "err", text });
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <footer className="relative bg-burgundy text-ivory">
      <div className="mx-auto max-w-[1240px] px-4 md:px-8 pt-14 md:pt-20 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2 md:col-span-2">
            <LogoWithTagline variant="light" />
            <p className="mt-6 font-serif-display italic text-ivory/90 text-[17px] leading-snug">
              where art heals,
              <br />
              tech empowers,
              <br />& minds transform.
            </p>
          </div>

          {FOOTER.columns.slice(0, 3).map((col) => (
            <div key={col.title}>
              <div className="text-ivory font-semibold text-[14px] mb-4">
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        l.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="text-ivory/80 hover:text-ivory text-[14px]"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <div className="text-ivory font-semibold text-[14px] mb-4">
              Connect
            </div>
            <ul className="space-y-2.5">
              {FOOTER.columns[3].links.map((l) => {
                const Icon = iconMap[l.icon];
                return (
                  <li key={l.label} className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-ivory/80" />}
                    <a
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-ivory/80 hover:text-ivory text-[14px]"
                    >
                      {l.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-end">
          <div>
            <div className="text-ivory font-semibold text-[14px] mb-2">
              {FOOTER.newsletter.title}
            </div>
            <p className="text-ivory/75 text-[13px] max-w-[420px]">
              {FOOTER.newsletter.body}
            </p>
          </div>
          <form
            onSubmit={submit}
            className="flex items-center bg-ivory rounded-full pl-5 pr-1 py-1 w-full md:w-[380px]"
          >
            <input
              type="email"
              required
              placeholder={FOOTER.newsletter.placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink/50 text-[14px] py-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="cta-btn inline-flex items-center justify-center w-10 h-10 rounded-full bg-burgundy text-ivory hover:bg-burgundy-light disabled:opacity-70"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
        {msg && (
          <div
            className={`text-[13px] mt-2 md:text-right ${msg.type === "ok" ? "text-ivory/90" : "text-red-200"}`}
          >
            {msg.text}
          </div>
        )}

        <div className="mt-14 pt-6 border-t border-ivory/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[12.5px] text-ivory/70">
          <div>{FOOTER.copyright}</div>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {FOOTER.legal.map((l) => (
              <a key={l.label} href={l.href} className="hover:text-ivory">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
