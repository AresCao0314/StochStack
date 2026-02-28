import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LifeTabs } from '@/components/life-tabs';
import { Timeline } from '@/components/timeline';
import { getDictionary, type Locale } from '@/lib/i18n';
import { getLifeModule, getLifeSections } from '@/lib/content';

export async function generateMetadata({ params }: { params: { locale: Locale; section: string } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const label = dict.life.sections[params.section as keyof typeof dict.life.sections] ?? dict.nav.life;
  return {
    title: `${dict.nav.life} - ${label}`,
    description: dict.life.subtitle,
    openGraph: {
      title: `${label} | StochStack`,
      description: dict.life.subtitle
    }
  };
}

export default function LifeSectionPage({ params }: { params: { locale: Locale; section: string } }) {
  const dict = getDictionary(params.locale);
  if (!getLifeSections().includes(params.section as never)) {
    notFound();
  }

  const content = getLifeModule(params.section as keyof typeof dict.life.sections);

  return (
    <div className="space-y-8">
      <header>
        <p className="section-title">life module</p>
        <h1 className="text-5xl font-bold md:text-7xl">{dict.life.title}</h1>
        <p className="mt-3 text-lg text-ink/75">{dict.life.subtitle}</p>
      </header>

      <LifeTabs locale={params.locale} current={params.section} sections={dict.life.sections} />

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {content.cards.map((item) => (
          <article key={item.title.en} className="noise-border scanline rounded-lg p-4">
            <h3 className="mb-2 text-xl font-semibold">{item.title[params.locale]}</h3>
            <p className="text-sm text-ink/78">{item.note[params.locale]}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">{dict.common.timeline}</h2>
        <Timeline items={content.timeline} locale={params.locale} />
      </section>
    </div>
  );
}
