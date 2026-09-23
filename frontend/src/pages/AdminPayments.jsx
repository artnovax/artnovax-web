import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  CreditCard,
  Loader2,
  RefreshCw,
  Smartphone,
  WalletCards,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  getCurrentRole,
  getSession,
} from "../services/admin";
import {
  confirmManualPayment,
  getOrdersForPaymentReview,
} from "../services/paymentAdmin";

const formatKES = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : "—";

const methodLabel = (method) => {
  switch (method) {
    case "mpesa":
      return "M-Pesa Paybill";
    case "bank":
      return "Bank transfer";
    case "card":
      return "Card";
    default:
      return method || "Unknown";
  }
};

const AdminPayments = () => {
  const [authorized, setAuthorized] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("pending");

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      setOrders(await getOrdersForPaymentReview());
    } catch (loadError) {
      console.error(loadError);
      setError(loadError?.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        const session = await getSession();

        if (!session) {
          if (!cancelled) {
            setAuthorized(false);
            setLoading(false);
          }
          return;
        }

        const role = await getCurrentRole();
        const allowed = role === "admin";

        if (!cancelled) {
          setAuthorized(allowed);
        }

        if (allowed && !cancelled) {
          await loadOrders();
        } else if (!cancelled) {
          setLoading(false);
        }
      } catch (initializeError) {
        console.error(initializeError);

        if (!cancelled) {
          setAuthorized(false);
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleOrders = useMemo(() => {
    if (filter === "all") {
      return orders;
    }

    if (filter === "paid") {
      return orders.filter((order) => order.payment_status === "paid");
    }

    return orders.filter(
      (order) =>
        order.payment_status !== "paid" &&
        ["mpesa", "bank"].includes(order.payment_method),
    );
  }, [orders, filter]);

  const verify = async (order) => {
    const reference = order.manual_payment_reference || "No reference submitted";

    const confirmed = window.confirm(
      `Confirm payment for order #${order.id.slice(0, 8).toUpperCase()}?\n\n` +
        `Expected amount: ${formatKES(order.total)}\n` +
        `Submitted reference: ${reference}\n\n` +
        "Only continue after you have independently verified this payment in KCB/M-Pesa.",
    );

    if (!confirmed) return;

    setConfirmingId(order.id);
    setError(null);

    try {
      await confirmManualPayment(order.id);
      await loadOrders();
    } catch (confirmError) {
      console.error(confirmError);
      setError(
        confirmError?.message ||
          "Could not confirm this payment.",
      );
    } finally {
      setConfirmingId(null);
    }
  };

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/admin" />
        <section className="mx-auto max-w-[620px] px-4 md:px-8 py-16 text-center">
          <div className="rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-8 md:p-10">
            <CircleAlert className="w-10 h-10 text-burgundy mx-auto" />
            <h1 className="mt-4 font-serif-display text-burgundy text-[28px] font-semibold">
              Staff sign-in required
            </h1>
            <p className="mt-2 text-ink/70 text-[14px]">
              Sign in with an ArtNovaX admin account, then return to the payment review page. Payment confirmation is restricted to admins.
            </p>
            <a
              href="/admin"
              className="cta-btn mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold hover:bg-burgundy-light"
            >
              Go to Admin <ArrowLeft className="w-4 h-4 rotate-180" />
            </a>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/admin" />

      <section className="mx-auto max-w-[1180px] px-4 md:px-8 py-10 md:py-14">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ivory-300 pb-5">
          <div>
            <a
              href="/admin"
              className="inline-flex items-center gap-1 text-burgundy text-[13px] font-semibold hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </a>
            <h1 className="mt-2 font-serif-display text-burgundy text-[32px] md:text-[40px] font-semibold">
              Payment Review
            </h1>
            <p className="mt-1 text-ink/65 text-[13.5px] max-w-[720px]">
              Manual payments remain pending until you independently verify the incoming transaction. A customer-submitted M-Pesa code is not proof of payment by itself.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full ring-1 ring-burgundy/30 px-4 py-2 text-burgundy text-[13px] font-semibold hover:bg-burgundy/10 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            ["pending", "Pending manual"],
            ["paid", "Paid"],
            ["all", "All orders"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors ${
                filter === value
                  ? "bg-burgundy text-ivory"
                  : "bg-ivory-100 ring-1 ring-ivory-300 text-ink hover:text-burgundy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 text-red-800 px-4 py-3 text-[13px]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-ink/60 text-[13.5px]">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading orders…
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-10 text-center text-ink/60 text-[13.5px]">
            No orders in this view.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {visibleOrders.map((order) => (
              <OrderReviewCard
                key={order.id}
                order={order}
                confirming={confirmingId === order.id}
                onConfirm={() => verify(order)}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

const OrderReviewCard = ({ order, confirming, onConfirm }) => {
  const paid = order.payment_status === "paid";
  const manual = ["mpesa", "bank"].includes(order.payment_method);
  const reference = order.manual_payment_reference;
  const customer = order.customer || {};
  const MethodIcon =
    order.payment_method === "mpesa"
      ? Smartphone
      : order.payment_method === "card"
        ? CreditCard
        : WalletCards;

  return (
    <article className="rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-serif-display text-burgundy text-[20px] font-semibold">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide ${
                paid
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {paid ? "Paid" : "Pending"}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[12.5px]">
            <Info label="Customer" value={customer.name || "—"} />
            <Info label="Email" value={customer.email || "—"} />
            <Info label="Phone" value={customer.phone || "—"} />
            <Info label="Created" value={formatDate(order.created_at)} />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-ivory-200/60 p-3">
              <div className="text-[10.5px] uppercase tracking-wider text-ink/55 font-semibold">
                Payment method
              </div>
              <div className="mt-1 flex items-center gap-2 text-[13.5px] font-semibold text-ink">
                <MethodIcon className="w-4 h-4 text-burgundy" />
                {methodLabel(order.payment_method)}
              </div>
            </div>

            <div className="rounded-xl bg-ivory-200/60 p-3">
              <div className="text-[10.5px] uppercase tracking-wider text-ink/55 font-semibold">
                Expected total
              </div>
              <div className="mt-1 text-[15px] font-semibold text-burgundy">
                {formatKES(order.total)}
              </div>
            </div>

            <div className="rounded-xl bg-ivory-200/60 p-3">
              <div className="text-[10.5px] uppercase tracking-wider text-ink/55 font-semibold">
                Submitted reference
              </div>
              <div className="mt-1 text-[14px] font-semibold text-burgundy break-all">
                {reference || "Not submitted"}
              </div>
              {order.manual_payment_reference_submitted_at && (
                <div className="mt-1 text-[10.5px] text-ink/50">
                  {formatDate(order.manual_payment_reference_submitted_at)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-[210px] shrink-0">
          {paid ? (
            <div className="rounded-xl bg-emerald-50 text-emerald-800 px-4 py-3 text-[12.5px] font-semibold flex items-center gap-2">
              <BadgeCheck className="w-4 h-4" />
              Payment confirmed
            </div>
          ) : manual && reference ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirming}
              className="cta-btn w-full inline-flex items-center justify-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-3 text-[13px] font-semibold hover:bg-burgundy-light disabled:opacity-60"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirming…
                </>
              ) : (
                <>
                  <BadgeCheck className="w-4 h-4" />
                  Confirm paid
                </>
              )}
            </button>
          ) : manual ? (
            <div className="rounded-xl bg-amber-50 text-amber-800 px-4 py-3 text-[12px] leading-relaxed">
              Waiting for a customer payment reference.
            </div>
          ) : (
            <div className="rounded-xl bg-ivory-200/60 text-ink/60 px-4 py-3 text-[12px] leading-relaxed">
              Card payment status is managed by Stripe.
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

const Info = ({ label, value }) => (
  <div className="min-w-0">
    <div className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold">
      {label}
    </div>
    <div className="mt-0.5 text-ink/80 truncate" title={String(value)}>
      {value}
    </div>
  </div>
);

export default AdminPayments;
