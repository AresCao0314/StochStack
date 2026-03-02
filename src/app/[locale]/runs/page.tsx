import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/protocolWorkflow/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Runs | StochStack',
  description: 'Extraction runs with status progression and artifact links.'
};

export default async function RunsPage({ params }: { params: { locale: string } }) {
  const runs = await db.extractionRun.findMany({
    include: { study: true, document: true },
    orderBy: { startedAt: 'desc' }
  });

  return (
    <div className="space-y-4">
      <section className="noise-border rounded-lg p-4">
        <h1 className="text-3xl font-bold md:text-5xl">Runs</h1>
        <p className="mt-2 text-sm text-ink/70">Business view: each extraction run is versioned with state transitions from review to publish.</p>
      </section>
      <section className="space-y-2">
        {runs.map((run) => (
          <article key={run.id} className="noise-border rounded-lg p-4 text-sm">
            <p className="font-semibold">{run.study.name} · {run.id.slice(0, 8)}</p>
            <p className="text-xs text-ink/60">{run.status} · model={run.modelName} · prompt={run.promptVersion}</p>
            <p className="text-xs text-ink/60">doc={run.document.filename}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <Link href={`/${params.locale}/review/${run.id}`} className="underline">Review</Link>
              <Link href={`/${params.locale}/validate/${run.id}`} className="underline">Validate</Link>
              <Link href={`/${params.locale}/artifact/usdm/${run.id}`} className="underline">USDM</Link>
              <Link href={`/${params.locale}/artifact/ddf/${run.id}`} className="underline">DDF</Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
