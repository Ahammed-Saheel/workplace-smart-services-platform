import { initials, cn } from '@/lib/utils';

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white',
        className
      )}
      aria-hidden="true"
    >
      {initials(name || '?')}
    </div>
  );
}
