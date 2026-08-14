'use client';

import * as React from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs } from '@/components/ui/tabs';
import { Select } from '@/components/ui/input';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toaster';
import { relativeTime } from '@/lib/utils';

interface Request {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  customerName: string;
}

const STATUS_OPTIONS = ['UNDER_REVIEW', 'PLANNED', 'ADDED_TO_MENU', 'REJECTED'];
const TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Under review', value: 'UNDER_REVIEW' },
  { label: 'Planned', value: 'PLANNED' },
  { label: 'Added to menu', value: 'ADDED_TO_MENU' },
  { label: 'Rejected', value: 'REJECTED' },
];

export default function DishRequestsPage() {
  const [requests, setRequests] = React.useState<Request[] | null>(null);
  const [tab, setTab] = React.useState('ALL');
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    const res = await fetch('/api/food-requests', { cache: 'no-store' });
    const json = await res.json();
    if (json.success) setRequests(json.data.requests);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/food-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!json.success) {
      toast({ kind: 'error', title: 'Could not update status', description: json.message });
      return;
    }
    toast({ kind: 'success', title: 'Status updated' });
    load();
  }

  const filtered = requests?.filter((r) => tab === 'ALL' || r.status === tab) ?? [];

  return (
    <div>
      <PageHeader title="Dish Requests" description="Review what employees want to see on the menu." />

      <div className="mb-5">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {requests === null ? (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={MessageSquarePlus} title="No dish requests found" />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-ink-900">{r.name}</p>
                <p className="text-xs text-ink-400">{r.customerName} · {relativeTime(r.createdAt)}</p>
                {r.description && <p className="mt-1 text-sm text-ink-500">{r.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                <Select
                  value=""
                  onChange={(e) => e.target.value && updateStatus(r.id, e.target.value)}
                  className="w-auto text-xs"
                >
                  <option value="">Change status...</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
