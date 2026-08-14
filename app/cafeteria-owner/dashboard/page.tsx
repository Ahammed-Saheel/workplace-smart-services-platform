import Link from 'next/link';
import {
  ClipboardList,
  IndianRupee,
  Clock,
  ChefHat,
  Sparkles,
  PackageCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { findCafeteriaByOwnerId } from '@/lib/repo/cafeterias';
import { ordersForCafeteriaToday, popularMenuItems } from '@/lib/repo/orders';
import { listMenuItems } from '@/lib/repo/menu-items';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CafeteriaOwnerDashboard() {
  const session = await getSession();
  const cafeteria = findCafeteriaByOwnerId(session!.sub);

  if (!cafeteria) {
    return (
      <EmptyState
        icon={ChefHat}
        title="No cafeteria assigned"
        description="Contact your platform admin to get a cafeteria assigned to your account."
      />
    );
  }

  const todayOrders = ordersForCafeteriaToday(cafeteria.id);
  const revenue = todayOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);
  const pending = todayOrders.filter((o) => o.status === 'PLACED').length;
  const preparing = todayOrders.filter((o) => ['ACCEPTED', 'PREPARING'].includes(o.status)).length;
  const ready = todayOrders.filter((o) => o.status === 'READY').length;
  const completed = todayOrders.filter((o) => o.status === 'COMPLETED').length;

  const popular = popularMenuItems(cafeteria.id, 5);
  const unavailableItems = listMenuItems({ cafeteriaId: cafeteria.id }).filter((i) => !i.available);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-900 sm:text-[28px]">{cafeteria.name}</h1>
          <p className="mt-1 text-sm text-ink-400">Today's operational overview.</p>
        </div>
        <StatusBadge status={cafeteria.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Today's revenue" value={formatCurrency(revenue)} icon={IndianRupee} tone="amber" />
        <StatCard label="Pending" value={pending} icon={Clock} />
        <StatCard label="Preparing" value={preparing} icon={ChefHat} />
        <StatCard label="Ready" value={ready} icon={Sparkles} tone="teal" />
        <StatCard label="Completed" value={completed} icon={PackageCheck} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink-900">Recent orders today</h2>
            <Link href="/cafeteria-owner/orders" className="flex items-center gap-1 text-sm text-ink-400 hover:text-ink-700">
              Manage orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {todayOrders.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No orders yet today" />
          ) : (
            <div className="space-y-3">
              {todayOrders.slice(0, 6).map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-card">
                  <div>
                    <p className="font-medium text-ink-900">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-ink-400">
                      {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </p>
                    <p className="text-xs text-ink-300">Ordered {formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="mt-1 text-sm font-semibold text-ink-900">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-ink-400" />
              <p className="font-medium text-ink-900">Popular items</p>
            </div>
            {popular.length === 0 ? (
              <p className="mt-3 text-sm text-ink-300">No orders yet.</p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {popular.map((p) => (
                  <div key={p.menuItemId} className="flex items-center justify-between text-sm">
                    <span className="truncate text-ink-600">{p.name}</span>
                    <span className="shrink-0 font-medium text-ink-900">{p.totalQty} sold</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {unavailableItems.length > 0 && (
            <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <p className="font-medium text-ink-900">Unavailable items</p>
              <div className="mt-3 space-y-2">
                {unavailableItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink-600">{item.name}</span>
                    <span className="text-xs text-ink-300">Sold out</span>
                  </div>
                ))}
              </div>
              <Link
                href="/cafeteria-owner/menu"
                className="mt-3 flex items-center gap-1 text-sm font-medium text-ink-900 hover:underline"
              >
                Update menu <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
