import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Landmark,
  Loader2,
  Copy,
  ReceiptText,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";
import {
  BANK_TRANSFER_ENABLED,
  MPESA_PAYBILL,
} from "../config/payments";

const formatKES = (n) => `KES ${Number(n).toLocaleString()}`;

const basePaymentOptions = [
  {
    key: "M-Pesa",
    label: "M-Pesa",
    icon: Smartphone,
    sub: "Pay manually using our Paybill",
  },
  {
    key: "Card",
    label: "Card",
    icon: CreditCard,
    sub: "Visa / Mastercard (Stripe)",
  },
];

const bankTransferOption = {
  key: "Bank Transfer",
  label: "Bank Transfer",
  icon: Landmark,
  sub: "Manual settlement",
};

const Checkout = () => {
  const { items, subtotal, clear } = useCart();
  const [params, setParams] = useSearchParams();

  const returnedOrderId = params.get("order_id");
  const stripeSession = params.get("session_id");

  const paymentOptions = useMemo(
    () =>
      BANK_TRANSFER_ENABLED
        ? [...basePaymentOptions, bankTransferOption]
        : basePaymentOptions,
    [],
  );

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

  const [manualReference, setManualReference] = useState("");
  const [submittingReference, setSubmittingReference] = useState(false);
  const [referenceMessage, setReferenceMessage] = useState(null);
  const [copied, setCopied] = useState(null);

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
  }, [returnedOrderId, stripeSession, clear, setParams]);

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

    if (data?.error) {
      throw new Error(data.error);
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

      if (form.payment === "M-Pesa") {
        const data = await createOrder("mpesa");

        if (!data?.order_id) {
          throw new Error("Order ID was not returned.");
        }

        setConfirmation({
          id: data.order_id,
          paid: false,
          method: "mpesa",
          total: Number(data.total),
          email: form.email,
          phone: form.phone,
          referenceSubmitted: false,
        });

        clear();

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      if (form.payment === "Bank Transfer" && BANK_TRANSFER_ENABLED) {
        const data = await createOrder("bank");

        if (!data?.order_id) {
          throw new Error("Order ID was not returned.");
        }

        setConfirmation({
          id: data.order_id,
          paid: false,
          method: "bank",
          total: Number(data.total),
          email: form.email,
          phone: form.phone,
        });

        clear();

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

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

  const copyValue = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  const submitManualReference = async (event) => {
    event.preventDefault();

    if (
      submittingReference ||
      !confirmation?.id ||
      confirmation.method !== "mpesa"
    ) {
      return;
    }

    const reference = manualReference.trim().toUpperCase();

    if (!reference) {
      setReferenceMessage({
        type: "error",
        text: "Enter the M-Pesa transaction code from your confirmation message.",
      });
      return;
    }

    setSubmittingReference(true);
    setReferenceMessage(null);

    try {
      const { data, error: referenceError } = await supabase.functions.invoke(
        "submit-manual-payment-reference",
        {
          body: {
            order_id: confirmation.id,
            email: confirmation.email,
            reference,
          },
        },
      );

      if (referenceError) {
        throw referenceError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setConfirmation((current) => ({
        ...current,
        referenceSubmitted: true,
        reference,
      }));

      setReferenceMessage({
        type: "success",
        text:
          data?.message ||
          "Reference received. We will verify the payment before confirming your order.",
      });
    } catch (referenceError) {
      console.error("Manual payment reference submission failed:", referenceError);
      setReferenceMessage({
        type: "error",
        text:
          referenceError?.message ||
          "We could not save that transaction code. Please try again or contact us.",
      });
    } finally {
      setSubmittingReference(false);
    }
  };

  if (confirmation) {
    const shortOrderId = confirmation.id?.slice(0, 8).toUpperCase();
    const isMpesaPending = confirmation.method === "mpesa" && !confirmation.paid;

    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/checkout" />

        <section className="mx-auto max-w-[760px] px-4 md:px-8 py-14 md:py-16">
          <div className="rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-7 md:p-10">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center">
                {confirmation.paid ? (
                  <CheckCircle2 className="w-9 h-9 text-burgundy" />
                ) : (
                  <ReceiptText className="w-8 h-8 text-burgundy" />
                )}
              </div>

              <h1 className="mt-4 font-serif-display text-burgundy text-[30px] md:text-[38px] font-semibold">
                {confirmation.paid
                  ? "Thank you — payment received."
                  : isMpesaPending
                    ? "Order placed — complete your M-Pesa payment."
                    : "Order placed — awaiting payment."}
              </h1>

              <p className="mt-3 text-ink/80 text-[14.5px] max-w-[580px] mx-auto">
                {confirmation.paid
                  ? "Your payment has been confirmed. Your support fuels creative wellbeing programs across our communities."
                  : "Your order is reserved, but it is not marked paid until ArtNovaX verifies the incoming payment."}
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-ivory-200 ring-1 ring-ivory-300 px-4 py-2 text-[13.5px] font-semibold text-ink">
                Order ID
                <span className="text-burgundy">#{shortOrderId}</span>
              </div>
            </div>

            {isMpesaPending && (
              <div className="mt-8 space-y-5">
                <div className="rounded-2xl bg-white ring-1 ring-ivory-300 p-5 md:p-6">
                  <div className="flex items-center gap-2 text-burgundy font-semibold">
                    <Smartphone className="w-5 h-5" />
                    Pay using M-Pesa Paybill
                  </div>

                  <ol className="mt-4 space-y-2 text-[13.5px] text-ink/80 list-decimal pl-5">
                    <li>Open M-Pesa and choose Lipa na M-Pesa → Pay Bill.</li>
                    <li>Enter the business number and account number below.</li>
                    <li>Enter the exact order total shown below.</li>
                    <li>Review the payment details carefully before entering your M-Pesa PIN.</li>
                    <li>After payment, submit the M-Pesa transaction code below so we can match and verify it.</li>
                  </ol>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <PaymentDetail
                      label="Paybill"
                      value={MPESA_PAYBILL.paybill}
                      copied={copied === "paybill"}
                      onCopy={() => copyValue("paybill", MPESA_PAYBILL.paybill)}
                    />
                    <PaymentDetail
                      label="Account number"
                      value={MPESA_PAYBILL.accountNumber}
                      copied={copied === "account"}
                      onCopy={() =>
                        copyValue("account", MPESA_PAYBILL.accountNumber)
                      }
                    />
                    <PaymentDetail
                      label="Amount"
                      value={formatKES(confirmation.total)}
                      copied={copied === "amount"}
                      onCopy={() =>
                        copyValue("amount", String(Math.round(confirmation.total)))
                      }
                    />
                  </div>

                  <div className="mt-4 rounded-xl bg-ivory-200/60 px-4 py-3 text-[12.5px] text-ink/70">
                    Receiving business: <strong>{MPESA_PAYBILL.businessName}</strong>.
                    Use only the Paybill and account number shown here. ArtNovaX will
                    never ask you to enter your M-Pesa PIN on this website.
                  </div>
                </div>

                <div className="rounded-2xl bg-white ring-1 ring-ivory-300 p-5 md:p-6">
                  <div className="font-semibold text-burgundy text-[15px]">
                    Submit your M-Pesa transaction code
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink/65">
                    This does not automatically mark the order as paid. Our team will
                    verify the transaction against the ArtNovaX receiving account first.
                  </p>

                  <form onSubmit={submitManualReference} className="mt-4 flex flex-col sm:flex-row gap-3">
                    <input
                      value={manualReference}
                      onChange={(event) =>
                        setManualReference(event.target.value.toUpperCase())
                      }
                      disabled={confirmation.referenceSubmitted}
                      placeholder="e.g. M-Pesa transaction code"
                      autoCapitalize="characters"
                      className="flex-1 rounded-lg ring-1 ring-ivory-300 bg-ivory px-4 py-3 text-[14px] uppercase focus:outline-none focus:ring-2 focus:ring-burgundy/40 disabled:opacity-60"
                    />
                    <button
                      disabled={
                        submittingReference || confirmation.referenceSubmitted
                      }
                      className="cta-btn inline-flex items-center justify-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-3 text-[13.5px] font-semibold hover:bg-burgundy-light disabled:opacity-60"
                    >
                      {submittingReference ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting…
                        </>
                      ) : confirmation.referenceSubmitted ? (
                        "Reference submitted"
                      ) : (
                        "Submit reference"
                      )}
                    </button>
                  </form>

                  {referenceMessage && (
                    <div
                      className={`mt-3 text-[12.5px] ${
                        referenceMessage.type === "success"
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      {referenceMessage.text}
                    </div>
                  )}
                </div>
              </div>
            )}

            {confirmation.method === "bank" && !confirmation.paid && (
              <div className="mt-7 rounded-2xl bg-ivory-200/60 ring-1 ring-ivory-300 p-5 text-[13.5px] text-ink/80">
                Direct bank transfer is currently configured as a manual payment.
                Follow the verified receiving details provided by ArtNovaX and keep
                your Order ID for reconciliation.
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
                href="/contact"
                className="cta-btn inline-flex items-center gap-2 rounded-full border-2 border-burgundy text-burgundy px-6 py-3 text-[14px] font-semibold hover:bg-burgundy hover:text-ivory"
              >
                Need help?
              </a>
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

                <div
                  className={`grid grid-cols-1 gap-3 ${
                    paymentOptions.length === 3
                      ? "sm:grid-cols-3"
                      : "sm:grid-cols-2"
                  }`}
                >
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

                <div className="mt-3 text-ink/60 text-[12px] flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    Card payments are processed by Stripe. M-Pesa uses the
                    official ArtNovaX Paybill and is verified manually before an
                    order is marked paid.
                  </span>
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
                        ? "Place order & view Paybill"
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

const PaymentDetail = ({ label, value, copied, onCopy }) => (
  <div className="rounded-xl bg-ivory-100 ring-1 ring-ivory-300 p-4">
    <div className="text-[11px] uppercase tracking-wider text-ink/55 font-semibold">
      {label}
    </div>
    <div className="mt-1 flex items-center justify-between gap-2">
      <div className="text-[17px] font-semibold text-burgundy break-all">
        {value}
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-burgundy hover:bg-ivory-200"
        aria-label={`Copy ${label}`}
        title={`Copy ${label}`}
      >
        {copied ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  </div>
);

export default Checkout;
