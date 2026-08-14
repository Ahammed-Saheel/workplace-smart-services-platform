import { getSession } from '@/lib/auth';
import { reservationRevenueByDay, chargerUtilization } from '@/lib/repo/charging';
import { PageHeader } from '@/components/layout/page-header';
import { RevenueBarChart, PopularItemsBarChart } from '@/components/charts/simple-charts';

export const dynamic = 'force-dynamic';

export default async function ChargingAnalyticsPage() {
  const session = await getSession();
  const revenue = reservationRevenueByDay(session!.sub, 7);
  const utilization = chargerUtilization(session!.sub);
  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);

  return (
    <div>
      <PageHeader title="Analytics" description="Reservation revenue and charger utilization." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-medium text-ink-900">Revenue, last 7 days</p>
            <p className="font-display text-lg text-ink-900">₹{totalRevenue}</p>
          </div>
          <RevenueBarChart data={revenue} />
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <p className="mb-1 font-medium text-ink-900">Charger utilization (all-time reservations)</p>
          <PopularItemsBarChart data={utilization} />
        </div>
      </div>
    </div>
  );
}
