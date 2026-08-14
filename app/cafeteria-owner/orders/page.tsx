'use client';

import * as React from 'react';
import { ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toaster';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { nextOrderStatuses, ORDER_STATUS_LABEL } from '@/lib/business/orders';
import type { OrderStatus } from '@/types/db';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}
interface OrderRow {
  id: string;
  status: OrderStatus;
  total: number;
  pickupTime: string;
  createdAt: string;
  customerName?: string;
  items: OrderItem[];
}

const TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'Placed', value: 'PLACED' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function CafeteriaOrdersPage() {
  const [orders, setOrders] = React.useState<OrderRow[] | null>(null);
  const [tab, setTab] = React.useState('ALL');
  const [updating, setUpdating] = React.useState<string | null>(null);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    const res = await fetch('/api/orders', { cache: 'no-store' });
    const json = await res.json();
    if (json.success) setOrders(json.data.orders);
  }, []);

  React.useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  async function updateStatus(id: string, status: OrderStatus) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) {
        toast({ kind: 'error', title: "Couldn't update order", description: json.message });
        return;
      }
      toast({ kind: 'success', title: `Order marked ${ORDER_STATUS_LABEL[status]}` });
      load();
    } finally {
      setUpdating(null);
    }
  }

  const filtered = orders?.filter((o) => tab === 'ALL' || o.status === tab) ?? [];
  const counts = TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.value] = t.value === 'ALL' ? orders?.length ?? 0 : orders?.filter((o) => o.status === t.value).length ?? 0;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Orders" description="Accept, prepare, and hand off orders as they come in." />

      <div className="mb-5">
        <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))} value={tab} onChange={setTab} />
      </div>

      {orders === null ? (
        <div className="space-y-3">
          <SkeletonCard /><SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders here" description="Orders matching this filter will show up here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const nextSteps = nextOrderStatuses(order.status).filter((s) => s !== 'CANCELLED');
            const canCancel = nextOrderStatuses(order.status).includes('CANCELLED');
            return (
              <div key={order.id} className="rounded-2xl border border-line bg-white p-4 shadow-card sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink-900">#{order.id.slice(-6).toUpperCase()}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm text-ink-500">{order.customerName}</p>
                  <p className="text-sm text-ink-400">
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </p>
                  <p className="mt-1 text-xs text-ink-300">
                    Pickup {formatDateTime(order.pickupTime)} · Ordered {formatDateTime(order.createdAt)} · {formatCurrency(order.total)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
                  {nextSteps.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={status === 'READY' ? 'secondary' : 'outline'}
                      loading={updating === order.id}
                      onClick={() => updateStatus(order.id, status)}
                    >
                      Mark {ORDER_STATUS_LABEL[status]}
                    </Button>
                  ))}
                  {canCancel && (
                    <Button size="sm" variant="danger" loading={updating === order.id} onClick={() => updateStatus(order.id, 'CANCELLED')}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
