import React, { useState } from 'react';
import { ArrowRight, Play, Shield, Sparkles, Download, Lock, Flower2, Palette, Globe, List, Brush, Smile } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { APP } from '../mock_pages2';
import { joinAppWaitlist } from '../services/submissions';


const featIcon = (key) => {
  const cls = 'w-8 h-8 text-burgundy';
  const map = { shield: Shield, flower: Flower2, palette: Palette, download: Download, lock: Lock, globe: Globe, sparkles: Sparkles, list: List, brush: Brush, smile: Smile };
  const Icon = map[key];
  return Icon ? <Icon className={cls} strokeWidth={1.4} /> : null;
};
const smallIcon = (key) => {
  const cls = 'w-4 h-4 text-burgundy';
  const map = { shield: Shield, sparkles: Sparkles, download: Download, lock: Lock };
  const Icon = map[key];
  return Icon ? <Icon className={cls} strokeWidth={1.6} /> : null;
};

const TabletMock = () => (
  <div className="relative w-full max-w-[560px] mx-auto">
    {/* Pink watercolor blob */}
    <div className="absolute -inset-6 -z-10 opacity-90">
      <div className="w-full h-full rounded-[45%_55%_60%_40%/50%_50%_55%_45%] bg-gradient-to-br from-[#F7C7C0] via-[#F2A99F] to-[#E88A82] blur-md" />
    </div>
    {/* Decorative leaves */}
    <svg viewBox="0 0 200 200" className="absolute -left-6 top-8 w-20 h-20 text-burgundy/70 -rotate-12" fill="currentColor">
      <path d="M40 100c20-40 60-70 120-60-20 60-70 100-120 60z" opacity="0.55" />
    </svg>
    <svg viewBox="0 0 200 200" className="absolute -right-8 bottom-2 w-24 h-24 text-burgundy/60 rotate-12" fill="currentColor">
      <path d="M40 100c20-40 60-70 120-60-20 60-70 100-120 60z" opacity="0.5" />
    </svg>
    {/* Apple pencil */}
    <div className="absolute -right-2 top-6 w-2.5 h-40 bg-gradient-to-b from-neutral-300 to-neutral-500 rounded-full shadow-md rotate-[8deg]" />
    <div className="absolute -right-1 top-5 w-2.5 h-4 bg-neutral-700 rounded-full rotate-[8deg]" />

    <div className="relative rounded-[26px] bg-neutral-900 p-2 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.35)]">
      <div className="rounded-[20px] bg-ivory p-4 aspect-[4/3] overflow-hidden">
        <div className="text-[15px] font-serif-display text-ink flex items-center gap-1">Good morning, Shiro <span className="text-amber-500">✨</span></div>
        <div className="text-[11px] text-ink/60">Take a breath. You’re in a safe space.</div>

        <div className="mt-3 rounded-xl bg-ivory-100 ring-1 ring-ivory-300 p-3">
          <div className="text-[10px] tracking-widest text-ink/60">Continue Your Journey</div>
          <div className="grid grid-cols-[1fr_auto] gap-2 items-center mt-1">
            <div>
              <div className="font-serif-display text-burgundy text-[15px] font-semibold">Grounding Through Color</div>
              <div className="text-[10px] text-ink/60">Step 2 of 5 • 6 min left</div>
              <button className="mt-2 text-[10.5px] rounded-md bg-burgundy text-ivory px-2.5 py-1 font-semibold">Continue Session</button>
            </div>
            <div className="w-16 h-14 rounded-lg overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-orange-200 via-pink-300 to-purple-400" />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-[10.5px] font-semibold text-ink/70">Recommended For You</div>
          <a className="text-[10px] text-burgundy">See all</a>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {[['from-green-200','to-emerald-400','Soothing Lines','10 min'],['from-orange-200','to-rose-400','Poetic Doodles','8 min'],['from-amber-200','to-red-400','Ubuntu Flow','8 min']].map((c,i) => (
            <div key={i} className="rounded-lg overflow-hidden ring-1 ring-ivory-300">
              <div className={`h-10 bg-gradient-to-br ${c[0]} ${c[1]}`} />
              <div className="px-1.5 py-1">
                <div className="text-[9.5px] font-semibold text-ink truncate">{c[2]}</div>
                <div className="text-[8.5px] text-ink/60">{c[3]}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-around border-t border-ivory-300 pt-1.5 text-[8.5px] text-ink/60">
          <div className="flex flex-col items-center gap-0.5"><div className="w-3 h-3 rounded-sm bg-burgundy" />Home</div>
          <div className="flex flex-col items-center gap-0.5 text-ink/50"><div className="w-3 h-3 rounded-full ring border" />Sessions</div>
          <div className="flex flex-col items-center gap-0.5 text-ink/50"><div className="w-3 h-3 rounded-sm border" />My Journey</div>
          <div className="flex flex-col items-center gap-0.5 text-ink/50"><div className="w-3 h-3 rounded-full border" />Community</div>
          <div className="flex flex-col items-center gap-0.5 text-ink/50"><div className="w-3 h-3 rounded-full border" />Profile</div>
        </div>
      </div>
    </div>
  </div>
);

const AppPage = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true); setMsg(null);
    try {
      const r = await joinAppWaitlist(email);
      setMsg({ type: 'ok', text: r.message });
      setEmail('');
    } catch (err) {
      setMsg({ type: 'err', text: err?.message || 'Something went wrong.' });
    } finally { setLoading(false); setTimeout(() => setMsg(null), 4000); }
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/app" />

      {/* Hero */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 pt-8 md:pt-14 pb-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 items-center">
        <div>
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold fade-up flex items-center gap-2">
            <span>{APP.eyebrow}</span>
          </div>
          <span className="fade-up delay-1 mt-3 inline-block rounded-full bg-burgundy/10 text-burgundy text-[11.5px] font-semibold tracking-wider px-3 py-1">In development · Launching later this year</span>
          <h1 className="fade-up delay-1 mt-4 font-serif-display text-burgundy text-[46px] sm:text-[56px] md:text-[64px] leading-[1.02] font-semibold whitespace-pre-line">{APP.title}</h1>
          <p className="fade-up delay-2 mt-6 text-[16px] md:text-[17px] leading-[1.7] text-ink/80 max-w-[520px]">{APP.body}</p>
          <div className="fade-up delay-3 mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="cta-btn inline-flex items-center gap-3 rounded-full bg-burgundy text-ivory px-6 py-4 text-[15px] font-semibold hover:bg-burgundy-light shadow-[0_14px_30px_-14px_rgba(92,21,25,0.7)]">
              {APP.primaryCta.label}
              <ArrowRight className="w-4 h-4" />
            </button>
            <a href={APP.secondaryCta.href} className="cta-btn inline-flex items-center gap-3 rounded-full border-2 border-burgundy text-burgundy px-6 py-4 text-[15px] font-semibold hover:bg-burgundy hover:text-ivory">
              {APP.secondaryCta.label}
              <Play className="w-4 h-4" />
            </a>
          </div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
            {APP.bullets.map((b) => (
              <div key={b.title} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-burgundy/10 flex items-center justify-center">{smallIcon(b.icon)}</div>
                <div>
                  <div className="text-[12.5px] font-semibold text-ink">{b.title}</div>
                  <div className="text-[11px] text-ink/60">{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="fade-up delay-2"><TabletMock /></div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-[1180px] px-4 md:px-8 pt-10 md:pt-16">
        <div className="text-center">
          <h2 className="font-serif-display text-ink text-[28px] md:text-[34px] font-medium">{APP.featuresTitle}</h2>
          <div className="mx-auto mt-2 w-16 h-0.5 bg-burgundy/40" />
        </div>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {APP.features.map((f) => (
            <div key={f.title} className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-ivory-200 flex items-center justify-center">{featIcon(f.icon)}</div>
              <h3 className="mt-3 font-serif-display text-ink text-[15px] font-semibold">{f.title}</h3>
              <p className="mt-1 text-[12.5px] text-ink/70 leading-snug">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-[1240px] px-4 md:px-8 pt-14 md:pt-20">
        <div className="text-center">
          <h2 className="font-serif-display text-ink text-[26px] md:text-[32px] font-medium">{APP.howTitle}</h2>
          <div className="mx-auto mt-2 w-16 h-0.5 bg-burgundy/40" />
        </div>
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)] gap-8 items-start">
          <div className="flex flex-wrap md:flex-nowrap items-start gap-3 md:gap-1 justify-between">
            {APP.steps.map((s, i) => (
              <React.Fragment key={s.title}>
                <div className="flex flex-col items-center text-center max-w-[160px]">
                  <div className="w-14 h-14 rounded-full bg-ivory-200 flex items-center justify-center">{featIcon(s.icon)}</div>
                  <div className="mt-3 text-[13.5px] font-semibold text-ink">{s.title}</div>
                  <p className="mt-1 text-[12px] text-ink/70 leading-snug">{s.body}</p>
                </div>
                {i < APP.steps.length - 1 && (
                  <ArrowRight className="hidden md:block w-6 h-6 text-burgundy/60 mt-4 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="rounded-3xl bg-ivory-200/70 ring-1 ring-ivory-300 p-5 md:p-6 relative overflow-hidden">
            <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">{APP.journey.title}</h3>
            <p className="mt-2 text-ink/80 text-[13.5px] leading-relaxed max-w-[240px]">{APP.journey.body}</p>
            {/* Illustration */}
            <div className="mt-4 relative h-32">
              <svg viewBox="0 0 240 140" className="absolute right-2 bottom-0 w-40 h-32">
                <ellipse cx="140" cy="120" rx="70" ry="12" fill="#EFD1D3" opacity="0.6" />
                <path d="M120 60c-10 0-18 8-18 18v30h36V78c0-10-8-18-18-18z" fill="#E88A82" />
                <circle cx="120" cy="48" r="14" fill="#3E2A2A" />
                <path d="M108 42c0-8 6-14 12-14s12 6 12 14c0 4-2 8-6 10-2-2-4-4-6-4s-4 2-6 4c-4-2-6-6-6-10z" fill="#2A1B1C" />
                <path d="M114 92c2 4 10 4 12 0" stroke="#2A1B1C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M160 60c14-2 26 10 24 22" stroke="#5C1519" strokeWidth="2" fill="none" opacity="0.4"/>
                <path d="M60 50c14 2 20 20 12 30" stroke="#5C1519" strokeWidth="2" fill="none" opacity="0.4"/>
                <circle cx="175" cy="58" r="3" fill="#F1A97E" />
                <circle cx="185" cy="66" r="2" fill="#F1A97E" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist band */}
      <section id="waitlist" className="mt-14 md:mt-20">
        <div className="paint-band py-8 md:py-10">
          <div className="mx-auto max-w-[1180px] px-6 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-5">
            <svg viewBox="0 0 64 64" className="w-14 h-14 shrink-0" fill="none" stroke="#F1DFC7" strokeWidth="1.5">
              <path d="M32 46c-6-4-14-10-14-18 0-5 4-9 8-9 3 0 5 2 6 4 1-2 3-4 6-4 4 0 8 4 8 9 0 8-8 14-14 18z" />
            </svg>
            <div>
              <div className="font-serif-display text-ivory text-[20px] md:text-[22px]">{APP.waitlist.title}</div>
              <div className="text-ivory/85 text-[13.5px] mt-1">{APP.waitlist.body}</div>
            </div>
            <form onSubmit={submit} className="flex items-center gap-2 w-full md:w-auto">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={APP.waitlist.placeholder} className="flex-1 md:w-[280px] rounded-full bg-ivory ring-1 ring-ivory-300 px-5 py-3 text-[14px] text-ink focus:outline-none" />
              <button disabled={loading} className="cta-btn rounded-full bg-ivory text-burgundy px-6 py-3 text-[14px] font-semibold hover:bg-white disabled:opacity-70">{APP.waitlist.button}</button>
            </form>
          </div>
          {msg && <div className={`text-[13px] mt-2 text-center ${msg.type === 'ok' ? 'text-ivory' : 'text-red-200'}`}>{msg.text}</div>}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AppPage;
