import type { Metadata } from 'next';
import Link from 'next/link';
import { getDictionary, type Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  return {
    title: `${dict.nav.ventures} | StochStack`,
    description: dict.ventures.subtitle
  };
}

function isExternal(url: string) {
  return url.startsWith('http://') || url.startsWith('https://');
}

export default function VenturesPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  return (
    <div className="space-y-8">
      <section className="noise-border rounded-lg p-6">
        <p className="section-title">isolation / systems / ventures</p>
        <h1 className="mt-1 text-4xl font-bold md:text-6xl">{dict.ventures.title}</h1>
        <p className="mt-3 max-w-3xl text-sm text-ink/75 md:text-base">{dict.ventures.subtitle}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {dict.ventures.cards.map((card) => {
          const href = isExternal(card.href) ? card.href : `/${params.locale}${card.href}`;
          return (
            <article key={card.title} className="noise-border rounded-lg p-5">
              <h2 className="text-xl font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm text-ink/70">{card.summary}</p>
              {isExternal(card.href) ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="glitch-link mt-4 inline-block text-sm"
                >
                  {card.cta}
                </a>
              ) : (
                <Link href={href} className="glitch-link mt-4 inline-block text-sm">
                  {card.cta}
                </Link>
              )}
            </article>
          );
        })}
      </section>

      <section className="noise-border rounded-lg p-5 text-sm text-ink/70">
        <p className="section-title">deployment policy</p>
        <p className="mt-2">
          Ventures are isolated from the main website runtime. Heavy database workflows and orchestration logic should run on labs domain to avoid impacting homepage availability.
        </p>
      </section>
    </div>
  );
}
