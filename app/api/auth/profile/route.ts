import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateProfileSchema } from '@/lib/validation';
import { ok, unauthorized, zodFail, serverError } from '@/lib/api-response';
import { updateUserProfile, findPublicUserById } from '@/lib/repo/users';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    updateUserProfile(session.sub, parsed.data.name);
    const user = findPublicUserById(session.sub);

    return ok({ user });
  } catch (err) {
    return serverError(err);
  }
}
