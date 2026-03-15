import { SiteFeasibilityShell } from '@/components/site-feasibility-platform/shell';

export default function NextGenSiteFeasibilityLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return <SiteFeasibilityShell locale={params.locale}>{children}</SiteFeasibilityShell>;
}

