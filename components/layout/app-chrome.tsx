'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  LayoutGrid,
  UtensilsCrossed,
  ClipboardList,
  Zap,
  MessageSquarePlus,
  Vote,
  Bell,
  User,
  Users,
  CalendarClock,
  ScrollText,
  Settings,
  BarChart3,
  Building2,
} from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { NotificationBell } from '@/components/layout/notification-bell';
import { useToast } from '@/components/ui/toaster';

export interface ChromeNavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: LayoutGrid,
  dashboard: LayoutGrid,
  cafeteria: UtensilsCrossed,
  cafeterias: UtensilsCrossed,
  menu: UtensilsCrossed,
  orders: ClipboardList,
  charging: Zap,
  chargers: Zap,
  requests: MessageSquarePlus,
  polls: Vote,
  notifications: Bell,
  profile: User,
  users: Users,
  reservations: CalendarClock,
  activity: ScrollText,
  settings: Settings,
  analytics: BarChart3,
  stations: Building2,
};

export function AppChrome({
  navItems,
  roleLabel,
  userName,
  userEmail,
  mobilePrimaryHrefs,
  children,
}: {
  navItems: ChromeNavItem[];
  roleLabel: string;
  userName: string;
  userEmail: string;
  mobilePrimaryHrefs?: string[];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => setDrawerOpen(false), [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast({ kind: 'success', title: 'Signed out' });
    router.push('/login');
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  const mobileNav = mobilePrimaryHrefs
    ? navItems.filter((n) => mobilePrimaryHrefs.includes(n.href))
    : navItems.slice(0, 5);

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-line px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 font-display text-sm text-white">
            W
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink-900">Workplace</p>
            <p className="text-[11px] text-ink-400">Smart Services Platform</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = NAV_ICONS[item.icon] || LayoutGrid;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-ink-900 text-white'
                    : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-semibold text-ink-900">
              {initials(userName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">{userName}</p>
              <p className="truncate text-xs text-ink-400">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="rounded-lg p-1.5 text-ink-300 hover:bg-ink-50 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-pop animate-fade-up">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 font-display text-sm text-white">
                  W
                </div>
                <p className="text-sm font-semibold text-ink-900">Workplace</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => {
                const Icon = NAV_ICONS[item.icon] || LayoutGrid;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                      active ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-50'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-line p-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topbar */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-50 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <div className="mx-1 hidden h-6 w-px bg-line sm:block" />
            <div className="hidden items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-white">
                {initials(userName)}
              </div>
              <span className="text-ink-600">{userName.split(' ')[0]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-ink-300" />
            </div>
          </div>
        </header>

        <main className="px-4 pb-24 pt-6 sm:px-6 md:pb-10">{children}</main>
      </div>

      {/* Mobile bottom quick-nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-white/95 backdrop-blur md:hidden">
        {mobileNav.map((item) => {
          const Icon = NAV_ICONS[item.icon] || LayoutGrid;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium',
                active ? 'text-ink-900' : 'text-ink-300'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-amber-500')} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
