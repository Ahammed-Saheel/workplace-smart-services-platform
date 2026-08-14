'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { label: string; value: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex w-full gap-1 overflow-x-auto rounded-xl bg-ink-50 p-1"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
            value === tab.value
              ? 'bg-white text-ink-900 shadow-card'
              : 'text-ink-400 hover:text-ink-700'
          )}
        >
          {tab.label}
          {typeof tab.count === 'number' && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                value === tab.value ? 'bg-ink-100 text-ink-600' : 'bg-ink-100/60 text-ink-400'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
