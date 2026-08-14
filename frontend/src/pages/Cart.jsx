import React from 'react';
import { ArrowRight, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';

const formatKES = (n) => `KES ${n.toLocaleString()}`;

const Cart = () => {
  const { items, subtotal, setQty, remove, clear } = useCart();
  return (
    <div className="min-h-screen bg-ivory">
      <Header activePath="/cart" />
      <section className="mx-auto max-w-[1180px] px-4 md:px-8 py-10 md:py-14">
        <div className="flex items-end justify-between border-b border-ivory-300 pb-4">
          <h1 className="font-serif-display text-burgundy text-[34px] md:text-[42px] font-semibold">Your Bag</h1>
          {items.length > 0 && <button onClick={clear} className="text-burgundy text-[13px] font-semibold hover:underline">Clear cart</button>}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-20 h-20 rounded-full bg-ivory-200 flex items-center justify-center">
              <ShoppingBag className="w-9 h-9 text-burgundy" />
            </div>
            <div className="mt-5 font-serif-display text-ink text-[22px]">Your bag is empty</div>
            <p className="mt-2 text-ink/70 max-w-[420px] mx-auto">Explore our collection—every purchase supports ArtNovaX programs.</p>
            <a href="/shop" className="cta-btn mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-6 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light">Shop the Collection <ArrowRight className="w-4 h-4" /></a>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-8">
            <ul className="divide-y divide-ivory-300">
              {items.map((i) => (
                <li key={i.id} className="py-5 flex gap-4 items-start">
                  <div className="w-24 h-24 rounded-xl overflow-hidden ring-1 ring-ivory-300 shrink-0">
                    <img src={i.img} alt={i.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold text-ink">{i.name}</div>
                    <div className="text-[13px] text-ink/60 mt-0.5">{formatKES(i.priceNum)}</div>
                    <div className="mt-3 inline-flex items-center ring-1 ring-ivory-300 rounded-full">
                      <button onClick={() => setQty(i.id, i.qty - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-ivory-200 rounded-full"><Minus className="w-4 h-4" /></button>
                      <span className="px-3 min-w-[24px] text-center text-[14px]">{i.qty}</span>
                      <button onClick={() => setQty(i.id, i.qty + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-ivory-200 rounded-full"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[16px] font-semibold text-burgundy">{formatKES(i.priceNum * i.qty)}</div>
                    <button onClick={() => remove(i.id)} className="mt-2 text-ink/60 hover:text-burgundy inline-flex items-center gap-1 text-[13px]"><Trash2 className="w-4 h-4" />Remove</button>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="h-fit rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-6">
              <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">Order Summary</h3>
              <dl className="mt-4 space-y-2 text-[14px]">
                <div className="flex justify-between"><dt className="text-ink/70">Subtotal</dt><dd className="text-ink font-semibold">{formatKES(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink/70">Shipping</dt><dd className="text-ink font-semibold">Calculated at checkout</dd></div>
              </dl>
              <div className="my-4 border-t border-ivory-300" />
              <div className="flex justify-between text-[16px]"><span className="text-ink font-semibold">Total</span><span className="text-burgundy font-serif-display text-[22px] font-semibold">{formatKES(subtotal)}</span></div>
              <a href="/checkout" className="cta-btn mt-5 flex justify-center items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light">Proceed to Checkout <ArrowRight className="w-4 h-4" /></a>
              <a href="/shop" className="mt-2 block text-center text-burgundy text-[13px] font-semibold hover:underline">Continue shopping</a>
            </aside>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Cart;
