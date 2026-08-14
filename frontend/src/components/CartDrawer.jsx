import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

const formatKES = (n) => `KES ${n.toLocaleString()}`;

const CartDrawer = () => {
  const { open, setOpen, items, subtotal, setQty, remove } = useCart();
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-ink/40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full sm:w-[420px] bg-ivory shadow-2xl transform transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ivory-300">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-burgundy" />
            <h3 className="font-serif-display text-burgundy text-[20px] font-semibold">Your bag</h3>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close cart" className="w-9 h-9 rounded-full hover:bg-ivory-200 flex items-center justify-center">
            <X className="w-5 h-5 text-ink" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-ivory-200 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-burgundy" />
              </div>
              <div className="mt-4 font-serif-display text-ink text-[18px]">Your bag is empty</div>
              <p className="mt-1 text-ink/70 text-[13.5px]">Every purchase helps fund our programs.</p>
              <a href="/shop" onClick={() => setOpen(false)} className="cta-btn mt-5 inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light">Continue shopping <ArrowRight className="w-4 h-4" /></a>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.id} className="flex gap-3 items-start">
                  <div className="w-16 h-16 rounded-lg overflow-hidden ring-1 ring-ivory-300 shrink-0">
                    <img src={i.img} alt={i.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold text-ink">{i.name}</div>
                    <div className="text-[12.5px] text-ink/60">{formatKES(i.priceNum)}</div>
                    <div className="mt-2 inline-flex items-center gap-1 ring-1 ring-ivory-300 rounded-full">
                      <button aria-label="Decrease" onClick={() => setQty(i.id, i.qty - 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-ivory-200"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="px-2 text-[13px] min-w-[20px] text-center">{i.qty}</span>
                      <button aria-label="Increase" onClick={() => setQty(i.id, i.qty + 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-ivory-200"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold text-burgundy">{formatKES(i.priceNum * i.qty)}</div>
                    <button onClick={() => remove(i.id)} aria-label="Remove" className="mt-2 text-ink/60 hover:text-burgundy inline-flex items-center gap-1 text-[12px]"><Trash2 className="w-3.5 h-3.5" />Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-ivory-300 bg-ivory-100">
            <div className="flex items-center justify-between">
              <div className="text-ink/70 text-[13px]">Subtotal</div>
              <div className="font-serif-display text-burgundy text-[20px] font-semibold">{formatKES(subtotal)}</div>
            </div>
            <div className="text-ink/60 text-[11.5px] mt-1">Taxes and shipping calculated at checkout.</div>
            <a href="/checkout" onClick={() => setOpen(false)} className="cta-btn mt-4 flex justify-center items-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-3.5 text-[14.5px] font-semibold hover:bg-burgundy-light">Checkout <ArrowRight className="w-4 h-4" /></a>
            <a href="/cart" onClick={() => setOpen(false)} className="mt-2 block text-center text-burgundy text-[13px] font-semibold hover:underline">View full cart</a>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
