import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { pollVoteSchema } from '@/lib/validation';
import { created, unauthorized, forbidden, notFound, fail, zodFail, serverError } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import { findPollById, findPollOption, hasVoted, castVote } from '@/lib/repo/polls';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'EMPLOYEE') return forbidden('Only employees can vote in polls.');

    const poll = findPollById(id);
    if (!poll) return notFound('Poll not found.');
    if (!poll.active || new Date(poll.endDate) < new Date()) {
      return fail('This poll is closed and no longer accepting votes.', 409);
    }

    const body = await req.json();
    const parsed = pollVoteSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const option = findPollOption(parsed.data.optionId);
    if (!option || option.pollId !== poll.id) {
      return fail('That option does not belong to this poll.', 422);
    }

    if (hasVoted(poll.id, session.sub)) {
      return fail("You've already voted in this poll.", 409);
    }

    try {
      castVote(poll.id, parsed.data.optionId, session.sub);
    } catch (err: any) {
      // The UNIQUE(pollId, userId) constraint is the real safety net against
      // duplicate votes under concurrent requests.
      if (String(err?.message ?? '').includes('UNIQUE')) {
        return fail("You've already voted in this poll.", 409);
      }
      throw err;
    }

    await logActivity(session.sub, 'Voted in poll', 'Poll', poll.id);
    return created({ voted: true });
  } catch (err) {
    return serverError(err);
  }
}
