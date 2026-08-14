'use client';

import * as React from 'react';
import { Users, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toaster';
import { formatDate } from '@/lib/utils';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  EMPLOYEE: 'Employee',
  CAFETERIA_OWNER: 'Cafeteria Owner',
  CHARGING_OWNER: 'Charging Operator',
  ADMIN: 'Admin',
};

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserRow[] | null>(null);
  const [role, setRole] = React.useState('ALL');
  const [search, setSearch] = React.useState('');
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (role !== 'ALL') params.set('role', role);
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: 'no-store' });
    const json = await res.json();
    if (json.success) setUsers(json.data.users);
  }, [role, search]);

  React.useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function toggleActive(user: UserRow) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    });
    const json = await res.json();
    if (!json.success) {
      toast({ kind: 'error', title: 'Could not update user', description: json.message });
      return;
    }
    toast({ kind: 'success', title: user.active ? 'User suspended' : 'User reactivated' });
    load();
  }

  return (
    <div>
      <PageHeader title="Users" description="View and manage every account on the platform." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..." className="pl-9" />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="sm:w-56">
          <option value="ALL">All roles</option>
          <option value="EMPLOYEE">Employee</option>
          <option value="CAFETERIA_OWNER">Cafeteria Owner</option>
          <option value="CHARGING_OWNER">Charging Operator</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>

      {users === null ? (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users match your filters" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-ink-50/50 text-left text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} className="h-8 w-8 text-[11px]" />
                      <div>
                        <p className="font-medium text-ink-900">{u.name}</p>
                        <p className="text-xs text-ink-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{ROLE_LABEL[u.role] ?? u.role}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.active ? 'green' : 'red'}>{u.active ? 'Active' : 'Suspended'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant={u.active ? 'danger' : 'outline'} onClick={() => toggleActive(u)}>
                      {u.active ? 'Suspend' : 'Reactivate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
