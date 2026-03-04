import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InteractiveDiagram } from '@/components/atlas/interactive-diagram';
import { getAtlasDiagram } from '@/lib/atlas';
import { getDictionary, type Locale } from '@/lib/i18n';

type PageProps = {
  params: {
    locale: Locale;
    slug: string;
  };
};

export function generateMetadata({ params }: PageProps): Metadata {
  const dict = getDictionary(params.locale);
  const diagram = getAtlasDiagram(params.slug);

  if (!diagram) {
    return {
      title: `${dict.nav.atlas} | StochStack`
    };
  }

  return {
    title: `${diagram.title} | ${dict.nav.atlas} | StochStack`,
    description: diagram.summary
  };
}

export default function AtlasDetailPage({ params }: PageProps) {
  const diagram = getAtlasDiagram(params.slug);
  const dict = getDictionary(params.locale);

  if (!diagram) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="section-title">atlas / interactive diagram</p>
        <h1 className="text-4xl font-bold md:text-6xl">{diagram.title}</h1>
        <p className="max-w-3xl text-lg text-ink/75">{diagram.summary}</p>
        <Link href={`/${params.locale}/atlas`} className="glitch-link text-sm">
          ← Back to {dict.nav.atlas}
        </Link>
      </section>

      <InteractiveDiagram diagram={diagram} />
    </div>
  );
}

