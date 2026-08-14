import { cn } from '@/lib/utils';

/**
 * Signature element: a claim-ticket stub, echoing "skip the queue, collect
 * your order/charging slot" across the product, used in the landing hero,
 * order tracking, and reservation confirmations.
 */
export function Ticket({
  eyebrow,
  title,
  subtitle,
  right,
  children,
  className,
  accent = 'amber',
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  accent?: 'amber' | 'teal';
}) {
  const accentBar = accent === 'amber' ? 'bg-amber-400' : 'bg-teal-400';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-line bg-white shadow-card',
        className
      )}
    >
      <div className={cn('h-1.5 w-full', accentBar)} aria-hidden="true" />
      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
            {eyebrow}
          </p>
          <p className="mt-1 font-display text-lg text-ink-900">{title}</p>
          {subtitle && <p className="mt-0.5 text-sm text-ink-400">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children && (
        <>
          <div className="relative flex items-center px-5" aria-hidden="true">
            <div className="h-3 w-3 -translate-x-1/2 rounded-full bg-paper" />
            <div className="mx-1 h-px flex-1 border-t border-dashed border-ink-200" />
            <div className="h-3 w-3 translate-x-1/2 rounded-full bg-paper" />
          </div>
          <div className="p-5 pt-4">{children}</div>
        </>
      )}
    </div>
  );
}
