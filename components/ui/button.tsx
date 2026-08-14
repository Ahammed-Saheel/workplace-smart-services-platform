import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'teal';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-ink-900 text-white hover:bg-ink-700 focus-visible:ring-ink-900 disabled:bg-ink-300',
  secondary:
    'bg-amber-400 text-ink-900 hover:bg-amber-500 focus-visible:ring-amber-500 disabled:bg-amber-100',
  teal:
    'bg-teal-400 text-white hover:bg-teal-500 focus-visible:ring-teal-500 disabled:bg-teal-100',
  outline:
    'bg-transparent border border-ink-200 text-ink-900 hover:bg-ink-50 focus-visible:ring-ink-300',
  ghost:
    'bg-transparent text-ink-600 hover:bg-ink-50 hover:text-ink-900 focus-visible:ring-ink-200',
  danger:
    'bg-transparent border border-red-200 text-red-600 hover:bg-red-50 focus-visible:ring-red-300',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-70',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
