'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input, Label, FieldError } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const token = params.get('token') ?? '';
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? 'Could not reset your password.');
        return;
      }
      setDone(true);
      toast({ kind: 'success', title: 'Password updated' });
      setTimeout(() => router.push('/login'), 1200);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 font-display text-sm text-white">
          W
        </div>
        <span className="font-display text-lg text-ink-900">Workplace</span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-7 shadow-card">
        <h1 className="font-display text-2xl text-ink-900">Set a new password</h1>

        {!token ? (
          <p className="mt-4 text-sm text-red-600">
            This reset link is missing its token. Request a new one from the{' '}
            <Link href="/forgot-password" className="underline">
              forgot password
            </Link>{' '}
            page.
          </p>
        ) : done ? (
          <p className="mt-4 text-sm text-teal-600">
            Password updated. Redirecting you to sign in...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <FieldError>{error ?? undefined}</FieldError>
            <Button type="submit" className="w-full" loading={loading}>
              Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
