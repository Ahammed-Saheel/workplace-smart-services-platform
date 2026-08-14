import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Workplace Smart Cafeteria & Services Platform',
  description:
    'Order food before you leave your desk, skip cafeteria queues, and reserve your EV charging slot in advance. Built for office campuses.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#12151C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
