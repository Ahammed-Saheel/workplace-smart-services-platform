import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { chargerSchema } from '@/lib/validation';
import { created, ok, unauthorized, forbidden, notFound, zodFail, serverError } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import { listChargers, createCharger } from '@/lib/repo/charging';
import { findStationById } from '@/lib/repo/charging';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(req.url);
    const chargers = listChargers({
      stationId: searchParams.get('stationId') ?? undefined,
      ownerId: session.role === 'CHARGING_OWNER' ? session.sub : undefined,
    });

    return ok({ chargers });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'CHARGING_OWNER') return forbidden('Only charging operators can add chargers.');

    const body = await req.json();
    const parsed = chargerSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const station = findStationById(parsed.data.stationId);
    if (!station) return notFound('Station not found.');
    if (station.ownerId !== session.sub) return forbidden("You don't manage this station.");

    const charger = createCharger(parsed.data);
    await logActivity(session.sub, 'Charger created', 'Charger', charger.id);
    return created({ charger });
  } catch (err) {
    return serverError(err);
  }
}
