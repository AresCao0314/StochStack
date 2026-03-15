import { Badge } from '@/components/ui/badge';

export function SectionHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <Badge className="border-ink/10 bg-white/70">{eyebrow}</Badge>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        <p className="max-w-3xl text-sm text-ink/68 md:text-base">{description}</p>
      </div>
    </div>
  );
}

