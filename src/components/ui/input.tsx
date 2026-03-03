import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn('w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-ink/50', className)}
      {...props}
    />
  );
});
