import React, { useEffect, useState } from "react";
import { ArrowRight, Heart, Sparkles, Gift, ShoppingCart } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BrushFrame from "../components/BrushFrame";
import { SHOP } from "../mock_pages2";
import { useToast } from "../hooks/use-toast";
import { useCart } from "../context/CartContext";
import { getProducts } from "../services/content";

const bulletIcon = (key) => {
  const cls = "w-6 h-6 text-burgundy";
  const map = { heart: Heart, sparkles: Sparkles, gift: Gift };
  const Icon = map[key];
  return Icon ? <Icon className={cls} strokeWidth={1.5} /> : null;
};

const formatKES = (n) => `KES ${Number(n).toLocaleString()}`;

const Shop = () => {
  const [category, setCategory] = useState("All Products");
  const { toast } = useToast();
  const { add } = useCart();
  const [productsAll, setProductsAll] = useState(SHOP.products);

  useEffect(() => {
    (async () => {
      try {
        const rows = await getProducts();
        if (rows.length) {
          setProductsAll(
            rows.map((p) => ({
              ...p,
              price: `KES ${Number(p.price).toLocaleString()}`,
            })),
          );
        }
      } catch {}
    })();
  }, []);

  const categories = [
    "All Products",
    ...Array.from(new Set(productsAll.map((p) => p.category))).filter(Boolean),
  ];
  const products =
    category === "All Products"
      ? productsAll
      : productsAll.filter((p) => p.category === category);

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/shop" />

      {/* Hero */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 pt-8 md:pt-14 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div className="order-2 lg:order-1">
          <div className="text-burgundy tracking-[0.28em] text-[12px] font-semibold fade-up">
            {SHOP.eyebrow}
          </div>
          <div className="fade-up delay-1 mt-4 flex items-start gap-3">
            <h1 className="font-serif-display text-burgundy text-[42px] sm:text-[52px] md:text-[58px] leading-[1.02] font-semibold whitespace-pre-line">
              {SHOP.title}
            </h1>
            <svg
              viewBox="0 0 64 64"
              className="w-16 h-16 shrink-0 mt-2"
              fill="none"
              stroke="#5C1519"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M14 46c8-14 20-24 34-24 8 0 12 8 8 14" />
              <path d="M32 46c-6-4-14-10-14-18 0-5 4-9 8-9 3 0 5 2 6 4 1-2 3-4 6-4 4 0 8 4 8 9 0 8-8 14-14 18z" />
            </svg>
          </div>
          <p className="fade-up delay-2 mt-6 text-[16px] md:text-[17px] leading-[1.7] text-ink/80 max-w-[520px]">
            {SHOP.body}
          </p>
          <a
            href={SHOP.cta.href}
            className="fade-up delay-3 mt-8 inline-flex items-center gap-3 rounded-full bg-burgundy text-ivory px-6 py-4 text-[15px] font-semibold hover:bg-burgundy-light shadow-[0_14px_30px_-14px_rgba(92,21,25,0.7)] cta-btn"
          >
            {SHOP.cta.label}
            <ArrowRight className="w-4 h-4" />
          </a>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SHOP.bullets.map((b) => (
              <div key={b.title} className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-burgundy/10 flex items-center justify-center shrink-0">
                  {bulletIcon(b.icon)}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-ink">
                    {b.title}
                  </div>
                  <div className="text-[12px] text-ink/70 leading-snug">
                    {b.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2 fade-up delay-2">
          <BrushFrame
            src={SHOP.image}
            alt={SHOP.imageAlt}
            aspect="aspect-[5/4]"
            objectPosition="center"
          />
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        className="mx-auto max-w-[1240px] px-4 md:px-8 pt-10 md:pt-14"
      >
        <div className="text-center">
          <h2 className="font-serif-display text-ink text-[26px] md:text-[32px] font-medium">
            {SHOP.collectionTitle}
          </h2>
          <div className="mx-auto mt-2 w-16 h-0.5 bg-burgundy/40" />
        </div>

        <div className="mt-8 flex items-center gap-2 flex-wrap justify-center">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-[13.5px] font-semibold transition-colors ${category === c ? "bg-burgundy text-ivory" : "text-ink/70 hover:text-burgundy ring-1 ring-ivory-300 bg-ivory-100"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {products.map((p) => (
            <article
              key={p.name}
              className="wwd-card rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 overflow-hidden"
            >
              <div className="aspect-square bg-ivory-200">
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="px-3 py-3 flex items-start justify-between gap-2">
                <div>
                  <div className="text-[13.5px] font-semibold text-ink">
                    {p.name}
                  </div>
                  <div className="text-[12.5px] text-ink/70">{p.price}</div>
                </div>
                <button
                  onClick={() => {
                    add(p);
                    toast({
                      title: "Added to bag",
                      description: `${p.name} — ${p.price}`,
                    });
                  }}
                  aria-label={`Add ${p.name} to cart`}
                  className="cta-btn shrink-0 w-9 h-9 rounded-full bg-burgundy/10 text-burgundy hover:bg-burgundy hover:text-ivory flex items-center justify-center"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Thanks */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-8 mt-12 md:mt-16 mb-16 md:mb-24">
        <div className="rounded-2xl bg-[#FADFC6]/60 ring-1 ring-ivory-300 p-5 md:p-6 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-5">
          <svg
            viewBox="0 0 64 64"
            className="w-14 h-14 shrink-0"
            fill="none"
            stroke="#5C1519"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M14 46c8-14 20-24 34-24 8 0 12 8 8 14" />
            <path d="M32 46c-6-4-14-10-14-18 0-5 4-9 8-9 3 0 5 2 6 4 1-2 3-4 6-4 4 0 8 4 8 9 0 8-8 14-14 18z" />
          </svg>
          <div>
            <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
              {SHOP.thanks.title}
            </h3>
            <p className="text-ink/80 text-[14px] mt-1">{SHOP.thanks.body}</p>
          </div>
          <a
            href={SHOP.thanks.cta.href}
            className="cta-btn inline-flex items-center gap-2 rounded-full border-2 border-burgundy text-burgundy px-6 py-3 text-[14px] font-semibold hover:bg-burgundy hover:text-ivory"
          >
            {SHOP.thanks.cta.label}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Shop;
