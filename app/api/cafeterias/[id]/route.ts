import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { cafeteriaStatusSchema } from '@/lib/validation';
import { ok, unauthorized, forbidden, notFound, zodFail, serverError } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import { findCafeteriaById, updateCafeteriaStatus } from '@/lib/repo/cafeterias';
import { listMenuItems } from '@/lib/repo/menu-items';
import { findUserById } from '@/lib/repo/users';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();

    const cafeteria = findCafeteriaById(id);
    if (!cafeteria) return notFound('Cafeteria not found.');

    const owner = findUserById(cafeteria.ownerId);
    const menuItems = listMenuItems({ cafeteriaId: cafeteria.id });

    return ok({
      cafeteria: {
        ...cafeteria,
        owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
        menuItems,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();

    const cafeteria = findCafeteriaById(id);
    if (!cafeteria) return notFound('Cafeteria not found.');

    const isOwner = session.role === 'CAFETERIA_OWNER' && cafeteria.ownerId === session.sub;
    if (!isOwner && session.role !== 'ADMIN') return forbidden();

    const body = await req.json();
    const parsed = cafeteriaStatusSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const status =
      parsed.data.status ??
      (parsed.data.active === false ? 'CLOSED' : parsed.data.active === true ? 'OPEN' : undefined);
    if (!status) return ok({ cafeteria });

    const updated = updateCafeteriaStatus(id, status);
    await logActivity(session.sub, `Cafeteria ${status === 'CLOSED' ? 'closed' : 'opened'}`, 'Cafeteria', cafeteria.id);
    return ok({ cafeteria: updated });
  } catch (err) {
    return serverError(err);
  }
}
