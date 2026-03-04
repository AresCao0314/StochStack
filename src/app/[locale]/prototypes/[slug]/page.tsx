import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ProtocolLogicPrototype, type ProtocolRecord } from '@/components/protocol-logic-prototype';
import { PrototypeChangelog, type LogEntry } from '@/components/prototype-changelog';
import { AgentOrchestrationPrototype } from '@/components/agent-orchestration-prototype';
import { DataAgentPrototype } from '@/components/data-agent-prototype';
import { DigitalTwinPrototype } from '@/components/digital-twin-prototype';
import { EnrollmentForecastPrototype } from '@/components/enrollment-forecast-prototype';
import { LaySynopsisPrototype } from '@/components/lay-synopsis-prototype';
import { CsrDraftPrototype } from '@/components/csr-draft-prototype';
import { ProtocolDigitizationPrototype } from '@/components/protocol-digitization-prototype';
import { SiteFeasibilityFeedbackPrototype } from '@/components/site-feasibility-feedback-prototype';
import { SiteFeasibilityPrototype } from '@/components/site-feasibility-prototype';
import { OphthalmologyDiffusionTwinPrototype } from '@/components/ophthalmology-diffusion-twin-prototype';
import { CtmDashboardPrototype, type TrialRecord, type SkillPack } from '@/components/ctm-dashboard-prototype';
import { OpsTwinStudio } from '@/components/opsTwin/ops-twin-studio';
import { getDictionary, locales, type Locale } from '@/lib/i18n';
import { getPortBySlug, getPorts } from '@/lib/content';
import { loadCtmSopRegistry } from '@/lib/ctm-sop-registry';
import feasibilitySites from '@/content/site-feasibility/sites.json';
import protocolEngineData from '@/content/protocol-engine/protocols.json';
import orchestrationInitiatives from '@/content/agent-orchestration/initiatives.json';
import dataAgentDatasets from '@/content/data-agent/datasets.json';
import enrollmentTrials from '@/content/enrollment-forecast/trials.json';
import digitalTwinScenarios from '@/content/digital-twin/scenarios.json';
import ophDiffusionScenarios from '@/content/digital-twin/ophthalmology-diffusion-scenarios.json';
import protocolDigitizationSamples from '@/content/protocol-digitization/samples.json';
import laySynopsisSamples from '@/content/lay-synopsis/samples.json';
import csrDraftSamples from '@/content/csr-drafting/samples.json';
import ctmDashboardTrials from '@/content/ctm-dashboard/trials.json';
import siteScoringChangelog from '@/content/changelogs/site-feasibility-scoring.json';
import siteFeedbackChangelog from '@/content/changelogs/site-feasibility-human-feedback.json';
import protocolChangelog from '@/content/changelogs/protocol-qa-logic-engine.json';
import orchestrationChangelog from '@/content/changelogs/agent-orchestration-highscore.json';
import dataAgentChangelog from '@/content/changelogs/data-agent-catalog.json';
import enrollmentChangelog from '@/content/changelogs/enrollment-forecast-monte-carlo.json';
import digitalTwinChangelog from '@/content/changelogs/digital-twin-synthetic-control.json';
import ophDiffusionTwinChangelog from '@/content/changelogs/ophthalmology-diffusion-digital-twin.json';
import protocolDigitizationChangelog from '@/content/changelogs/historical-protocol-digitizer.json';
import laySynopsisChangelog from '@/content/changelogs/lay-language-synopsis-eu.json';
import csrDraftChangelog from '@/content/changelogs/csr-drafting-bds-tfl.json';
import ctmDashboardChangelog from '@/content/changelogs/ctm-ops-daily-dashboard.json';
import opsTwinChangelog from '@/content/changelogs/ops-twin-site-startup-recruitment.json';

export function generateStaticParams() {
  const ports = getPorts();
  return locales.flatMap((locale) => ports.map((port) => ({ locale, slug: port.slug })));
}

export async function generateMetadata({ params }: { params: { locale: Locale; slug: string } }): Promise<Metadata> {
  const port = getPortBySlug(params.slug);
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

export default function PrototypeDetailPage({ params }: { params: { locale: Locale; slug: string } }) {
  if (params.slug === 'ctm-ops-daily-dashboard') {
    const registry = loadCtmSopRegistry();
    return (
      <>
        <CtmDashboardPrototype
          locale={params.locale}
          trials={ctmDashboardTrials as unknown as TrialRecord[]}
          skills={registry.skills as unknown as SkillPack[]}
          registryMeta={{
            registryId: registry.registryId,
            registryVersion: registry.registryVersion,
            updatedAt: registry.updatedAt,
            sourceFormat: registry.sourceFormat
          }}
        />
        <PrototypeChangelog locale={params.locale} entries={ctmDashboardChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  if (params.slug === 'site-feasibility-scoring-ctgov') {
    return (
      <>
        <SiteFeasibilityPrototype locale={params.locale} sites={feasibilitySites} />
        <PrototypeChangelog locale={params.locale} entries={siteScoringChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  if (params.slug === 'site-feasibility-human-feedback') {
    return (
      <>
        <SiteFeasibilityFeedbackPrototype locale={params.locale} sites={feasibilitySites} />
        <PrototypeChangelog locale={params.locale} entries={siteFeedbackChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  if (params.slug === 'protocol-qa-logic-engine') {
    return (
      <>
        <ProtocolLogicPrototype locale={params.locale} protocols={protocolEngineData as unknown as ProtocolRecord[]} />
        <PrototypeChangelog locale={params.locale} entries={protocolChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  if (params.slug === 'agent-orchestration-highscore') {
    return (
      <>
        <AgentOrchestrationPrototype locale={params.locale} initiatives={orchestrationInitiatives} />
        <PrototypeChangelog locale={params.locale} entries={orchestrationChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  if (params.slug === 'data-agent-catalog') {
    return (
      <>
        <DataAgentPrototype locale={params.locale} initial={dataAgentDatasets} />
        <PrototypeChangelog locale={params.locale} entries={dataAgentChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  if (params.slug === 'enrollment-forecast-monte-carlo') {
    return (
      <>
        <EnrollmentForecastPrototype locale={params.locale} trials={enrollmentTrials} />
        <PrototypeChangelog locale={params.locale} entries={enrollmentChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  if (params.slug === 'digital-twin-synthetic-control') {
    return (
      <>
        <DigitalTwinPrototype locale={params.locale} scenarios={digitalTwinScenarios} />
        <PrototypeChangelog locale={params.locale} entries={digitalTwinChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  if (params.slug === 'ophthalmology-diffusion-control-twin') {
    return (
      <>
        <OphthalmologyDiffusionTwinPrototype locale={params.locale} scenarios={ophDiffusionScenarios} />
        <PrototypeChangelog locale={params.locale} entries={ophDiffusionTwinChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  if (params.slug === 'historical-protocol-digitizer') {
    return (
      <>
        <ProtocolDigitizationPrototype locale={params.locale} samples={protocolDigitizationSamples} />
        <PrototypeChangelog locale={params.locale} entries={protocolDigitizationChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  if (params.slug === 'lay-language-synopsis-eu') {
    return (
      <>
        <LaySynopsisPrototype locale={params.locale} samples={laySynopsisSamples} />
        <PrototypeChangelog locale={params.locale} entries={laySynopsisChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  if (params.slug === 'csr-drafting-bds-tfl') {
    return (
      <>
        <CsrDraftPrototype locale={params.locale} samples={csrDraftSamples} />
        <PrototypeChangelog locale={params.locale} entries={csrDraftChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  if (params.slug === 'ops-twin-site-startup-recruitment') {
    return (
      <>
        <OpsTwinStudio locale={params.locale} />
        <PrototypeChangelog locale={params.locale} entries={opsTwinChangelog as unknown as LogEntry[]} />
      </>
    );
  }

  const dict = getDictionary(params.locale);
  const port = getPortBySlug(params.slug);

  if (!port) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <p className="section-title">prototype detail</p>
        <h1 className="text-4xl font-bold md:text-6xl">{port.name[params.locale]}</h1>
        <p className="max-w-3xl text-lg text-ink/75">{port.description[params.locale]}</p>
      </header>

      <div className="noise-border overflow-hidden rounded-lg">
        <Image
          src={port.screenshot}
          alt={port.name[params.locale]}
          width={1200}
          height={720}
          className="h-auto w-full object-cover"
        />
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {port.techStack.map((item) => (
              <span key={item} className="rounded border border-ink/15 px-2 py-1 text-xs uppercase tracking-[0.12em]">
                {item}
              </span>
            ))}
          </div>
          <a href={port.link} target="_blank" rel="noreferrer" className="glitch-link inline-block text-sm">
            {dict.common.visit}
          </a>
        </div>

        <div className="noise-border rounded-lg bg-warm p-4">
          <h2 className="mb-2 text-xl font-semibold">{dict.common.designIntent}</h2>
          <p className="text-ink/85">{port.designIntent[params.locale]}</p>
        </div>
      </section>
    </div>
  );
}
