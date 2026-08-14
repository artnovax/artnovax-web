import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Landmark,
  Loader2,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const formatKES = (n) => `KES ${Number(n).toLocaleString()}`;

const paymentOptions = [
  {
    key: "M-Pesa",
    label: "M-Pesa",
    icon: Smartphone,
    sub: "STK Push to your phone",
  },
  {
    key: "Card",
    label: "Card",
    icon: CreditCard,
    sub: "Visa / Mastercard (Stripe)",
  },
  {
    key: "Bank Transfer",
    label: "Bank Transfer",
    icon: Landmark,
    sub: "Manual settlement",
  },
];

const Checkout = () => {
  const { items, subtotal, clear } = useCart();
  const [params, setParams] = useSearchParams();
  const returnedOrderId = params.get("order_id");
  const stripeSession = params.get("session_id");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "Nairobi",
    country: "Kenya",
    payment: "M-Pesa",
  });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const [mpesa, setMpesa] = useState(null); // { orderId, ref }
  const [mpesaPin, setMpesaPin] = useState("");
  const [mpesaWait, setMpesaWait] = useState(false);
  const [mpesaMsg, setMpesaMsg] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const shipping = subtotal > 0 ? (subtotal >= 3000 ? 0 : 200) : 0;
  const total = subtotal + shipping;

  // Handle Stripe return
  useEffect(() => {
    const verify = async () => {
      if (!returnedOrderId || !stripeSession) return;
      try {
        const r = await axios.get(`${API}/payments/stripe/verify`, {
          params: { order_id: returnedOrderId, session_id: stripeSession },
        });
        if (r.data.paid) {
          setConfirmation({ id: returnedOrderId, paid: true, method: "card" });
          clear();
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setError("Card payment was not completed. You can try again below.");
        }
      } catch (e) {
        setError("We could not verify your card payment. Please contact us.");
      } finally {
        setParams({}, { replace: true });
      }
    };
    verify();
    // eslint-disable-next-line
  }, [returnedOrderId, stripeSession]);

  const createOrder = async () => {
    const payload = {
      customer: { ...form },
      items: items.map((i) => ({
        name: i.name,
        price: i.priceNum,
        qty: i.qty,
      })),
      subtotal,
      shipping,
      total,
    };
    const r = await axios.post(`${API}/orders/create`, payload);
    return r.data.id;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (placing || items.length === 0) return;
    setPlacing(true);
    setError(null);
    try {
      const orderId = await createOrder();
      if (form.payment === "Card") {
        const success = window.location.origin + "/checkout";
        const cancel = window.location.origin + "/checkout";
        const s = await axios.post(`${API}/payments/stripe/checkout`, {
          order_id: orderId,
          success_url: success,
          cancel_url: cancel,
        });
        window.location.href = s.data.url;
        return;
      }
      if (form.payment === "M-Pesa") {
        const r = await axios.post(`${API}/payments/mpesa/stk`, {
          order_id: orderId,
          phone: form.phone,
        });
        setMpesa({ orderId, ref: r.data.ref });
        setMpesaMsg(r.data.message);
        setPlacing(false);
        return;
      }
      // Bank Transfer — order created, show instructions
      setConfirmation({ id: orderId, paid: false, method: "bank" });
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setPlacing(false);
    }
  };

  const confirmMpesa = async (e) => {
    e.preventDefault();
    if (!mpesa || mpesaWait) return;
    setMpesaWait(true);
    setError(null);
    try {
      const r = await axios.post(`${API}/payments/mpesa/confirm`, {
        order_id: mpesa.orderId,
        ref: mpesa.ref,
        pin: mpesaPin,
      });
      setConfirmation({
        id: mpesa.orderId,
        paid: true,
        method: "mpesa",
        receipt: r.data.receipt,
      });
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Payment failed. Please try again.",
      );
    } finally {
      setMpesaWait(false);
    }
  };

  if (confirmation) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/checkout" />
        <section className="mx-auto max-w-[720px] px-4 md:px-8 py-16">
          <div className="rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-8 md:p-10 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-burgundy" />
            </div>
            <h1 className="mt-4 font-serif-display text-burgundy text-[32px] md:text-[38px] font-semibold">
              {confirmation.paid
                ? "Thank you — payment received."
                : "Order placed — awaiting payment."}
            </h1>
            <p className="mt-3 text-ink/80 text-[15px] max-w-[520px] mx-auto">
              A confirmation with next steps has been sent to your email. Your
              support fuels creative wellbeing programs across our communities.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 rounded-full bg-ivory-200 ring-1 ring-ivory-300 px-4 py-2 text-[13.5px] font-semibold text-ink">
                Order ID{" "}
                <span className="text-burgundy">
                  #{confirmation.id?.slice(0, 8).toUpperCase()}
                </span>
              </div>
              {confirmation.receipt && (
                <div className="inline-flex items-center gap-2 rounded-full bg-ivory-200 ring-1 ring-ivory-300 px-4 py-2 text-[13.5px] font-semibold text-ink">
                  M-Pesa{" "}
                  <span className="text-burgundy">{confirmation.receipt}</span>
                </div>
              )}
            </div>
            {confirmation.method === "bank" && (
              <div className="mt-6 text-left mx-auto max-w-[420px] rounded-2xl bg-ivory-200/60 ring-1 ring-ivory-300 p-5 text-[13.5px] text-ink/85">
                <div className="font-semibold text-burgundy mb-1">
                  Bank details
                </div>
                <div>Account name: ArtNovaX Mental Health Foundation</div>
                <div>Bank: KCB Bank Kenya</div>
                <div>Account: 1234567890</div>
                <div className="mt-2 text-ink/60 text-[12px]">
                  Use your Order ID as the reference. We\u2019ll email you once
                  we confirm the transfer.
                </div>
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <a
                href="/shop"
                className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold hover:bg-burgundy-light"
              >
                Continue shopping <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/our-work"
                className="cta-btn inline-flex items-center gap-2 rounded-full border-2 border-burgundy text-burgundy px-6 py-3 text-[14px] font-semibold hover:bg-burgundy hover:text-ivory"
              >
                Explore our work
              </a>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // M-Pesa PIN entry step
  if (mpesa) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/checkout" />
        <section className="mx-auto max-w-[560px] px-4 md:px-8 py-16">
          <div className="rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-8 md:p-10">
            <div className="mx-auto w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-burgundy" />
            </div>
            <h1 className="mt-4 text-center font-serif-display text-burgundy text-[26px] font-semibold">
              Confirm M-Pesa payment
            </h1>
            <p className="mt-2 text-center text-ink/75 text-[14px]">
              {mpesaMsg ||
                "Check your phone and enter the M-Pesa PIN to authorise the payment."}
            </p>
            <div className="mt-4 text-center inline-flex items-center gap-2 bg-ivory-200 ring-1 ring-ivory-300 rounded-full px-3 py-1 text-[12.5px] mx-auto">
              <span className="text-ink/60">Reference</span>
              <span className="font-semibold text-burgundy">{mpesa.ref}</span>
            </div>
            <div className="mt-2 text-center inline-flex items-center gap-2 bg-ivory-200 ring-1 ring-ivory-300 rounded-full px-3 py-1 text-[12.5px] mx-auto ml-2">
              <span className="text-ink/60">Amount</span>
              <span className="font-semibold text-burgundy">
                {formatKES(total)}
              </span>
            </div>
            <form onSubmit={confirmMpesa} className="mt-6 space-y-3">
              <input
                type="password"
                inputMode="numeric"
                required
                placeholder="Enter M-Pesa PIN"
                value={mpesaPin}
                onChange={(e) => setMpesaPin(e.target.value)}
                className="w-full text-center tracking-[0.5em] rounded-full bg-ivory ring-1 ring-ivory-300 px-5 py-3 text-[18px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
              />
              <button
                disabled={mpesaWait}
                className="cta-btn w-full inline-flex justify-center items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light disabled:opacity-70"
              >
                {mpesaWait ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying\u2026
                  </>
                ) : (
                  <>
                    Confirm payment <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMpesa(null)}
                className="w-full text-ink/60 text-[13px] hover:text-burgundy"
              >
                Cancel and choose another method
              </button>
            </form>
            {error && (
              <div className="mt-3 text-red-700 text-[13px] text-center">
                {error}
              </div>
            )}
            <div className="mt-4 text-center text-[11.5px] text-ink/50 inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Sandbox mode — test
              payment only.
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/checkout" />
      <section className="mx-auto max-w-[1180px] px-4 md:px-8 py-10 md:py-14">
        <h1 className="font-serif-display text-burgundy text-[34px] md:text-[42px] font-semibold">
          Checkout
        </h1>
        <p className="text-ink/70 text-[14px] mt-1">
          Every purchase supports ArtNovaX programs.
        </p>

        {items.length === 0 && !returnedOrderId ? (
          <div className="mt-10 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-8 text-center">
            <div className="font-serif-display text-ink text-[20px]">
              Your bag is empty.
            </div>
            <a
              href="/shop"
              className="cta-btn mt-4 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold hover:bg-burgundy-light"
            >
              Shop the Collection <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-8"
          >
            <div className="space-y-5">
              <div>
                <h2 className="font-serif-display text-burgundy text-[20px] font-semibold mb-3">
                  Contact
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    required
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Full name *"
                    className="rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
                  />
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="Email *"
                    className="rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
                  />
                  <input
                    required
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="Phone (e.g. 07XXXXXXXX) *"
                    className="md:col-span-2 rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
                  />
                </div>
              </div>
              <div>
                <h2 className="font-serif-display text-burgundy text-[20px] font-semibold mb-3">
                  Delivery
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    required
                    value={form.address}
                    onChange={set("address")}
                    placeholder="Address *"
                    className="md:col-span-2 rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
                  />
                  <input
                    required
                    value={form.city}
                    onChange={set("city")}
                    placeholder="City *"
                    className="rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
                  />
                  <input
                    required
                    value={form.country}
                    onChange={set("country")}
                    placeholder="Country *"
                    className="rounded-lg ring-1 ring-ivory-300 bg-ivory-100 px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40"
                  />
                </div>
              </div>
              <div>
                <h2 className="font-serif-display text-burgundy text-[20px] font-semibold mb-3">
                  Payment
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {paymentOptions.map((p) => (
                    <label
                      key={p.key}
                      className={`cursor-pointer rounded-xl ring-1 px-4 py-3 flex items-start gap-3 transition-colors ${form.payment === p.key ? "bg-burgundy text-ivory ring-burgundy" : "bg-ivory-100 text-ink ring-ivory-300 hover:ring-burgundy/40"}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        className="sr-only"
                        checked={form.payment === p.key}
                        onChange={() =>
                          setForm((f) => ({ ...f, payment: p.key }))
                        }
                      />
                      <p.icon
                        className={`w-5 h-5 shrink-0 ${form.payment === p.key ? "text-ivory" : "text-burgundy"}`}
                      />
                      <div>
                        <div className="text-[14px] font-semibold">
                          {p.label}
                        </div>
                        <div
                          className={`text-[11.5px] ${form.payment === p.key ? "text-ivory/80" : "text-ink/60"}`}
                        >
                          {p.sub}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-3 text-ink/60 text-[12px] inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Sandbox mode — test payment only. Card test: 4242 4242 4242
                  4242.
                </div>
              </div>
              {error && (
                <div className="text-red-700 text-[13.5px]">{error}</div>
              )}
            </div>

            <aside className="h-fit rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-6 sticky top-24">
              <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">
                Order Summary
              </h3>
              <ul className="mt-4 space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden ring-1 ring-ivory-300 shrink-0">
                      <img
                        src={i.img}
                        alt={i.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-ink truncate">
                        {i.name}
                      </div>
                      <div className="text-[12px] text-ink/60">Qty {i.qty}</div>
                    </div>
                    <div className="text-[13px] font-semibold text-burgundy">
                      {formatKES(i.priceNum * i.qty)}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="my-4 border-t border-ivory-300" />
              <dl className="space-y-1.5 text-[14px]">
                <div className="flex justify-between">
                  <dt className="text-ink/70">Subtotal</dt>
                  <dd className="text-ink font-semibold">
                    {formatKES(subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/70">Shipping</dt>
                  <dd className="text-ink font-semibold">
                    {shipping === 0 ? "Free" : formatKES(shipping)}
                  </dd>
                </div>
              </dl>
              <div className="my-3 border-t border-ivory-300" />
              <div className="flex justify-between text-[16px]">
                <span className="text-ink font-semibold">Total</span>
                <span className="text-burgundy font-serif-display text-[22px] font-semibold">
                  {formatKES(total)}
                </span>
              </div>
              <button
                disabled={placing}
                className="cta-btn mt-5 w-full flex justify-center items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light disabled:opacity-70"
              >
                {placing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{" "}
                    Processing\u2026
                  </>
                ) : (
                  <>
                    {form.payment === "Card"
                      ? "Pay with Card"
                      : form.payment === "M-Pesa"
                        ? "Pay with M-Pesa"
                        : "Place order"}{" "}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <a
                href="/cart"
                className="mt-2 block text-center text-burgundy text-[13px] font-semibold hover:underline"
              >
                Back to cart
              </a>
            </aside>
          </form>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Checkout;
