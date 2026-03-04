import type { Metadata } from 'next';
import { getDictionary, type Locale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  return {
    title: `${dict.nav.atlas} | StochStack`,
    description: dict.atlas.subtitle,
    openGraph: {
      title: `${dict.nav.atlas} | StochStack`,
      description: dict.atlas.subtitle
    }
  };
}

function Node({ label, tone = 'ink' }: { label: string; tone?: 'ink' | 'accent1' | 'accent2' }) {
  const toneClass =
    tone === 'accent1'
      ? 'border-accent1/50 bg-accent1/15'
      : tone === 'accent2'
        ? 'border-accent2/50 bg-accent2/15'
        : 'border-ink/25 bg-base';

  return <div className={`rounded-md border px-3 py-2 text-xs text-ink ${toneClass}`}>{label}</div>;
}

export default function AtlasPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="section-title">atlas / architecture / signal maps</p>
        <h1 className="text-5xl font-bold md:text-7xl">{dict.atlas.title}</h1>
        <p className="max-w-3xl text-lg text-ink/75">{dict.atlas.subtitle}</p>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="noise-border scanline rounded-lg p-5">
          <p className="section-title">01 · Clinical Data Foundation</p>
          <h2 className="mt-2 text-xl font-semibold">Layered Clinical Data Stack</h2>
          <p className="mt-2 text-sm text-ink/70">From source systems to semantic layer, products, and agent apps.</p>

          <div className="mt-4 space-y-2">
            <Node tone="accent2" label="L5 Apps & Agents" />
            <div className="text-center text-xs text-ink/50">↓</div>
            <Node label="L4 Data Products / Feature Store" />
            <div className="text-center text-xs text-ink/50">↓</div>
            <Node tone="accent1" label="L3 Canonical Semantic Model" />
            <div className="text-center text-xs text-ink/50">↓</div>
            <Node label="L2 Conformed Bronze/Silver" />
            <div className="text-center text-xs text-ink/50">↓</div>
            <Node label="L1 Landing / Raw" />
            <div className="text-center text-xs text-ink/50">↓</div>
            <Node label="L0 CTMS · EDC · RTSM · eTMF · PV" />
          </div>
        </article>

        <article className="noise-border scanline rounded-lg p-5">
          <p className="section-title">02 · Protocol Design OS</p>
          <h2 className="mt-2 text-xl font-semibold">Decision-Centric Protocol Loop</h2>
          <p className="mt-2 text-sm text-ink/70">Synopsis-first workflow with policy checks and traceable compilation.</p>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Node tone="accent1" label="Brief" />
            <Node tone="accent1" label="Evidence" />
            <Node label="A/B Plan" />
            <Node label="Policy Scoring" />
            <Node label="Synopsis" />
            <Node tone="accent2" label="Full Protocol" />
            <Node label="SoA CSV" />
            <Node label="Traceability JSON" />
          </div>

          <div className="mt-3 rounded-md border border-ink/20 bg-ink/5 px-3 py-2 text-xs text-ink/75">
            Loop: feedback → weights → strategy switch → next run delta
          </div>
        </article>

        <article className="noise-border scanline rounded-lg p-5">
          <p className="section-title">03 · Multi-Agent Governance</p>
          <h2 className="mt-2 text-xl font-semibold">A2A + Human Review Mesh</h2>
          <p className="mt-2 text-sm text-ink/70">Functional agents, role reviewers, and explicit governance controls.</p>

          <div className="mt-4 rounded-lg border border-ink/20 p-3">
            <div className="mx-auto mb-2 w-fit rounded-md border border-accent1/50 bg-accent1/15 px-3 py-1 text-xs">Orchestrator</div>
            <div className="grid grid-cols-2 gap-2">
              <Node label="Endpoint Agent" />
              <Node label="Eligibility Agent" />
              <Node label="SoA Agent" />
              <Node label="Risk Gate Agent" />
            </div>
            <div className="my-2 text-center text-xs text-ink/55">reviewed by</div>
            <div className="grid grid-cols-2 gap-2">
              <Node tone="accent2" label="Medical Reviewer" />
              <Node tone="accent2" label="Stats Reviewer" />
              <Node tone="accent2" label="ClinOps Reviewer" />
              <Node tone="accent2" label="Reg Reviewer" />
            </div>
          </div>

          <div className="mt-3 rounded-md border border-ink/20 bg-ink/5 px-3 py-2 text-xs text-ink/75">
            Controls: HMAC · idempotency · audit log · policy gates
          </div>
        </article>
      </section>
    </div>
  );
}
