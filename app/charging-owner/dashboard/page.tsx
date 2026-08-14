import Link from 'next/link';
import { Building2, Zap, CalendarClock, IndianRupee, ArrowRight, BatteryCharging } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { listStations, listReservations } from '@/lib/repo/charging';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ChargingOwnerDashboard() {
  const session = await getSession();
  const stations = listStations({ ownerId: session!.sub });
  const chargers = stations.flatMap((s) => s.chargers);
  const reservations = listReservations({ ownerId: session!.sub });

  const today = new Date().toISOString().slice(0, 10);
  const todayReservations = reservations.filter((r) => r.date === today);
  const todayRevenue = todayReservations
    .filter((r) => r.status !== 'CANCELLED')
    .reduce((sum, r) => sum + r.amount, 0);

  const available = chargers.filter((c) => c.status === 'AVAILABLE').length;
  const occupied = chargers.filter((c) => c.status === 'OCCUPIED').length;
  const reserved = chargers.filter((c) => c.status === 'RESERVED').length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink-900 sm:text-[28px]">Charging Operations</h1>
        <p className="mt-1 text-sm text-ink-400">Live status across all your stations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total stations" value={stations.length} icon={Building2} />
        <StatCard label="Total chargers" value={chargers.length} icon={Zap} />
        <StatCard label="Today's reservations" value={todayReservations.length} icon={CalendarClock} tone="teal" />
        <StatCard label="Today's revenue" value={formatCurrency(todayRevenue)} icon={IndianRupee} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink-900">Today's reservations</h2>
            <Link href="/charging-owner/reservations" className="flex items-center gap-1 text-sm text-ink-400 hover:text-ink-700">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {todayReservations.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No reservations today" />
          ) : (
            <div className="space-y-3">
              {todayReservations.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-500">
                      <BatteryCharging className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-ink-900">{r.chargerName} · {r.userName}</p>
                      <p className="text-sm text-ink-400">{r.startTime}–{r.endTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={r.status} />
                    <p className="mt-1 text-sm font-semibold text-ink-900">{formatCurrency(r.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <p className="font-medium text-ink-900">Charger status</p>
          <div className="mt-4 space-y-3">
            <StatusRow label="Available" value={available} tone="bg-teal-400" />
            <StatusRow label="Occupied" value={occupied} tone="bg-amber-400" />
            <StatusRow label="Reserved" value={reserved} tone="bg-sky-400" />
            <StatusRow label="Offline" value={chargers.length - available - occupied - reserved} tone="bg-ink-300" />
          </div>
          <Link
            href="/charging-owner/chargers"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-50"
          >
            Manage chargers <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function StatusRow({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-ink-500">
        <span className={`h-2 w-2 rounded-full ${tone}`} /> {label}
      </span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  );
}
