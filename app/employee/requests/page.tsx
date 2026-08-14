'use client';

import * as React from 'react';
import { MessageSquarePlus, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea, Label, Select } from '@/components/ui/input';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toaster';
import { relativeTime } from '@/lib/utils';

interface Request {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  cafeteriaName: string;
}
interface Cafeteria {
  id: string;
  name: string;
}

export default function FoodRequestsPage() {
  const [requests, setRequests] = React.useState<Request[] | null>(null);
  const [cafeterias, setCafeterias] = React.useState<Cafeteria[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [cafeteriaId, setCafeteriaId] = React.useState('');
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    const [reqRes, cafRes] = await Promise.all([
      fetch('/api/food-requests', { cache: 'no-store' }),
      fetch('/api/cafeterias', { cache: 'no-store' }),
    ]);
    const reqJson = await reqRes.json();
    const cafJson = await cafRes.json();
    if (reqJson.success) setRequests(reqJson.data.requests);
    if (cafJson.success) {
      setCafeterias(cafJson.data.cafeterias);
      if (cafJson.data.cafeterias[0]) setCafeteriaId(cafJson.data.cafeterias[0].id);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/food-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeteriaId, name, description: description || undefined }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? 'Could not submit your request.');
        return;
      }
      toast({ kind: 'success', title: 'Request submitted' });
      setName('');
      setDescription('');
      setModalOpen(false);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Food Requests"
        description="Suggest a dish you'd like to see on a future menu."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> New request
          </Button>
        }
      />

      {requests === null ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title="No dish requests found"
          description="Tell the cafeteria what you'd love to see on the menu."
          action={<Button onClick={() => setModalOpen(true)}>Submit a request</Button>}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink-900">{r.name}</p>
                  <p className="text-xs text-ink-400">{r.cafeteriaName} · {relativeTime(r.createdAt)}</p>
                  {r.description && <p className="mt-1.5 text-sm text-ink-500">{r.description}</p>}
                </div>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request a dish">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cafeteria">Cafeteria</Label>
            <Select id="cafeteria" value={cafeteriaId} onChange={(e) => setCafeteriaId(e.target.value)} required>
              {cafeterias.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="dish-name">Dish name</Label>
            <Input id="dish-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Avocado Toast" />
          </div>
          <div>
            <Label htmlFor="dish-desc">Description (optional)</Label>
            <Textarea id="dish-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us more about it..." />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={submitting}>Submit request</Button>
        </form>
      </Modal>
    </div>
  );
}
