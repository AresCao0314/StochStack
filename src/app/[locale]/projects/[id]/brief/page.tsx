import type { Metadata } from 'next';
import Link from 'next/link';
import { BriefClient } from '@/components/protocol-os/brief-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Project Brief | Protocol OS',
  description: 'Capture protocol design brief'
};

export default function ProjectBriefPage({ params }: { params: { locale: string; id: string } }) {
  return (
    <div className="space-y-4">
      <Link href={`/${params.locale}/projects`} className="text-xs uppercase tracking-[0.12em] text-ink/60">← Back to Projects</Link>
      <BriefClient locale={params.locale} projectId={params.id} />
    </div>
  );
}
