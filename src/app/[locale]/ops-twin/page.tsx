import type { Metadata } from 'next';
import { OpsTwinStudio } from '@/components/opsTwin/ops-twin-studio';
import { PrototypeChangelog, type LogEntry } from '@/components/prototype-changelog';
import { getDictionary, type Locale } from '@/lib/i18n';
import opsTwinChangelog from '@/content/changelogs/ops-twin-site-startup-recruitment.json';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  const title =
    params.locale === 'zh'
      ? 'Ops Twin 多智能体协作'
      : params.locale === 'de'
        ? 'Ops Twin Multi-Agent Collaboration'
        : 'Ops Twin Multi-Agent Collaboration';

  return {
    title,
    description: dict.prototypes.subtitle,
    openGraph: {
      title: `${title} | StochStack`,
      description: dict.prototypes.subtitle
    }
  };
}

export default function OpsTwinPage({ params }: { params: { locale: Locale } }) {
  return (
    <>
      <OpsTwinStudio locale={params.locale} />
      <PrototypeChangelog locale={params.locale} entries={opsTwinChangelog as unknown as LogEntry[]} />
    </>
  );
}
