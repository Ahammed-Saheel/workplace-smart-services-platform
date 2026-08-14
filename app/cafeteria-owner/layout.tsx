import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppChrome } from '@/components/layout/app-chrome';
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/cafeteria-owner/dashboard', icon: 'dashboard' },
  { label: 'Orders', href: '/cafeteria-owner/orders', icon: 'orders' },
  { label: 'Menu', href: '/cafeteria-owner/menu', icon: 'menu' },
  { label: 'Polls', href: '/cafeteria-owner/polls', icon: 'polls' },
  { label: 'Dish Requests', href: '/cafeteria-owner/requests', icon: 'requests' },
  { label: 'Analytics', href: '/cafeteria-owner/analytics', icon: 'analytics' },
  { label: 'Profile', href: '/cafeteria-owner/profile', icon: 'profile' },
];

export default async function CafeteriaOwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'CAFETERIA_OWNER') redirect('/login');

  return (
    <AppChrome
      navItems={NAV_ITEMS}
      roleLabel="Cafeteria Owner"
      userName={session.name}
      userEmail={session.email}
      mobilePrimaryHrefs={[
        '/cafeteria-owner/dashboard',
        '/cafeteria-owner/orders',
        '/cafeteria-owner/menu',
        '/cafeteria-owner/polls',
        '/cafeteria-owner/profile',
      ]}
    >
      {children}
    </AppChrome>
  );
}
