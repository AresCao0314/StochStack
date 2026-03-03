import * as React from 'react';
import { cn } from '@/lib/utils';

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn('inline-flex items-center rounded border border-ink/20 bg-white/80 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em]', className)} {...props} />
  );
}
