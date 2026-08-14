import Link from 'next/link';
import { Zap, BatteryCharging } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { listStations } from '@/lib/repo/charging';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function EmployeeChargingPage() {
  const stations = listStations({}).filter((s) => s.status === 'ACTIVE');

  return (
    <div>
      <PageHeader
        title="EV Charging"
        description="Reserve a charging slot in advance and skip waiting for one to free up."
      />

      {stations.length === 0 ? (
        <EmptyState icon={Zap} title="No charging stations available" />
      ) : (
        <div className="space-y-6">
          {stations.map((station) => (
            <div key={station.id}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="font-display text-lg text-ink-900">{station.name}</h2>
                <span className="text-sm text-ink-400">· {station.location}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {station.chargers.map((charger) => {
                  const bookable = charger.status === 'AVAILABLE' || charger.status === 'RESERVED';
                  const card = (
                    <div
                      className={cn(
                        'flex h-full flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-card transition-shadow',
                        bookable && 'hover:shadow-pop'
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-500">
                            <BatteryCharging className="h-4 w-4" />
                          </div>
                          <StatusBadge status={charger.status} />
                        </div>
                        <p className="mt-3 font-medium text-ink-900">{charger.name}</p>
                        <p className="text-sm text-ink-400">{charger.connectorType} · {charger.power} kW</p>
                        <p className="mt-1 text-xs text-ink-300">
                          Open {charger.operatingHoursStart}–{charger.operatingHoursEnd}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-display text-lg text-ink-900">{formatCurrency(charger.price)}</span>
                        <span className="text-xs text-ink-400">per reservation</span>
                      </div>
                    </div>
                  );
                  return bookable ? (
                    <Link key={charger.id} href={`/employee/charging/${charger.id}`}>
                      {card}
                    </Link>
                  ) : (
                    <div key={charger.id} className="opacity-60">
                      {card}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
