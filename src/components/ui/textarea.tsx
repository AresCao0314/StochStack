import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn('w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-ink/50', className)}
      {...props}
    />
  );
});
