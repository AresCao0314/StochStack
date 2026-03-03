import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WorkflowDashboard } from '@/components/protocolWorkflow/workflow-dashboard';
import { db } from '@/lib/protocolWorkflow/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { studyId: string } }): Promise<Metadata> {
  try {
    const study = await db.study.findUnique({ where: { id: params.studyId } });
    if (!study) return {};
    return {
      title: `${study.name} Workflow | StochStack`,
      description: `Workflow overview for ${study.name}`
    };
  } catch (error) {
    console.error('[workflow/metadata] failed to load study metadata', error);
    return {
      title: 'Protocol Workflow | StochStack',
      description: 'Protocol workflow dashboard'
    };
  }
}

export default async function WorkflowStudyPage({ params }: { params: { locale: string; studyId: string } }) {
  try {
    const study = await db.study.findUnique({
      where: { id: params.studyId },
      include: {
        documents: { orderBy: { uploadedAt: 'desc' } },
        runs: { orderBy: { startedAt: 'desc' } },
        feedback: { orderBy: { amendmentDate: 'desc' } }
      }
    });

    if (!study) {
      const latest = await db.study.findFirst({ orderBy: { createdAt: 'desc' } });
      if (latest) {
        return (
          <div className="space-y-4">
            <p className="text-sm text-ink/70">Study not found. Open the latest seeded study instead.</p>
            <Link className="scanline inline-flex rounded border border-ink/20 px-3 py-2 text-xs" href={`/${params.locale}/workflow/${latest.id}`}>
              Open {latest.name}
            </Link>
          </div>
        );
      }
      notFound();
    }

    return <WorkflowDashboard locale={params.locale} initialStudy={study} />;
  } catch (error) {
    console.error('[workflow/study] failed to load dashboard data', error);
    return (
      <div className="space-y-3 noise-border rounded-lg p-6">
        <h1 className="text-2xl font-bold">Protocol Workflow (Safe Mode)</h1>
        <p className="text-sm text-ink/70">
          Workflow dataset is not ready on this server yet, so interactive review is temporarily disabled.
        </p>
        <p className="text-xs text-ink/55">
          The main site is healthy. We can keep this module in simplified read-only mode until DB initialization is fully stable.
        </p>
      </div>
    );
  }
}
