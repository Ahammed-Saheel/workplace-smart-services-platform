import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppChrome } from '@/components/layout/app-chrome';
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/charging-owner/dashboard', icon: 'dashboard' },
  { label: 'Stations', href: '/charging-owner/stations', icon: 'stations' },
  { label: 'Chargers', href: '/charging-owner/chargers', icon: 'chargers' },
  { label: 'Reservations', href: '/charging-owner/reservations', icon: 'reservations' },
  { label: 'Analytics', href: '/charging-owner/analytics', icon: 'analytics' },
  { label: 'Profile', href: '/charging-owner/profile', icon: 'profile' },
];

export default async function ChargingOwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'CHARGING_OWNER') redirect('/login');

  return (
    <AppChrome
      navItems={NAV_ITEMS}
      roleLabel="Charging Operator"
      userName={session.name}
      userEmail={session.email}
      mobilePrimaryHrefs={[
        '/charging-owner/dashboard',
        '/charging-owner/stations',
        '/charging-owner/chargers',
        '/charging-owner/reservations',
        '/charging-owner/profile',
      ]}
    >
      {children}
    </AppChrome>
  );
}
