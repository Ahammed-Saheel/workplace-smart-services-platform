import { Zap, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { StationStatusToggle } from '@/components/admin/status-toggle';
import { listStations } from '@/lib/repo/charging';

export const dynamic = 'force-dynamic';

export default function AdminChargingPage() {
  const stations = listStations({});

  return (
    <div>
      <PageHeader title="Charging" description="Every charging station and operator on the platform." />

      {stations.length === 0 ? (
        <EmptyState icon={Zap} title="No charging stations yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((s) => (
            <div key={s.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-500">
                  <Building2 className="h-5 w-5" />
                </div>
                <StatusBadge status={s.status} />
              </div>
              <p className="mt-3 font-medium text-ink-900">{s.name}</p>
              <p className="text-sm text-ink-400">{s.ownerName} · {s.ownerEmail}</p>
              <p className="mt-1 text-xs text-ink-300">{s.location} · {s.chargerCount} chargers</p>
              <div className="mt-3">
                <StationStatusToggle id={s.id} status={s.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
