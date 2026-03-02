import type { Metadata } from 'next';
import { SignalPoster } from '@/components/signal-poster';
import { DataFoundationCard } from '@/components/data-foundation-card';
import { getDictionary, type Locale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  return {
    title: 'Signal',
    description: dict.signal.subtitle,
    openGraph: {
      title: `Signal | StochStack`,
      description: dict.signal.subtitle
    }
  };
}

export default function SignalPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <p className="section-title">hidden signal page</p>
        <h1 className="text-5xl font-bold md:text-7xl">{dict.signal.title}</h1>
        <p className="text-lg text-ink/75">{dict.signal.subtitle}</p>
      </div>

      {/* Signal Logs Articles */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Signal Logs</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <DataFoundationCard locale={params.locale} />
        </div>
      </section>

      <SignalPoster regenerateLabel={dict.signal.regenerate} downloadLabel={dict.signal.download} />
    </div>
  );
}
