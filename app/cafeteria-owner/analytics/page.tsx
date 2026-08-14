import { getSession } from '@/lib/auth';
import { findCafeteriaByOwnerId } from '@/lib/repo/cafeterias';
import { revenueByDay, orderStatusDistribution, popularMenuItems } from '@/lib/repo/orders';
import { PageHeader } from '@/components/layout/page-header';
import { RevenueBarChart, StatusPieChart, PopularItemsBarChart } from '@/components/charts/simple-charts';

export const dynamic = 'force-dynamic';

export default async function CafeteriaAnalyticsPage() {
  const session = await getSession();
  const cafeteria = findCafeteriaByOwnerId(session!.sub);
  if (!cafeteria) return null;

  const revenue = revenueByDay(cafeteria.id, 7);
  const statusDist = orderStatusDistribution(cafeteria.id);
  const popular = popularMenuItems(cafeteria.id, 6);
  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);

  return (
    <div>
      <PageHeader title="Analytics" description="Revenue, order mix, and your best-selling dishes." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-medium text-ink-900">Revenue, last 7 days</p>
            <p className="font-display text-lg text-ink-900">₹{totalRevenue}</p>
          </div>
          <RevenueBarChart data={revenue} />
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <p className="mb-1 font-medium text-ink-900">Order status distribution</p>
          <StatusPieChart data={statusDist} />
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-card lg:col-span-2">
          <p className="mb-1 font-medium text-ink-900">Most popular items</p>
          <PopularItemsBarChart data={popular} />
        </div>
      </div>
    </div>
  );
}
