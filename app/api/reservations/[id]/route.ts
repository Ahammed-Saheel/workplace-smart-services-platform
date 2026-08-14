import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { canCancelReservation } from '@/lib/business/charging';
import { ok, unauthorized, forbidden, notFound, fail, serverError } from '@/lib/api-response';
import { logActivity, notify } from '@/lib/notifications';
import { findReservationWithMeta, updateReservationStatus } from '@/lib/repo/charging';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();

    const reservation = findReservationWithMeta(id);
    if (!reservation) return notFound('Reservation not found.');

    const isCustomer = session.role === 'EMPLOYEE' && reservation.userId === session.sub;
    const isOwner = session.role === 'CHARGING_OWNER' && reservation.stationOwnerId === session.sub;
    const isAdmin = session.role === 'ADMIN';
    if (!isCustomer && !isOwner && !isAdmin) return forbidden();

    const body = await req.json();
    const nextStatus = body.status as string;

    if (nextStatus === 'CANCELLED') {
      if (!isAdmin && !canCancelReservation(reservation.status)) {
        return fail('Only upcoming reservations can be cancelled.', 409);
      }
      const updated = updateReservationStatus(id, 'CANCELLED', 'REFUNDED');

      await logActivity(session.sub, 'Reservation cancelled', 'ChargingReservation', reservation.id);

      const notifyTarget = isCustomer ? reservation.stationOwnerId : reservation.userId;
      await notify(
        notifyTarget,
        'Reservation cancelled',
        `The reservation for ${reservation.chargerName} on ${reservation.date} was cancelled. ₹${reservation.amount} has been refunded.`,
        'CHARGING'
      );

      return ok({ reservation: updated });
    }

    return fail('Unsupported status transition.', 422);
  } catch (err) {
    return serverError(err);
  }
}
