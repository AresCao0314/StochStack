import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WorkflowNav } from '@/components/protocolWorkflow/workflow-nav';
import { buildArtifactsForRun } from '@/lib/protocolWorkflow';
import { db } from '@/lib/protocolWorkflow/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { runId: string } }): Promise<Metadata> {
  return {
    title: `DDF Artifact ${params.runId} | StochStack`,
    description: 'DDF artifact preview and export.'
  };
}

export default async function DdfArtifactPage({ params }: { params: { locale: string; runId: string } }) {
  const run = await db.extractionRun.findUnique({ where: { id: params.runId }, include: { ddfArtifact: true } });
  if (!run) notFound();

  const ddf = run.ddfArtifact?.ddfJson ? JSON.parse(run.ddfArtifact.ddfJson) : (await buildArtifactsForRun(run.id)).ddf;

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
        current={`/${params.locale}/artifact/ddf/${run.id}`}
      />

      <section className="noise-border rounded-lg p-4">
        <h1 className="text-3xl font-bold md:text-5xl">DDF Artifact</h1>
        <p className="mt-2 text-sm text-ink/70">Business view: this represents downstream operational data flow handoff from standardized design data.</p>
      </section>

      <section className="noise-border rounded-lg p-4">
        <a
          href={`/api/workflow/artifact/ddf/${run.id}`}
          className="scanline mb-3 inline-flex rounded border border-ink/20 px-3 py-2 text-xs"
        >
          Export DDF JSON
        </a>
        <details open>
          <summary className="cursor-pointer text-sm font-medium">DDF JSON Preview</summary>
          <pre className="mt-3 max-h-[620px] overflow-auto rounded border border-ink/15 bg-white/70 p-3 text-xs">
            {JSON.stringify(ddf, null, 2)}
          </pre>
        </details>
      </section>
    </div>
  );
}
