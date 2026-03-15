import { DashboardView, FooterCallout, HeaderSummaryRail, RiskBanner } from '@/components/site-feasibility-platform/views';

export default function NextGenSiteFeasibilityDashboardPage() {
  return (
    <div className="space-y-8">
      <HeaderSummaryRail />
      <RiskBanner />
      <DashboardView />
      <FooterCallout />
    </div>
  );
}

