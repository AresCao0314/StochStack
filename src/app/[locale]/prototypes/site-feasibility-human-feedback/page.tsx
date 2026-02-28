import type { Metadata } from 'next';
import { PrototypeChangelog, type LogEntry } from '@/components/prototype-changelog';
import { SiteFeasibilityFeedbackPrototype } from '@/components/site-feasibility-feedback-prototype';
import { getDictionary, type Locale } from '@/lib/i18n';
import sites from '@/content/site-feasibility/sites.json';
import feedbackChangelog from '@/content/changelogs/site-feasibility-human-feedback.json';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const title =
    params.locale === 'zh'
      ? '站点可行性（人类反馈强化）'
      : params.locale === 'de'
        ? 'Site-Feasibility mit Human Feedback'
        : 'Site Feasibility with Human Feedback';

  return {
    title,
    description: dict.prototypes.subtitle,
    openGraph: {
      title: `${title} | StochStack`,
      description: dict.prototypes.subtitle
    }
  };
}

export default function SiteFeasibilityHumanFeedbackPage({ params }: { params: { locale: Locale } }) {
  return (
    <>
      <SiteFeasibilityFeedbackPrototype locale={params.locale} sites={sites} />
      <PrototypeChangelog locale={params.locale} entries={feedbackChangelog as unknown as LogEntry[]} />
    </>
  );
}
