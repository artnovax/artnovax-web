import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "artnovax_cart_v1";

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore localStorage write failures */
    }
  }, [items]);

  const parsePrice = (price) => {
    const value = Number(String(price).replace(/[^0-9.]/g, ""));
    return Number.isNaN(value) ? 0 : value;
  };

  const add = (product) => {
    const productKey = product.id || product.name;

    setItems((previous) => {
      const found = previous.find(
        (item) =>
          (product.id && item.productId === product.id) ||
          item.name === product.name,
      );

      if (found) {
        return previous.map((item) =>
          item.id === found.id
            ? {
                ...item,
                id: productKey,
                productId: product.id || item.productId || null,
                qty: item.qty + 1,
              }
            : item,
        );
      }

      return [
        ...previous,
        {
          id: productKey,
          productId: product.id || null,
          name: product.name,
          price: product.price,
          priceNum: parsePrice(product.price),
          img: product.img,
          qty: 1,
        },
      ];
    });

    setOpen(true);
  };

  const remove = (id) =>
    setItems((previous) => previous.filter((item) => item.id !== id));

  const setQty = (id, qty) =>
    setItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              qty: Math.max(1, qty),
            }
          : item,
      ),
    );

  const clear = () => setItems([]);

  const count = items.reduce((sum, item) => sum + item.qty, 0);

  const subtotal = items.reduce(
    (sum, item) => sum + item.priceNum * item.qty,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        add,
        remove,
        setQty,
        clear,
        count,
        subtotal,
        open,
        setOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
};
