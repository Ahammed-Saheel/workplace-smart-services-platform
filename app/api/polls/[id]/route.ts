import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { ok, unauthorized, forbidden, notFound, serverError } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import { findPollById, setPollActive } from '@/lib/repo/polls';
import { findCafeteriaById } from '@/lib/repo/cafeterias';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();

    const poll = findPollById(id, session.sub);
    if (!poll) return notFound('Poll not found.');
    return ok({ poll });
  } catch (err) {
    return serverError(err);
  }
}

// Owner closes/reopens a poll.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'CAFETERIA_OWNER') return forbidden();

    const poll = findPollById(id);
    if (!poll) return notFound('Poll not found.');
    const cafeteria = findCafeteriaById(poll.cafeteriaId);
    if (cafeteria?.ownerId !== session.sub) return forbidden();

    const body = await req.json();
    const active = typeof body.active === 'boolean' ? body.active : false;

    setPollActive(id, active);
    await logActivity(session.sub, active ? 'Poll reopened' : 'Poll closed', 'Poll', poll.id);
    return ok({ poll: findPollById(id, session.sub) });
  } catch (err) {
    return serverError(err);
  }
}
