import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { foodRequestSchema } from '@/lib/validation';
import { created, ok, unauthorized, forbidden, notFound, zodFail, serverError } from '@/lib/api-response';
import { logActivity, notify } from '@/lib/notifications';
import { listFoodRequests, createFoodRequest } from '@/lib/repo/food-requests';
import { findCafeteriaById, findCafeteriaByOwnerId } from '@/lib/repo/cafeterias';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    let filters: { customerId?: string; cafeteriaId?: string } = {};
    if (session.role === 'EMPLOYEE') {
      filters.customerId = session.sub;
    } else if (session.role === 'CAFETERIA_OWNER') {
      const cafeteria = findCafeteriaByOwnerId(session.sub);
      if (!cafeteria) return ok({ requests: [] });
      filters.cafeteriaId = cafeteria.id;
    } else if (session.role !== 'ADMIN') {
      return forbidden();
    }

    const requests = listFoodRequests(filters);
    return ok({ requests });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'EMPLOYEE') return forbidden('Only employees can submit dish requests.');

    const body = await req.json();
    const parsed = foodRequestSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const cafeteria = findCafeteriaById(parsed.data.cafeteriaId);
    if (!cafeteria) return notFound('Cafeteria not found.');

    const request = createFoodRequest({ ...parsed.data, customerId: session.sub });

    await logActivity(session.sub, 'Dish request submitted', 'FoodRequest', request.id);
    await notify(
      cafeteria.ownerId,
      'New dish request',
      `${session.name} requested "${request.name}" for a future menu.`,
      'REQUEST',
      '/cafeteria-owner/requests'
    );

    return created({ request });
  } catch (err) {
    return serverError(err);
  }
}
