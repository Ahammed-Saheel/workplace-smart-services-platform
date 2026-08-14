import { ok } from '@/lib/api-response';
import { sessionCookieOptions } from '@/lib/auth';

export async function POST() {
  const res = ok({ loggedOut: true });
  res.cookies.set(sessionCookieOptions().name, '', {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return res;
}
