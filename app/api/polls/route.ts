import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { createPollSchema } from '@/lib/validation';
import { created, ok, unauthorized, forbidden, notFound, zodFail, serverError, fail } from '@/lib/api-response';
import { logActivity, notify } from '@/lib/notifications';
import { listPolls, createPoll } from '@/lib/repo/polls';
import { findCafeteriaByOwnerId } from '@/lib/repo/cafeterias';
import { listEmployeeIds } from '@/lib/repo/users';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    let cafeteriaId: string | undefined;
    if (session.role === 'CAFETERIA_OWNER') {
      const cafeteria = findCafeteriaByOwnerId(session.sub);
      if (!cafeteria) return ok({ polls: [] });
      cafeteriaId = cafeteria.id;
    }

    const polls = listPolls({ cafeteriaId, activeOnly, userId: session.sub });
    return ok({ polls });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'CAFETERIA_OWNER') return forbidden('Only cafeteria owners can create polls.');

    const body = await req.json();
    const parsed = createPollSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const cafeteria = findCafeteriaByOwnerId(session.sub);
    if (!cafeteria) return notFound('You do not manage a cafeteria yet.');

    const start = new Date(parsed.data.startDate);
    const end = new Date(parsed.data.endDate);
    if (end <= start) return fail('End date must be after the start date.', 422);

    const poll = createPoll({
      cafeteriaId: cafeteria.id,
      title: parsed.data.title,
      description: parsed.data.description,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      options: parsed.data.options,
    });

    await logActivity(session.sub, 'Poll created', 'Poll', poll.id);

    const employeeIds = listEmployeeIds();
    await Promise.all(
      employeeIds.map((id) =>
        notify(id, 'New food poll', `Vote now: "${poll.title}"`, 'POLL', '/employee/polls')
      )
    );

    return created({ poll });
  } catch (err) {
    return serverError(err);
  }
}
