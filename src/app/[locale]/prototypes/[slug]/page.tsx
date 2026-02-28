import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MarketIntelligencePrototype } from '@/components/market-intelligence-prototype';
import { getDictionary, locales, type Locale } from '@/lib/i18n';
import { getPortBySlug, getPorts } from '@/lib/content';
import projects from '@/content/market-intelligence/projects.json';
import signals from '@/content/market-intelligence/signals.json';
import digest from '@/content/market-intelligence/digest.json';

export function generateStaticParams() {
  const ports = getPorts();
  return locales.flatMap((locale) => ports.map((port) => ({ locale, slug: port.slug })));
}

export async function generateMetadata({ params }: { params: { locale: Locale; slug: string } }): Promise<Metadata> {
  const port = getPortBySlug(params.slug);
  if (!port) return {};
  return {
    title: port.name[params.locale],
    description: port.description[params.locale],
    openGraph: {
      title: `${port.name[params.locale]} | StochStack`,
      description: port.description[params.locale]
    }
  };
}

export default function PrototypeDetailPage({ params }: { params: { locale: Locale; slug: string } }) {
  if (params.slug === 'market-intelligence-highscore') {
    return (
      <MarketIntelligencePrototype
        locale={params.locale}
        projects={projects}
        signals={signals}
        digest={digest}
      />
    );
  }

  const dict = getDictionary(params.locale);
  const port = getPortBySlug(params.slug);

  if (!port) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <p className="section-title">prototype detail</p>
        <h1 className="text-4xl font-bold md:text-6xl">{port.name[params.locale]}</h1>
        <p className="max-w-3xl text-lg text-ink/75">{port.description[params.locale]}</p>
      </header>

      <div className="noise-border overflow-hidden rounded-lg">
        <Image
          src={port.screenshot}
          alt={port.name[params.locale]}
          width={1200}
          height={720}
          className="h-auto w-full object-cover"
        />
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {port.techStack.map((item) => (
              <span key={item} className="rounded border border-ink/15 px-2 py-1 text-xs uppercase tracking-[0.12em]">
                {item}
              </span>
            ))}
          </div>
          <a href={port.link} target="_blank" rel="noreferrer" className="glitch-link inline-block text-sm">
            {dict.common.visit}
          </a>
        </div>

        <div className="noise-border rounded-lg bg-warm p-4">
          <h2 className="mb-2 text-xl font-semibold">{dict.common.designIntent}</h2>
          <p className="text-ink/85">{port.designIntent[params.locale]}</p>
        </div>
      </section>
    </div>
  );
}
