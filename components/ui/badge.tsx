import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'amber' | 'teal' | 'green' | 'red' | 'blue';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-ink-50 text-ink-500 border-ink-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  teal: 'bg-teal-50 text-teal-500 border-teal-100',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  blue: 'bg-sky-50 text-sky-600 border-sky-100',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
