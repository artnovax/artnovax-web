import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Heart, CheckCircle2, Loader2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";

const PRESETS = [500, 1000, 2500, 5000, 10000];

const Support = () => {
  const [amt, setAmt] = useState(1000);
  const [custom, setCustom] = useState("");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [params, setParams] = useSearchParams();
  const donationId = params.get("donation_id");
  const stripeSession = params.get("session_id");
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    if (donationId && stripeSession) {
      setThanks(true);
      setParams({}, { replace: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [donationId, stripeSession, setParams]);

  const donate = async () => {
    const value = Number(custom || amt);

    if (!value || value < 100) {
      setErr("Minimum donation is KES 100.");
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-donation-checkout",
        {
          body: {
            amount_kes: value,
            name: form.name,
            email: form.email,
            message: form.message,
            success_url: `${window.location.origin}/support`,
            cancel_url: `${window.location.origin}/support`,
          },
        },
      );

      if (error) throw error;
      if (!data?.url) throw new Error("Stripe checkout URL was not returned.");

      window.location.href = data.url;
    } catch (error) {
      console.error("Donation checkout failed:", error);
      setErr(
        error?.message ||
          "We could not start the donation checkout. Please try again.",
      );
      setLoading(false);
    }
  };

  if (thanks) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/support" />
        <section className="mx-auto max-w-[640px] px-4 md:px-8 py-20 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-burgundy" />
          </div>
          <h1 className="mt-4 font-serif-display text-burgundy text-[36px] font-semibold">
            Thank you — we&apos;re moved.
          </h1>
          <p className="mt-3 text-ink/80">
            Your checkout was completed. Stripe is securely confirming the
            payment with ArtNovaX, and your gift will help us reach more young
            people through art.
          </p>
          <a
            href="/"
            className="cta-btn mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold hover:bg-burgundy-light"
          >
            Back to home <ArrowRight className="w-4 h-4" />
          </a>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/get-involved/support" />
      <section className="mx-auto max-w-[1100px] px-4 md:px-8 pt-10 md:pt-14 pb-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10">
        <div>
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold">
            SUPPORT OUR WORK
          </div>
          <h1 className="mt-3 font-serif-display text-burgundy text-[42px] md:text-[52px] leading-[1.05] font-semibold">
            Your gift makes creative wellbeing possible.
          </h1>
          <p className="mt-5 text-ink/80 text-[16px] leading-[1.7]">
            Every shilling helps us bring guided art sessions, research and
            community care to young people across Kenya. You can give once
            today, or reach out to set up a longer-term commitment.
          </p>
          <ul className="mt-6 space-y-2 text-ink/85 text-[14.5px]">
            <li className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-burgundy mt-1" />
              <span>
                KES 1,000 helps stock materials for one campus session.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-burgundy mt-1" />
              <span>KES 5,000 sponsors a small circle of care for a term.</span>
            </li>
            <li className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-burgundy mt-1" />
              <span>
                Any amount goes 100% to program delivery and research.
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-6 md:p-8">
          <h2 className="font-serif-display text-burgundy text-[24px] font-semibold">
            Give today
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {PRESETS.map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => {
                  setAmt(v);
                  setCustom("");
                }}
                className={`rounded-full ring-1 px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                  !custom && amt === v
                    ? "bg-burgundy text-ivory ring-burgundy"
                    : "ring-ivory-300 bg-ivory text-ink hover:ring-burgundy/40"
                }`}
              >
                KES {v.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <label className="block text-[11.5px] tracking-widest text-ink/60 font-semibold">
              Or custom amount (KES)
            </label>
            <input
              type="number"
              min="100"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="e.g. 750"
              className="mt-1 w-full rounded-lg ring-1 ring-ivory-300 bg-ivory px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
            />
          </div>

          <div className="mt-4 space-y-3">
            <input
              placeholder="Your name (optional)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg ring-1 ring-ivory-300 bg-ivory px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
            />
            <input
              type="email"
              placeholder="Email (for receipt)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg ring-1 ring-ivory-300 bg-ivory px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
            />
            <textarea
              placeholder="A note (optional)"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              className="w-full rounded-lg ring-1 ring-ivory-300 bg-ivory px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
            />
          </div>

          {err && <div className="mt-3 text-red-700 text-[13.5px]">{err}</div>}

          <button
            onClick={donate}
            disabled={loading}
            className="cta-btn mt-5 w-full inline-flex justify-center items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting…
              </>
            ) : (
              <>
                Donate KES {Number(custom || amt).toLocaleString()}{" "}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="mt-3 text-ink/60 text-[11.5px] text-center">
            Secured by Stripe. We also welcome bank transfers and pledges:{" "}
            <a href="/contact" className="text-burgundy font-semibold">
              contact us
            </a>
            .
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Support;
