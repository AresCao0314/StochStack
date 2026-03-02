import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReviewWorkbench } from '@/components/protocolWorkflow/review-workbench';
import { WorkflowNav } from '@/components/protocolWorkflow/workflow-nav';
import { getReviewSummary } from '@/lib/protocolWorkflow';
import { db } from '@/lib/protocolWorkflow/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { runId: string } }): Promise<Metadata> {
  return {
    title: `Review Run ${params.runId} | StochStack`,
    description: 'Human-in-the-loop review workbench for extracted protocol fields.'
  };
}

export default async function ReviewRunPage({ params }: { params: { locale: string; runId: string } }) {
  const run = await db.extractionRun.findUnique({
    where: { id: params.runId },
    include: {
      fields: { orderBy: { path: 'asc' } },
      document: true,
      study: true
    }
  });

  if (!run) notFound();

  const summary = await getReviewSummary(run.id);
  const items = [
    { href: `/${params.locale}/workflow/${run.studyId}`, label: 'Workflow' },
    { href: `/${params.locale}/review/${run.id}`, label: 'Review' },
    { href: `/${params.locale}/validate/${run.id}`, label: 'Validate' },
    { href: `/${params.locale}/artifact/usdm/${run.id}`, label: 'USDM' },
    { href: `/${params.locale}/artifact/ddf/${run.id}`, label: 'DDF' },
    { href: `/${params.locale}/diff`, label: 'Diff' }
  ];

  return (
    <div className="space-y-4">
      <WorkflowNav items={items} current={`/${params.locale}/review/${run.id}`} />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-4xl">Review Run {run.id.slice(0, 8)}</h1>
        <Link href={`/${params.locale}/validate/${run.id}`} className="scanline rounded border border-ink/20 px-3 py-2 text-xs">
          Jump to Validate
        </Link>
      </div>
      <ReviewWorkbench locale={params.locale} initialRun={run} initialSummary={summary} />
    </div>
  );
}
