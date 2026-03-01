import type { Metadata } from 'next';
import { VendorIntelligencePrototype, type Catalog, type Signals } from '@/components/vendor-intelligence-prototype';
import { PrototypeChangelog, type LogEntry } from '@/components/prototype-changelog';
import { getPortBySlug } from '@/lib/content';
import type { Locale } from '@/lib/i18n';
import { readVendorSignals } from '@/lib/server/vendor-signals-store';
import vendorIntelligenceCatalog from '@/content/vendor-intelligence/catalog.json';
import vendorIntelligenceChangelog from '@/content/changelogs/vendor-ai-intelligence-radar.json';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const port = getPortBySlug('vendor-ai-intelligence-radar');
  if (!port) return {};
  return {
    title: port.name[params.locale],
    description: port.description[params.locale],
    openGraph: {
      title: `${port.name[params.locale]} | StochStack`,
      description: port.description[params.locale]
    }
  };
}

export default async function VendorAiRadarPage({ params }: { params: { locale: Locale } }) {
  const runtimeSignals = await readVendorSignals();

  return (
    <>
      <VendorIntelligencePrototype
        locale={params.locale}
        catalog={vendorIntelligenceCatalog as unknown as Catalog}
        signals={runtimeSignals as Signals}
      />
      <PrototypeChangelog locale={params.locale} entries={vendorIntelligenceChangelog as unknown as LogEntry[]} />
    </>
  );
}
