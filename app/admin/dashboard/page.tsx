import {
  Users,
  UtensilsCrossed,
  Zap,
  ClipboardList,
  CalendarClock,
  IndianRupee,
  Vote,
  MessageSquarePlus,
  UserCheck,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { StatCard } from '@/components/ui/stat-card';
import { listActivity } from '@/lib/repo/audit-log';
import { relativeTime } from '@/lib/utils';
import {
  countUsers,
} from '@/lib/repo/users';
import { countCafeterias } from '@/lib/repo/cafeterias';
import { countOrders, sumOrderRevenue } from '@/lib/repo/orders';
import { countActivePolls } from '@/lib/repo/polls';
import { countPendingFoodRequests } from '@/lib/repo/food-requests';
import { countStations, countReservations, sumReservationRevenue } from '@/lib/repo/charging';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getSession();
  const totalUsers = countUsers();
  const activeUsers = countUsers({ active: true });
  const cafeterias = countCafeterias();
  const stations = countStations();
  const orders = countOrders();
  const reservations = countReservations();
  const activePolls = countActivePolls();
  const pendingRequests = countPendingFoodRequests();
  const revenue = sumOrderRevenue() + sumReservationRevenue();
  const recentActivity = listActivity(8);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink-900 sm:text-[28px]">Platform overview</h1>
        <p className="mt-1 text-sm text-ink-400">Welcome back, {session!.name.split(' ')[0]}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} icon={Users} hint={`${activeUsers} active`} />
        <StatCard label="Cafeterias" value={cafeterias} icon={UtensilsCrossed} />
        <StatCard label="Charging stations" value={stations} icon={Zap} />
        <StatCard label="Platform revenue" value={formatCurrency(revenue)} icon={IndianRupee} tone="amber" />
        <StatCard label="Orders" value={orders} icon={ClipboardList} />
        <StatCard label="Reservations" value={reservations} icon={CalendarClock} tone="teal" />
        <StatCard label="Active polls" value={activePolls} icon={Vote} />
        <StatCard label="Pending requests" value={pendingRequests} icon={MessageSquarePlus} />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-display text-lg text-ink-900">Recent activity</h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {recentActivity.length === 0 ? (
            <p className="p-5 text-sm text-ink-300">No activity recorded yet.</p>
          ) : (
            recentActivity.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5 text-ink-300" />
                  <span className="text-ink-700">{log.action}</span>
                  {log.userName && <span className="text-ink-400">· {log.userName}</span>}
                </div>
                <span className="text-xs text-ink-300">{relativeTime(log.timestamp)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
