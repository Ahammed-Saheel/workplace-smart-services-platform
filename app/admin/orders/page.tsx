import { ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { listOrders } from '@/lib/repo/orders';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function AdminOrdersPage() {
  const orders = listOrders({});

  return (
    <div>
      <PageHeader title="Orders" description="Every order placed across all cafeterias." />
      {orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders yet" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-ink-50/50 text-left text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Cafeteria</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">#{o.id.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3 text-ink-600">{o.customerName}</td>
                  <td className="px-4 py-3 text-ink-600">{o.cafeteriaName}</td>
                  <td className="px-4 py-3 text-ink-900">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDateTime(o.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
