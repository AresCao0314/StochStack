import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WorkflowNav } from '@/components/protocolWorkflow/workflow-nav';
import { db } from '@/lib/protocolWorkflow/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { studyId: string } }): Promise<Metadata> {
  const study = await db.study.findUnique({ where: { id: params.studyId } });
  return {
    title: `${study?.name ?? 'Study'} Ops Evidence | StochStack`,
    description: 'Operational view that links design objects with amendment signals.'
  };
}

export default async function OpsStudyPage({ params }: { params: { locale: string; studyId: string } }) {
  const study = await db.study.findUnique({
    where: { id: params.studyId },
    include: {
      feedback: { orderBy: { amendmentDate: 'desc' } }
    }
  });

  if (!study) notFound();

  const buckets = new Map<string, { count: number; rows: Array<{ date: string; description: string }> }>();

  for (const item of study.feedback) {
    const paths = JSON.parse(item.linkedUsdmPaths || '[]') as string[];
    for (const path of paths) {
      const domain = path.startsWith('eligibility.')
        ? 'eligibility'
        : path.startsWith('soa.')
          ? 'SoA'
          : path.startsWith('endpoint.')
            ? 'endpoints'
            : 'other';
      const key = `${domain}:${path}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.count += 1;
        existing.rows.push({ date: item.amendmentDate.toISOString(), description: item.description });
      } else {
        buckets.set(key, {
          count: 1,
          rows: [{ date: item.amendmentDate.toISOString(), description: item.description }]
        });
      }
    }
  }

  const topDesignAreas = ['eligibility', 'SoA', 'endpoints'].map((area) => {
    const count = Array.from(buckets.entries()).filter(([key]) => key.startsWith(`${area}:`)).reduce((sum, [, value]) => sum + value.count, 0);
    return { area, count };
  });
  const latestRun = await db.extractionRun.findFirst({
    where: { studyId: study.id },
    orderBy: { startedAt: 'desc' }
  });

  return (
    <div className="space-y-4">
      <WorkflowNav
        items={[
          { href: `/${params.locale}/workflow/${study.id}`, label: 'Workflow' },
          { href: `/${params.locale}/feedback/${study.id}`, label: 'Feedback' },
          { href: `/${params.locale}/ops/${study.id}`, label: 'Ops' },
          { href: `/${params.locale}/diff`, label: 'Diff' }
        ]}
        current={`/${params.locale}/ops/${study.id}`}
      />

      <section className="noise-border rounded-lg p-4">
        <h1 className="text-3xl font-bold md:text-5xl">Ops Evidence View</h1>
        <p className="mt-2 text-sm text-ink/70">
          Business view: this panel turns amendment signals into design-risk evidence cards, so teams can see which protocol elements keep causing operational friction.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {topDesignAreas.map((item) => (
          <article key={item.area} className="noise-border rounded-lg p-4 text-center">
            <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{item.area}</p>
            <p className="mt-2 text-3xl font-semibold">{item.count}</p>
            <p className="text-xs text-ink/60">linked amendments</p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        {Array.from(buckets.entries()).map(([key, value]) => {
          const [, path] = key.split(':');
          return (
            <article key={key} className="noise-border rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{path}</p>
                <span className="rounded border border-ink/20 px-2 py-1 text-xs">{value.count} signals</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-ink/80">
                {value.rows.map((row, idx) => (
                  <li key={`${key}-${idx}`}>
                    {new Date(row.date).toLocaleDateString()} · {row.description}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-2">
                {latestRun ? (
                  <Link href={`/${params.locale}/review/${latestRun.id}`} className="text-xs underline">
                    Open Review Object
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
