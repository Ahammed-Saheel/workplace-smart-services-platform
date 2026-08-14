import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { chargerSchema } from '@/lib/validation';
import { ok, unauthorized, forbidden, notFound, fail, zodFail, serverError } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import {
  findChargerWithStation,
  updateCharger,
  deleteCharger,
  activeReservationCountForCharger,
} from '@/lib/repo/charging';

async function loadOwnedCharger(id: string, userId: string, isAdmin: boolean) {
  const charger = findChargerWithStation(id);
  if (!charger) return { charger: null, owns: false };
  return { charger, owns: isAdmin || charger.stationOwnerId === userId };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();

    const charger = findChargerWithStation(id);
    if (!charger) return notFound('Charger not found.');

    return ok({ charger });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'CHARGING_OWNER' && session.role !== 'ADMIN') return forbidden();

    const { charger, owns } = await loadOwnedCharger(id, session.sub, session.role === 'ADMIN');
    if (!charger) return notFound('Charger not found.');
    if (!owns) return forbidden();

    const body = await req.json();
    const parsed = chargerSchema.partial().safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const updated = updateCharger(id, parsed.data);
    await logActivity(session.sub, 'Charger updated', 'Charger', charger.id);
    return ok({ charger: updated });
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

    const { charger, owns } = await loadOwnedCharger(id, session.sub, session.role === 'ADMIN');
    if (!charger) return notFound('Charger not found.');
    if (!owns) return forbidden();

    if (activeReservationCountForCharger(id) > 0) {
      return fail('This charger has active or upcoming reservations and cannot be deleted.', 409);
    }

    deleteCharger(id);
    await logActivity(session.sub, 'Charger deleted', 'Charger', charger.id);
    return ok({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
