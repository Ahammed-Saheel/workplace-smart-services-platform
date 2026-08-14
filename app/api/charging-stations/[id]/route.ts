import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { chargingStationSchema } from '@/lib/validation';
import { ok, unauthorized, forbidden, notFound, fail, zodFail, serverError } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import {
  findStationById,
  updateStation,
  deleteStation,
  chargerCountForStation,
} from '@/lib/repo/charging';

async function loadOwnedStation(id: string, userId: string, isAdmin: boolean) {
  const station = findStationById(id);
  if (!station) return { station: null, owns: false };
  return { station, owns: isAdmin || station.ownerId === userId };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'CHARGING_OWNER' && session.role !== 'ADMIN') return forbidden();

    const { station, owns } = await loadOwnedStation(id, session.sub, session.role === 'ADMIN');
    if (!station) return notFound('Station not found.');
    if (!owns) return forbidden();

    const body = await req.json();
    const parsed = chargingStationSchema.partial().safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const updated = updateStation(id, parsed.data);
    await logActivity(session.sub, 'Charging station updated', 'ChargingStation', station.id);
    return ok({ station: updated });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'CHARGING_OWNER' && session.role !== 'ADMIN') return forbidden();

    const { station, owns } = await loadOwnedStation(id, session.sub, session.role === 'ADMIN');
    if (!station) return notFound('Station not found.');
    if (!owns) return forbidden();

    if (chargerCountForStation(id) > 0) {
      return fail('Remove all chargers from this station before deleting it.', 409);
    }

    deleteStation(id);
    await logActivity(session.sub, 'Charging station deleted', 'ChargingStation', station.id);
    return ok({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
