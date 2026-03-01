import type { Metadata } from 'next';
import { OpsEvalDashboard } from '@/components/opsTwin/ops-eval-dashboard';
import type { Locale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const title =
    params.locale === 'zh'
      ? 'Ops Twin Agent 评估看板'
      : params.locale === 'de'
        ? 'Ops Twin Agent-Evaluierung'
        : 'Ops Twin Agent Evaluation';

  return {
    title,
    description: 'Agent scorecards, trial-level filtering, version compare, and human feedback loop.',
    openGraph: {
      title: `${title} | StochStack`,
      description: 'Agent scorecards, trial-level filtering, version compare, and human feedback loop.'
    }
  };
}

export default function OpsTwinEvalPage({ params }: { params: { locale: Locale } }) {
  return <OpsEvalDashboard locale={params.locale} />;
}
