import { NextRequest } from 'next/server';
import { hashPassword, signSession, sessionCookieOptions } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { ok, fail, zodFail, serverError } from '@/lib/api-response';
import { logActivity, notify } from '@/lib/notifications';
import { findUserByEmail, createUser } from '@/lib/repo/users';
import { getDefaultWorkplace } from '@/lib/repo/workplaces';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const { name, email, password } = parsed.data;

    const existing = findUserByEmail(email);
    if (existing) {
      return fail('An account with this email already exists. Try signing in instead.', 409);
    }

    const workplace = getDefaultWorkplace();
    const passwordHash = await hashPassword(password);

    const user = createUser({
      name,
      email,
      passwordHash,
      role: 'EMPLOYEE',
      workplaceId: workplace?.id ?? null,
    });

    await logActivity(user.id, 'User registered', 'User', user.id);
    await notify(
      user.id,
      'Welcome to the platform',
      `You're all set, ${user.name.split(' ')[0]}. Browse today's menu or reserve an EV charging slot to get started.`,
      'SYSTEM'
    );

    const token = await signSession({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    const res = ok({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    res.cookies.set(sessionCookieOptions().name, token, sessionCookieOptions());
    return res;
  } catch (err) {
    return serverError(err);
  }
}
