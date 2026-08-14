import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BrushFrame from '../components/BrushFrame';
import { CONTACT } from '../mock_pages2';
import { submitContact, subscribeNewsletter } from '../services/submissions';


const iconMap = { mail: Mail, phone: Phone, 'map-pin': MapPin, clock: Clock };

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);
  const [nlEmail, setNlEmail] = useState('');
  const [nlMsg, setNlMsg] = useState(null);

  const submitForm = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true); setMsg(null);
    try {
      await submitContact(form);
      setMsg({ type: 'ok', text: 'Message sent — we’ll be in touch soon.' });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setMsg({ type: 'err', text: err?.message || 'Something went wrong.' });
    } finally { setSending(false); setTimeout(() => setMsg(null), 5000); }
  };

  const submitNl = async (e) => {
    e.preventDefault();
    try {
      const r = await subscribeNewsletter(nlEmail, 'contact');
      setNlMsg({ type: 'ok', text: r.message });
      setNlEmail('');
    } catch (err) {
      setNlMsg({ type: 'err', text: err?.message || 'Try again.' });
    } finally { setTimeout(() => setNlMsg(null), 4000); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/contact" />

      {/* Hero */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 pt-8 md:pt-14 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div className="order-2 lg:order-1">
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold fade-up">{CONTACT.eyebrow}</div>
          <h1 className="fade-up delay-1 mt-4 font-serif-display text-burgundy text-[42px] sm:text-[52px] md:text-[60px] leading-[1.02] font-semibold whitespace-pre-line">{CONTACT.title}</h1>
          <p className="fade-up delay-2 mt-6 text-[16px] md:text-[17px] leading-[1.7] text-ink/80 max-w-[520px]">{CONTACT.body}</p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CONTACT.quickInfo.map((q) => {
              const Icon = iconMap[q.icon];
              return (
                <div key={q.label} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-burgundy/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-burgundy" /></div>
                  <div>
                    <div className="text-[13px] font-semibold text-burgundy">{q.label}</div>
                    <div className="text-[13px] text-ink/80">{q.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="order-1 lg:order-2 fade-up delay-2 relative">
          <BrushFrame src={CONTACT.image} alt={CONTACT.imageAlt} aspect="aspect-[5/4]" objectPosition="center" />
        </div>
      </section>

      {/* Form + sidebar */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 pt-6 md:pt-8 pb-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-8">
        <div>
          <h2 className="font-serif-display text-burgundy text-[24px] md:text-[26px] font-semibold inline-block border-b-2 border-burgundy/50 pb-1">{CONTACT.formTitle}</h2>
          <form onSubmit={submitForm} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required value={form.name} onChange={set('name')} placeholder="Your Name *" className="rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40" />
            <input required type="email" value={form.email} onChange={set('email')} placeholder="Email Address *" className="rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40" />
            <input required value={form.subject} onChange={set('subject')} placeholder="Subject *" className="md:col-span-2 rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40" />
            <textarea required value={form.message} onChange={set('message')} placeholder="Your Message *" rows={6} className="md:col-span-2 rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40 resize-none" />
            <button disabled={sending} className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light disabled:opacity-70 w-fit">
              {sending ? 'Sending…' : 'Send Message'}
              <Send className="w-4 h-4" />
            </button>
            {msg && <div className={`md:col-span-2 text-[13.5px] ${msg.type === 'ok' ? 'text-burgundy' : 'text-red-700'}`}>{msg.text}</div>}
          </form>
        </div>

        <aside className="space-y-6">
          <div>
            <h3 className="font-serif-display text-burgundy text-[19px] font-semibold whitespace-pre-line leading-tight">{CONTACT.sidebar.responseTitle}</h3>
            <ul className="mt-4 space-y-3">
              {CONTACT.sidebar.details.map((d) => {
                const Icon = iconMap[d.icon];
                return (
                  <li key={d.label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-burgundy/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-burgundy" /></div>
                    <div>
                      <div className="text-[13px] font-semibold text-burgundy">{d.label}</div>
                      <div className="text-[13px] text-ink/80">{d.value}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-3xl bg-ivory-200/70 ring-1 ring-ivory-300 p-5 relative overflow-hidden">
            <h4 className="font-serif-display text-burgundy text-[17px] font-semibold flex items-center gap-2">
              <span className="inline-flex w-8 h-8 rounded-full bg-burgundy/10 items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-burgundy" fill="currentColor"><path d="M12 21s-7-4.35-7-10a5 5 0 019-3 5 5 0 019 3c0 5.65-7 10-7 10z"/></svg>
              </span>
              {CONTACT.sidebar.quote.title}
            </h4>
            <p className="mt-3 text-ink/80 text-[13.5px] leading-relaxed">{CONTACT.sidebar.quote.body}</p>
            {/* Palette illustration */}
            <svg viewBox="0 0 220 90" className="mt-3 w-full h-20">
              <ellipse cx="110" cy="78" rx="90" ry="6" fill="#E9D2B3" opacity="0.6" />
              <rect x="40" y="30" width="70" height="40" rx="6" fill="#F1DFC7" />
              {[0,1,2,3,4,5,6].map((i) => (
                <circle key={i} cx={50 + i*9} cy="50" r="3.5" fill={['#E88A82','#F0B67F','#F7E7A4','#B9DDB0','#B0D3E8','#C8B0E8','#E8B0D3'][i]} />
              ))}
              <rect x="120" y="38" width="22" height="36" rx="3" fill="#F1DFC7" />
              <circle cx="131" cy="48" r="4" fill="#5C1519" />
              <path d="M155 74V50c0-6 12-6 12 0v24" fill="#B08968" />
              <rect x="150" y="20" width="22" height="12" rx="3" fill="#5C1519" />
              <path d="M156 20l10-6" stroke="#8B5A2B" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
        </aside>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 pb-16 md:pb-24">
        <div className="rounded-2xl bg-[#FADFC6]/60 ring-1 ring-ivory-300 p-5 md:p-6 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-5">
          <svg viewBox="0 0 60 60" className="w-14 h-14 shrink-0" fill="none" stroke="#5C1519" strokeWidth="1.6">
            <path d="M8 20l22-10 22 10v22a4 4 0 01-4 4H12a4 4 0 01-4-4V20z"/>
            <path d="M8 20l22 16 22-16" />
            <path d="M22 34c4 4 12 4 16 0" strokeLinecap="round" />
            <path d="M30 22c-4-4-10 2-4 6 6-4 0-10-4-6z" fill="#E88A82" stroke="none" />
          </svg>
          <div>
            <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">{CONTACT.newsletter.title}</h3>
            <p className="text-ink/80 text-[14px]">{CONTACT.newsletter.body}</p>
          </div>
          <form onSubmit={submitNl} className="flex items-center gap-2 w-full md:w-auto">
            <input type="email" required value={nlEmail} onChange={(e) => setNlEmail(e.target.value)} placeholder={CONTACT.newsletter.placeholder} className="flex-1 md:w-[260px] rounded-full bg-ivory ring-1 ring-ivory-300 px-5 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40" />
            <button className="cta-btn rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold hover:bg-burgundy-light inline-flex items-center gap-2">{CONTACT.newsletter.button} <ArrowRight className="w-4 h-4" /></button>
          </form>
        </div>
        {nlMsg && <div className={`text-[13px] mt-2 md:text-right ${nlMsg.type === 'ok' ? 'text-burgundy' : 'text-red-700'}`}>{nlMsg.text}</div>}
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
