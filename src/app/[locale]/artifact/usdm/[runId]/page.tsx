import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WorkflowNav } from '@/components/protocolWorkflow/workflow-nav';
import { buildArtifactsForRun } from '@/lib/protocolWorkflow';
import { db } from '@/lib/protocolWorkflow/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { runId: string } }): Promise<Metadata> {
  return {
    title: `USDM Artifact ${params.runId} | StochStack`,
    description: 'USDM artifact preview and export.'
  };
}

export default async function UsdmArtifactPage({ params }: { params: { locale: string; runId: string } }) {
  const run = await db.extractionRun.findUnique({ where: { id: params.runId }, include: { usdmArtifact: true } });
  if (!run) notFound();

  const usdm = run.usdmArtifact?.usdmJson ? JSON.parse(run.usdmArtifact.usdmJson) : (await buildArtifactsForRun(run.id)).usdm;

  return (
    <div className="space-y-4">
      <WorkflowNav
        items={[
          { href: `/${params.locale}/workflow/${run.studyId}`, label: 'Workflow' },
          { href: `/${params.locale}/review/${run.id}`, label: 'Review' },
          { href: `/${params.locale}/validate/${run.id}`, label: 'Validate' },
          { href: `/${params.locale}/artifact/usdm/${run.id}`, label: 'USDM' },
          { href: `/${params.locale}/artifact/ddf/${run.id}`, label: 'DDF' }
        ]}
        current={`/${params.locale}/artifact/usdm/${run.id}`}
      />

      <section className="noise-border rounded-lg p-4">
        <h1 className="text-3xl font-bold md:text-5xl">USDM Artifact</h1>
        <p className="mt-2 text-sm text-ink/70">Business view: this is the publish-ready structured design model used by downstream teams.</p>
      </section>

      <section className="noise-border rounded-lg p-4">
        <a
          href={`/api/workflow/artifact/usdm/${run.id}`}
          className="scanline mb-3 inline-flex rounded border border-ink/20 px-3 py-2 text-xs"
        >
          Export USDM JSON
        </a>
        <details open>
          <summary className="cursor-pointer text-sm font-medium">USDM JSON Preview</summary>
          <pre className="mt-3 max-h-[620px] overflow-auto rounded border border-ink/15 bg-white/70 p-3 text-xs">
            {JSON.stringify(usdm, null, 2)}
          </pre>
        </details>
      </section>
    </div>
  );
}
