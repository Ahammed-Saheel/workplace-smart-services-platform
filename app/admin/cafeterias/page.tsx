import { UtensilsCrossed } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { CafeteriaStatusToggle } from '@/components/admin/status-toggle';
import { listCafeterias } from '@/lib/repo/cafeterias';

export const dynamic = 'force-dynamic';

export default function AdminCafeteriasPage() {
  const cafeterias = listCafeterias();

  return (
    <div>
      <PageHeader title="Cafeterias" description="Every cafeteria registered on the platform." />

      {cafeterias.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No cafeterias yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cafeterias.map((c) => (
            <div key={c.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-3 font-medium text-ink-900">{c.name}</p>
              <p className="text-sm text-ink-400">{c.ownerName} · {c.ownerEmail}</p>
              <p className="mt-1 text-xs text-ink-300">
                {c.menuItemCount} menu items · {c.orderCount} orders
              </p>
              <div className="mt-3">
                <CafeteriaStatusToggle id={c.id} status={c.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
