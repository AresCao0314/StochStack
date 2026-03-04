import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { HeroSignal } from '@/components/hero-signal';
import { PortGrid } from '@/components/port-grid';
import { getDictionary, type Locale } from '@/lib/i18n';
import { getActivePorts } from '@/lib/content';

const SHOW_POTATO_ON_HERO = true;

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
  const ports = getActivePorts().slice(0, 6);

  return (
    <div className="space-y-16">
      <section className="editorial-grid items-end gap-8">
        <div className="md:col-span-7 space-y-5">
          <p className="section-title">signal / noise / stack</p>
          <div className="relative inline-block">
            <h1 className="font-[var(--font-heading)] text-6xl font-bold leading-[0.9] md:text-8xl">
              {dict.home.heroTitle}
            </h1>
            {SHOW_POTATO_ON_HERO ? (
              <div className="pointer-events-none absolute -top-10 right-2 z-10 md:-top-16 md:right-8">
                <Image
                  src="/picture/potato.png"
                  alt="Potato the dog"
                  width={180}
                  height={180}
                  priority
                  className="h-24 w-auto rotate-[-8deg] drop-shadow-[0_10px_20px_rgba(11,15,20,0.24)] md:h-36"
                />
              </div>
            ) : null}
          </div>
          <p className="max-w-2xl text-lg text-ink/75 md:text-xl">{dict.slogan}</p>
        </div>
        <div className="md:col-span-5">
          <HeroSignal />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {dict.home.cards.map((card, idx) => {
          const href =
            idx === 0
              ? '/prototypes'
              : idx === 1
                ? '/ventures'
                : idx === 2
                  ? '/atlas'
                  : idx === 3
                    ? '/notes'
                    : '/life/books';
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
