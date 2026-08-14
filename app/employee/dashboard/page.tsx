import Link from 'next/link';
import {
  UtensilsCrossed,
  Zap,
  ClipboardList,
  Vote,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { listCafeterias } from '@/lib/repo/cafeterias';
import { listOrders } from '@/lib/repo/orders';
import { listStations } from '@/lib/repo/charging';
import { listPolls } from '@/lib/repo/polls';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EmployeeDashboardPage() {
  const session = await getSession();
  const cafeterias = listCafeterias();
  const myOrders = listOrders({ customerId: session!.sub });
  const activeOrders = myOrders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status));
  const stations = listStations({});
  const availableChargers = stations.flatMap((s) => s.chargers).filter((c) => c.status === 'AVAILABLE');
  const activePolls = listPolls({ activeOnly: true, userId: session!.sub });

  const firstName = session!.name.split(' ')[0];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink-900 sm:text-[28px]">
          Good to see you, {firstName}.
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          Here's what's happening across your campus today.
        </p>
      </div>

      {/* Cafeteria status strip */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {cafeterias.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-ink-900">{c.name}</p>
                <p className="text-xs text-ink-400">{c.menuItemCount} items on the menu</p>
              </div>
            </div>
            <StatusBadge status={c.status} />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Active orders */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg text-ink-900">Your active orders</h2>
              <Link href="/employee/orders" className="flex items-center gap-1 text-sm text-ink-400 hover:text-ink-700">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {activeOrders.length === 0 ? (
              <EmptyStrip
                icon={ClipboardList}
                text="No active orders. Browse the cafeteria to place one."
                href="/employee/cafeteria"
                cta="Browse menu"
              />
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/employee/orders/${order.id}`}
                    className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-card hover:shadow-pop"
                  >
                    <div>
                      <p className="font-medium text-ink-900">{order.cafeteriaName} · #{order.id.slice(-6).toUpperCase()}</p>
                      <p className="text-sm text-ink-400">
                        Pickup {formatDateTime(order.pickupTime)} · {formatCurrency(order.total)}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Active polls */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg text-ink-900">Active food polls</h2>
              <Link href="/employee/polls" className="flex items-center gap-1 text-sm text-ink-400 hover:text-ink-700">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {activePolls.length === 0 ? (
              <EmptyStrip icon={Vote} text="No open polls right now." href="/employee/polls" cta="View polls" />
            ) : (
              <div className="space-y-3">
                {activePolls.slice(0, 2).map((poll) => (
                  <Link
                    key={poll.id}
                    href="/employee/polls"
                    className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-card hover:shadow-pop"
                  >
                    <div>
                      <p className="font-medium text-ink-900">{poll.title}</p>
                      <p className="text-sm text-ink-400">{poll.cafeteriaName} · {poll.totalVotes} votes so far</p>
                    </div>
                    {poll.myVoteOptionId ? (
                      <StatusBadge status="ACCEPTED" />
                    ) : (
                      <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-medium text-ink-900">Vote now</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {/* EV charging availability */}
          <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-500">
                <Zap className="h-4 w-4" />
              </div>
              <p className="font-medium text-ink-900">EV Charging</p>
            </div>
            <p className="mt-3 font-display text-3xl text-ink-900">{availableChargers.length}</p>
            <p className="text-sm text-ink-400">chargers available right now</p>
            <Link
              href="/employee/charging"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-50"
            >
              Reserve a slot <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>

          {/* Quick tip */}
          <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <div className="flex items-center gap-2 text-amber-600">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-medium">Tip</p>
            </div>
            <p className="mt-2 text-sm text-amber-700">
              Order before you leave your desk. Pick a pickup time and we'll notify you the moment
              it's ready.
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-400" />
              <p className="font-medium text-ink-900">Recent order history</p>
            </div>
            <div className="mt-3 space-y-2">
              {myOrders.slice(0, 3).map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-ink-500">{o.cafeteriaName}</span>
                  <StatusBadge status={o.status} />
                </div>
              ))}
              {myOrders.length === 0 && <p className="text-sm text-ink-300">No orders yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function EmptyStrip({
  icon: Icon,
  text,
  href,
  cta,
}: {
  icon: React.ElementType;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-dashed border-ink-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-ink-300" />
        <p className="text-sm text-ink-400">{text}</p>
      </div>
      <Link href={href} className="shrink-0 text-sm font-medium text-ink-900 hover:underline">
        {cta}
      </Link>
    </div>
  );
}
