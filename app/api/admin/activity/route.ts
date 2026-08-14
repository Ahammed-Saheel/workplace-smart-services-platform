import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { ok, unauthorized, forbidden, serverError } from '@/lib/api-response';
import { listActivity } from '@/lib/repo/audit-log';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'ADMIN') return forbidden();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

    const logs = listActivity(limit);
    return ok({ logs });
  } catch (err) {
    return serverError(err);
  }
}
