import type { Metadata } from 'next';
import { ProjectsClient } from '@/components/protocol-os/projects-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Protocol OS Projects | StochStack',
  description: 'Decision-centric protocol design projects'
};

export default function ProjectsPage({ params }: { params: { locale: string } }) {
  return <ProjectsClient locale={params.locale} />;
}
