'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, ChefHat, Sparkles, PackageCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toaster';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const STEPS = [
  { status: 'PLACED', label: 'Placed', icon: Clock },
  { status: 'ACCEPTED', label: 'Accepted', icon: CheckCircle2 },
  { status: 'PREPARING', label: 'Preparing', icon: ChefHat },
  { status: 'READY', label: 'Ready', icon: Sparkles },
  { status: 'COMPLETED', label: 'Collected', icon: PackageCheck },
];

interface OrderDetail {
  id: string;
  status: string;
  total: number;
  pickupTime: string;
  createdAt: string;
  cafeteriaName?: string;
  items: { id: string; name: string; quantity: number; price: number }[];
}

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? 'Order not found.');
        return;
      }
      setOrder(json.data.order);
    } catch {
      setError('Could not load this order.');
    }
  }, [id]);

  React.useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const json = await res.json();
      if (!json.success) {
        toast({ kind: 'error', title: "Couldn't cancel order", description: json.message });
        return;
      }
      setOrder(json.data.order);
      toast({ kind: 'success', title: 'Order cancelled' });
    } finally {
      setCancelling(false);
      setCancelOpen(false);
    }
  }

  if (error) {
    return (
      <div>
        <BackLink />
        <p className="mt-4 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <BackLink />
        <div className="mt-4">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === 'CANCELLED';
  const canCancel = ['PLACED', 'ACCEPTED'].includes(order.status);

  return (
    <div className="mx-auto max-w-xl">
      <BackLink />
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className={`h-1.5 ${isCancelled ? 'bg-red-400' : 'bg-amber-400'}`} />
        <div className="p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
            {order.cafeteriaName} · Order #{order.id.slice(-6).toUpperCase()}
          </p>
          {isCancelled ? (
            <div className="mt-3 flex items-center gap-2 text-red-500">
              <XCircle className="h-5 w-5" />
              <p className="font-display text-xl">Order cancelled</p>
            </div>
          ) : (
            <>
              <p className="mt-1 font-display text-xl text-ink-900">
                {STEPS[currentStepIndex]?.label === 'Ready'
                  ? 'Your food is ready. Skip the queue!'
                  : `${STEPS[currentStepIndex]?.label ?? order.status} your order`}
              </p>
              <p className="text-sm text-ink-400">Estimated pickup: {formatDateTime(order.pickupTime)}</p>

              <div className="mt-6 flex items-center">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const reached = i <= currentStepIndex;
                  return (
                    <React.Fragment key={step.status}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            reached ? 'bg-amber-400 text-ink-900' : 'bg-ink-50 text-ink-300'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={`text-[10px] font-medium ${reached ? 'text-ink-700' : 'text-ink-300'}`}>
                          {step.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`mx-1 h-0.5 flex-1 ${i < currentStepIndex ? 'bg-amber-400' : 'bg-ink-100'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-line px-6 py-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">Order summary</p>
          <div className="space-y-1.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-ink-600">{item.quantity}× {item.name}</span>
                <span className="text-ink-900">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm font-semibold">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        {canCancel && (
          <div className="border-t border-line p-4">
            <Button variant="danger" className="w-full" onClick={() => setCancelOpen(true)}>
              Cancel order
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel this order?"
        description="The cafeteria will be notified. This can't be undone."
        confirmLabel="Cancel order"
        danger
        loading={cancelling}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/employee/orders" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700">
      <ArrowLeft className="h-4 w-4" /> Back to orders
    </Link>
  );
}
