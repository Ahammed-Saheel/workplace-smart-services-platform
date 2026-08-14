'use client';

import * as React from 'react';
import { CalendarClock } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs } from '@/components/ui/tabs';
import { SkeletonCard } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  status: string;
  chargerName: string;
  userName: string;
  userEmail: string;
}

const TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function ChargingReservationsPage() {
  const [reservations, setReservations] = React.useState<Reservation[] | null>(null);
  const [tab, setTab] = React.useState('ALL');

  React.useEffect(() => {
    fetch('/api/reservations', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => json.success && setReservations(json.data.reservations));
  }, []);

  const filtered = reservations?.filter((r) => tab === 'ALL' || r.status === tab) ?? [];
  const counts = TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.value] = t.value === 'ALL' ? reservations?.length ?? 0 : reservations?.filter((r) => r.status === t.value).length ?? 0;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Reservations" description="All charging reservations across your stations." />

      <div className="mb-5">
        <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))} value={tab} onChange={setTab} />
      </div>

      {reservations === null ? (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No reservations here" />
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
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{r.userName}</p>
                    <p className="text-xs text-ink-400">{r.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{r.chargerName}</td>
                  <td className="px-4 py-3 text-ink-600">{r.date}</td>
                  <td className="px-4 py-3 text-ink-600">{r.startTime}–{r.endTime}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{formatCurrency(r.amount)}</td>
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
