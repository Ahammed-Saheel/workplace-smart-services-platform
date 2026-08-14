import { NextRequest } from 'next/server';
import { getSession, hashPassword, verifyPassword } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validation';
import { ok, fail, unauthorized, zodFail, serverError } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import { findUserById, updateUserPassword } from '@/lib/repo/users';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const user = findUserById(session.sub);
    if (!user) return unauthorized();

    const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return fail('Your current password is incorrect.', 400);

    const passwordHash = await hashPassword(parsed.data.newPassword);
    updateUserPassword(user.id, passwordHash);
    await logActivity(user.id, 'Password changed', 'User', user.id);

    return ok({ changed: true });
  } catch (err) {
    return serverError(err);
  }
}
