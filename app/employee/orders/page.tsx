import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getSession } from '@/lib/auth';
import { listOrders } from '@/lib/repo/orders';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EmployeeOrdersPage() {
  const session = await getSession();
  const orders = listOrders({ customerId: session!.sub });

  return (
    <div>
      <PageHeader title="Your orders" description="Track every order from placed to ready for pickup." />

      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="Head to the cafeteria to place your first order."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/employee/orders/${order.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4 shadow-card transition-shadow hover:shadow-pop sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-ink-900">
                  {order.cafeteriaName} · #{order.id.slice(-6).toUpperCase()}
                </p>
                <p className="mt-0.5 text-sm text-ink-400">
                  {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                </p>
                <p className="mt-1 text-xs text-ink-300">
                  Pickup {formatDateTime(order.pickupTime)} · Placed {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                <StatusBadge status={order.status} />
                <span className="font-display text-lg text-ink-900">{formatCurrency(order.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
