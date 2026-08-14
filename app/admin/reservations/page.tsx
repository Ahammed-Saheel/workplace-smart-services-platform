import { CalendarClock } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { listReservations } from '@/lib/repo/charging';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function AdminReservationsPage() {
  const reservations = listReservations({});

  return (
    <div>
      <PageHeader title="Reservations" description="Every EV charging reservation across the platform." />
      {reservations.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No reservations yet" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-ink-50/50 text-left text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Charger</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-ink-900">{r.userName}</td>
                  <td className="px-4 py-3 text-ink-600">{r.chargerName} · {r.stationName}</td>
                  <td className="px-4 py-3 text-ink-600">{r.date}</td>
                  <td className="px-4 py-3 text-ink-600">{r.startTime}–{r.endTime}</td>
                  <td className="px-4 py-3 text-ink-900">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
