'use client';

import * as React from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input, Label, FieldError } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

const ROLE_HOME: Record<string, string> = {
  EMPLOYEE: '/employee/dashboard',
  CAFETERIA_OWNER: '/cafeteria-owner/dashboard',
  CHARGING_OWNER: '/charging-owner/dashboard',
  ADMIN: '/admin/dashboard',
};

const QUICK_ACCOUNTS = [
  { label: 'Employee', email: 'employee@demo.com' },
  { label: 'Cafeteria Owner', email: 'cafeteria@demo.com' },
  { label: 'Charging Operator', email: 'charging@demo.com' },
  { label: 'Admin', email: 'admin@demo.com' },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('Demo@1234');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? 'Could not sign in.');
        return;
      }
      toast({ kind: 'success', title: `Welcome back, ${json.data.user.name.split(' ')[0]}!` });
      const next = params.get('next');
      const targetUrl = next ?? ROLE_HOME[json.data.user.role] ?? '/';
      window.location.href = targetUrl;
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
        <h1 className="font-display text-2xl text-ink-900">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-400">Sign in to continue to your dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs font-medium text-teal-500 hover:text-teal-600">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <FieldError>{error ?? undefined}</FieldError>
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-400">
          New here?{' '}
          <Link href="/register" className="font-medium text-ink-900 hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      <div className="mt-6 w-full max-w-sm rounded-2xl border border-dashed border-ink-200 bg-white/60 p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-400">
          Quick-fill a demo account
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => setEmail(a.email)}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-ink-300"
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-300">Password for every demo account: Demo@1234</p>
      </div>
    </div>
  );
}
