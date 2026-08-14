'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BatteryCharging, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label, Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toaster';
import { formatCurrency } from '@/lib/utils';
import { SkeletonCard } from '@/components/ui/skeleton';

interface ChargerDetail {
  id: string;
  name: string;
  connectorType: string;
  power: number;
  price: number;
  status: string;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  stationName: string;
  stationLocation: string;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function ChargerBookingPage({ params }: { params: Promise<{ chargerId: string }> }) {
  const { chargerId } = React.use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [charger, setCharger] = React.useState<ChargerDetail | null>(null);
  const [date, setDate] = React.useState(todayStr());
  const [startTime, setStartTime] = React.useState('10:00');
  const [endTime, setEndTime] = React.useState('11:00');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState<{ amount: number; date: string; startTime: string; endTime: string } | null>(null);

  React.useEffect(() => {
    async function loadCharger() {
      try {
        const res = await fetch(`/api/chargers/${chargerId}`, { cache: 'no-store' });
        const json = await res.json();
        if (json.success) {
          setCharger(json.data.charger);
        } else {
          setError(json.message ?? 'Charger not found.');
        }
      } catch {
        setError('Could not load this charger.');
      }
    }
    loadCharger();
  }, [chargerId]);

  async function handleReserve(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chargerId, date, startTime, endTime }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? 'Could not reserve this slot.');
        return;
      }
      setConfirmed({ amount: json.data.reservation.amount, date, startTime, endTime });
      toast({ kind: 'success', title: 'Reservation confirmed' });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !charger) {
    return (
      <div>
        <BackLink />
        <p className="mt-4 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!charger) {
    return (
      <div>
        <BackLink />
        <div className="mt-4">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
          <div className="h-1.5 bg-teal-400" />
          <div className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="mt-4 font-display text-xl text-ink-900">Payment successful</p>
            <p className="mt-1 text-sm text-ink-400">
              {formatCurrency(confirmed.amount)} advance payment received (simulated demo payment)
            </p>
            <div className="mt-5 rounded-xl bg-ink-50 p-4 text-left text-sm">
              <p className="font-medium text-ink-900">{charger.name} · {charger.stationName}</p>
              <p className="text-ink-500">{confirmed.date}, {confirmed.startTime}–{confirmed.endTime}</p>
            </div>
            <p className="mt-4 text-xs text-ink-300">
              This is a simulated payment for demo purposes. No real transaction has occurred.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={() => router.push('/employee/reservations')}>View my reservations</Button>
              <Link href="/employee/charging" className="text-sm text-ink-400 hover:text-ink-700">
                Back to charging stations
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <BackLink />
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="h-1.5 bg-teal-400" />
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-500">
              <BatteryCharging className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-ink-900">{charger.name}</p>
              <p className="text-sm text-ink-400">{charger.stationName} · {charger.stationLocation}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-ink-400">
            {charger.connectorType} · {charger.power} kW · Open {charger.operatingHoursStart}–{charger.operatingHoursEnd}
          </p>

          <form onSubmit={handleReserve} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                min={todayStr()}
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start">Start time</Label>
                <Input
                  id="start"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end">End time</Label>
                <Input
                  id="end"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3 text-sm">
              <span className="text-ink-500">Advance payment (simulated)</span>
              <span className="font-semibold text-ink-900">{formatCurrency(charger.price)}</span>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              Pay {formatCurrency(charger.price)} & confirm
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/employee/charging" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700">
      <ArrowLeft className="h-4 w-4" /> Back to charging stations
    </Link>
  );
}
