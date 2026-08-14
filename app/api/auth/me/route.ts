import { getSession } from '@/lib/auth';
import { ok, unauthorized, serverError } from '@/lib/api-response';
import { findPublicUserById } from '@/lib/repo/users';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const user = findPublicUserById(session.sub);
    if (!user) return unauthorized();

    let workplace: { name: string; location: string } | undefined;
    if (user.workplaceId) {
      workplace = db
        .prepare('SELECT name, location FROM Workplace WHERE id = ?')
        .get(user.workplaceId) as { name: string; location: string } | undefined;
    }

    return ok({ user: { ...user, active: !!user.active, workplace } });
  } catch (err) {
    return serverError(err);
  }
}
