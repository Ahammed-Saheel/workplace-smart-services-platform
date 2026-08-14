import { Settings, Building2, ShieldCheck, KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { getDefaultWorkplace } from '@/lib/repo/workplaces';

export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  const workplace = getDefaultWorkplace();

  return (
    <div>
      <PageHeader title="Settings" description="Platform configuration for this workplace." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-50 text-ink-500">
              <Building2 className="h-4 w-4" />
            </div>
            <p className="font-medium text-ink-900">Workplace</p>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-400">Name</dt>
              <dd className="text-ink-900">{workplace?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">Location</dt>
              <dd className="text-ink-900">{workplace?.location}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">Status</dt>
              <dd className="text-ink-900">{workplace?.active ? 'Active' : 'Inactive'}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-50 text-ink-500">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="font-medium text-ink-900">Security</p>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-ink-500">
            <li>Passwords are hashed with bcrypt before storage.</li>
            <li>Sessions use signed, httpOnly JWT cookies.</li>
            <li>Every API route re-checks role and resource ownership server-side.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-card lg:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-50 text-ink-500">
              <KeyRound className="h-4 w-4" />
            </div>
            <p className="font-medium text-ink-900">Demo mode</p>
          </div>
          <p className="mt-2 text-sm text-ink-500">
            This MVP uses simulated payments for EV charging reservations and does not send real
            emails. Password resets show the reset link directly on screen instead. Both are
            clearly labeled in the UI wherever they appear.
          </p>
        </div>
      </div>
    </div>
  );
}
