import type { Metadata } from 'next';
import Link from 'next/link';
import { getAtlasDiagrams } from '@/lib/atlas';
import { getDictionary, type Locale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  return {
    title: `${dict.nav.atlas} | StochStack`,
    description: dict.atlas.subtitle,
    openGraph: {
      title: `${dict.nav.atlas} | StochStack`,
      description: dict.atlas.subtitle
    }
  };
}

function Node({ label, tone = 'ink' }: { label: string; tone?: 'ink' | 'accent1' | 'accent2' }) {
  const toneClass =
    tone === 'accent1'
      ? 'border-accent1/50 bg-accent1/15'
      : tone === 'accent2'
        ? 'border-accent2/50 bg-accent2/15'
        : 'border-ink/25 bg-base';

  return <div className={`rounded-md border px-3 py-2 text-xs text-ink ${toneClass}`}>{label}</div>;
}

export default function AtlasPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const diagrams = getAtlasDiagrams();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="section-title">atlas / architecture / signal maps</p>
        <h1 className="text-5xl font-bold md:text-7xl">{dict.atlas.title}</h1>
        <p className="max-w-3xl text-lg text-ink/75">{dict.atlas.subtitle}</p>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {diagrams.map((diagram, index) => (
          <article key={diagram.slug} className="noise-border scanline flex flex-col rounded-lg p-5">
            <p className="section-title">{String(index + 1).padStart(2, '0')} · Atlas</p>
            <h2 className="mt-2 text-xl font-semibold">{diagram.title}</h2>
            <p className="mt-2 text-sm text-ink/70">{diagram.summary}</p>

            <div className="mt-4 grid gap-2 text-xs">
              {diagram.layers.map((layer) => (
                <Node key={layer.id} label={layer.label} tone={layer.id === diagram.layers[0]?.id ? 'accent1' : 'ink'} />
              ))}
            </div>

            <div className="mt-5">
              <Link
                href={`/${params.locale}/atlas/${diagram.slug}`}
                className="inline-flex items-center rounded-md border border-ink/35 px-3 py-1.5 text-sm font-medium hover:bg-ink/10"
              >
                Open Interactive
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
