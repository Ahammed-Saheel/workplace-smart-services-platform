'use client';

import * as React from 'react';
import type { CartLine } from '@/types';

interface CartContextValue {
  lines: CartLine[];
  addItem: (line: Omit<CartLine, 'quantity'>, quantity?: number) => { ok: boolean; message?: string };
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = React.createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'wsc_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt cart data
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = React.useCallback(
    (line: Omit<CartLine, 'quantity'>, quantity = 1): { ok: boolean; message?: string } => {
      let result = { ok: true as boolean, message: undefined as string | undefined };
      setLines((prev) => {
        if (prev.length > 0 && prev[0].cafeteriaId !== line.cafeteriaId) {
          result = {
            ok: false,
            message: `Your cart has items from ${prev[0].cafeteriaName}. Clear it first to order from ${line.cafeteriaName}.`,
          };
          return prev;
        }
        const existing = prev.find((l) => l.menuItemId === line.menuItemId);
        if (existing) {
          return prev.map((l) =>
            l.menuItemId === line.menuItemId ? { ...l, quantity: l.quantity + quantity } : l
          );
        }
        return [...prev, { ...line, quantity }];
      });
      return result;
    },
    []
  );

  const updateQuantity = React.useCallback((menuItemId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.menuItemId !== menuItemId);
      return prev.map((l) => (l.menuItemId === menuItemId ? { ...l, quantity } : l));
    });
  }, []);

  const removeItem = React.useCallback((menuItemId: string) => {
    setLines((prev) => prev.filter((l) => l.menuItemId !== menuItemId));
  }, []);

  const clear = React.useCallback(() => setLines([]), []);

  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider value={{ lines, addItem, updateQuantity, removeItem, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
