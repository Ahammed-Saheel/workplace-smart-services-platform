import { getSession } from '@/lib/auth';
import { ok, unauthorized, forbidden, serverError } from '@/lib/api-response';
import { countUsers } from '@/lib/repo/users';
import { countCafeterias } from '@/lib/repo/cafeterias';
import { countOrders, sumOrderRevenue } from '@/lib/repo/orders';
import { countActivePolls } from '@/lib/repo/polls';
import { countPendingFoodRequests } from '@/lib/repo/food-requests';
import { countStations, countReservations, sumReservationRevenue } from '@/lib/repo/charging';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'ADMIN') return forbidden();

    const totalUsers = countUsers();
    const activeUsers = countUsers({ active: true });
    const cafeterias = countCafeterias();
    const cafeteriaOwners = countUsers({ role: 'CAFETERIA_OWNER' });
    const chargingStations = countStations();
    const chargingOperators = countUsers({ role: 'CHARGING_OWNER' });
    const orders = countOrders();
    const reservations = countReservations();
    const activePolls = countActivePolls();
    const pendingRequests = countPendingFoodRequests();
    const revenue = sumOrderRevenue() + sumReservationRevenue();

    return ok({
      totalUsers,
      activeUsers,
      cafeterias,
      cafeteriaOwners,
      chargingStations,
      chargingOperators,
      orders,
      reservations,
      activePolls,
      pendingRequests,
      revenue,
    });
  } catch (err) {
    return serverError(err);
  }
}
