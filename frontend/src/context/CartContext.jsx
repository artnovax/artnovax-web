import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'artnovax_cart_v1';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const parsePrice = (p) => {
    const n = Number(String(p).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const add = (product) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.name);
      if (found) return prev.map((i) => i.id === product.name ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.name, name: product.name, price: product.price, priceNum: parsePrice(product.price), img: product.img, qty: 1 }];
    });
    setOpen(true);
  };
  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const setQty = (id, qty) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, qty) } : i));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.priceNum * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, subtotal, open, setOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
