'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Plus, Minus, ShoppingCart, Clock } from 'lucide-react';
import { useCart } from '@/components/employee/cart-context';
import { useToast } from '@/components/ui/toaster';
import { formatCurrency, cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { UtensilsCrossed } from 'lucide-react';

interface MenuItemView {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  preparationTime: number;
  available: number | boolean;
}

export function MenuBrowser({
  cafeteriaId,
  cafeteriaName,
  cafeteriaOpen,
  items,
}: {
  cafeteriaId: string;
  cafeteriaName: string;
  cafeteriaOpen: boolean;
  items: MenuItemView[];
}) {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('All');
  const cart = useCart();
  const { toast } = useToast();

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];

  const filtered = items.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function handleAdd(item: MenuItemView) {
    const result = cart.addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      cafeteriaId,
      cafeteriaName,
      image: null,
    });
    if (!result.ok) {
      toast({ kind: 'error', title: "Can't add item", description: result.message });
      return;
    }
    toast({ kind: 'success', title: `Added ${item.name} to cart` });
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search food..."
            className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9 pr-3.5 text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-900/20"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium',
                category === c
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-line bg-white text-ink-500 hover:border-ink-300'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {!cafeteriaOpen && (
        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          This cafeteria is currently closed. You can browse the menu, but ordering is disabled until it reopens.
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No dishes match your search"
          description="Try a different search term or category."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isAvailable = !!item.available && cafeteriaOpen;
            const cartLine = cart.lines.find((l) => l.menuItemId === item.id);
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-card"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-ink-900">{item.name}</p>
                    {!item.available && (
                      <span className="shrink-0 rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-medium text-ink-400">
                        Sold out
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-xs text-ink-400 line-clamp-2">{item.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-ink-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {item.preparationTime} min
                    </span>
                    <span>{item.category}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display text-lg text-ink-900">{formatCurrency(item.price)}</span>
                  {!isAvailable ? (
                    <button
                      disabled
                      className="rounded-lg bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-300"
                    >
                      Unavailable
                    </button>
                  ) : cartLine ? (
                    <div className="flex items-center gap-2 rounded-lg border border-line px-1.5 py-1">
                      <button
                        onClick={() => cart.updateQuantity(item.id, cartLine.quantity - 1)}
                        aria-label={`Remove one ${item.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-ink-500 hover:bg-ink-50"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-4 text-center text-sm font-medium">{cartLine.quantity}</span>
                      <button
                        onClick={() => handleAdd(item)}
                        aria-label={`Add one more ${item.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-ink-500 hover:bg-ink-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAdd(item)}
                      className="flex items-center gap-1 rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-ink-700"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cart.count > 0 && (
        <div className="fixed inset-x-4 bottom-20 z-20 sm:inset-x-auto sm:bottom-6 sm:right-6 md:left-72 md:right-6">
          <Link
            href="/employee/cart"
            className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-ink-900 px-5 py-3.5 text-white shadow-pop"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="h-4 w-4" />
              {cart.count} item{cart.count > 1 ? 's' : ''}
            </span>
            <span className="text-sm font-semibold">{formatCurrency(cart.total)} · View cart</span>
          </Link>
        </div>
      )}
    </div>
  );
}
