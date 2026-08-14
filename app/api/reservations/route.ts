import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { createReservationSchema } from '@/lib/validation';
import { validateReservationSlot, isChargerBookable } from '@/lib/business/charging';
import { created, ok, unauthorized, forbidden, notFound, fail, zodFail, serverError } from '@/lib/api-response';
import { logActivity, notify } from '@/lib/notifications';
import {
  listReservations,
  createReservation,
  reservationsForChargerOnDate,
  findChargerById,
  findStationById,
} from '@/lib/repo/charging';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    let filters: { userId?: string; ownerId?: string } = {};
    if (session.role === 'EMPLOYEE') {
      filters.userId = session.sub;
    } else if (session.role === 'CHARGING_OWNER') {
      filters.ownerId = session.sub;
    } else if (session.role !== 'ADMIN') {
      return forbidden();
    }

    const reservations = listReservations(filters);
    return ok({ reservations });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'EMPLOYEE') {
      return forbidden('Only employees can reserve a charging slot.');
    }

    const body = await req.json();
    const parsed = createReservationSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const charger = findChargerById(parsed.data.chargerId);
    if (!charger) return notFound('Charger not found.');
    if (!isChargerBookable(charger.status)) {
      return fail('This charger is offline and cannot be reserved right now.', 409);
    }

    const existing = reservationsForChargerOnDate(charger.id, parsed.data.date);

    const validation = validateReservationSlot(
      { date: parsed.data.date, startTime: parsed.data.startTime, endTime: parsed.data.endTime },
      existing,
      { startTime: charger.operatingHoursStart, endTime: charger.operatingHoursEnd }
    );
    if (!validation.valid) return fail(validation.message!, 409);

    // Simulated advance payment that always succeeds in this MVP.
    const reservation = createReservation({
      chargerId: charger.id,
      userId: session.sub,
      date: parsed.data.date,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      amount: charger.price,
    });

    await logActivity(session.sub, 'EV charging slot reserved', 'ChargingReservation', reservation.id);

    const station = findStationById(charger.stationId);
    if (station) {
      await notify(
        station.ownerId,
        'New charging reservation',
        `${session.name} booked ${charger.name} on ${parsed.data.date} from ${parsed.data.startTime} to ${parsed.data.endTime}.`,
        'CHARGING',
        '/charging-owner/reservations'
      );
    }
    await notify(
      session.sub,
      'Reservation confirmed',
      `₹${charger.price} advance payment received. ${charger.name} is booked for ${parsed.data.date}, ${parsed.data.startTime}–${parsed.data.endTime}.`,
      'CHARGING',
      '/employee/reservations'
    );

    return created({ reservation });
  } catch (err) {
    return serverError(err);
  }
}
