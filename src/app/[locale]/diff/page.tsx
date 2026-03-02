import type { Metadata } from 'next';
import { DiffConsole } from '@/components/protocolWorkflow/diff-console';
import { computeImpactList } from '@/lib/protocolWorkflow';
import { db } from '@/lib/protocolWorkflow/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Run Diff | StochStack',
  description: 'Compare extraction/review versions and assess downstream impact.'
};

export default async function DiffPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { baseRunId?: string; compareRunId?: string };
}) {
  const runs = await db.extractionRun.findMany({
    include: { study: true },
    orderBy: { startedAt: 'desc' },
    take: 20
  });

  let initialChangeSet = null;
  let initialImpacts: ReturnType<typeof computeImpactList> = [];

  if (searchParams.baseRunId && searchParams.compareRunId) {
    const existing = await db.changeSet.findFirst({
      where: {
        baseRunId: searchParams.baseRunId,
        compareRunId: searchParams.compareRunId
      },
      orderBy: { generatedAt: 'desc' }
    });

    if (existing) {
      initialChangeSet = existing;
      initialImpacts = computeImpactList(JSON.parse(existing.changes) as never);
    }
  }

  return <DiffConsole locale={params.locale} payload={{ runs, initialChangeSet, initialImpacts }} />;
}
