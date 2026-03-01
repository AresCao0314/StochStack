import type { Metadata } from 'next';
import { MarketIntelligencePrototype } from '@/components/market-intelligence-prototype';
import { PrototypeChangelog, type LogEntry } from '@/components/prototype-changelog';
import { getDictionary, type Locale } from '@/lib/i18n';
import { readMarketIntelligenceData } from '@/lib/server/market-intelligence-store';
import marketChangelog from '@/content/changelogs/market-intelligence-highscore.json';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const title =
    params.locale === 'zh'
      ? 'Market Intelligence 中枢'
      : params.locale === 'de'
        ? 'Market-Intelligence Hub'
        : 'Market Intelligence Hub';

  return {
    title,
    description: dict.prototypes.subtitle,
    openGraph: {
      title: `${title} | StochStack`,
      description: dict.prototypes.subtitle
    }
  };
}

export default async function MarketIntelligenceHighscorePage({ params }: { params: { locale: Locale } }) {
  const data = await readMarketIntelligenceData();
  return (
    <>
      <MarketIntelligencePrototype
        locale={params.locale}
        projects={data.projects}
        signals={data.signals}
        digest={data.digest}
      />
      <PrototypeChangelog locale={params.locale} entries={marketChangelog as unknown as LogEntry[]} />
    </>
  );
}
