'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

export function CafeteriaStatusToggle({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cafeterias/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status === 'OPEN' ? 'CLOSED' : 'OPEN' }),
      });
      const json = await res.json();
      if (!json.success) {
        toast({ kind: 'error', title: 'Could not update', description: json.message });
        return;
      }
      toast({ kind: 'success', title: status === 'OPEN' ? 'Cafeteria deactivated' : 'Cafeteria activated' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant={status === 'OPEN' ? 'danger' : 'outline'} loading={loading} onClick={toggle} className="w-full">
      {status === 'OPEN' ? 'Deactivate' : 'Activate'}
    </Button>
  );
}

export function StationStatusToggle({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/charging-stations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
      });
      const json = await res.json();
      if (!json.success) {
        toast({ kind: 'error', title: 'Could not update', description: json.message });
        return;
      }
      toast({ kind: 'success', title: status === 'ACTIVE' ? 'Station deactivated' : 'Station activated' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant={status === 'ACTIVE' ? 'danger' : 'outline'} loading={loading} onClick={toggle} className="w-full">
      {status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
    </Button>
  );
}
