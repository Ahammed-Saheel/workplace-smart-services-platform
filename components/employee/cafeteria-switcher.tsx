'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MenuBrowser } from '@/components/employee/menu-browser';

interface CafeteriaView {
  id: string;
  name: string;
  status: string;
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    preparationTime: number;
    available: number | boolean;
  }[];
}

export function CafeteriaSwitcher({ cafeterias }: { cafeterias: CafeteriaView[] }) {
  const [activeId, setActiveId] = React.useState(cafeterias[0]?.id);
  const active = cafeterias.find((c) => c.id === activeId) ?? cafeterias[0];

  if (!active) return null;

  return (
    <div>
      <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-none">
        {cafeterias.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium',
              active.id === c.id
                ? 'border-ink-900 bg-ink-900 text-white'
                : 'border-line bg-white text-ink-600 hover:border-ink-300'
            )}
          >
            {c.name}
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                c.status === 'OPEN' ? 'bg-teal-400' : 'bg-ink-300'
              )}
            />
          </button>
        ))}
      </div>
      <MenuBrowser
        cafeteriaId={active.id}
        cafeteriaName={active.name}
        cafeteriaOpen={active.status === 'OPEN'}
        items={active.items}
      />
    </div>
  );
}
