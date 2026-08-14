import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { chargingStationSchema } from '@/lib/validation';
import { created, ok, unauthorized, forbidden, zodFail, serverError } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import { listStations, createStation } from '@/lib/repo/charging';
import { getDefaultWorkplace } from '@/lib/repo/workplaces';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const stations = listStations({
      ownerId: session.role === 'CHARGING_OWNER' ? session.sub : undefined,
    });
    return ok({ stations });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'CHARGING_OWNER') return forbidden('Only charging operators can create stations.');

    const body = await req.json();
    const parsed = chargingStationSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const workplace = getDefaultWorkplace();
    if (!workplace) return forbidden('No active workplace configured.');

    const station = createStation({
      name: parsed.data.name,
      location: parsed.data.location,
      ownerId: session.sub,
      workplaceId: workplace.id,
    });

    await logActivity(session.sub, 'Charging station created', 'ChargingStation', station.id);
    return created({ station });
  } catch (err) {
    return serverError(err);
  }
}
