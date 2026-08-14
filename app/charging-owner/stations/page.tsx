'use client';

import * as React from 'react';
import { Plus, Building2, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input, Label, Select } from '@/components/ui/input';
import { SkeletonCard } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toaster';

interface Station {
  id: string;
  name: string;
  location: string;
  status: string;
  chargerCount: number;
}

export default function StationsPage() {
  const [stations, setStations] = React.useState<Station[] | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Station | null>(null);
  const [name, setName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [status, setStatus] = React.useState('ACTIVE');
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Station | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    const res = await fetch('/api/charging-stations', { cache: 'no-store' });
    const json = await res.json();
    if (json.success) setStations(json.data.stations);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setName('');
    setLocation('');
    setStatus('ACTIVE');
    setError(null);
    setModalOpen(true);
  }

  function openEdit(s: Station) {
    setEditing(s);
    setName(s.name);
    setLocation(s.location);
    setStatus(s.status);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/charging-stations/${editing.id}` : '/api/charging-stations', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, location, status }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? 'Could not save station.');
        return;
      }
      toast({ kind: 'success', title: editing ? 'Station updated' : 'Station created' });
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/charging-stations/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        toast({ kind: 'error', title: 'Could not delete station', description: json.message });
        return;
      }
      toast({ kind: 'success', title: 'Station deleted' });
      load();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Charging Stations"
        description="Manage the charging zones you operate across the campus."
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add station</Button>}
      />

      {stations === null ? (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
      ) : stations.length === 0 ? (
        <EmptyState icon={Building2} title="No stations yet" action={<Button onClick={openCreate}>Add your first station</Button>} />
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
              <p className="text-sm text-ink-400">{s.location}</p>
              <p className="mt-1 text-xs text-ink-300">{s.chargerCount} charger{s.chargerCount === 1 ? '' : 's'}</p>
              <div className="mt-3 flex items-center gap-1">
                <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-900">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteTarget(s)} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit station' : 'Add station'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="station-name">Name</Label>
            <Input id="station-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Main EV Charging Zone" />
          </div>
          <div>
            <Label htmlFor="station-location">Location</Label>
            <Input id="station-location" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Basement parking, Block C" />
          </div>
          {editing && (
            <div>
              <Label htmlFor="station-status">Status</Label>
              <Select id="station-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={saving}>{editing ? 'Save changes' : 'Add station'}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        description="Remove all its chargers first if this fails."
        confirmLabel="Delete station"
        danger
        loading={deleting}
      />
    </div>
  );
}
