import { db, newId, nowISO } from '@/lib/db';
import type { PollRow, PollOptionRow } from '@/types/db';

export interface PollOptionWithVotes extends PollOptionRow {
  voteCount: number;
}

export interface PollWithOptions extends PollRow {
  cafeteriaName: string;
  options: PollOptionWithVotes[];
  totalVotes: number;
  myVoteOptionId?: string | null;
}

function attachOptions(poll: PollRow, userId?: string): PollWithOptions {
  const options = db
    .prepare(
      `SELECT po.*, (SELECT COUNT(*) FROM PollVote pv WHERE pv.optionId = po.id) as voteCount
       FROM PollOption po WHERE po.pollId = ?`
    )
    .all(poll.id) as PollOptionWithVotes[];

  const cafeteria = db
    .prepare('SELECT name FROM Cafeteria WHERE id = ?')
    .get(poll.cafeteriaId) as { name: string } | undefined;

  const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);

  let myVoteOptionId: string | null | undefined = undefined;
  if (userId) {
    const vote = db
      .prepare('SELECT optionId FROM PollVote WHERE pollId = ? AND userId = ?')
      .get(poll.id, userId) as { optionId: string } | undefined;
    myVoteOptionId = vote?.optionId ?? null;
  }

  return {
    ...poll,
    cafeteriaName: cafeteria?.name ?? '',
    options,
    totalVotes,
    myVoteOptionId,
  };
}

export function listPolls(filters: {
  cafeteriaId?: string;
  activeOnly?: boolean;
  userId?: string;
}): PollWithOptions[] {
  let sql = 'SELECT * FROM Poll WHERE 1=1';
  const params: Record<string, unknown> = {};
  if (filters.cafeteriaId) {
    sql += ' AND cafeteriaId = @cafeteriaId';
    params.cafeteriaId = filters.cafeteriaId;
  }
  if (filters.activeOnly) {
    sql += ' AND active = 1 AND endDate >= @now';
    params.now = nowISO();
  }
  sql += ' ORDER BY createdAt DESC';

  const polls = db.prepare(sql).all(params) as PollRow[];
  return polls.map((p) => attachOptions(p, filters.userId));
}

export function findPollById(id: string, userId?: string): PollWithOptions | undefined {
  const poll = db.prepare('SELECT * FROM Poll WHERE id = ?').get(id) as PollRow | undefined;
  if (!poll) return undefined;
  return attachOptions(poll, userId);
}

export function createPoll(input: {
  cafeteriaId: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  options: string[];
}): PollWithOptions {
  const id = newId('poll');
  const now = nowISO();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO Poll (id, cafeteriaId, title, description, startDate, endDate, active, createdAt)
       VALUES (@id, @cafeteriaId, @title, @description, @startDate, @endDate, 1, @now)`
    ).run({
      id,
      cafeteriaId: input.cafeteriaId,
      title: input.title,
      description: input.description ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      now,
    });
    const insertOption = db.prepare(
      'INSERT INTO PollOption (id, pollId, option) VALUES (?, ?, ?)'
    );
    for (const option of input.options) {
      insertOption.run(newId('opt'), id, option);
    }
  });
  tx();

  return findPollById(id)!;
}

export function setPollActive(id: string, active: boolean) {
  db.prepare('UPDATE Poll SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
}

export function findPollOption(id: string): PollOptionRow | undefined {
  return db.prepare('SELECT * FROM PollOption WHERE id = ?').get(id) as
    | PollOptionRow
    | undefined;
}

export function hasVoted(pollId: string, userId: string): boolean {
  const row = db
    .prepare('SELECT 1 FROM PollVote WHERE pollId = ? AND userId = ?')
    .get(pollId, userId);
  return !!row;
}

/** Throws if the DB unique constraint (pollId, userId) rejects a duplicate vote. */
export function castVote(pollId: string, optionId: string, userId: string) {
  db.prepare('INSERT INTO PollVote (id, pollId, optionId, userId, createdAt) VALUES (?, ?, ?, ?, ?)').run(
    newId('vote'),
    pollId,
    optionId,
    userId,
    nowISO()
  );
}

export function countActivePolls(): number {
  return (
    db
      .prepare(`SELECT COUNT(*) as c FROM Poll WHERE active = 1 AND endDate >= @now`)
      .get({ now: nowISO() }) as { c: number }
  ).c;
}
