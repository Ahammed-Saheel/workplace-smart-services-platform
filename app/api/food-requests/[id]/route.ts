import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { foodRequestStatusSchema } from '@/lib/validation';
import { ok, unauthorized, forbidden, notFound, zodFail, serverError } from '@/lib/api-response';
import { logActivity, notify } from '@/lib/notifications';
import { findFoodRequestById, updateFoodRequestStatus } from '@/lib/repo/food-requests';
import { findCafeteriaById } from '@/lib/repo/cafeterias';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'CAFETERIA_OWNER' && session.role !== 'ADMIN') return forbidden();

    const request = findFoodRequestById(id);
    if (!request) return notFound('Request not found.');
    const cafeteria = findCafeteriaById(request.cafeteriaId);
    if (session.role === 'CAFETERIA_OWNER' && cafeteria?.ownerId !== session.sub) {
      return forbidden("You can't manage another cafeteria's requests.");
    }

    const body = await req.json();
    const parsed = foodRequestStatusSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const updated = updateFoodRequestStatus(id, parsed.data.status);
    await logActivity(session.sub, `Dish request marked ${parsed.data.status}`, 'FoodRequest', request.id);

    const labels: Record<string, string> = {
      UNDER_REVIEW: 'is now under review',
      PLANNED: 'has been planned for an upcoming menu',
      ADDED_TO_MENU: 'was added to the menu. Try it soon!',
      REJECTED: "won't be added this time",
    };
    await notify(
      request.customerId,
      'Your dish request was updated',
      `Your request for "${request.name}" ${labels[parsed.data.status] ?? 'was updated'}.`,
      'REQUEST',
      '/employee/requests'
    );

    return ok({ request: updated });
  } catch (err) {
    return serverError(err);
  }
}
