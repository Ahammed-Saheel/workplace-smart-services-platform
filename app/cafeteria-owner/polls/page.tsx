'use client';

import * as React from 'react';
import { Plus, Vote, X, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea, Label } from '@/components/ui/input';
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
  active: number;
  startDate: string;
  endDate: string;
  options: PollOption[];
  totalVotes: number;
}

function defaultDates() {
  const start = new Date();
  const end = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default function CafeteriaOwnerPollsPage() {
  const [polls, setPolls] = React.useState<Poll[] | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [options, setOptions] = React.useState(['', '', '']);
  const { start, end } = defaultDates();
  const [startDate, setStartDate] = React.useState(start);
  const [endDate, setEndDate] = React.useState(end);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    const res = await fetch('/api/polls', { cache: 'no-store' });
    const json = await res.json();
    if (json.success) setPolls(json.data.polls);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }
  function addOption() {
    if (options.length < 6) setOptions((prev) => [...prev, '']);
  }
  function removeOption(i: number) {
    if (options.length > 2) setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setError('Add at least 2 options.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          options: cleanOptions,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate + 'T23:59:59').toISOString(),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? 'Could not create poll.');
        return;
      }
      toast({ kind: 'success', title: 'Poll created', description: 'Employees have been notified.' });
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setOptions(['', '', '']);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function togglePoll(poll: Poll) {
    const res = await fetch(`/api/polls/${poll.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !poll.active }),
    });
    const json = await res.json();
    if (json.success) {
      toast({ kind: 'success', title: poll.active ? 'Poll closed' : 'Poll reopened' });
      load();
    }
  }

  return (
    <div>
      <PageHeader
        title="Food Polls"
        description="Ask employees to vote on upcoming specials."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Create poll
          </Button>
        }
      />

      {polls === null ? (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
      ) : polls.length === 0 ? (
        <EmptyState icon={Vote} title="No polls yet" action={<Button onClick={() => setModalOpen(true)}>Create your first poll</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {polls.map((poll) => {
            const isOpen = !!poll.active && new Date(poll.endDate) >= new Date();
            return (
              <div key={poll.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg text-ink-900">{poll.title}</p>
                    <p className="text-xs text-ink-400">
                      {formatDate(poll.startDate)} – {formatDate(poll.endDate)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      isOpen ? 'bg-teal-50 text-teal-600' : 'bg-ink-50 text-ink-400'
                    )}
                  >
                    {isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {poll.options.map((opt) => {
                    const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id} className="relative overflow-hidden rounded-xl border border-line">
                        <div className="absolute inset-y-0 left-0 bg-amber-100" style={{ width: `${pct}%` }} aria-hidden="true" />
                        <div className="relative flex items-center justify-between px-3.5 py-2 text-sm">
                          <span className="font-medium text-ink-800">{opt.option}</span>
                          <span className="text-ink-400">{pct}% ({opt.voteCount})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-ink-300">{poll.totalVotes} total votes</p>
                  <button
                    onClick={() => togglePoll(poll)}
                    className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900"
                  >
                    {poll.active ? <><X className="h-3.5 w-3.5" /> Close poll</> : <><RotateCcw className="h-3.5 w-3.5" /> Reopen</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create a poll">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="poll-title">Title</Label>
            <Input id="poll-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What should tomorrow's special be?" />
          </div>
          <div>
            <Label htmlFor="poll-desc">Description (optional)</Label>
            <Textarea id="poll-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Options</Label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    required={i < 2}
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} className="shrink-0 rounded-lg px-2 text-ink-300 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button type="button" onClick={addOption} className="mt-2 text-sm font-medium text-teal-500 hover:text-teal-600">
                + Add option
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="poll-start">Start date</Label>
              <Input id="poll-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="poll-end">End date</Label>
              <Input id="poll-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={saving}>Create poll</Button>
        </form>
      </Modal>
    </div>
  );
}
