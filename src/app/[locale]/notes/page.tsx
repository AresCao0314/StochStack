import type { Metadata } from 'next';
import { NotesBrowser } from '@/components/notes-browser';
import { NotesCapture } from '@/components/notes-capture';
import { getDictionary, type Locale } from '@/lib/i18n';
import { getNotes } from '@/lib/content';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  return {
    title: dict.nav.notes,
    description: dict.notes.subtitle,
    openGraph: {
      title: `${dict.nav.notes} | StochStack`,
      description: dict.notes.subtitle
    }
  };
}

export default function NotesPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">editorial feed</p>
        <h1 className="text-5xl font-bold md:text-7xl">{dict.notes.title}</h1>
        <p className="max-w-3xl text-lg text-ink/75">{dict.notes.subtitle}</p>
      </header>

      <NotesBrowser
        locale={params.locale}
        notes={getNotes()}
        allLabel={dict.common.all}
        topicLabel={dict.common.filterByTag}
      />

      <NotesCapture locale={params.locale} dict={dict.notes.capture} />
    </div>
  );
}
