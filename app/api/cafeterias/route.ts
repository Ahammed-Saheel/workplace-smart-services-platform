import { getSession } from '@/lib/auth';
import { ok, unauthorized, serverError } from '@/lib/api-response';
import { listCafeterias } from '@/lib/repo/cafeterias';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const cafeterias = listCafeterias();
    return ok({ cafeterias });
  } catch (err) {
    return serverError(err);
  }
}
