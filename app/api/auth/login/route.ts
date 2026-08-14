import { NextRequest } from 'next/server';
import { verifyPassword, signSession, sessionCookieOptions } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { ok, fail, zodFail, serverError } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import { findUserByEmail } from '@/lib/repo/users';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const { email, password } = parsed.data;
    const user = findUserByEmail(email);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return fail('Incorrect email or password.', 401);
    }
    if (!user.active) {
      return fail('This account has been deactivated. Contact your platform admin.', 403);
    }

    const token = await signSession({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    await logActivity(user.id, 'User signed in', 'User', user.id);

    const res = ok({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    res.cookies.set(sessionCookieOptions().name, token, sessionCookieOptions());
    return res;
  } catch (err) {
    return serverError(err);
  }
}
