import type { Metadata } from 'next';
import { PortGrid } from '@/components/port-grid';
import { PrototypesBrowser } from '@/components/prototypes-browser';
import { getDictionary, type Locale } from '@/lib/i18n';
import { getActivePorts, getArchivedPorts } from '@/lib/content';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  return {
    title: dict.nav.prototypes,
    description: dict.prototypes.subtitle,
    openGraph: {
      title: `${dict.nav.prototypes} | StochStack`,
      description: dict.prototypes.subtitle
    }
  };
}

export default function PrototypesPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);
  const activePorts = getActivePorts();
  const archivedPorts = getArchivedPorts();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype index</p>
        <h1 className="text-5xl font-bold md:text-7xl">{dict.prototypes.title}</h1>
        <p className="max-w-3xl text-lg text-ink/70">{dict.prototypes.subtitle}</p>
      </header>
      <PrototypesBrowser
        locale={params.locale}
        ports={activePorts}
        allLabel={dict.common.all}
        tagLabel={dict.common.filterByTag}
        statusLabel={dict.common.filterByStatus}
        visitLabel={dict.common.visit}
      />

      {archivedPorts.length > 0 ? (
        <section className="space-y-4 border-t border-ink/15 pt-8">
          <p className="section-title">archive</p>
          <details className="noise-border rounded-lg p-4">
            <summary className="cursor-pointer text-2xl font-semibold">
              Archived Prototypes ({archivedPorts.length})
            </summary>
            <div className="mt-4">
              <PortGrid locale={params.locale} ports={archivedPorts} detailPath visitLabel={dict.common.visit} />
            </div>
          </details>
        </section>
      ) : null}
    </div>
  );
}
