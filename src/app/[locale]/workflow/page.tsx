import { redirect } from 'next/navigation';
import { db } from '@/lib/protocolWorkflow/db';

export const dynamic = 'force-dynamic';

export default async function WorkflowIndexPage({ params }: { params: { locale: string } }) {
  const study = await db.study.findFirst({ orderBy: { createdAt: 'desc' } });

  if (study) {
    redirect(`/${params.locale}/workflow/${study.id}`);
  }

  return (
    <div className="noise-border rounded-lg p-6">
      <h1 className="text-3xl font-bold">Protocol Workflow</h1>
      <p className="mt-2 text-sm text-ink/70">No studies found. Run seed data first, then refresh this page.</p>
    </div>
  );
}
