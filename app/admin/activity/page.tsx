import { ScrollText } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { listActivity } from '@/lib/repo/audit-log';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function AdminActivityPage() {
  const logs = listActivity(100);

  return (
    <div>
      <PageHeader title="Activity Logs" description="A simple audit trail of platform-wide actions." />
      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity recorded yet" />
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <span className="text-ink-800">{log.action}</span>
                {log.entity && <span className="text-ink-400"> · {log.entity}</span>}
                {log.userName && <span className="text-ink-400"> · by {log.userName} ({log.userRole})</span>}
              </div>
              <span className="shrink-0 text-xs text-ink-300">{formatDateTime(log.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
