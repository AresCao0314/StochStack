import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FeedbackWorkbench } from '@/components/protocolWorkflow/feedback-workbench';
import { WorkflowNav } from '@/components/protocolWorkflow/workflow-nav';
import { db } from '@/lib/protocolWorkflow/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { studyId: string } }): Promise<Metadata> {
  const study = await db.study.findUnique({ where: { id: params.studyId } });
  return {
    title: `${study?.name ?? 'Study'} Feedback | StochStack`,
    description: 'Import and link amendment feedback to USDM paths.'
  };
}

export default async function FeedbackPage({ params }: { params: { locale: string; studyId: string } }) {
  const study = await db.study.findUnique({
    where: { id: params.studyId },
    include: {
      feedback: { orderBy: { amendmentDate: 'desc' } },
      runs: { orderBy: { startedAt: 'desc' } }
    }
  });

  if (!study) notFound();

  return (
    <div className="space-y-4">
      <WorkflowNav
        items={[
          { href: `/${params.locale}/workflow/${study.id}`, label: 'Workflow' },
          { href: `/${params.locale}/feedback/${study.id}`, label: 'Feedback' },
          { href: `/${params.locale}/ops/${study.id}`, label: 'Ops' },
          { href: `/${params.locale}/diff`, label: 'Diff' }
        ]}
        current={`/${params.locale}/feedback/${study.id}`}
      />

      <FeedbackWorkbench
        locale={params.locale}
        studyId={study.id}
        initialRows={study.feedback.map((item) => ({
          ...item,
          linkedUsdmPaths: JSON.parse(item.linkedUsdmPaths || '[]')
        }))}
      />
    </div>
  );
}
