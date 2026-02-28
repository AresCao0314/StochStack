import type { Locale } from '@/lib/i18n';

export type LogEntry = {
  date: string;
  version: string;
  title: Record<Locale, string>;
  changes: Record<Locale, string[]>;
};

export function PrototypeChangelog({ locale, entries }: { locale: Locale; entries: LogEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="mt-12 space-y-3 border-t border-ink/15 pt-6">
      <p className="section-title">update log</p>
      <h2 className="text-2xl font-semibold">Prototype Change Log</h2>
      <ol className="space-y-4 border-l border-ink/20 pl-4">
        {entries.map((entry) => (
          <li key={`${entry.version}-${entry.date}`} className="relative">
            <span className="absolute -left-[1.15rem] top-1 h-2 w-2 rounded-full bg-accent1" />
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-ink/65">
              {entry.date} · {entry.version}
            </p>
            <p className="mt-1 text-sm font-medium">{entry.title[locale]}</p>
            <ul className="mt-2 space-y-1 text-sm text-ink/78">
              {entry.changes[locale].map((line) => (
                <li key={line}>- {line}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
