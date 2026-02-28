import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditorialLayout } from '@/components/editorial-layout';
import { getDictionary, locales, type Locale } from '@/lib/i18n';
import { getNoteBySlug, getNotes } from '@/lib/content';

export function generateStaticParams() {
  const notes = getNotes();
  return locales.flatMap((locale) => notes.map((note) => ({ locale, slug: note.slug })));
}

export async function generateMetadata({ params }: { params: { locale: Locale; slug: string } }): Promise<Metadata> {
  const note = getNoteBySlug(params.slug);
  if (!note) return {};
  return {
    title: note.title[params.locale],
    description: note.excerpt[params.locale],
    openGraph: {
      title: `${note.title[params.locale]} | StochStack`,
      description: note.excerpt[params.locale]
    }
  };
}

export default function NoteDetailPage({ params }: { params: { locale: Locale; slug: string } }) {
  const note = getNoteBySlug(params.slug);
  if (!note) {
    notFound();
  }
  const dict = getDictionary(params.locale);

  return (
    <div className="space-y-6">
      <p className="section-title">{dict.notes.title}</p>
      <EditorialLayout note={note} locale={params.locale} />
    </div>
  );
}
