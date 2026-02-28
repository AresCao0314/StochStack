import type { Metadata } from 'next';
import { MarketIntelligencePrototype } from '@/components/market-intelligence-prototype';
import { PrototypeChangelog, type LogEntry } from '@/components/prototype-changelog';
import { getDictionary, type Locale } from '@/lib/i18n';
import projects from '@/content/market-intelligence/projects.json';
import signals from '@/content/market-intelligence/signals.json';
import digest from '@/content/market-intelligence/digest.json';
import marketChangelog from '@/content/changelogs/market-intelligence-highscore.json';

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

export default function MarketIntelligenceHighscorePage({ params }: { params: { locale: Locale } }) {
  return (
    <>
      <MarketIntelligencePrototype
        locale={params.locale}
        projects={projects}
        signals={signals}
        digest={digest}
      />
      <PrototypeChangelog locale={params.locale} entries={marketChangelog as unknown as LogEntry[]} />
    </>
  );
}
