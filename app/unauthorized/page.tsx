import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1 className="mt-5 font-display text-2xl text-ink-900">You don't have access to this page</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-400">
        This area is restricted to a different role. If you think this is a mistake, contact your
        platform admin.
      </p>
      <Link
        href="/login"
        className="mt-6 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-700"
      >
        Back to sign in
      </Link>
    </div>
  );
}
