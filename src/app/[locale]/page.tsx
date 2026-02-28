import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroSignal } from '@/components/hero-signal';
import { PortGrid } from '@/components/port-grid';
import { getDictionary, type Locale } from '@/lib/i18n';
import { getPorts } from '@/lib/content';

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  return {
    title: dict.nav.home,
    description: dict.home.heroSubtitle,
    openGraph: {
      title: `${dict.nav.home} | StochStack`,
      description: dict.home.heroSubtitle
    }
  };
}

export default function HomePage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const ports = getPorts().slice(0, 6);

  return (
    <div className="space-y-16">
      <section className="editorial-grid items-end gap-8">
        <div className="md:col-span-7 space-y-5">
          <p className="section-title">signal / noise / stack</p>
          <h1 className="font-[var(--font-heading)] text-6xl font-bold leading-[0.9] md:text-8xl">
            {dict.home.heroTitle}
          </h1>
          <p className="max-w-2xl text-lg text-ink/75 md:text-xl">{dict.slogan}</p>
        </div>
        <div className="md:col-span-5">
          <HeroSignal />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {dict.home.cards.map((card, idx) => {
          const href = idx === 0 ? '/prototypes' : idx === 1 ? '/notes' : '/life/books';
          return (
            <article
              key={card.title}
              className="noise-border scanline rounded-lg p-5"
            >
              <h3 className="mb-2 text-2xl font-semibold">{card.title}</h3>
              <p className="mb-4 text-sm text-ink/65">{card.hint}</p>
              <Link href={`/${params.locale}${href}`} className="glitch-link text-sm">
                Enter
              </Link>
            </article>
          );
        })}
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl font-semibold">{dict.home.portsTitle}</h2>
        <PortGrid locale={params.locale} ports={ports} visitLabel={dict.common.visit} />
      </section>

      <section className="border-t border-ink/15 pt-8">
        <p className="mb-4 section-title">social links</p>
        <div className="flex gap-5 text-sm">
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="glitch-link">
            LinkedIn
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="glitch-link">
            GitHub
          </a>
          <a href="mailto:hello@stochstack.com" className="glitch-link">
            Email
          </a>
        </div>
      </section>
    </div>
  );
}
