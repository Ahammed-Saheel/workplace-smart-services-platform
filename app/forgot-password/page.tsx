'use client';

import * as React from 'react';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { Input, Label, FieldError } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [resetLink, setResetLink] = React.useState<string | null | undefined>(undefined);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? 'Something went wrong.');
        return;
      }
      setResetLink(json.data.resetLink);
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-50 text-ink-500">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="mt-4 font-display text-2xl text-ink-900">Reset your password</h1>
        <p className="mt-1 text-sm text-ink-400">
          Enter your account email and we'll get you a reset link.
        </p>

        {resetLink === undefined ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <FieldError>{error ?? undefined}</FieldError>
            <Button type="submit" className="w-full" loading={loading}>
              Send reset link
            </Button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
              <p className="font-medium">Demo mode: no email service is connected.</p>
              <p className="mt-1 text-amber-600">
                In production this link would be emailed to you. For this MVP, use it directly below.
              </p>
            </div>
            {resetLink ? (
              <Link
                href={resetLink}
                className="block rounded-xl bg-ink-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-ink-700"
              >
                Continue to reset password
              </Link>
            ) : (
              <p className="text-sm text-ink-400">
                If an account exists for that email, a reset link has been generated.
              </p>
            )}
          </div>
        )}

        <p className="mt-5 text-center text-sm text-ink-400">
          <Link href="/login" className="font-medium text-ink-900 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
