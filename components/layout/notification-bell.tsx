'use client';

import * as React from 'react';
import { Bell, Check } from 'lucide-react';
import Link from 'next/link';
import { cn, relativeTime } from '@/lib/utils';

interface NotifItem {
  id: string;
  title: string;
  message: string;
  read: number | boolean;
  link: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotifItem[]>([]);
  const [unread, setUnread] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=15', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setItems(json.data.notifications);
        setUnread(json.data.unreadCount);
      }
    } catch {
      // Silent: notifications are non-critical, so the bell will not update this cycle.
    }
  }, []);

  React.useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await fetch('/api/notifications', { method: 'PATCH' });
  }

  async function markOneRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-50 hover:text-ink-900"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-semibold text-ink-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[22rem] max-w-[90vw] overflow-hidden rounded-2xl border border-line bg-white shadow-pop animate-fade-up">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-teal-500 hover:text-teal-600"
              >
                <Check className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-400">
                You're all caught up. No notifications yet.
              </p>
            ) : (
              items.map((n) => {
                const content = (
                  <div
                    className={cn(
                      'flex gap-2 border-b border-line/60 px-4 py-3 last:border-0',
                      !n.read && 'bg-amber-50/50'
                    )}
                  >
                    {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />}
                    <div className={cn('flex-1', n.read && 'pl-3.5')}>
                      <p className="text-sm font-medium text-ink-900">{n.title}</p>
                      <p className="mt-0.5 text-xs text-ink-400">{n.message}</p>
                      <p className="mt-1 text-[11px] text-ink-300">{relativeTime(n.createdAt)}</p>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => {
                      if (!n.read) markOneRead(n.id);
                      setOpen(false);
                    }}
                    className="block hover:bg-ink-50/50"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markOneRead(n.id)}
                    className="block w-full text-left hover:bg-ink-50/50"
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
