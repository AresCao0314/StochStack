import type { Metadata } from 'next';
import { SiteFeasibilityPrototype } from '@/components/site-feasibility-prototype';
import { getDictionary, type Locale } from '@/lib/i18n';
import sites from '@/content/site-feasibility/sites.json';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const title =
    params.locale === 'zh'
      ? '站点可行性评分'
      : params.locale === 'de'
        ? 'Site-Feasibility Scoring'
        : 'Site Feasibility Scoring';

  return {
    title,
    description: dict.prototypes.subtitle,
    openGraph: {
      title: `${title} | StochStack`,
      description: dict.prototypes.subtitle
    }
  };
}

export default function SiteFeasibilityScoringPage({ params }: { params: { locale: Locale } }) {
  return <SiteFeasibilityPrototype locale={params.locale} sites={sites} />;
}
