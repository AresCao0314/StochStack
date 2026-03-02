import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WorkflowNav } from '@/components/protocolWorkflow/workflow-nav';
import { computeImpactList } from '@/lib/protocolWorkflow';
import { db } from '@/lib/protocolWorkflow/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { changeSetId: string } }): Promise<Metadata> {
  return {
    title: `Impact ${params.changeSetId} | StochStack`,
    description: 'Impact list mapped from object-level protocol changes.'
  };
}

export default async function ImpactPage({ params }: { params: { locale: string; changeSetId: string } }) {
  const changeSet = await db.changeSet.findUnique({ where: { id: params.changeSetId } });
  if (!changeSet) notFound();

  const impacts = computeImpactList(JSON.parse(changeSet.changes) as never);

  return (
    <div className="space-y-4">
      <WorkflowNav
        items={[
          { href: `/${params.locale}/diff`, label: 'Diff' },
          { href: `/${params.locale}/impact/${changeSet.id}`, label: 'Impact' }
        ]}
        current={`/${params.locale}/impact/${changeSet.id}`}
      />

      <section className="noise-border rounded-lg p-4">
        <h1 className="text-3xl font-bold md:text-5xl">Impact List</h1>
        <p className="mt-2 text-sm text-ink/70">
          Business view: this list translates technical path changes into downstream clinical operations consequences.
        </p>
      </section>

      <section className="noise-border rounded-lg p-4">
        <p className="text-sm">{changeSet.summary}</p>
        <p className="text-xs text-ink/60">Generated: {new Date(changeSet.generatedAt).toLocaleString()}</p>
        <a
          href={`/api/workflow/changesets/${changeSet.id}`}
          className="scanline mt-3 inline-flex rounded border border-ink/20 px-3 py-2 text-xs"
        >
          Export ChangeSet JSON
        </a>
      </section>

      <section className="grid gap-3">
        {impacts.map((impact, idx) => (
          <article key={`${impact.path}-${idx}`} className="noise-border rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{impact.domain}</p>
              <span className="rounded border border-ink/20 px-2 py-1 text-xs uppercase tracking-[0.12em]">{impact.changeType}</span>
            </div>
            <p className="mt-1 text-sm text-ink/75">{impact.path}</p>
            <p className="mt-2 text-sm">{impact.rationale}</p>
            <p className="mt-1 text-xs text-ink/60">Downstream: {impact.downstream.join(' · ')}</p>
          </article>
        ))}
      </section>

      <Link href={`/${params.locale}/diff`} className="scanline inline-flex rounded border border-ink/20 px-3 py-2 text-xs">
        Back to Diff Console
      </Link>
    </div>
  );
}
