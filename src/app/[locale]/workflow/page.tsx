import type { Metadata } from 'next';
import { WorkflowBusinessMvp } from '@/components/protocolWorkflow/workflow-business-mvp';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Workflow MVP+ | StochStack',
  description: 'Business-first protocol workflow dashboard with mock/live demo modes.'
};

export default function WorkflowIndexPage({ params }: { params: { locale: string } }) {
  return <WorkflowBusinessMvp locale={params.locale} />;
}
