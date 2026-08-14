'use client';

import * as React from 'react';
import { Bell, Check } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { cn, relativeTime } from '@/lib/utils';

interface Notif {
  id: string;
  title: string;
  message: string;
  read: number | boolean;
  link: string | null;
  createdAt: string;
  type: string;
}

export default function NotificationsPage() {
  const [items, setItems] = React.useState<Notif[] | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch('/api/notifications?limit=50', { cache: 'no-store' });
    const json = await res.json();
    if (json.success) setItems(json.data.notifications);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function markAll() {
    setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
    await fetch('/api/notifications', { method: 'PATCH' });
  }

  async function markOne(id: string) {
    setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? null);
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
  }

  const unreadCount = items?.filter((n) => !n.read).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Order updates, poll alerts, and reservation confirmations."
        action={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={markAll}>
              <Check className="h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {items === null ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="We'll let you know when something needs your attention." />
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {items.map((n) => {
            const body = (
              <div className={cn('flex gap-3 px-5 py-4', !n.read && 'bg-amber-50/40')}>
                {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />}
                <div className={cn('flex-1', n.read && 'pl-3.5')}>
                  <p className="text-sm font-medium text-ink-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-ink-400">{n.message}</p>
                  <p className="mt-1 text-xs text-ink-300">{relativeTime(n.createdAt)}</p>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} onClick={() => !n.read && markOne(n.id)} className="block hover:bg-ink-50/50">
                {body}
              </Link>
            ) : (
              <button key={n.id} onClick={() => !n.read && markOne(n.id)} className="block w-full text-left hover:bg-ink-50/50">
                {body}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
