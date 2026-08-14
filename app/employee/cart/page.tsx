'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCart } from '@/components/employee/cart-context';
import { Button } from '@/components/ui/button';
import { Label, Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toaster';
import { formatCurrency } from '@/lib/utils';

function defaultPickupTime(): string {
  const d = new Date(Date.now() + 20 * 60 * 1000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CartPage() {
  const cart = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [pickupTime, setPickupTime] = React.useState(defaultPickupTime());
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handlePlaceOrder() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeteriaId: cart.lines[0].cafeteriaId,
          items: cart.lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
          pickupTime: new Date(pickupTime).toISOString(),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? 'Could not place your order.');
        return;
      }
      cart.clear();
      toast({ kind: 'success', title: 'Order placed!', description: 'Track its status from Orders.' });
      router.push(`/employee/orders/${json.data.order.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.lines.length === 0) {
    return (
      <div>
        <Link href="/employee/cafeteria" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700">
          <ArrowLeft className="h-4 w-4" /> Back to cafeteria
        </Link>
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the cafeteria menu and add a few items to get started."
          action={
            <Link href="/employee/cafeteria">
              <Button>Browse menu</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/employee/cafeteria" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" /> Back to cafeteria
      </Link>
      <h1 className="font-display text-2xl text-ink-900">Your cart</h1>
      <p className="mt-1 text-sm text-ink-400">Ordering from {cart.lines[0].cafeteriaName}</p>

      <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-white">
        {cart.lines.map((line) => (
          <div key={line.menuItemId} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink-900">{line.name}</p>
              <p className="text-sm text-ink-400">{formatCurrency(line.price)} each</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-line px-1.5 py-1">
              <button
                onClick={() => cart.updateQuantity(line.menuItemId, line.quantity - 1)}
                aria-label={`Decrease ${line.name} quantity`}
                className="flex h-6 w-6 items-center justify-center rounded-md text-ink-500 hover:bg-ink-50"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-4 text-center text-sm font-medium">{line.quantity}</span>
              <button
                onClick={() => cart.updateQuantity(line.menuItemId, line.quantity + 1)}
                aria-label={`Increase ${line.name} quantity`}
                className="flex h-6 w-6 items-center justify-center rounded-md text-ink-500 hover:bg-ink-50"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="w-16 shrink-0 text-right text-sm font-semibold text-ink-900">
              {formatCurrency(line.price * line.quantity)}
            </span>
            <button
              onClick={() => cart.removeItem(line.menuItemId)}
              aria-label={`Remove ${line.name} from cart`}
              className="text-ink-300 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex items-center justify-between p-4">
          <span className="font-medium text-ink-900">Total</span>
          <span className="font-display text-xl text-ink-900">{formatCurrency(cart.total)}</span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-white p-4">
        <Label htmlFor="pickup">Pickup time</Label>
        <Input
          id="pickup"
          type="datetime-local"
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-ink-400">Choose a time within the next 6 hours.</p>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <Button className="mt-5 w-full" size="lg" onClick={handlePlaceOrder} loading={submitting}>
        Place order · {formatCurrency(cart.total)}
      </Button>
    </div>
  );
}
