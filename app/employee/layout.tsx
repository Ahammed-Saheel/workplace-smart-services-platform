import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppChrome } from '@/components/layout/app-chrome';
import { CartProvider } from '@/components/employee/cart-context';


const NAV_ITEMS = [
  { label: 'Home', href: '/employee/dashboard', icon: 'home' },
  { label: 'Cafeteria', href: '/employee/cafeteria', icon: 'cafeteria' },
  { label: 'Orders', href: '/employee/orders', icon: 'orders' },
  { label: 'EV Charging', href: '/employee/charging', icon: 'charging' },
  { label: 'Food Requests', href: '/employee/requests', icon: 'requests' },
  { label: 'Food Polls', href: '/employee/polls', icon: 'polls' },
  { label: 'Notifications', href: '/employee/notifications', icon: 'notifications' },
  { label: 'Profile', href: '/employee/profile', icon: 'profile' },
];

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE') redirect('/login');

  return (
    <CartProvider>
      <AppChrome
        navItems={NAV_ITEMS}
        roleLabel="Employee"
        userName={session.name}
        userEmail={session.email}
        mobilePrimaryHrefs={[
          '/employee/dashboard',
          '/employee/cafeteria',
          '/employee/orders',
          '/employee/charging',
          '/employee/profile',
        ]}
      >
        {children}
      </AppChrome>
    </CartProvider>
  );
}
