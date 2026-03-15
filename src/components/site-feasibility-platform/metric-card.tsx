import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function MetricCard({
  label,
  value,
  detail,
  tone = 'neutral'
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'accent' | 'warn';
}) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden p-5',
        tone === 'accent' && 'border-accent1/35 bg-gradient-to-br from-white via-white to-accent1/10',
        tone === 'warn' && 'border-orange-300/60 bg-gradient-to-br from-white via-white to-orange-100/60'
      )}
    >
      <div className="absolute right-4 top-4 rounded-full border border-ink/10 p-1 text-ink/40">
        <ArrowUpRight size={14} />
      </div>
      <Badge className="border-ink/10 bg-white/70">{label}</Badge>
      <CardTitle className="mt-4 text-3xl font-bold">{value}</CardTitle>
      <CardDescription className="mt-2">{detail}</CardDescription>
    </Card>
  );
}

