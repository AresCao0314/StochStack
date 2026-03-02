import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WorkflowNav } from '@/components/protocolWorkflow/workflow-nav';
import { ValidatePanel } from '@/components/protocolWorkflow/validate-panel';
import { runValidationForRun } from '@/lib/protocolWorkflow';
import { db } from '@/lib/protocolWorkflow/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { runId: string } }): Promise<Metadata> {
  return {
    title: `Validate Run ${params.runId} | StochStack`,
    description: 'Validation report for protocol extraction run.'
  };
}

export default async function ValidateRunPage({ params }: { params: { locale: string; runId: string } }) {
  const run = await db.extractionRun.findUnique({ where: { id: params.runId } });
  if (!run) notFound();

  const report = await runValidationForRun(run.id);

  const items = [
    { href: `/${params.locale}/workflow/${run.studyId}`, label: 'Workflow' },
    { href: `/${params.locale}/review/${run.id}`, label: 'Review' },
    { href: `/${params.locale}/validate/${run.id}`, label: 'Validate' },
    { href: `/${params.locale}/artifact/usdm/${run.id}`, label: 'USDM' },
    { href: `/${params.locale}/artifact/ddf/${run.id}`, label: 'DDF' }
  ];

  return (
    <div className="space-y-4">
      <WorkflowNav items={items} current={`/${params.locale}/validate/${run.id}`} />
      <h1 className="text-2xl font-bold md:text-4xl">Validate Run {run.id.slice(0, 8)}</h1>
      <ValidatePanel locale={params.locale} runId={run.id} initialReport={report} />
    </div>
  );
}
