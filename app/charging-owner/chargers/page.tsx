'use client';

import * as React from 'react';
import { Plus, Zap, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input, Label, Select } from '@/components/ui/input';
import { SkeletonCard } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toaster';
import { formatCurrency } from '@/lib/utils';
import { CONNECTOR_TYPES } from '@/types';

interface Station {
  id: string;
  name: string;
}
interface Charger {
  id: string;
  stationId: string;
  name: string;
  connectorType: string;
  power: number;
  price: number;
  status: string;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  stationName: string;
}

const emptyForm = {
  stationId: '',
  name: '',
  connectorType: CONNECTOR_TYPES[0] as string,
  power: '22',
  price: '50',
  status: 'AVAILABLE',
  operatingHoursStart: '08:00',
  operatingHoursEnd: '20:00',
};

export default function ChargersPage() {
  const [chargers, setChargers] = React.useState<Charger[] | null>(null);
  const [stations, setStations] = React.useState<Station[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Charger | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Charger | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    const [chargerRes, stationRes] = await Promise.all([
      fetch('/api/chargers', { cache: 'no-store' }),
      fetch('/api/charging-stations', { cache: 'no-store' }),
    ]);
    const chargerJson = await chargerRes.json();
    const stationJson = await stationRes.json();
    if (chargerJson.success) setChargers(chargerJson.data.chargers);
    if (stationJson.success) {
      setStations(stationJson.data.stations);
      if (stationJson.data.stations[0]) {
        setForm((f) => ({ ...f, stationId: f.stationId || stationJson.data.stations[0].id }));
      }
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, stationId: stations[0]?.id ?? '' });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(c: Charger) {
    setEditing(c);
    setForm({
      stationId: c.stationId,
      name: c.name,
      connectorType: c.connectorType,
      power: String(c.power),
      price: String(c.price),
      status: c.status,
      operatingHoursStart: c.operatingHoursStart,
      operatingHoursEnd: c.operatingHoursEnd,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const power = Number(form.power);
    const price = Number(form.price);
    if (!power || power <= 0) { setError('Enter a valid power rating.'); return; }
    if (price < 0) { setError('Price cannot be negative.'); return; }

    setSaving(true);
    try {
      const payload = { ...form, power, price };
      const res = await fetch(editing ? `/api/chargers/${editing.id}` : '/api/chargers', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? 'Could not save charger.');
        return;
      }
      toast({ kind: 'success', title: editing ? 'Charger updated' : 'Charger added' });
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function quickStatusChange(charger: Charger, status: string) {
    const res = await fetch(`/api/chargers/${charger.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) {
      toast({ kind: 'success', title: 'Status updated' });
      load();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/chargers/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        toast({ kind: 'error', title: 'Could not delete charger', description: json.message });
        return;
      }
      toast({ kind: 'success', title: 'Charger deleted' });
      load();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Chargers"
        description="Manage individual chargers, pricing, and availability."
        action={
          <Button onClick={openCreate} disabled={stations.length === 0}>
            <Plus className="h-4 w-4" /> Add charger
          </Button>
        }
      />

      {stations.length === 0 && chargers !== null && (
        <p className="mb-4 text-sm text-ink-400">Create a station first before adding chargers.</p>
      )}

      {chargers === null ? (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
      ) : chargers.length === 0 ? (
        <EmptyState icon={Zap} title="No chargers yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chargers.map((c) => (
            <div key={c.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-500">
                  <Zap className="h-5 w-5" />
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-3 font-medium text-ink-900">{c.name}</p>
              <p className="text-sm text-ink-400">{c.stationName}</p>
              <p className="text-xs text-ink-300">{c.connectorType} · {c.power} kW · {formatCurrency(c.price)}</p>
              <div className="mt-3 flex items-center justify-between">
                <Select
                  value={c.status}
                  onChange={(e) => quickStatusChange(c, e.target.value)}
                  className="h-8 w-auto text-xs"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="OFFLINE">Offline</option>
                </Select>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-900">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit charger' : 'Add charger'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="charger-station">Station</Label>
            <Select id="charger-station" value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })} required>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="charger-name">Charger name</Label>
            <Input id="charger-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Charger A1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="charger-connector">Connector type</Label>
              <Select id="charger-connector" value={form.connectorType} onChange={(e) => setForm({ ...form, connectorType: e.target.value })}>
                {CONNECTOR_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="charger-power">Power (kW)</Label>
              <Input id="charger-power" type="number" min="1" required value={form.power} onChange={(e) => setForm({ ...form, power: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="charger-price">Price (₹)</Label>
              <Input id="charger-price" type="number" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            {editing && (
              <div>
                <Label htmlFor="charger-status">Status</Label>
                <Select id="charger-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="OFFLINE">Offline</option>
                </Select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="charger-start">Open from</Label>
              <Input id="charger-start" type="time" required value={form.operatingHoursStart} onChange={(e) => setForm({ ...form, operatingHoursStart: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="charger-end">Open until</Label>
              <Input id="charger-end" type="time" required value={form.operatingHoursEnd} onChange={(e) => setForm({ ...form, operatingHoursEnd: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={saving}>{editing ? 'Save changes' : 'Add charger'}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This can't be done if there are active or upcoming reservations."
        confirmLabel="Delete charger"
        danger
        loading={deleting}
      />
    </div>
  );
}
