'use client';

import * as React from 'react';
import { Vote, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toaster';
import { formatDate, cn } from '@/lib/utils';

interface PollOption {
  id: string;
  option: string;
  voteCount: number;
}
interface Poll {
  id: string;
  title: string;
  description: string | null;
  cafeteriaName: string;
  active: number;
  endDate: string;
  options: PollOption[];
  totalVotes: number;
  myVoteOptionId?: string | null;
}

export default function EmployeePollsPage() {
  const [polls, setPolls] = React.useState<Poll[] | null>(null);
  const [votingId, setVotingId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    const res = await fetch('/api/polls', { cache: 'no-store' });
    const json = await res.json();
    if (json.success) setPolls(json.data.polls);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleVote(pollId: string, optionId: string) {
    setVotingId(pollId);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      const json = await res.json();
      if (!json.success) {
        toast({ kind: 'error', title: "Couldn't vote", description: json.message });
        return;
      }
      toast({ kind: 'success', title: 'Vote recorded!' });
      load();
    } finally {
      setVotingId(null);
    }
  }

  const isOpen = (p: Poll) => !!p.active && new Date(p.endDate) >= new Date();

  return (
    <div>
      <PageHeader title="Food Polls" description="Vote for what you'd like to see on the menu next." />

      {polls === null ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : polls.length === 0 ? (
        <EmptyState icon={Vote} title="No polls right now" description="Check back when the cafeteria opens a new poll." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {polls.map((poll) => {
            const open = isOpen(poll);
            const voted = !!poll.myVoteOptionId;
            const showResults = voted || !open;
            return (
              <div key={poll.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg text-ink-900">{poll.title}</p>
                    <p className="text-xs text-ink-400">
                      {poll.cafeteriaName} · {open ? `Closes ${formatDate(poll.endDate)}` : 'Closed'}
                    </p>
                  </div>
                </div>
                {poll.description && <p className="mt-2 text-sm text-ink-500">{poll.description}</p>}

                <div className="mt-4 space-y-2">
                  {poll.options.map((opt) => {
                    const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;
                    const isMine = poll.myVoteOptionId === opt.id;
                    if (showResults) {
                      return (
                        <div key={opt.id} className="relative overflow-hidden rounded-xl border border-line">
                          <div
                            className={cn('absolute inset-y-0 left-0', isMine ? 'bg-amber-100' : 'bg-ink-50')}
                            style={{ width: `${pct}%` }}
                            aria-hidden="true"
                          />
                          <div className="relative flex items-center justify-between px-3.5 py-2.5 text-sm">
                            <span className="flex items-center gap-1.5 font-medium text-ink-800">
                              {isMine && <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />}
                              {opt.option}
                            </span>
                            <span className="text-ink-400">{pct}% ({opt.voteCount})</span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleVote(poll.id, opt.id)}
                        disabled={votingId === poll.id}
                        className="w-full rounded-xl border border-line px-3.5 py-2.5 text-left text-sm font-medium text-ink-700 hover:border-ink-900 hover:bg-ink-50 disabled:opacity-50"
                      >
                        {opt.option}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-ink-300">{poll.totalVotes} vote{poll.totalVotes === 1 ? '' : 's'} total</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
