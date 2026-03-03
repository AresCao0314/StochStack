import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StudioClient } from '@/components/protocol-os/studio-client';
import { getProjectDetail, orchestrateProtocolOs } from '@/core/protocol-os';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Protocol Studio | Protocol OS',
  description: 'Compare plans, review graph, and export artifacts'
};

export default async function ProjectStudioPage({ params }: { params: { locale: string; id: string } }) {
  const project = await getProjectDetail(params.id);
  if (!project) notFound();

  const initialPlans = await orchestrateProtocolOs({
    projectId: params.id,
    runMode: 'plan_generation'
  });

  return (
    <div className="space-y-4">
      <Link href={`/${params.locale}/projects/${params.id}/evidence`} className="text-xs uppercase tracking-[0.12em] text-ink/60">← Back to Evidence</Link>
      <StudioClient locale={params.locale} project={project as any} initialPlans={initialPlans.plans as any} />
    </div>
  );
}
