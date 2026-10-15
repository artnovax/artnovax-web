import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Linkedin, Mail, MapPin, ArrowRight } from "lucide-react";
import { LogoWithTagline } from "./Logo";
import { FOOTER } from "../mock";
import { subscribeNewsletter } from "../services/submissions";
import { useSiteChromeSuppressed } from "../context/SiteChromeContext";

const iconMap = {
  instagram: Instagram,
  linkedin: Linkedin,
  mail: Mail,
  "map-pin": MapPin,
};

const FooterLink = ({
  href,
  resolveNavHref = (value) => value,
  children,
  ...props
}) => {
  if (href.startsWith("/")) {
    return (
      <Link to={resolveNavHref(href)} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  );
};

const Footer = ({
  persistent = false,
  resolveNavHref = (href) => href,
}) => {
  const suppressed = useSiteChromeSuppressed();

  if (suppressed && !persistent) {
    return null;
  }

  return <FooterInner resolveNavHref={resolveNavHref} />;
};

const FooterInner = ({ resolveNavHref }) => {
  const [firstName, setFirstName] = useState("");

  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setMsg(null);

    try {
      const res = await subscribeNewsletter(email, "footer", firstName);
      setMsg({
        type: "ok",
        text: res.message || "Thanks — you’re on the list!",
      });
      setFirstName("");
      setEmail("");
      setSubscribeOpen(false);
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
                    <FooterLink
                      href={l.href}
                      resolveNavHref={resolveNavHref}
                      className="text-ivory/80 hover:text-ivory text-[14px]"
                    >
                      {l.label}
                    </FooterLink>
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
                    <FooterLink
                      href={l.href}
                      resolveNavHref={resolveNavHref}
                      className="text-ivory/80 hover:text-ivory text-[14px]"
                    >
                      {l.label}
                    </FooterLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] items-center gap-6 md:gap-10">
          <div className="min-w-0">
            <div className="text-ivory font-semibold text-[14px] mb-2">
              {FOOTER.newsletter.title}
            </div>
            <p className="text-ivory/75 text-[13px] max-w-[520px] leading-relaxed">
              {FOOTER.newsletter.body}
            </p>
            <Link
              to={resolveNavHref("/newsletters")}
              className="mt-2 inline-flex text-ivory/85 hover:text-ivory text-[13px] underline underline-offset-4"
            >
              Browse published issues
            </Link>
          </div>

          {!subscribeOpen && (
            <button
              type="button"
              onClick={() => {
                setMsg(null);
                setSubscribeOpen(true);
              }}
              aria-expanded={subscribeOpen}
              className="cta-btn w-fit md:justify-self-end inline-flex items-center justify-center gap-2 rounded-full bg-ivory text-burgundy px-6 py-3 text-[13.5px] font-semibold hover:bg-ivory-200 md:min-w-[168px]"
            >
              Subscribe
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {subscribeOpen && (
            <div className="w-full md:w-[420px] md:justify-self-end rounded-2xl bg-ivory/10 ring-1 ring-ivory/20 p-4">
              <form onSubmit={submit} className="space-y-2.5">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name (optional)"
                  aria-label="First name"
                  autoComplete="given-name"
                  maxLength={80}
                  className="w-full rounded-full bg-ivory px-4 py-2.5 text-[13.5px] text-ink placeholder:text-ink/50 outline-none ring-1 ring-ivory-300 focus:ring-2 focus:ring-ivory/70"
                />
                <input
                  type="email"
                  required
                  placeholder={FOOTER.newsletter.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                  autoComplete="email"
                  className="w-full rounded-full bg-ivory px-4 py-2.5 text-[13.5px] text-ink placeholder:text-ink/50 outline-none ring-1 ring-ivory-300 focus:ring-2 focus:ring-ivory/70"
                />
                <div className="flex items-center justify-end gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMsg(null);
                      setSubscribeOpen(false);
                    }}
                    className="rounded-full px-4 py-2 text-[12.5px] font-semibold text-ivory/85 hover:text-ivory"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="cta-btn rounded-full bg-ivory text-burgundy px-5 py-2.5 text-[12.5px] font-semibold hover:bg-ivory-200 disabled:opacity-70"
                  >
                    {loading ? "Subscribing…" : "Subscribe"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {msg && (
            <div
              className={msg.type === "ok"
                ? "text-[13px] md:col-span-2 md:text-right text-ivory/90"
                : "text-[13px] md:col-span-2 md:text-right text-red-200"}
            >
              {msg.text}
            </div>
          )}
        </div>

        <div className="mt-14 pt-6 border-t border-ivory/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[12.5px] text-ivory/70">
          <div>{FOOTER.copyright}</div>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {FOOTER.legal.map((l) => (
              <FooterLink
                key={l.label}
                href={l.href}
                resolveNavHref={resolveNavHref}
                className="hover:text-ivory"
              >
                {l.label}
              </FooterLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
