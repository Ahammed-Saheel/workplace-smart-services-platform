import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppChrome } from '@/components/layout/app-chrome';
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Users', href: '/admin/users', icon: 'users' },
  { label: 'Cafeterias', href: '/admin/cafeterias', icon: 'cafeterias' },
  { label: 'Charging', href: '/admin/charging', icon: 'charging' },
  { label: 'Orders', href: '/admin/orders', icon: 'orders' },
  { label: 'Reservations', href: '/admin/reservations', icon: 'reservations' },
  { label: 'Activity Logs', href: '/admin/activity', icon: 'activity' },
  { label: 'Settings', href: '/admin/settings', icon: 'settings' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  return (
    <AppChrome
      navItems={NAV_ITEMS}
      roleLabel="Platform Admin"
      userName={session.name}
      userEmail={session.email}
      mobilePrimaryHrefs={[
        '/admin/dashboard',
        '/admin/users',
        '/admin/cafeterias',
        '/admin/charging',
        '/admin/activity',
      ]}
    >
      {children}
    </AppChrome>
  );
}
