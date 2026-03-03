import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'default' && 'bg-ink text-base hover:opacity-90',
        variant === 'outline' && 'border border-ink/25 bg-white text-ink hover:border-ink/55',
        variant === 'ghost' && 'text-ink hover:bg-ink/5',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        className
      )}
      {...props}
    />
  );
});
