import type { Metadata } from 'next';
import Link from 'next/link';
import { EvidenceClient } from '@/components/protocol-os/evidence-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Project Evidence | Protocol OS',
  description: 'Manage evidence snippets'
};

export default function ProjectEvidencePage({ params }: { params: { locale: string; id: string } }) {
  return (
    <div className="space-y-4">
      <Link href={`/${params.locale}/projects/${params.id}/brief`} className="text-xs uppercase tracking-[0.12em] text-ink/60">← Back to Brief</Link>
      <EvidenceClient locale={params.locale} projectId={params.id} />
    </div>
  );
}
