'use client';

import * as React from 'react';
import { CalendarClock, BatteryCharging } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toaster';
import { formatCurrency } from '@/lib/utils';

interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  status: string;
  chargerName: string;
  stationName: string;
  stationLocation: string;
}

export default function EmployeeReservationsPage() {
  const [reservations, setReservations] = React.useState<Reservation[] | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<string | null>(null);
  const [cancelling, setCancelling] = React.useState(false);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    const res = await fetch('/api/reservations', { cache: 'no-store' });
    const json = await res.json();
    if (json.success) setReservations(json.data.reservations);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/reservations/${cancelTarget}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const json = await res.json();
      if (!json.success) {
        toast({ kind: 'error', title: "Couldn't cancel", description: json.message });
        return;
      }
      toast({ kind: 'success', title: 'Reservation cancelled', description: 'Your advance payment has been refunded.' });
      load();
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  }

  return (
    <div>
      <PageHeader title="Your reservations" description="Upcoming, active, and past EV charging bookings." />

      {reservations === null ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : reservations.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No charging reservations yet" description="Book a slot from the EV Charging page." />
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-500">
                  <BatteryCharging className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-ink-900">{r.chargerName} · {r.stationName}</p>
                  <p className="text-sm text-ink-400">{r.date}, {r.startTime}–{r.endTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-ink-900">{formatCurrency(r.amount)}</span>
                <StatusBadge status={r.status} />
                {r.status === 'UPCOMING' && (
                  <Button variant="danger" size="sm" onClick={() => setCancelTarget(r.id)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel this reservation?"
        description="Your advance payment will be refunded and the slot released."
        confirmLabel="Cancel reservation"
        danger
        loading={cancelling}
      />
    </div>
  );
}
