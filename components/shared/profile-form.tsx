'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input, Label, FieldError } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toaster';

interface UserInfo {
  name: string;
  email: string;
  role: string;
  createdAt: string;
  workplace?: { name: string; location: string } | null;
}

const ROLE_LABEL: Record<string, string> = {
  EMPLOYEE: 'Employee',
  CAFETERIA_OWNER: 'Cafeteria Owner',
  CHARGING_OWNER: 'Charging Operator',
  ADMIN: 'Platform Admin',
};

export function ProfileForm({ user }: { user: UserInfo }) {
  const { toast } = useToast();
  const [name, setName] = React.useState(user.name);
  const [savingProfile, setSavingProfile] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [savingPassword, setSavingPassword] = React.useState(false);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!json.success) {
        toast({ kind: 'error', title: 'Could not update profile', description: json.message });
        return;
      }
      toast({ kind: 'success', title: 'Profile updated' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!json.success) {
        setPasswordError(json.message ?? 'Could not change password.');
        return;
      }
      toast({ kind: 'success', title: 'Password changed' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account details and password." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} className="h-12 w-12 text-sm" />
            <div>
              <p className="font-medium text-ink-900">{user.name}</p>
              <p className="text-sm text-ink-400">{ROLE_LABEL[user.role] ?? user.role}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>
            {user.workplace && (
              <div>
                <Label>Workplace</Label>
                <p className="text-sm text-ink-600">{user.workplace.name} · {user.workplace.location}</p>
              </div>
            )}
            <Button type="submit" loading={savingProfile}>Save changes</Button>
          </form>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <p className="font-medium text-ink-900">Change password</p>
          <p className="mt-1 text-sm text-ink-400">Choose a strong password you don't use elsewhere.</p>

          <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <FieldError>{passwordError ?? undefined}</FieldError>
            <Button type="submit" variant="outline" loading={savingPassword}>Update password</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
