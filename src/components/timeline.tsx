import type { Locale } from '@/lib/i18n';
import type { LifeTimelineItem } from '@/lib/types';

export function Timeline({ items, locale }: { items: LifeTimelineItem[]; locale: Locale }) {
  return (
    <ol className="space-y-4 border-l border-ink/20 pl-4">
      {items.map((item) => (
        <li key={`${item.year}-${item.text.en}`} className="relative">
          <span className="absolute -left-[1.15rem] top-1 h-2 w-2 rounded-full bg-accent1" />
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink/65">{item.year}</p>
          <p className="mt-1 text-sm text-ink/85">{item.text[locale]}</p>
        </li>
      ))}
    </ol>
  );
}
