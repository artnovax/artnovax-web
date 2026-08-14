import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Users, Ticket, Share2, Copy, Check, Download } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getEventBySlug } from "../services/events";


const EventPhoto = ({ ev }) => (
  <div className="rounded-3xl overflow-hidden ring-1 ring-ivory-300 bg-ivory-100">
    <div className="relative aspect-[4/5] w-full">
      {ev.img ? (
        <img src={ev.img} alt={ev.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-ink/40 text-sm">No image yet</div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 text-ivory">
        <div className="text-[10.5px] tracking-widest opacity-85">{ev.location || ''}</div>
        <div className="font-serif-display text-[24px] leading-tight mt-1">{ev.title}</div>
        {ev.date && <div className="mt-1 text-[12px] opacity-85 flex items-center gap-1.5"><Calendar className="w-3 h-3" />{ev.date}</div>}
      </div>
    </div>
    {(ev.partners || []).length > 0 && (
      <div className="px-4 py-3 bg-ivory">
        <div className="text-[10.5px] tracking-widest text-ink/60">Partners</div>
        <div className="flex items-center gap-3 flex-wrap mt-1 text-[10.5px] font-semibold text-ink/80">
          {ev.partners.map((p) => <span key={p}>{p}</span>)}
        </div>
      </div>
    )}
  </div>
);

const IVORY = '#FBF3E8';
const BURGUNDY = '#5C1519';
const INK = '#2A1B1C';

const wrapText = (ctx, text, maxWidth) => {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const loadImage = (src) => new Promise((resolve) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

const downloadEventPoster = async (ev) => {
  const W = 1080, H = 1350;                    // Instagram Story-friendly 4:5
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = IVORY;
  ctx.fillRect(0, 0, W, H);

  // Event photo (top 65%)
  const imgH = Math.round(H * 0.65);
  const img = ev.img ? await loadImage(ev.img) : null;
  if (img) {
    // cover-fit
    const ratio = Math.max(W / img.width, imgH / img.height);
    const dw = img.width * ratio, dh = img.height * ratio;
    ctx.drawImage(img, (W - dw) / 2, (imgH - dh) / 2, dw, dh);
  } else {
    // Burgundy fallback with a subtle radial highlight
    const g = ctx.createRadialGradient(W / 2, imgH / 2, 60, W / 2, imgH / 2, W);
    g.addColorStop(0, '#7a2530');
    g.addColorStop(1, BURGUNDY);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, imgH);
  }

  // Bottom cream panel
  ctx.fillStyle = IVORY;
  ctx.fillRect(0, imgH, W, H - imgH);

  // Little burgundy divider
  ctx.fillStyle = BURGUNDY;
  ctx.fillRect(80, imgH + 60, 60, 4);

  // Eyebrow
  ctx.fillStyle = BURGUNDY;
  ctx.font = '600 22px Inter, Arial, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('ARTNOVAX  ·  UPCOMING EVENT', 80, imgH + 90);

  // Title (serif) with wrapping
  ctx.fillStyle = BURGUNDY;
  ctx.font = '600 72px "Fraunces", Georgia, serif';
  const titleLines = wrapText(ctx, ev.title || 'Event', W - 160).slice(0, 3);
  titleLines.forEach((line, i) => ctx.fillText(line, 80, imgH + 140 + i * 82));

  // Date + Location
  ctx.fillStyle = INK;
  ctx.font = '400 28px Inter, Arial, sans-serif';
  const yMeta = imgH + 140 + titleLines.length * 82 + 20;
  if (ev.date) ctx.fillText('\u{1F4C5}  ' + ev.date, 80, yMeta);
  if (ev.location) ctx.fillText('\u{1F4CD}  ' + ev.location, 80, yMeta + 44);

  // Footer strip
  ctx.fillStyle = BURGUNDY;
  ctx.fillRect(0, H - 90, W, 90);
  ctx.fillStyle = IVORY;
  ctx.font = 'italic 32px "Fraunces", Georgia, serif';
  ctx.fillText('where art heals, tech empowers, & minds transform.', 80, H - 66);
  ctx.font = '600 22px Inter, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('artnovax.org', W - 80, H - 60);
  ctx.textAlign = 'left';

  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `artnovax-${(ev.slug || 'event').toLowerCase()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const ShareRow = ({ ev }) => {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const text = `${ev.title} — ${ev.date || ''} in ${ev.location || 'Nairobi'}. Join us with ArtNovaX.`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
  const igLink = 'https://www.instagram.com/'; // no direct story link on web

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: ev.title, text, url }); } catch (err) {
        if (err?.name !== 'AbortError') console.warn('Share cancelled:', err);
      }
    } else {
      copyLink();
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) { console.warn('Copy failed:', err); }
  };

  const [downloading, setDownloading] = useState(false);
  const downloadPoster = async () => {
    if (downloading) return;
    setDownloading(true);
    try { await downloadEventPoster(ev); }
    catch (err) { console.warn('Poster download failed:', err); }
    finally { setDownloading(false); }
  };

  return (
    <div className="mt-6 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4">
      <div className="text-[12.5px] tracking-widest text-ink/60 font-semibold uppercase">Share this event</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={nativeShare} data-testid="event-share-native" className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-2 text-[13px] font-semibold hover:bg-burgundy-light">
          <Share2 className="w-4 h-4" /> Share
        </button>
        <a href={waLink} target="_blank" rel="noreferrer" data-testid="event-share-whatsapp" className="cta-btn inline-flex items-center gap-2 rounded-full ring-1 ring-ivory-300 bg-ivory px-4 py-2 text-[13px] font-semibold text-ink hover:ring-burgundy/40">
          WhatsApp
        </a>
        <a href={igLink} target="_blank" rel="noreferrer" data-testid="event-share-instagram" className="cta-btn inline-flex items-center gap-2 rounded-full ring-1 ring-ivory-300 bg-ivory px-4 py-2 text-[13px] font-semibold text-ink hover:ring-burgundy/40">
          Instagram
        </a>
        <button onClick={copyLink} data-testid="event-share-copy" className="cta-btn inline-flex items-center gap-2 rounded-full ring-1 ring-ivory-300 bg-ivory px-4 py-2 text-[13px] font-semibold text-ink hover:ring-burgundy/40">
          {copied ? <><Check className="w-4 h-4 text-burgundy" /> Copied</> : <><Copy className="w-4 h-4" /> Copy link</>}
        </button>
        <button onClick={downloadPoster} data-testid="event-download-poster" disabled={downloading} className="cta-btn inline-flex items-center gap-2 rounded-full ring-1 ring-ivory-300 bg-ivory px-4 py-2 text-[13px] font-semibold text-ink hover:ring-burgundy/40 disabled:opacity-60">
          <Download className="w-4 h-4" /> {downloading ? 'Rendering…' : 'Download poster'}
        </button>
      </div>
      <p className="mt-2 text-ink/60 text-[12px]">Tip: on your phone, tap <b>Share</b> to send this directly to Instagram Stories or WhatsApp. The <b>Download poster</b> saves a 1080×1350 image perfect for stories or print.</p>
    </div>
  );
};

const EventDetail = () => {
  const { slug } = useParams();
  const [ev, setEv] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  (async () => {
    try {
      const event = await getEventBySlug(slug);
      setEv(event);
    } catch (error) {
      console.error("Failed to load event:", error);
      setError("Event not found.");
    } finally {
      setLoading(false);
    }
  })();
}, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/events" />
        <section className="mx-auto max-w-[720px] px-6 py-24 text-center text-ink/60">Loading event…</section>
        <Footer />
      </div>
    );
  }

  if (error || !ev) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/events" />
        <section className="mx-auto max-w-[720px] px-6 py-24 text-center">
          <h1 className="font-serif-display text-burgundy text-[32px] font-semibold">Event not found</h1>
          <a href="/events" className="cta-btn mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold"><ArrowLeft className="w-4 h-4" /> Back to Events</a>
        </section>
        <Footer />
      </div>
    );
  }

const tags = Array.isArray(ev.tags)
  ? ev.tags
  : (ev.tags || "")
      .split(",")
      .map((t) => t.trim())
    .filter(Boolean);
  
  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/events" />

      <section className="mx-auto max-w-[1200px] px-4 md:px-8 pt-8 md:pt-12">
        <a href="/events" className="inline-flex items-center gap-1 text-burgundy text-[13.5px] font-semibold hover:underline"><ArrowLeft className="w-4 h-4" /> Back to Events</a>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-8">
          {/* Event photo (same image shown on the Events list) */}
          <div>
            <EventPhoto ev={ev} />
          </div>

          {/* Details */}
          <div>
            <div className="inline-block bg-burgundy text-ivory text-[10.5px] font-semibold tracking-widest px-2 py-1 rounded">{(ev.status || 'UPCOMING').toUpperCase()}</div>
            <h1 className="mt-3 font-serif-display text-burgundy text-[36px] md:text-[48px] leading-[1.05] font-semibold">{ev.title}</h1>
            {ev.subtitle && <div className="text-ink/70 text-[15px] mt-1">{ev.subtitle}</div>}

            <ul className="mt-6 space-y-2.5 text-[14.5px] text-ink/85">
              {ev.date && <li className="flex items-center gap-2"><Calendar className="w-4 h-4 text-burgundy" />{ev.date}</li>}
              {ev.location && <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-burgundy" />{ev.location}</li>}
              {ev.audience && <li className="flex items-center gap-2"><Users className="w-4 h-4 text-burgundy" />{ev.audience}</li>}
            </ul>

            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="text-[11.5px] font-semibold text-burgundy bg-burgundy/10 rounded-full px-3 py-1">{t}</span>
                ))}
              </div>
            )}

            {ev.body && (
              <div className="mt-6 text-ink/85 text-[15.5px] leading-[1.75] whitespace-pre-wrap">{ev.body}</div>
            )}

            {ev.status !== 'past' && ev.capacity && (
              <div className="mt-6 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="text-[12.5px] tracking-widest text-ink/60 font-semibold uppercase">Attendance</div>
                  <div className="text-[13.5px] text-ink/70">
                    <span className="text-burgundy font-semibold">{ev.registered_count || 0}</span>
                    <span className="text-ink/50"> / {ev.capacity} registered</span>
                    {ev.is_full && <span className="ml-2 text-[11.5px] font-semibold text-burgundy bg-burgundy/10 rounded-full px-2 py-0.5">Waitlist open</span>}
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-ivory-300 overflow-hidden">
                  <div
                    className="h-full bg-burgundy"
                    style={{ width: `${Math.min(100, Math.round(((ev.registered_count || 0) / ev.capacity) * 100))}%` }}
                  />
                </div>
                {!ev.is_full && typeof ev.spots_left === 'number' && (
                  <div className="mt-2 text-[12.5px] text-ink/60">{ev.spots_left} {ev.spots_left === 1 ? 'spot' : 'spots'} left</div>
                )}
              </div>
            )}

            {ev.status !== 'past' && (
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={`/events/${ev.slug || ev.id}/register`} className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light">
                  <Ticket className="w-4 h-4" /> {ev.is_full ? 'Join the waitlist' : 'Register now'}
                </a>
                <a href="/get-involved/partner" className="cta-btn inline-flex items-center gap-2 rounded-full border-2 border-burgundy text-burgundy px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy hover:text-ivory">
                  Partner With Us <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}

            <ShareRow ev={ev} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EventDetail;
