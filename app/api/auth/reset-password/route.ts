import { NextRequest } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { resetPasswordSchema } from '@/lib/validation';
import { ok, fail, zodFail, serverError } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import { findUserByResetToken, updateUserPassword, clearResetToken } from '@/lib/repo/users';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const { token, password } = parsed.data;
    const user = findUserByResetToken(token);

    if (!user || !user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
      return fail('This reset link is invalid or has expired. Request a new one.', 400);
    }

    const passwordHash = await hashPassword(password);
    updateUserPassword(user.id, passwordHash);
    clearResetToken(user.id);

    await logActivity(user.id, 'Password reset', 'User', user.id);
    return ok({ reset: true });
  } catch (err) {
    return serverError(err);
  }
}
