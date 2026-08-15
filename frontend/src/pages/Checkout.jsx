import React, { useEffect, useState } from "react";
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
import { supabase } from "../lib/supabase";

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

  const [mpesa, setMpesa] = useState(null);
  const [mpesaMsg, setMpesaMsg] = useState(null);

  const set = (key) => (event) =>
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));

  // Display-only totals. The Edge Function recalculates all prices,
  // shipping and totals from Supabase before creating an order.
  const shipping = subtotal > 0 ? (subtotal >= 3000 ? 0 : 200) : 0;
  const total = subtotal + shipping;

  // Stripe return verification.
  useEffect(() => {
    const verify = async () => {
      if (!returnedOrderId || !stripeSession) {
        return;
      }

      try {
        const { data, error: verifyError } = await supabase.functions.invoke(
          "verify-order-checkout",
          {
            body: {
              order_id: returnedOrderId,
              session_id: stripeSession,
            },
          },
        );

        if (verifyError) {
          throw verifyError;
        }

        if (data?.paid) {
          setConfirmation({
            id: returnedOrderId,
            paid: true,
            method: "card",
          });

          clear();

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        } else {
          setError("Card payment was not completed. You can try again below.");
        }
      } catch (verifyError) {
        console.error("Payment verification failed:", verifyError);
        setError("We could not verify your card payment. Please contact us.");
      } finally {
        setParams({}, { replace: true });
      }
    };

    verify();

  }, [returnedOrderId, stripeSession]);

  // Once an STK Push has been started, poll Supabase for the result
  // written by the Safaricom callback Edge Function.
  useEffect(() => {
    if (!mpesa?.orderId) {
      return undefined;
    }

    let stopped = false;
    let attempts = 0;
    let timeoutId = null;

    const poll = async () => {
      attempts += 1;

      try {
        const { data, error: statusError } = await supabase.functions.invoke(
          "mpesa-status",
          {
            body: {
              order_id: mpesa.orderId,
            },
          },
        );

        if (statusError) {
          throw statusError;
        }

        if (stopped) {
          return;
        }

        if (data?.paid) {
          setConfirmation({
            id: mpesa.orderId,
            paid: true,
            method: "mpesa",
            receipt: data.receipt,
          });

          clear();
          setMpesa(null);

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });

          return;
        }

        if (data?.failed) {
          setError(
            data.message ||
              "The M-Pesa payment was not completed. Please try again.",
          );
          setMpesa(null);
          return;
        }

        if (attempts < 40 && !stopped) {
          timeoutId = window.setTimeout(poll, 3000);
        } else if (!stopped) {
          setError(
            "We are still waiting for M-Pesa confirmation. Check your phone and try again if needed.",
          );
          setMpesa(null);
        }
      } catch (statusError) {
        console.error("M-Pesa status check failed:", statusError);

        if (attempts < 40 && !stopped) {
          timeoutId = window.setTimeout(poll, 3000);
        } else if (!stopped) {
          setError(
            "We could not confirm the M-Pesa payment. Please try again.",
          );
          setMpesa(null);
        }
      }
    };

    poll();

    return () => {
      stopped = true;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [mpesa?.orderId, clear]);

  const createOrder = async (paymentMethod) => {
    const { data, error: orderError } = await supabase.functions.invoke(
      "create-order-checkout",
      {
        body: {
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            country: form.country,
          },

          items: items.map((item) => ({
            product_id: item.productId || null,
            // Compatibility fallback for older carts that were saved
            // before the Supabase UUID was preserved.
            name: item.name,
            qty: item.qty,
          })),

          payment_method: paymentMethod,

          success_url: `${window.location.origin}/checkout`,
          cancel_url: `${window.location.origin}/checkout`,
        },
      },
    );

    if (orderError) {
      throw orderError;
    }

    return data;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (placing || items.length === 0) {
      return;
    }

    setPlacing(true);
    setError(null);

    try {
      if (form.payment === "Card") {
        const data = await createOrder("card");

        if (!data?.url) {
          throw new Error("Stripe checkout URL was not returned.");
        }

        window.location.href = data.url;
        return;
      }

      if (form.payment === "Bank Transfer") {
        const data = await createOrder("bank");

        if (!data?.order_id) {
          throw new Error("Order ID was not returned.");
        }

        setConfirmation({
          id: data.order_id,
          paid: false,
          method: "bank",
        });

        clear();

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      if (form.payment === "M-Pesa") {
        const orderData = await createOrder("mpesa");

        if (!orderData?.order_id) {
          throw new Error("Order ID was not returned.");
        }

        const { data: stkData, error: stkError } =
          await supabase.functions.invoke("mpesa-stk", {
            body: {
              order_id: orderData.order_id,
              phone: form.phone,
            },
          });

        if (stkError) {
          throw stkError;
        }

        setMpesa({
          orderId: orderData.order_id,
          ref: stkData.ref,
        });

        setMpesaMsg(
          stkData.message ||
            "Check your phone for the M-Pesa prompt and approve the payment there.",
        );

        return;
      }

      throw new Error("Unsupported payment method.");
    } catch (submitError) {
      console.error("Checkout failed:", submitError);

      setError(
        submitError?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setPlacing(false);
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
              Your order has been received. Keep your Order ID for your records.
              Your support fuels creative wellbeing programs across our
              communities.
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
                  Use your Order ID as the reference. We&apos;ll confirm the
                  transfer once it is received.
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

  if (mpesa) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/checkout" />

        <section className="mx-auto max-w-[560px] px-4 md:px-8 py-16">
          <div className="rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-8 md:p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-burgundy" />
            </div>

            <h1 className="mt-4 font-serif-display text-burgundy text-[26px] font-semibold">
              Approve the M-Pesa payment
            </h1>

            <p className="mt-2 text-ink/75 text-[14px]">
              {mpesaMsg ||
                "Check your phone for the M-Pesa prompt and approve the payment there."}
            </p>

            <p className="mt-3 text-[13px] text-ink/65">
              Enter your M-Pesa PIN only in the secure prompt on your phone.
              ArtNovaX will never ask you to type your PIN on this website.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 bg-ivory-200 ring-1 ring-ivory-300 rounded-full px-3 py-1 text-[12.5px]">
              <span className="text-ink/60">Reference</span>
              <span className="font-semibold text-burgundy">{mpesa.ref}</span>
            </div>

            <div className="mt-6 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-burgundy" />
            </div>

            <div className="mt-4 text-[12px] text-ink/55">
              Waiting for payment confirmation…
            </div>

            <button
              type="button"
              onClick={() => {
                setMpesa(null);
                setError(null);
              }}
              className="mt-5 text-burgundy text-[13px] font-semibold hover:underline"
            >
              Cancel and choose another method
            </button>
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
                  {paymentOptions.map((paymentOption) => (
                    <label
                      key={paymentOption.key}
                      className={`cursor-pointer rounded-xl ring-1 px-4 py-3 flex items-start gap-3 transition-colors ${
                        form.payment === paymentOption.key
                          ? "bg-burgundy text-ivory ring-burgundy"
                          : "bg-ivory-100 text-ink ring-ivory-300 hover:ring-burgundy/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        className="sr-only"
                        checked={form.payment === paymentOption.key}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            payment: paymentOption.key,
                          }))
                        }
                      />

                      <paymentOption.icon
                        className={`w-5 h-5 shrink-0 ${
                          form.payment === paymentOption.key
                            ? "text-ivory"
                            : "text-burgundy"
                        }`}
                      />

                      <div>
                        <div className="text-[14px] font-semibold">
                          {paymentOption.label}
                        </div>

                        <div
                          className={`text-[11.5px] ${
                            form.payment === paymentOption.key
                              ? "text-ivory/80"
                              : "text-ink/60"
                          }`}
                        >
                          {paymentOption.sub}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-3 text-ink/60 text-[12px] inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Sandbox/test payments only while development is in progress.
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
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden ring-1 ring-ivory-300 shrink-0">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-ink truncate">
                        {item.name}
                      </div>

                      <div className="text-[12px] text-ink/60">
                        Qty {item.qty}
                      </div>
                    </div>

                    <div className="text-[13px] font-semibold text-burgundy">
                      {formatKES(item.priceNum * item.qty)}
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
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
