import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ShoppingCart } from "lucide-react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useToast } from "../hooks/use-toast";
import { getProduct } from "../services/content";

const formatKES = (value) => `KES ${Number(value || 0).toLocaleString()}`;

const ProductDetail = () => {
  const { id } = useParams();
  const { add } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const nextProduct = await getProduct(id);
        if (!cancelled) {
          setProduct(nextProduct);
          const primaryIndex = (nextProduct.images || []).findIndex((image) => image.isPrimary);
          setSelectedIndex(primaryIndex >= 0 ? primaryIndex : 0);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const gallery = useMemo(() => {
    if (product?.images?.length) return product.images;
    if (product?.img) {
      return [{
        publicUrl: product.img,
        altText: product.imgAlt || product.name,
        isPrimary: true,
        order: 0,
      }];
    }
    return [];
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/shop" />
        <div className="mx-auto max-w-[1180px] px-4 md:px-8 py-24 text-center text-ink/60">
          Loading product…
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header activePath="/shop" />
        <section className="mx-auto max-w-[720px] px-6 py-24 text-center">
          <h1 className="font-serif-display text-burgundy text-[32px] font-semibold">Product not found</h1>
          <p className="mt-3 text-ink/70">This product is unavailable or no longer active.</p>
          <a href="/shop" className="cta-btn mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3 text-[14px] font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to shop
          </a>
        </section>
        <Footer />
      </div>
    );
  }

  const selectedImage = gallery[selectedIndex] || gallery[0];

  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/shop" />
      <main className="mx-auto max-w-[1180px] px-4 md:px-8 pt-8 md:pt-12 pb-16 md:pb-24">
        <a href="/shop" className="inline-flex items-center gap-1 text-burgundy text-[13.5px] font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to shop
        </a>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-8 lg:gap-14 items-start">
          <div>
            <div className="rounded-3xl overflow-hidden aspect-square bg-ivory-200 ring-1 ring-ivory-300">
              {selectedImage ? (
                <img
                  src={selectedImage.publicUrl}
                  alt={selectedImage.altText || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink/45 text-[13px]">No product image</div>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="mt-4 grid grid-cols-5 sm:grid-cols-6 gap-3">
                {gallery.map((image, index) => (
                  <button
                    key={image.mediaAssetId || image.publicUrl}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    aria-label={`View product image ${index + 1}`}
                    className={`aspect-square rounded-xl overflow-hidden bg-ivory-200 ${selectedIndex === index ? "ring-2 ring-burgundy" : "ring-1 ring-ivory-300 hover:ring-burgundy/50"}`}
                  >
                    <img src={image.publicUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <section className="lg:sticky lg:top-24">
            <div className="text-burgundy tracking-[0.22em] text-[11px] font-semibold uppercase">
              {product.category}
            </div>
            <h1 className="mt-3 font-serif-display text-burgundy text-[38px] md:text-[48px] leading-[1.05] font-semibold">
              {product.name}
            </h1>
            <div className="mt-4 text-ink text-[20px] font-semibold">{formatKES(product.price)}</div>
            {product.description && (
              <p className="mt-6 text-ink/80 text-[15.5px] leading-[1.75] whitespace-pre-wrap">
                {product.description}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                add({ ...product, price: formatKES(product.price) });
                toast({
                  title: "Added to bag",
                  description: `${product.name} — ${formatKES(product.price)}`,
                });
              }}
              className="cta-btn mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light"
            >
              <ShoppingCart className="w-4 h-4" /> Add to bag
            </button>

            <div className="mt-6 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-4 space-y-2 text-ink/70 text-[12.5px]">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-burgundy" /> Every purchase supports ArtNovaX programs.</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-burgundy" /> Secure checkout and order confirmation.</div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
