import type { Locale } from '@/lib/i18n';
import type { Note } from '@/lib/types';

export function EditorialLayout({ note, locale }: { note: Note; locale: Locale }) {
  return (
    <article className="editorial-grid mt-8">
      <div className="md:col-span-8 md:col-start-2 space-y-6">
        <h1 className="text-4xl font-bold leading-tight md:text-6xl">{note.title[locale]}</h1>
        <p className="text-sm uppercase tracking-[0.14em] text-ink/60">{note.date}</p>

        <div className="noise-border rounded-lg bg-base p-4 text-lg font-medium leading-relaxed">
          {note.highlight[locale]}
        </div>

        {note.sections[locale].map((paragraph) => (
          <p key={paragraph} className="text-lg leading-relaxed text-ink/88">
            {paragraph}
          </p>
        ))}

        <blockquote className="border-l-2 border-accent1 pl-4 font-mono text-sm text-ink/80">“{note.quote[locale]}”</blockquote>
      </div>

      <aside className="space-y-3 md:col-span-2 md:col-start-10">
        <p className="section-title">sidenotes</p>
        {note.sidenotes[locale].map((entry, idx) => (
          <p key={entry} className="rounded border border-ink/12 p-3 text-sm text-ink/70">
            [{idx + 1}] {entry}
          </p>
        ))}
      </aside>
    </article>
  );
}
