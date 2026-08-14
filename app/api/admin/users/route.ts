import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { ok, unauthorized, forbidden, serverError } from '@/lib/api-response';
import { listUsers } from '@/lib/repo/users';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'ADMIN') return forbidden();

    const { searchParams } = new URL(req.url);
    const activeParam = searchParams.get('active');

    const users = listUsers({
      role: searchParams.get('role') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      active: activeParam === 'true' ? true : activeParam === 'false' ? false : undefined,
    });

    return ok({ users: users.map((u) => ({ ...u, active: !!u.active })) });
  } catch (err) {
    return serverError(err);
  }
}
