import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminUserUpdateSchema } from '@/lib/validation';
import { ok, unauthorized, forbidden, notFound, fail, zodFail, serverError } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import { findUserById, updateUserAdmin } from '@/lib/repo/users';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'ADMIN') return forbidden();
    if (id === session.sub) {
      return fail("You can't change your own account from the admin panel.", 400);
    }

    const user = findUserById(id);
    if (!user) return notFound('User not found.');

    const body = await req.json();
    const parsed = adminUserUpdateSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const updated = updateUserAdmin(id, parsed.data);

    await logActivity(
      session.sub,
      parsed.data.active === false
        ? 'User suspended'
        : parsed.data.active === true
        ? 'User reactivated'
        : 'User role changed',
      'User',
      user.id
    );

    return ok({ user: updated ? { ...updated, active: !!updated.active } : null });
  } catch (err) {
    return serverError(err);
  }
}
